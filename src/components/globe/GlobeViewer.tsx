import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AnalysisResult } from '../../types/geospatial';
import { RotateCcw, Eye, Layers, ZoomIn, ZoomOut, Compass, Sparkles } from 'lucide-react';

export type VisualizationMode = 'BEFORE' | 'DIFFERENCE' | 'AFTER';

interface TelemetryData {
  lat: number;
  lon: number;
  altitudeKm: number;
}

interface GlobeViewerProps {
  activeResult: AnalysisResult | null;
  allResults: AnalysisResult[];
  isTourActive: boolean;
  visualizationMode?: VisualizationMode;
  overlayOpacity?: number;
  onSelectResult: (index: number) => void;
  onUserInteract?: () => void;
  onTelemetryChange?: (telemetry: TelemetryData) => void;
}

export const GlobeViewer: React.FC<GlobeViewerProps> = ({
  activeResult,
  allResults,
  isTourActive,
  visualizationMode = 'DIFFERENCE',
  overlayOpacity = 0.85,
  onSelectResult,
  onUserInteract,
  onTelemetryChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const polygonsGroupRef = useRef<THREE.Group | null>(null);

  // Live real telemetry from camera orientation
  const [liveTelemetry, setLiveTelemetry] = useState<TelemetryData>({
    lat: -10.83,
    lon: -55.86,
    altitudeKm: 1800,
  });

  const [hoveredResult, setHoveredResult] = useState<AnalysisResult | null>(null);
  const [mouseScreenPos, setMouseScreenPos] = useState({ x: 0, y: 0 });

  // Camera Target Orientation & Zoom
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.19, y: 0.98 });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0.19, y: 0.98 });
  const targetCameraDistanceRef = useRef<number>(5.2);
  const currentCameraDistanceRef = useRef<number>(5.2);

  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);

  // Raycaster for clicking markers & polygons
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVecRef = useRef(new THREE.Vector2());

  // Convert lat/lon to 3D Cartesian coordinates on sphere of radius R
  const latLonToVector3 = useCallback((lat: number, lon: number, radius: number = 2.0) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }, []);

  // Handle active result change -> fly camera smoothly to target
  useEffect(() => {
    if (activeResult) {
      const { lat, lon } = activeResult.location;

      // Convert lat/lon to sphere rotation angles
      const phi = (lat * Math.PI) / 180;
      const theta = (-lon * Math.PI) / 180;

      targetRotationRef.current = {
        x: phi,
        y: theta - Math.PI / 2,
      };

      // Compute dynamic camera zoom distance based on polygon span
      if (activeResult.polygon && activeResult.polygon.length > 0) {
        let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
        activeResult.polygon.forEach((p) => {
          if (p.lat < minLat) minLat = p.lat;
          if (p.lat > maxLat) maxLat = p.lat;
          if (p.lon < minLon) minLon = p.lon;
          if (p.lon > maxLon) maxLon = p.lon;
        });
        const span = Math.max(Math.abs(maxLat - minLat), Math.abs(maxLon - minLon));
        // Smaller span -> closer zoom (e.g. distance 3.8 to 4.5)
        const targetDist = Math.max(3.6, Math.min(5.4, 3.4 + span * 0.22));
        targetCameraDistanceRef.current = targetDist;
      } else {
        targetCameraDistanceRef.current = 4.4;
      }
    }
  }, [activeResult]);

  // Initial Three.js Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.2);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // 1. Procedural Texture Canvas for High-Contrast Dark Earth
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Dark deep oceanic void
      ctx.fillStyle = '#050a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Continent Landmasses with luminous coastal strokes
      ctx.fillStyle = '#0f1d2e';
      ctx.strokeStyle = 'rgba(61, 242, 255, 0.45)';
      ctx.lineWidth = 1.6;

      // Draw Approximate World Contours
      const drawWorld = () => {
        // Americas
        ctx.beginPath();
        ctx.ellipse(500, 320, 220, 150, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(650, 680, 140, 220, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eurasia & Africa
        ctx.beginPath();
        ctx.ellipse(1200, 340, 320, 180, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(1180, 600, 160, 200, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // India / South Asia
        ctx.beginPath();
        ctx.ellipse(1390, 470, 75, 110, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Australia
        ctx.beginPath();
        ctx.ellipse(1680, 720, 110, 90, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      };
      drawWorld();

      // Precision Coordinate Graticule Grid
      ctx.strokeStyle = 'rgba(61, 242, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 128) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Constellation / Topo Points
      ctx.fillStyle = 'rgba(61, 242, 255, 0.3)';
      for (let i = 0; i < 450; i++) {
        const rx = Math.random() * canvas.width;
        const ry = Math.random() * canvas.height;
        ctx.fillRect(rx, ry, 2, 2);
      }
    }

    const globeTexture = new THREE.CanvasTexture(canvas);
    globeTexture.wrapS = THREE.RepeatWrapping;
    globeTexture.wrapT = THREE.ClampToEdgeWrapping;

    // 2. Base Earth Sphere
    const globeGeometry = new THREE.SphereGeometry(2, 64, 64);
    const globeMaterial = new THREE.MeshStandardMaterial({
      map: globeTexture,
      roughness: 0.75,
      metalness: 0.2,
      color: new THREE.Color(0x0c1928),
      emissive: new THREE.Color(0x03070f),
      emissiveIntensity: 0.7,
    });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeMesh.name = 'baseGlobe';
    globeGroup.add(globeMesh);

    // 3. Atmospheric Outer Glow
    const atmosphereGeometry = new THREE.SphereGeometry(2.09, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      uniforms: {
        glowColor: { value: new THREE.Color(0x3df2ff) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.8);
          gl_FragColor = vec4(glowColor, intensity * 0.55);
        }
      `,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // 4. Subtle Orbital Horizon Ring
    const horizonRingGeom = new THREE.RingGeometry(2.02, 2.14, 64);
    const horizonRingMat = new THREE.MeshBasicMaterial({
      color: 0x3df2ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.16,
    });
    const horizonRing = new THREE.Mesh(horizonRingGeom, horizonRingMat);
    horizonRing.rotation.x = Math.PI / 2;
    globeGroup.add(horizonRing);

    // Groups for Markers & Polygons
    const markersGroup = new THREE.Group();
    markersGroupRef.current = markersGroup;
    globeGroup.add(markersGroup);

    const polygonsGroup = new THREE.Group();
    polygonsGroupRef.current = polygonsGroup;
    globeGroup.add(polygonsGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x3df2ff, 1.4);
    directionalLight1.position.set(6, 4, 4);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xff4e00, 0.8);
    directionalLight2.position.set(-6, -3, -4);
    scene.add(directionalLight2);

    // Interactive Mouse Drag Controls
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      dragDistanceRef.current = 0;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      if (onUserInteract) {
        onUserInteract();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      // Raycasting for hover tooltip
      if (mountRef.current && cameraRef.current) {
        const rect = mountRef.current.getBoundingClientRect();
        mouseVecRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVecRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        setMouseScreenPos({ x: e.clientX, y: e.clientY });

        raycasterRef.current.setFromCamera(mouseVecRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(markersGroup.children, true);

        if (intersects.length > 0) {
          const hitObj = intersects[0].object;
          const resultId = hitObj.userData?.resultId;
          const found = allResults.find((r) => r.id === resultId);
          setHoveredResult(found || null);
        } else {
          setHoveredResult(null);
        }
      }

      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      dragDistanceRef.current += Math.abs(deltaX) + Math.abs(deltaY);

      currentRotationRef.current.y += deltaX * 0.005;
      currentRotationRef.current.x += deltaY * 0.005;

      // Clamp X rotation to prevent flipping over poles
      currentRotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, currentRotationRef.current.x));

      targetRotationRef.current = { ...currentRotationRef.current };
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e: MouseEvent) => {
      // If was just a click (not a drag), test raycaster for pin selection
      if (dragDistanceRef.current < 6 && mountRef.current && cameraRef.current) {
        const rect = mountRef.current.getBoundingClientRect();
        mouseVecRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVecRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseVecRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(markersGroup.children, true);

        if (intersects.length > 0) {
          const hitObj = intersects[0].object;
          const resultIndex = hitObj.userData?.resultIndex;
          if (typeof resultIndex === 'number') {
            if (onUserInteract) onUserInteract();
            onSelectResult(resultIndex);
          }
        }
      }

      isDraggingRef.current = false;
      dragDistanceRef.current = 0;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (onUserInteract) onUserInteract();

      targetCameraDistanceRef.current = Math.max(
        3.2,
        Math.min(7.5, targetCameraDistanceRef.current + e.deltaY * 0.0035)
      );
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Window Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation & Flight Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation towards target rotation
      if (!isDraggingRef.current) {
        currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.07;
        currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.07;
      }

      // Smooth camera zoom distance interpolation
      currentCameraDistanceRef.current +=
        (targetCameraDistanceRef.current - currentCameraDistanceRef.current) * 0.08;
      if (cameraRef.current) {
        cameraRef.current.position.z = currentCameraDistanceRef.current;
      }

      if (globeGroupRef.current) {
        globeGroupRef.current.rotation.x = currentRotationRef.current.x;
        globeGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      // Calculate Real Live Telemetry from spherical angles & altitude
      const realLat = (currentRotationRef.current.x * 180) / Math.PI;
      let rawLon = ((-currentRotationRef.current.y - Math.PI / 2) * 180) / Math.PI;
      // Normalize longitude to [-180, 180]
      let realLon = ((rawLon + 180) % 360 + 360) % 360 - 180;
      const realAltitudeKm = Math.round((currentCameraDistanceRef.current - 2.0) * 600);

      setLiveTelemetry({
        lat: realLat,
        lon: realLon,
        altitudeKm: Math.max(300, realAltitudeKm),
      });

      if (onTelemetryChange) {
        onTelemetryChange({
          lat: realLat,
          lon: realLon,
          altitudeKm: Math.max(300, realAltitudeKm),
        });
      }

      // Pulse active rings & polygons
      if (markersGroupRef.current) {
        markersGroupRef.current.children.forEach((child) => {
          if (child.name.startsWith('pulseRing_')) {
            const scale = 1 + 0.35 * Math.sin(elapsedTime * 4.5);
            child.scale.set(scale, scale, scale);
          }
        });
      }

      if (polygonsGroupRef.current) {
        polygonsGroupRef.current.children.forEach((child) => {
          if (child.name === 'activePolygonFill') {
            const mesh = child as THREE.Mesh;
            const mat = mesh.material as THREE.MeshBasicMaterial;
            if (mat) {
              const pulse = 0.85 + 0.15 * Math.sin(elapsedTime * 3);
              mat.opacity = overlayOpacity * pulse;
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [allResults, latLonToVector3, onSelectResult, onUserInteract, overlayOpacity]);

  // Update Markers & Curvature Polygon Meshes when results or active result changes
  useEffect(() => {
    const markersGroup = markersGroupRef.current;
    const polygonsGroup = polygonsGroupRef.current;
    if (!markersGroup || !polygonsGroup) return;

    // Clear old elements
    while (markersGroup.children.length > 0) {
      markersGroup.remove(markersGroup.children[0]);
    }
    while (polygonsGroup.children.length > 0) {
      polygonsGroup.remove(polygonsGroup.children[0]);
    }

    // Colors according to visualization mode
    let themeColor = 0xff4e00; // Orange for difference/vegetation decline
    if (activeResult?.analysisType === 'WATER_EXPANSION') {
      themeColor = 0x00d2ff;
    } else if (activeResult?.analysisType === 'URBAN_GROWTH') {
      themeColor = 0xea00ff;
    }

    if (visualizationMode === 'BEFORE') {
      themeColor = 0x22c55e; // Green baseline
    } else if (visualizationMode === 'AFTER') {
      themeColor = 0xd97706; // Amber degraded
    }

    // Render Markers for all results
    allResults.forEach((res, index) => {
      const pos = latLonToVector3(res.location.lat, res.location.lon, 2.03);
      const isActive = activeResult?.id === res.id;

      // Center Pin Mesh
      const pinGeom = new THREE.SphereGeometry(isActive ? 0.055 : 0.035, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: isActive ? themeColor : 0x3df2ff,
      });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.userData = { resultId: res.id, resultIndex: index };
      markersGroup.add(pinMesh);

      // Outer Beacon Ring for all sites
      const baseRingGeom = new THREE.RingGeometry(0.04, 0.055, 32);
      const baseRingMat = new THREE.MeshBasicMaterial({
        color: isActive ? themeColor : 0x3df2ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isActive ? 0.9 : 0.45,
      });
      const baseRing = new THREE.Mesh(baseRingGeom, baseRingMat);
      baseRing.position.copy(pos);
      baseRing.lookAt(new THREE.Vector3(0, 0, 0));
      baseRing.userData = { resultId: res.id, resultIndex: index };
      markersGroup.add(baseRing);

      // Pulsing alert ring for Active Site
      if (isActive) {
        const pulseRingGeom = new THREE.RingGeometry(0.07, 0.09, 32);
        const pulseRingMat = new THREE.MeshBasicMaterial({
          color: themeColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const pulseRing = new THREE.Mesh(pulseRingGeom, pulseRingMat);
        pulseRing.position.copy(pos);
        pulseRing.lookAt(new THREE.Vector3(0, 0, 0));
        pulseRing.name = `pulseRing_${res.id}`;
        markersGroup.add(pulseRing);
      }

      // Draw Surface Curvature Polygons for Active Result
      if (isActive && res.polygon && res.polygon.length > 2) {
        const points = res.polygon.map((p) => latLonToVector3(p.lat, p.lon, 2.025));
        const closedPoints = [...points, points[0]];

        // 1. Boundary Contour Line
        const lineGeom = new THREE.BufferGeometry().setFromPoints(closedPoints);
        const lineMat = new THREE.LineBasicMaterial({
          color: themeColor,
          linewidth: 3,
          transparent: true,
          opacity: 0.95,
        });
        const line = new THREE.Line(lineGeom, lineMat);
        polygonsGroup.add(line);

        // 2. Spherical Filled Curvature Fan Mesh
        const centerPos = latLonToVector3(res.location.lat, res.location.lon, 2.02);
        const fanVertices: THREE.Vector3[] = [];

        // Center point
        for (let i = 0; i < points.length; i++) {
          const nextI = (i + 1) % points.length;
          fanVertices.push(centerPos);
          fanVertices.push(points[i]);
          fanVertices.push(points[nextI]);
        }

        const fanGeom = new THREE.BufferGeometry().setFromPoints(fanVertices);
        fanGeom.computeVertexNormals();

        const fanMat = new THREE.MeshBasicMaterial({
          color: themeColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: overlayOpacity * 0.75,
          depthWrite: false,
        });

        const fanMesh = new THREE.Mesh(fanGeom, fanMat);
        fanMesh.name = 'activePolygonFill';
        polygonsGroup.add(fanMesh);
      }
    });
  }, [allResults, activeResult, visualizationMode, overlayOpacity, latLonToVector3]);

  // View Quick Actions
  const handleResetGlobal = () => {
    if (onUserInteract) onUserInteract();
    targetRotationRef.current = { x: 0.19, y: 0.98 };
    targetCameraDistanceRef.current = 5.2;
  };

  const handleZoomIn = () => {
    if (onUserInteract) onUserInteract();
    targetCameraDistanceRef.current = Math.max(3.2, targetCameraDistanceRef.current - 0.6);
  };

  const handleZoomOut = () => {
    if (onUserInteract) onUserInteract();
    targetCameraDistanceRef.current = Math.min(7.5, targetCameraDistanceRef.current + 0.6);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none">
      {/* Dynamic Background Starfield / Radar Grid */}
      <div className="absolute inset-0 opacity-25 bg-grid-pattern pointer-events-none"></div>

      {/* Top Live Camera Telemetry Badge */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-3 text-[10px] font-mono-code text-white/70 tracking-wider">
        <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 border border-white/15 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-[#3df2ff] animate-pulse"></span>
          <span>
            NADIR: {Math.abs(liveTelemetry.lat).toFixed(2)}°{liveTelemetry.lat >= 0 ? 'N' : 'S'} /{' '}
            {Math.abs(liveTelemetry.lon).toFixed(2)}°{liveTelemetry.lon >= 0 ? 'E' : 'W'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 border border-white/15 shadow-xl">
          <span>ALT: {liveTelemetry.altitudeKm.toLocaleString()} KM</span>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 border border-white/15 text-[#3df2ff] shadow-xl">
          <span>PLATFORM: {activeResult?.satellite || 'Sentinel-2 / Landsat-8'}</span>
        </div>
      </div>

      {/* Top Right Earth Orbit Navigation Controls */}
      <div className="absolute top-4 right-6 z-20 flex items-center gap-2 font-mono-code">
        <button
          onClick={handleZoomIn}
          title="Zoom In Camera"
          className="p-2 bg-black/75 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all shadow-lg active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out Camera"
          className="p-2 bg-black/75 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all shadow-lg active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetGlobal}
          title="Reset Global Earth Perspective"
          className="px-3 py-1.5 bg-black/75 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#3df2ff]" />
          <span className="text-[10px] uppercase tracking-widest hidden sm:inline">Reset Earth</span>
        </button>
      </div>

      {/* 3D WebGL Canvas */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Soft atmospheric blue glow behind sphere */}
        <div className="absolute w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] rounded-full shadow-[0_0_140px_rgba(61,242,255,0.16)] pointer-events-none"></div>

        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        />

        {/* Hover Tooltip when cursor is over a site pin on the 3D globe */}
        {hoveredResult && (
          <div
            className="fixed z-40 pointer-events-none bg-black/90 backdrop-blur-md px-3 py-2 border border-[#3df2ff]/50 shadow-2xl text-xs"
            style={{
              left: `${mouseScreenPos.x + 16}px`,
              top: `${mouseScreenPos.y - 30}px`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3df2ff]"></span>
              <p className="font-bold text-white font-mono-code">{hoveredResult.regionName}</p>
            </div>
            <p className="text-[10px] text-[#ff4e00] font-mono-code font-bold mt-0.5">
              {hoveredResult.metric.name.split(' ')[0]}: {hoveredResult.metric.percentageChange > 0 ? '+' : ''}
              {hoveredResult.metric.percentageChange}%
            </p>
          </div>
        )}
      </div>

      {/* Subtle Interaction Guide */}
      <div className="absolute bottom-4 left-6 z-10 text-[9px] font-mono-code text-white/35 uppercase tracking-[0.2em] hidden sm:flex items-center gap-3">
        <span>Click + Drag to Orbit</span>
        <span>•</span>
        <span>Scroll to Zoom</span>
        <span>•</span>
        <span>Click Any Region Pin to Inspect</span>
      </div>
    </div>
  );
};
