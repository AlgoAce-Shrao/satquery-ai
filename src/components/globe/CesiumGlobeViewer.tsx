import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { AnalysisResult, SpatialEvidenceItem } from '../../types/geospatial';
import { describeRegion, regionAnchor, TONE_HEX, InsightTone } from '../../lib/geo/regionInsight';
import { RegionCallout, RegionCalloutHandle } from './RegionCallout';
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

const EVIDENCE_TONE: Record<NonNullable<SpatialEvidenceItem['changeStatus']>, InsightTone> = {
  REMOVED_DECREASED: 'critical',
  NEW_INCREASED: 'positive',
  UNCHANGED: 'neutral',
};

/** Evidence items that are genuinely separate features (not a copy of the main polygon). */
function distinctSubRegions(result: AnalysisResult): SpatialEvidenceItem[] {
  const main = result.polygon ?? [];
  return (result.spatialEvidence ?? []).filter((item) => {
    if (!item.coordinates || item.coordinates.length < 3) return false;
    const same =
      item.coordinates.length === main.length &&
      item.coordinates.every((c, i) => c.lat === main[i]?.lat && c.lon === main[i]?.lon);
    return !same;
  });
}

/** Unreferenced uploads resolve to 0,0 at orbital altitude — there is nothing real to point at. */
function hasRealLocation(result: AnalysisResult) {
  return !(result.location.lat === 0 && result.location.lon === 0 && (result.camera?.altitude ?? 0) >= 20000000);
}

/**
 * Flies so the region sits in the middle of the view. (Placing the camera directly
 * above the site and tilting to the horizon leaves the site at the screen's bottom edge.)
 */
