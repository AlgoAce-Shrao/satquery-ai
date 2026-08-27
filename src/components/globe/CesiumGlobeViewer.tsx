import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { AnalysisResult } from '../../types/geospatial';
import {
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Crosshair,
  MapPin,
  Eye,
} from 'lucide-react';

export type VisualizationMode = 'BEFORE' | 'DIFFERENCE' | 'AFTER';

export interface TelemetryData {
  lat: number;
  lon: number;
  altitudeKm: number;
  heading: number;
  pitch: number;
}

interface CesiumGlobeViewerProps {
  activeResult: AnalysisResult | null;
  allResults: AnalysisResult[];
  isTourActive: boolean;
  visualizationMode?: VisualizationMode;
  overlayOpacity?: number;
  showSatelliteImagery?: boolean;
  showTerrain?: boolean;
  showBorders?: boolean;
  showMarkers?: boolean;
  onSelectResult: (index: number) => void;
  onUserInteract?: () => void;
  onTelemetryChange?: (telemetry: TelemetryData) => void;
}

export const CesiumGlobeViewer: React.FC<CesiumGlobeViewerProps> = ({
  activeResult,
  allResults,
  isTourActive,
  visualizationMode = 'DIFFERENCE',
  overlayOpacity = 0.85,
  showSatelliteImagery = true,
  showTerrain = true,
  showBorders = true,
  showMarkers = true,
  onSelectResult,
  onUserInteract,
  onTelemetryChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const isInteractingRef = useRef(false);
  const polygonEntityRef = useRef<Cesium.Entity | null>(null);
  const polygonOutlineEntityRef = useRef<Cesium.Entity | null>(null);
  const subRegionEntitiesRef = useRef<Cesium.Entity[]>([]);
  const boundingBoxEntityRef = useRef<Cesium.Entity | null>(null);
  const markersEntitiesRef = useRef<Cesium.Entity[]>([]);

  // Live real telemetry from Cesium camera
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    lat: -10.83,
    lon: -55.86,
    altitudeKm: 1650,
    heading: 0,
    pitch: -55,
  });

  const [headingDeg, setHeadingDeg] = useState<number>(0);
  const [is2DMode, setIs2DMode] = useState<boolean>(false);
  const [hoveredSite, setHoveredSite] = useState<AnalysisResult | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    // Configure Cesium Ion Access Token (fallback to default or Ion demo)
    if (!Cesium.Ion.defaultAccessToken) {
      const customToken = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_CESIUM_ION_TOKEN;
      Cesium.Ion.defaultAccessToken =
        customToken ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZW1vLXRva2VuIiwiaWQiOjEyMzQsInNjb3BlcyI6WyJhc3NldHM6cmVhZCJdLCJpYXQiOjE2MDAwMDAwMDB9.dummy';
    }

    // Initialize Viewer
    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      scene3DOnly: false,
      orderIndependentTranslucency: true,
      contextOptions: {
        webgl: {
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
        },
      },
    });

    viewerRef.current = viewer;

    // Enable high-contrast dark space background & realistic atmosphere
    const scene = viewer.scene;
    scene.backgroundColor = Cesium.Color.fromCssColorString('#050506');
    scene.globe.enableLighting = true;
    scene.globe.showGroundAtmosphere = true;
    scene.globe.atmosphereLightIntensity = 10.0;
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b1420');

    // Add High-Resolution ESRI World Imagery (Global Satellite Photorealism)
    try {
      Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
        { enablePickFeatures: false }
      ).then((provider) => {
        if (!viewer.isDestroyed()) {
          viewer.imageryLayers.removeAll();
          viewer.imageryLayers.addImageryProvider(provider);
        }
      }).catch(() => {
        // Fallback to TileMapService / OpenStreetMap
        Cesium.createWorldImageryAsync().then((provider) => {
          if (!viewer.isDestroyed()) {
            viewer.imageryLayers.addImageryProvider(provider);
          }
        }).catch(() => {});
      });
    } catch (e) {
      console.warn('Cesium imagery initialization fallback', e);
    }

    // Set initial camera perspective (global overview)
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-55.8594, -10.8281, 3500000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0.0,
      },
    });

    // Real-Time Camera Telemetry & Event Listener
    const updateTelemetry = () => {
      if (!viewer || viewer.isDestroyed()) return;
      try {
        const camera = viewer.camera;
        if (!camera) return;
        const cartographic = camera.positionCartographic;

        if (
          cartographic &&
          typeof cartographic.latitude === 'number' &&
          !isNaN(cartographic.latitude) &&
          typeof cartographic.longitude === 'number' &&
          !isNaN(cartographic.longitude)
        ) {
          const lat = Cesium.Math.toDegrees(cartographic.latitude);
          const lon = Cesium.Math.toDegrees(cartographic.longitude);
          const altKm = typeof cartographic.height === 'number' && !isNaN(cartographic.height)
            ? Math.round(cartographic.height / 1000)
            : 1000;
          const heading = typeof camera.heading === 'number' && !isNaN(camera.heading)
            ? Cesium.Math.toDegrees(camera.heading)
            : 0;
          const pitch = typeof camera.pitch === 'number' && !isNaN(camera.pitch)
            ? Cesium.Math.toDegrees(camera.pitch)
            : -90;

          if (!isNaN(heading)) {
            setHeadingDeg(heading);
          }

          if (!isNaN(lat) && !isNaN(lon)) {
            const data: TelemetryData = {
              lat: Number(lat.toFixed(2)),
              lon: Number(lon.toFixed(2)),
              altitudeKm: Math.max(10, isNaN(altKm) ? 1000 : altKm),
              heading: Math.round(isNaN(heading) ? 0 : heading),
              pitch: Math.round(isNaN(pitch) ? -90 : pitch),
            };

            setTelemetry(data);
            if (onTelemetryChange) {
              onTelemetryChange(data);
            }
          }
        }
      } catch (e) {
        // Prevent telemetry errors from stopping Cesium render loop
      }
    };

    const removeCameraChanged = viewer.camera.changed.addEventListener(updateTelemetry);
    const removePreRender = viewer.scene.preRender.addEventListener(updateTelemetry);

    // Screen Space Event Handler: Detect user dragging/zooming & picking
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    // User interaction pauses automated tour
    const notifyUserInteract = () => {
      isInteractingRef.current = true;
      if (onUserInteract) {
        onUserInteract();
      }
    };

    handler.setInputAction(() => {
      notifyUserInteract();
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction(() => {
      notifyUserInteract();
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

    handler.setInputAction(() => {
      notifyUserInteract();
    }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);

    handler.setInputAction(() => {
      notifyUserInteract();
    }, Cesium.ScreenSpaceEventType.WHEEL);

    handler.setInputAction(() => {
      notifyUserInteract();
    }, Cesium.ScreenSpaceEventType.PINCH_START);

    // Left Click: Pick Entity Marker
    handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
      const pickedObject = viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id as Cesium.Entity;
        if (entity.properties && entity.properties.hasProperty('resultIndex')) {
          const index = entity.properties.getValue(Cesium.JulianDate.now()).resultIndex;
          if (typeof index === 'number') {
            notifyUserInteract();
            onSelectResult(index);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Mouse Move: Hover Tooltip on site markers
    handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
      if (viewer.isDestroyed()) return;
      const pickedObject = viewer.scene.pick(movement.endPosition);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id as Cesium.Entity;
        if (entity.properties && entity.properties.hasProperty('resultId')) {
          const resultId = entity.properties.getValue(Cesium.JulianDate.now()).resultId;
          const found = allResults.find((r) => r.id === resultId);
          if (found) {
            setHoveredSite(found);
            setTooltipPos({ x: movement.endPosition.x, y: movement.endPosition.y });
            return;
          }
        }
      }
      setHoveredSite(null);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Cleanup
    return () => {
      removeCameraChanged();
      removePreRender();
      handler.destroy();
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []);

  // Update Result Markers / Pins on the Globe
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Clear old marker entities
    markersEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    markersEntitiesRef.current = [];

    if (!showMarkers) return;

    allResults.forEach((res, index) => {
      const isActive = activeResult?.id === res.id;
      const { lat, lon } = res.location;

      // Color scheme according to severity and active state
      const isCritical = res.metric.severity === 'CRITICAL';
      const pinColor = isActive
        ? Cesium.Color.fromCssColorString('#3df2ff')
        : isCritical
        ? Cesium.Color.fromCssColorString('#ff4e00')
        : Cesium.Color.fromCssColorString('#f59e0b');

      // 1. Point / Pin Entity
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 100),
        point: {
          pixelSize: isActive ? 16 : 10,
          color: pinColor,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: isActive ? 3 : 1.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: `${res.rank}. ${res.regionName}`,
          font: isActive ? 'bold 12px Plus Jakarta Sans, sans-serif' : '10px Plus Jakarta Sans, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, isActive ? -18 : -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000000),
        },
        properties: new Cesium.PropertyBag({
          resultId: res.id,
          resultIndex: index,
        }),
      });

      markersEntitiesRef.current.push(entity);
    });
  }, [allResults, activeResult, showMarkers]);

  // Update Polygon Overlays & Sub-Region Change Annotations for Active Result
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Remove previous polygon entities
    if (polygonEntityRef.current) {
      viewer.entities.remove(polygonEntityRef.current);
      polygonEntityRef.current = null;
    }
    if (polygonOutlineEntityRef.current) {
      viewer.entities.remove(polygonOutlineEntityRef.current);
      polygonOutlineEntityRef.current = null;
    }
    if (boundingBoxEntityRef.current) {
      viewer.entities.remove(boundingBoxEntityRef.current);
      boundingBoxEntityRef.current = null;
    }
    subRegionEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    subRegionEntitiesRef.current = [];

    if (!activeResult) return;

    // 1. If bounding box exists, render glowing bounding box
    if (activeResult.boundingBox) {
      const [minLon, minLat, maxLon, maxLat] = activeResult.boundingBox;
      const boxPositions = Cesium.Cartesian3.fromDegreesArray([
        minLon, minLat,
        maxLon, minLat,
        maxLon, maxLat,
        minLon, maxLat,
        minLon, minLat,
      ]);
      boundingBoxEntityRef.current = viewer.entities.add({
        polyline: {
          positions: boxPositions,
          width: 2.5,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString('#3df2ff'),
            gapColor: Cesium.Color.TRANSPARENT,
            dashLength: 16.0,
          }),
          clampToGround: true,
        },
      });
    }

    // 2. Render sub-region change items if available
    if (activeResult.spatialEvidence && activeResult.spatialEvidence.length > 0) {
      activeResult.spatialEvidence.forEach((item) => {
        if (!item.coordinates || item.coordinates.length < 3) return;

        let itemColor = Cesium.Color.fromCssColorString('#10b981').withAlpha(0.65);
        let itemOutline = Cesium.Color.fromCssColorString('#10b981');

        if (item.changeStatus === 'NEW_INCREASED') {
          itemColor = Cesium.Color.fromCssColorString('#06b6d4').withAlpha(0.7);
          itemOutline = Cesium.Color.fromCssColorString('#3df2ff');
        } else if (item.changeStatus === 'REMOVED_DECREASED') {
          itemColor = Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.7);
          itemOutline = Cesium.Color.fromCssColorString('#ff4e00');
        }

        const flatCoords: number[] = [];
        item.coordinates.forEach((c) => flatCoords.push(c.lon, c.lat));

        const subEntity = viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(flatCoords)),
            material: itemColor,
            classificationType: Cesium.ClassificationType.TERRAIN,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
        subRegionEntitiesRef.current.push(subEntity);
      });
    }

    // 3. Render Main Result Polygon
    if (activeResult.polygon && activeResult.polygon.length >= 3) {
      // Determine polygon fill color based on visualization mode
      let fillColor = Cesium.Color.fromCssColorString('#ff4e00').withAlpha(overlayOpacity * 0.75);
      let outlineColor = Cesium.Color.fromCssColorString('#ff4e00');

      if (visualizationMode === 'BEFORE') {
        fillColor = Cesium.Color.fromCssColorString('#10b981').withAlpha(overlayOpacity * 0.75);
        outlineColor = Cesium.Color.fromCssColorString('#10b981');
      } else if (visualizationMode === 'AFTER') {
        fillColor = Cesium.Color.fromCssColorString('#d97706').withAlpha(overlayOpacity * 0.75);
        outlineColor = Cesium.Color.fromCssColorString('#d97706');
      } else if (activeResult.analysisType === 'WATER_EXPANSION' || activeResult.category === 'WATER_CHANGE' || activeResult.category === 'FLOOD') {
        fillColor = Cesium.Color.fromCssColorString('#0284c7').withAlpha(overlayOpacity * 0.8);
        outlineColor = Cesium.Color.fromCssColorString('#38bdf8');
      } else if (activeResult.analysisType === 'URBAN_GROWTH' || activeResult.category === 'URBAN_EXPANSION') {
        fillColor = Cesium.Color.fromCssColorString('#c026d3').withAlpha(overlayOpacity * 0.8);
        outlineColor = Cesium.Color.fromCssColorString('#e879f9');
      }

      // Convert polygon points to Cesium Cartesian3 positions
      const flatPositions: number[] = [];
      activeResult.polygon.forEach((p) => {
        flatPositions.push(p.lon, p.lat);
      });

      const hierarchy = Cesium.Cartesian3.fromDegreesArray(flatPositions);

      // Create Clamped-to-Ground Surface Polygon
      polygonEntityRef.current = viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(hierarchy),
          material: fillColor,
          classificationType: Cesium.ClassificationType.TERRAIN,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });

      // Create Glowing Boundary Outline Polyline
      const closedFlatPositions = [...flatPositions, flatPositions[0], flatPositions[1]];
      const linePositions = Cesium.Cartesian3.fromDegreesArray(closedFlatPositions);

      polygonOutlineEntityRef.current = viewer.entities.add({
        polyline: {
          positions: linePositions,
          width: 3.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.35,
            color: outlineColor,
          }),
          clampToGround: true,
        },
      });
    }
  }, [activeResult, visualizationMode, overlayOpacity]);

  // Smooth Camera Flight to Active Result
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !activeResult) return;

    const { lat, lon } = activeResult.location;
    const { altitude, heading = 0, pitch = -55 } = activeResult.camera || {
      altitude: 1400000,
      heading: 0,
      pitch: -55,
    };

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0.0,
      },
      duration: 2.2,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }, [activeResult]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (viewer.imageryLayers.length > 0) {
      viewer.imageryLayers.get(0).show = showSatelliteImagery;
    }
  }, [showSatelliteImagery]);

  // Camera Action Helpers
  const handleZoomIn = () => {
    if (onUserInteract) onUserInteract();
    const camera = viewerRef.current?.camera;
    if (!camera) return;
    const height = camera.positionCartographic?.height || 2000000;
    camera.zoomIn(height * 0.35);
  };

  const handleZoomOut = () => {
    if (onUserInteract) onUserInteract();
    const camera = viewerRef.current?.camera;
    if (!camera) return;
    const height = camera.positionCartographic?.height || 2000000;
    camera.zoomOut(height * 0.5);
  };

  const handleResetNorth = () => {
    if (onUserInteract) onUserInteract();
    const camera = viewerRef.current?.camera;
    if (!camera) return;
    camera.setView({
      orientation: {
        heading: 0,
        pitch: camera.pitch,
        roll: 0,
      },
    });
  };

  const handleLocateActive = () => {
    if (!activeResult || !viewerRef.current) return;
    if (onUserInteract) onUserInteract();
    const { lat, lon } = activeResult.location;
    const { altitude = 1200000, pitch = -55 } = activeResult.camera || {};
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0,
      },
      duration: 1.8,
    });
  };

  const handleToggle2D3D = () => {
    if (!viewerRef.current) return;
    if (onUserInteract) onUserInteract();
    if (is2DMode) {
      viewerRef.current.scene.morphTo3D(1.5);
      setIs2DMode(false);
    } else {
      viewerRef.current.scene.morphTo2D(1.5);
      setIs2DMode(true);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none">
      {/* Dynamic Starfield / Coordinate Matrix */}
      <div className="absolute inset-0 opacity-20 bg-grid-pattern pointer-events-none"></div>

      {/* Top Left Live Camera Telemetry Badge */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-3 text-[10px] font-mono-code text-white/70 tracking-wider">
        <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 border border-white/15 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-[#3df2ff] animate-pulse"></span>
          <span>
            NADIR: {Math.abs(telemetry.lat).toFixed(2)}°{telemetry.lat >= 0 ? 'N' : 'S'} /{' '}
            {Math.abs(telemetry.lon).toFixed(2)}°{telemetry.lon >= 0 ? 'E' : 'W'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 border border-white/15 shadow-xl">
          <span>ALT: {telemetry.altitudeKm.toLocaleString()} KM</span>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 border border-white/15 text-[#3df2ff] shadow-xl">
          <span>SENSOR: {activeResult?.satellite || 'Sentinel-2 / Landsat-8'}</span>
        </div>
      </div>

      {/* Top Right Globe On-Screen Floating Widgets */}
      <div className="absolute top-4 right-6 z-20 flex items-center gap-2 font-mono-code">
        {/* Compass / Reset North */}
        <button
          onClick={handleResetNorth}
          title="Reset North Orientation"
          className="p-2 bg-black/80 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all shadow-lg active:scale-95 flex items-center justify-center group"
        >
          <Compass
            className="w-4 h-4 text-[#3df2ff] transition-transform duration-200"
            style={{ transform: `rotate(${-headingDeg}deg)` }}
          />
        </button>

        {/* 2D / 3D Mode Toggle */}
        <button
          onClick={handleToggle2D3D}
          title={is2DMode ? 'Switch to 3D Globe' : 'Switch to 2D Projection'}
          className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all shadow-lg active:scale-95 ${
            is2DMode
              ? 'bg-[#3df2ff] text-black border-[#3df2ff]'
              : 'bg-black/80 hover:bg-white/15 text-white/80 border-white/15'
          }`}
        >
          {is2DMode ? '2D Map' : '3D Globe'}
        </button>

        {/* Center / Locate Active Result */}
        <button
          onClick={handleLocateActive}
          title="Center on Active Region"
          className="p-2 bg-black/80 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all shadow-lg active:scale-95"
        >
          <Crosshair className="w-4 h-4 text-[#ff4e00]" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 bg-black/80 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all shadow-lg active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 bg-black/80 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all shadow-lg active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main Cesium Viewer Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
      />

      {/* Interactive Tooltip when hovering over a site pin */}
      {hoveredSite && (
        <div
          className="fixed z-40 pointer-events-none bg-black/90 backdrop-blur-md px-3.5 py-2 border border-[#3df2ff]/60 shadow-2xl text-xs select-none"
          style={{
            left: `${tooltipPos.x + 18}px`,
            top: `${tooltipPos.y - 35}px`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3df2ff] animate-ping"></span>
            <p className="font-bold text-white font-sans">{hoveredSite.regionName}</p>
          </div>
          <p className="text-[10px] text-[#ff4e00] font-mono-code font-bold mt-1">
            {hoveredSite.metric.name.split(' ')[0]}: {hoveredSite.metric.percentageChange > 0 ? '+' : ''}
            {hoveredSite.metric.percentageChange}% ({hoveredSite.metric.severity})
          </p>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-6 z-10 text-[9px] font-mono-code text-white/35 uppercase tracking-[0.2em] hidden sm:flex items-center gap-3">
        <span>Click + Drag to Orbit</span>
        <span>•</span>
        <span>Scroll to Zoom</span>
        <span>•</span>
        <span>Click Region to Inspect</span>
      </div>
    </div>
  );
};
