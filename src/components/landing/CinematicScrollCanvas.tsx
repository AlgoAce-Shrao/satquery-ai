/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createEOSatellite, SatelliteComponents } from './satelliteModel';
import { sampleWaypointTimeline } from './chapterTimeline';

interface CinematicScrollCanvasProps {
  scrollProgress: number; // 0.0 to 1.0
}

export const CinematicScrollCanvas: React.FC<CinematicScrollCanvasProps> = ({ scrollProgress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const satelliteRef = useRef<SatelliteComponents | null>(null);
  const earthShaderMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const targetProgress = useRef<number>(0);
  const currentProgress = useRef<number>(0);

  useEffect(() => {
    targetProgress.current = Math.max(0, Math.min(1, scrollProgress));
  }, [scrollProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 3000);
    camera.position.set(15, 12, 195);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL init error:', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x080907, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Deep Space Stars (sparse, subtle, warm)
    const starCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1100 + Math.random() * 600;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = r * Math.cos(phi);

      const temp = Math.random();
      if (temp > 0.85) { starCol[i] = 0.92; starCol[i+1] = 0.88; starCol[i+2] = 0.78; }
      else if (temp < 0.15) { starCol[i] = 0.82; starCol[i+1] = 0.88; starCol[i+2] = 0.96; }
      else { starCol[i] = 0.90; starCol[i+1] = 0.89; starCol[i+2] = 0.86; }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.0, vertexColors: true, transparent: true, opacity: 0.42, sizeAttenuation: true,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // 4. Globe Group (axial tilt)
    const globeGroup = new THREE.Group();
    globeGroup.rotation.z = 23.4 * (Math.PI / 180);
    globeGroup.position.set(38, -10, 0);
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const globeRadius = 62;
    const sunDirection = new THREE.Vector3(180, 110, 140).normalize();

    // 5. Earth Shader Material (GLSL) — will be populated once textures load
    const earthShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: null },
        nightTexture: { value: null },
        specularMap: { value: null },
        cloudsTexture: { value: null },
        sunDirection: { value: sunDirection },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D specularMap;
        uniform sampler2D cloudsTexture;
        uniform vec3 sunDirection;
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(-vPosition);
          vec3 sunDir = normalize(sunDirection);
          float nDotL = dot(normal, sunDir);

          // Soft photographic day/night terminator
          float dayFactor = clamp((nDotL + 0.10) / 0.24, 0.0, 1.0);
          float smoothDay = smoothstep(0.0, 1.0, dayFactor);

          // Surface textures
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          vec4 specVal = texture2D(specularMap, vUv);

          // Animated cloud layer
          vec2 cloudUv = vUv + vec2(time * 0.00022, 0.0);
          vec4 cloudSample = texture2D(cloudsTexture, cloudUv);
          // Thick, dense cloud coverage matching NASA Blue Marble
          float cloudAlpha = pow(cloudSample.r, 0.7) * 1.15;
          cloudAlpha = clamp(cloudAlpha, 0.0, 1.0);

          // Cloud shadow on terrain (cast along sun direction)
          vec2 shadowOffset = sunDir.xy * 0.006;
          float cloudShadow = pow(texture2D(cloudsTexture, cloudUv - shadowOffset).r, 0.8) * 0.35 * smoothDay;

          // Surface with cloud shadow applied
          vec3 surfaceDay = dayColor.rgb * (1.0 - cloudShadow * 0.8);

          // Deep cobalt ocean color boost — oceans are rich, dark blue (key NASA Blue Marble trait)
          float isOcean = specVal.r; // high = ocean, low = land
          vec3 oceanTint = vec3(0.04, 0.09, 0.22) * isOcean * (1.0 - cloudAlpha);
          surfaceDay = mix(surfaceDay, surfaceDay * vec3(0.75, 0.88, 1.15), isOcean * 0.25);
          surfaceDay += oceanTint * smoothDay;

          // Slightly boost continent vibrancy (greens and browns)
          float isLand = 1.0 - isOcean;
          surfaceDay = mix(surfaceDay, surfaceDay * vec3(1.08, 1.04, 0.94), isLand * 0.20);

          // Natural ocean specular sheen (sunglint on water)
          vec3 reflectDir = reflect(-sunDir, normal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 28.0) * isOcean * 0.70 * smoothDay;
          vec3 specColor = vec3(0.95, 0.96, 1.0) * spec;

          // Warm golden twilight scattering along the terminator
          float terminator = 1.0 - abs(nDotL);
          float twilightBand = pow(clamp(terminator, 0.0, 1.0), 3.8) * 0.22;
          vec3 twilightColor = vec3(0.92, 0.54, 0.18) * twilightBand * smoothDay;

          // In-atmosphere Rayleigh scattering on illuminated limb
          float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
          float rim = pow(fresnel, 2.8) * 0.38 * max(nDotL + 0.18, 0.0);
          vec3 rimColor = vec3(0.14, 0.46, 0.88) * rim;

          // Night city lights
          vec3 nightGlow = nightColor.rgb * (1.0 - smoothDay) * 1.40;

          // Daylight diffuse with slightly cooler solar to match NASA photo feel
          vec3 solarColor = vec3(1.0, 0.98, 0.96);
          vec3 baseDay = surfaceDay * max(nDotL, 0.04) * solarColor;

          // Composite surface
          vec3 surfaceColor = mix(nightGlow, baseDay + specColor + twilightColor, smoothDay) + rimColor;

          // Dense, bright cloud layer composited on top
          vec3 cloudColor = vec3(0.97, 0.98, 1.0) * max(nDotL, 0.12);
          surfaceColor = mix(surfaceColor, cloudColor, cloudAlpha * smoothDay);
          // Add slight cloud illumination on dark terminator side
          surfaceColor = mix(surfaceColor, vec3(0.20, 0.22, 0.28) * cloudSample.r, cloudAlpha * (1.0 - smoothDay) * 0.5);

          gl_FragColor = vec4(surfaceColor, 1.0);
        }
      `,
    });
    earthShaderMatRef.current = earthShaderMat;

    const earthGeo = new THREE.SphereGeometry(globeRadius, 80, 80);
    const earthMesh = new THREE.Mesh(earthGeo, earthShaderMat);
    globeGroup.add(earthMesh);

    // 6. Cloud Mesh (separate slightly above surface for parallax)
    const cloudGeo = new THREE.SphereGeometry(globeRadius * 1.008, 56, 56);
    const cloudMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    // 7. Thin Atmospheric Limb (BackSide, subtle Rayleigh)
    const atmGeo = new THREE.SphereGeometry(globeRadius * 1.018, 48, 48);
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float f = 1.0 - max(dot(vNormal, viewDir), 0.0);
          // Inner falloff for sharp luminous limb edge (matches NASA Blue Marble)
          float intensity = pow(f, 3.0);
          // Rich cobalt blue atmosphere limb — the iconic 'blue marble' atmospheric ring
          vec3 atmColor = vec3(0.12, 0.40, 0.90);
          gl_FragColor = vec4(atmColor, intensity * 0.62);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(atmGeo, atmMat));

    // 8. Satellite
    const satellite = createEOSatellite();
    scene.add(satellite.rootGroup);
    satelliteRef.current = satellite;

    // 9. Lighting
    const sunLight = new THREE.DirectionalLight(0xfff8e8, 2.8);
    sunLight.position.copy(sunDirection.clone().multiplyScalar(400));
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x10131a, 0.48));

    // 10. Use bundled procedural textures so the landing page has no CDN dependency.
    let loadedTextures: THREE.Texture[] = [];
    let isDisposed = false;
    void import('./realisticEarthTextures')
      .then(({ createRealisticEarthTexture, createNightLightsTexture, createOceanSpecularMap, createRealisticCloudsTexture }) => {
        const textures = [
          createRealisticEarthTexture(1024, 512),
          createNightLightsTexture(1024, 512),
          createOceanSpecularMap(512, 256),
          createRealisticCloudsTexture(512, 256),
        ];
        if (isDisposed) {
          textures.forEach((texture) => texture.dispose());
          return;
        }
        const [dayTexture, nightTexture, specularMap, cloudsTexture] = textures;
        earthShaderMat.uniforms.dayTexture.value = dayTexture;
        earthShaderMat.uniforms.nightTexture.value = nightTexture;
        earthShaderMat.uniforms.specularMap.value = specularMap;
        earthShaderMat.uniforms.cloudsTexture.value = cloudsTexture;
        earthShaderMat.needsUpdate = true;
        loadedTextures = textures;
      })
      .catch((error) => console.error('Unable to create landing-page Earth textures:', error));

    // 11. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      currentProgress.current += (targetProgress.current - currentProgress.current) * 0.08;
      const p = currentProgress.current;
      const waypoint = sampleWaypointTimeline(p);

      if (earthShaderMatRef.current) {
        earthShaderMatRef.current.uniforms.time.value = t;
      }

      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y = t * 0.005;
      }

      if (globeGroupRef.current && cameraRef.current && satelliteRef.current) {
        const globe = globeGroupRef.current;
        const cam = cameraRef.current;
        const sat = satelliteRef.current;

        globe.rotation.y = waypoint.globeRotOffset + t * 0.007;
        globe.position.copy(waypoint.globePos);

        cam.position.copy(waypoint.camPos);
        cam.lookAt(waypoint.camLookAt);

        const satFloatX = Math.cos(t * 0.35) * 0.7;
        const satFloatY = Math.sin(t * 0.30) * 0.5;
        sat.rootGroup.position.set(
          waypoint.satPos.x + satFloatX,
          waypoint.satPos.y + satFloatY,
          waypoint.satPos.z
        );
        sat.rootGroup.lookAt(globe.position);
        sat.updateAnimation(t, waypoint.isScanning);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !cameraRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      earthGeo.dispose();
      earthShaderMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      atmGeo.dispose();
      atmMat.dispose();
      loadedTextures.forEach((tex) => tex.dispose());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#080907]"
      style={{ willChange: 'transform' }}
    />
  );
};