function flyToRegion(
  viewer: Cesium.Viewer,
  result: AnalysisResult,
  options: { duration: number; headingDeg?: number; complete?: () => void; cancel?: () => void }
) {
  const { lat, lon } = regionAnchor(result);
  const { altitude = 1200000, heading = 0, pitch = -55 } = result.camera || {};
  const pitchRad = Cesium.Math.toRadians(Math.min(-20, pitch));
  // Keep roughly the configured altitude by converting it to a slant range.
  const range = altitude / Math.sin(-pitchRad);
  viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(lon, lat, 0), 1), {
    offset: new Cesium.HeadingPitchRange(Cesium.Math.toRadians(options.headingDeg ?? heading), pitchRad, range),
    duration: options.duration,
    easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    complete: options.complete,
    cancel: options.cancel,
  });
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
  const highlightEntitiesRef = useRef<Cesium.Entity[]>([]);
  const allResultsRef = useRef<AnalysisResult[]>(allResults);
  allResultsRef.current = allResults;
  const calloutRef = useRef<RegionCalloutHandle>(null);
  const activeAnchorRef = useRef<Cesium.Cartesian3 | null>(null);
  const flightDoneRef = useRef(false);

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
  const activeInsight = useMemo(
    () => (activeResult && hasRealLocation(activeResult) ? describeRegion(activeResult) : null),
    [activeResult]
  );

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    // Configure the optional Cesium Ion access token. ESRI imagery below works without it.
    if (!Cesium.Ion.defaultAccessToken) {
      const customToken = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_CESIUM_ION_ACCESS_TOKEN;
      if (customToken) {
        Cesium.Ion.defaultAccessToken = customToken;
      }
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
    scene.backgroundColor = Cesium.Color.fromCssColorString('#11120F');
    scene.globe.enableLighting = true;
    scene.globe.showGroundAtmosphere = true;
    scene.globe.atmosphereLightIntensity = 10.0;
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#161711');

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
      }).catch((error) => {
        // This fallback does not require a Cesium Ion token.
        console.warn('ESRI imagery is unavailable; falling back to OpenStreetMap.', error);
        try {
          viewer.imageryLayers.addImageryProvider(
            new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' })
          );
        } catch (fallbackError) {
          console.error('Unable to initialize a fallback imagery provider.', fallbackError);
        }
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
          const found = allResultsRef.current.find((r) => r.id === resultId);
          if (found) {
            setHoveredSite(found);
            setTooltipPos({ x: movement.endPosition.x, y: movement.endPosition.y });
            return;
          }
        }
      }
      setHoveredSite(null);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Keep the active-region callout pinned to its anchor as the camera moves.
    const scratchNormal = new Cesium.Cartesian3();
    const scratchToCamera = new Cesium.Cartesian3();
    const placeCallout = () => {
      const handle = calloutRef.current;
      if (!handle || viewer.isDestroyed()) return;
      const canvas = viewer.scene.canvas;
      const anchor = activeAnchorRef.current;
      if (!anchor || !flightDoneRef.current) {
        handle.place(0, 0, false, canvas.clientWidth, canvas.clientHeight);
        return;
      }
      const win = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, anchor);
      // Horizon test: hide when the anchor is on the far side of the globe.
      const facing =
        viewer.scene.mode !== Cesium.SceneMode.SCENE3D ||
        Cesium.Cartesian3.dot(
          Cesium.Cartesian3.normalize(anchor, scratchNormal),
          Cesium.Cartesian3.subtract(viewer.camera.positionWC, anchor, scratchToCamera)
        ) > 0;
      handle.place(win?.x ?? 0, win?.y ?? 0, Boolean(win) && facing, canvas.clientWidth, canvas.clientHeight);
    };
    const removePostRender = viewer.scene.postRender.addEventListener(placeCallout);

    // Cleanup
    return () => {
      removeCameraChanged();
      removePreRender();
      removePostRender();
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

      if (!hasRealLocation(res)) return;

      // Pin colour encodes what happened (loss / gain / mixed); the label names it.
      const insight = describeRegion(res);
      const pinColor = isActive
        ? Cesium.Color.fromCssColorString('#A6B86A')
        : Cesium.Color.fromCssColorString(TONE_HEX[insight.tone]);
      const isSevere = res.metric.severity === 'CRITICAL' || res.metric.severity === 'HIGH';

      // 1. Point / Pin Entity
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 100),
        point: {
          pixelSize: isActive ? 16 : isSevere ? 11 : 9,
          color: pinColor,
          outlineColor: Cesium.Color.fromCssColorString('#E6E2D6'),
          outlineWidth: isActive ? 3 : 1.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: `${res.rank}. ${res.regionName}\n${insight.headline} · ${insight.deltaText}`,
          font: isActive ? 'bold 12px IBM Plex Sans, sans-serif' : '10px IBM Plex Sans, sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#E6E2D6'),
          outlineColor: Cesium.Color.fromCssColorString('#11120F'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, isActive ? -18 : -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 6000000),
          show: !isActive, // the active region gets the full callout instead
        },
        properties: new Cesium.PropertyBag({
          resultId: res.id,
          resultIndex: index,
        }),
      });

      markersEntitiesRef.current.push(entity);
    });
  }, [allResults, activeResult, showMarkers]);

  // Active-region highlight: anchor for the callout / pulse overlay + labelled sub-regions.
  // (The pulse is drawn in the DOM overlay: translucent billboards over classified ground
  // polygons render as dark discs with order-independent translucency enabled.)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    highlightEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    highlightEntitiesRef.current = [];
    activeAnchorRef.current = null;
    if (!activeResult || !hasRealLocation(activeResult)) return;

    const { lat, lon } = regionAnchor(activeResult);
    activeAnchorRef.current = Cesium.Cartesian3.fromDegrees(lon, lat, 0);

    // Separate grounded features (e.g. AI vision boxes on a georeferenced upload)
    distinctSubRegions(activeResult).forEach((item) => {
      const c = item.coordinates;
      const cLat = c.reduce((sum, pt) => sum + pt.lat, 0) / c.length;
      const cLon = c.reduce((sum, pt) => sum + pt.lon, 0) / c.length;
      const color = Cesium.Color.fromCssColorString(TONE_HEX[EVIDENCE_TONE[item.changeStatus ?? 'UNCHANGED']]);
      highlightEntitiesRef.current.push(
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(cLon, cLat, 0),
          point: {
            pixelSize: 6,
            color,
            outlineColor: Cesium.Color.fromCssColorString('#11120F'),
            outlineWidth: 1.5,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: item.metricDelta ? `${item.label}\n${item.metricDelta}` : item.label,
            font: '10px IBM Plex Sans, sans-serif',
            fillColor: color,
            outlineColor: Cesium.Color.fromCssColorString('#11120F'),
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -9),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2500000),
          },
        })
      );
    });
  }, [activeResult]);

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
            color: Cesium.Color.fromCssColorString('#A6B86A'),
            gapColor: Cesium.Color.TRANSPARENT,
            dashLength: 16.0,
          }),
          clampToGround: true,
        },
      });
    }

    // 2. Render sub-region change items if available
    if (activeResult.spatialEvidence && activeResult.spatialEvidence.length > 0) {
      // Items identical to the main polygon are skipped: stacking both fills hid the imagery.
      distinctSubRegions(activeResult).forEach((item) => {
        if (!item.coordinates || item.coordinates.length < 3) return;

        let itemColor = Cesium.Color.fromCssColorString('#7FA66A').withAlpha(0.65);
        let itemOutline = Cesium.Color.fromCssColorString('#7FA66A');

        if (item.changeStatus === 'NEW_INCREASED') {
          itemColor = Cesium.Color.fromCssColorString('#A6B86A').withAlpha(0.7);
          itemOutline = Cesium.Color.fromCssColorString('#A6B86A');
        } else if (item.changeStatus === 'REMOVED_DECREASED') {
          itemColor = Cesium.Color.fromCssColorString('#B85C4A').withAlpha(0.7);
          itemOutline = Cesium.Color.fromCssColorString('#B85C4A');
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
      let fillColor = Cesium.Color.fromCssColorString('#B85C4A').withAlpha(overlayOpacity * 0.75);
      let outlineColor = Cesium.Color.fromCssColorString('#C4705E');

      if (visualizationMode === 'BEFORE') {
        fillColor = Cesium.Color.fromCssColorString('#7FA66A').withAlpha(overlayOpacity * 0.75);
        outlineColor = Cesium.Color.fromCssColorString('#7FA66A');
      } else if (visualizationMode === 'AFTER') {
        fillColor = Cesium.Color.fromCssColorString('#D39B4A').withAlpha(overlayOpacity * 0.75);
        outlineColor = Cesium.Color.fromCssColorString('#D39B4A');
      } else if (activeResult.analysisType === 'WATER_EXPANSION' || activeResult.category === 'WATER_CHANGE' || activeResult.category === 'FLOOD') {
        fillColor = Cesium.Color.fromCssColorString('#6F8C8E').withAlpha(overlayOpacity * 0.8);
        outlineColor = Cesium.Color.fromCssColorString('#8FA8A9');
      } else if (activeResult.analysisType === 'URBAN_GROWTH' || activeResult.category === 'URBAN_EXPANSION') {
        fillColor = Cesium.Color.fromCssColorString('#C4A484').withAlpha(overlayOpacity * 0.8);
        outlineColor = Cesium.Color.fromCssColorString('#D6BC9C');
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

    // The callout appears once the camera has arrived, so it never trails the flight.
    flightDoneRef.current = false;
    const settle = () => {
      flightDoneRef.current = true;
    };

    if (hasRealLocation(activeResult)) {
      flyToRegion(viewer, activeResult, { duration: 2.2, complete: settle, cancel: settle });
      return;
    }

    // Unreferenced upload: return to a global overview.
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
      complete: settle,
      cancel: settle,
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
    if (!hasRealLocation(activeResult)) return;
    flightDoneRef.current = false;
    const settle = () => {
      flightDoneRef.current = true;
    };
    flyToRegion(viewerRef.current, activeResult, { duration: 1.8, headingDeg: 0, complete: settle, cancel: settle });
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
          <span className="w-2 h-2 rounded-full bg-sq-accent animate-pulse"></span>
          <span>
            NADIR: {Math.abs(telemetry.lat).toFixed(2)}°{telemetry.lat >= 0 ? 'N' : 'S'} /{' '}
            {Math.abs(telemetry.lon).toFixed(2)}°{telemetry.lon >= 0 ? 'E' : 'W'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 border border-white/15 shadow-xl">
          <span>ALT: {telemetry.altitudeKm.toLocaleString()} KM</span>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 border border-white/15 text-sq-accent shadow-xl">
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
            className="w-4 h-4 text-sq-accent transition-transform duration-200"
            style={{ transform: `rotate(${-headingDeg}deg)` }}
          />
        </button>

        {/* 2D / 3D Mode Toggle */}
        <button
          onClick={handleToggle2D3D}
          title={is2DMode ? 'Switch to 3D Globe' : 'Switch to 2D Projection'}
          className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all shadow-lg active:scale-95 ${
            is2DMode
              ? 'bg-sq-accent text-black border-sq-accent'
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
          <Crosshair className="w-4 h-4 text-sq-amber" />
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

      {/* Anchored "what changed" callout for the active region */}
      {activeResult && activeInsight && (
        <RegionCallout
          key={activeResult.id}
          ref={calloutRef}
          insight={activeInsight}
          regionName={`${activeResult.regionName}, ${activeResult.country}`}
        />
      )}

      {/* Interactive Tooltip when hovering over a site pin */}
      {hoveredSite && (
        <div
          className="fixed z-40 pointer-events-none bg-black/90 backdrop-blur-md px-3.5 py-2 border border-sq-accent/60 shadow-2xl text-xs select-none"
          style={{
            left: `${tooltipPos.x + 18}px`,
            top: `${tooltipPos.y - 35}px`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sq-accent animate-ping"></span>
            <p className="font-bold text-white font-sans">{hoveredSite.regionName}</p>
          </div>
          {(() => {
            const hi = describeRegion(hoveredSite);
            return (
              <>
                <p className="mt-1 text-[11px] font-semibold" style={{ color: TONE_HEX[hi.tone] }}>
                  {hi.headline} · {hi.deltaText}
                </p>
                <p className="mt-0.5 font-mono-code text-[9px] uppercase tracking-wider text-white/50">
                  {[hi.area, hoveredSite.metric.severity, 'Click to inspect'].filter(Boolean).join(' · ')}
                </p>
              </>
            );
          })()}
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
