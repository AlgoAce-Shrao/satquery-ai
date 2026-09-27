/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SatQuery-specific configuration of the Aceternity 3D globe. The Aceternity
 * component stays generic (src/components/ui/3d-globe.tsx); everything that
 * makes it a SatQuery instrument lives here and is passed in as children:
 *
 *  - registry sites          every observation in the registry, as small square readouts
 *  - orbit tracks            two sun-synchronous-style passes with a moving spacecraft
 *  - target region           the real polygon of the queried observation
 *  - match arcs              other registry observations of the same category
 *  - camera director         flies to the target once the query resolves a region
 *
 * Loaded lazily (default export) so three.js / R3F never block first paint.
 */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Globe3D, latLngToVector3 } from '../../ui/3d-globe';
import { GLOBAL_OBSERVATIONS } from '../../../data/observations';
import { observationToAnalysisResult } from '../../../services/observationRegistry';
import { useConsoleEarthTexture } from './consoleEarthTexture';
import { QueryScenario, formatDelta } from '../landingData';
import { QueryPhase, phaseAtLeast } from '../useQuerySequence';

const RADIUS = 2;
const IDLE_DISTANCE = RADIUS * 3.5;
const FOCUS_DISTANCE = RADIUS * 3.05;

// Palette mirrors the CSS tokens in src/index.css (three.js needs literal colors).
const OLIVE = new THREE.Color('#A6B86A');   // --accent-primary: active data, arcs
const AMBER = new THREE.Color('#D3A64A');   // --accent-secondary: occasional arcs, spacecraft
const RUST = new THREE.Color('#B85C4A');    // --critical: resolved decrease region
const SITE_GRAY = new THREE.Color('#9D9B8F'); // --text-secondary: neutral registry sites

export interface SatQueryGlobeProps {
  scenario: QueryScenario;
  phase: QueryPhase;
  reducedMotion: boolean;
  /** Small screens: lower DPR and fewer decorative elements */
  compact: boolean;
  /** False when off-screen — rendering pauses entirely */
  active: boolean;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function surface(lat: number, lng: number, lift = 1.004) {
  return latLngToVector3(lat, lng, RADIUS * lift);
}

/** Great-circle arc between two surface points, raised proportionally to its length. */
function arcPoints(from: THREE.Vector3, to: THREE.Vector3, segments = 72) {
  const a = from.clone().normalize();
  const b = to.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(a, b);
  const identity = new THREE.Quaternion();
  const height = 0.04 + a.angleTo(b) * 0.09;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const qt = new THREE.Quaternion().slerpQuaternions(identity, q, t);
    const r = RADIUS * (1.004 + height * Math.sin(Math.PI * t));
    pts.push(a.clone().applyQuaternion(qt).multiplyScalar(r));
  }
  return pts;
}

function useLine(points: THREE.Vector3[], material: THREE.LineBasicMaterial, loop = false) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return loop ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
  }, [points, material, loop]);
  useEffect(() => () => line.geometry.dispose(), [line]);
  return line;
}

// ---------------------------------------------------------------------------
// Registry sites
// ---------------------------------------------------------------------------

function RegistrySites({ targetId }: { targetId: string }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const sites = GLOBAL_OBSERVATIONS.filter((o) => o.id !== targetId);
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        sites.flatMap((o) => surface(o.latitude, o.longitude, 1.006).toArray()),
        3
      )
    );
    return g;
  }, [targetId]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial color={SITE_GRAY} size={0.035} sizeAttenuation transparent opacity={0.75} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Orbit tracks
// ---------------------------------------------------------------------------

function OrbitTrack({
  inclinationDeg,
  raanDeg,
  periodS,
  phaseOffset,
  animate,
}: {
  inclinationDeg: number;
  raanDeg: number;
  periodS: number;
  phaseOffset: number;
  animate: boolean;
}) {
  const orbitRadius = RADIUS * 1.09;
  const rotation = useMemo(
    () =>
      new THREE.Euler(
        THREE.MathUtils.degToRad(inclinationDeg),
        THREE.MathUtils.degToRad(raanDeg),
        0,
        'YXZ'
      ),
    [inclinationDeg, raanDeg]
  );
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 160; i++) {
      const t = (i / 160) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * orbitRadius, 0, Math.sin(t) * orbitRadius));
    }
    return pts;
  }, [orbitRadius]);
  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#9D9B8F', transparent: true, opacity: 0.12 }),
    []
  );
  const track = useLine(points, material, true);
  const craft = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!craft.current) return;
    const t = (animate ? clock.elapsedTime / periodS : 0) * Math.PI * 2 + phaseOffset;
    craft.current.position.set(Math.cos(t) * orbitRadius, 0, Math.sin(t) * orbitRadius);
  });

  return (
    <group rotation={rotation}>
      <primitive object={track} />
      <mesh ref={craft}>
        <boxGeometry args={[0.035, 0.035, 0.035]} />
        <meshBasicMaterial color={AMBER} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Target region + match arcs
// ---------------------------------------------------------------------------

function TargetRegion({ scenario, phase, animate }: { scenario: QueryScenario; phase: QueryPhase; animate: boolean }) {
  const { observation } = scenario;
  const result = useMemo(() => observationToAnalysisResult(observation), [observation]);
  const center = useMemo(() => surface(observation.latitude, observation.longitude), [observation]);
  const labelPosition = useMemo(() => center.clone().multiplyScalar(1.03), [center]);
  const normal = useMemo(() => center.clone().normalize(), [center]);
  const orientation = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal),
    [normal]
  );

  const polygonPoints = useMemo(
    () => result.polygon.map((p) => surface(p.lat, p.lon, 1.006)),
    [result]
  );
  const polygonMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: OLIVE, transparent: true, opacity: 0.95 }),
    []
  );
  const outline = useLine(polygonPoints, polygonMaterial, true);

  const scan = useRef<THREE.Mesh>(null);
  const reticle = useRef<THREE.Group>(null);

  const visible = phaseAtLeast(phase, 'REGION');
  const analyzing = phase === 'ANALYZING';
  const ready = phase === 'READY';

  useFrame(({ clock }) => {
    polygonMaterial.color.copy(ready ? RUST : OLIVE);
    if (scan.current) {
      const t = animate && analyzing ? (clock.elapsedTime % 1.6) / 1.6 : 0;
      scan.current.visible = analyzing;
      scan.current.scale.setScalar(0.4 + t * 2.2);
      (scan.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.7;
    }
    if (reticle.current) {
      const pulse = animate && !ready ? 1 + Math.sin(clock.elapsedTime * 3) * 0.06 : 1;
      reticle.current.scale.setScalar(pulse);
    }
  });

  // Stays mounted and toggles visibility: unmounting drei <Html> mid-render breaks under React 19.
  return (
    <group visible={visible}>
      <primitive object={outline} />
      <group position={center} quaternion={orientation}>
        <group ref={reticle}>
          <mesh>
            <ringGeometry args={[0.105, 0.112, 4, 1, Math.PI / 4]} />
            <meshBasicMaterial color={ready ? AMBER : OLIVE} transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <mesh>
          <circleGeometry args={[0.012, 12]} />
          <meshBasicMaterial color={ready ? AMBER : OLIVE} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={scan}>
          <ringGeometry args={[0.07, 0.076, 48]} />
          <meshBasicMaterial color={OLIVE} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
      <Html
        position={labelPosition}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none', opacity: ready ? 1 : 0, transition: 'opacity 0.4s ease' }}
      >
          <div className="ml-4 -mt-3 whitespace-nowrap border border-sq-amber/50 bg-black/85 px-2 py-1 font-mono-code text-[9px] uppercase tracking-wider">
            <div className="text-white/50">{observation.id}</div>
            <div className="font-bold text-sq-critical">
              {observation.metricName.split(' ')[0]} {formatDelta(observation.percentageChange)}
            </div>
          </div>
      </Html>
    </group>
  );
}

function MatchArc({ from, to, delay, phase, animate, color }: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  delay: number;
  color: THREE.Color;
  phase: QueryPhase;
  animate: boolean;
}) {
  const points = useMemo(() => arcPoints(from, to), [from, to]);
  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 }),
    [color]
  );
  const line = useLine(points, material);
  const progress = useRef(0);

  useFrame((_, delta) => {
    const show = phaseAtLeast(phase, 'ANALYZING');
    if (!show) progress.current = 0;
    else if (!animate) progress.current = 1;
    else progress.current = Math.min(1, progress.current + delta * 0.9);
    const p = Math.max(0, Math.min(1, (progress.current - delay) / (1 - delay)));
    line.geometry.setDrawRange(0, Math.floor(p * points.length));
    material.opacity = phase === 'READY' ? 0.28 : 0.5;
  });

  return <primitive object={line} />;
}

function MatchArcs({ scenario, phase, animate, limit }: {
  scenario: QueryScenario;
  phase: QueryPhase;
  animate: boolean;
  limit: number;
}) {
  const origin = useMemo(
    () => surface(scenario.observation.latitude, scenario.observation.longitude),
    [scenario]
  );
  const targets = useMemo(
    () => scenario.matches.slice(0, limit).map((m) => surface(m.latitude, m.longitude)),
    [scenario, limit]
  );
  return (
    <>
      {targets.map((t, i) => (
        <MatchArc key={`${scenario.observation.id}-${i}`} from={origin} to={t} delay={i * 0.12} phase={phase} animate={animate} color={i % 3 === 2 ? AMBER : OLIVE} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Camera director
// ---------------------------------------------------------------------------

interface ControlsLike {
  autoRotate: boolean;
  enableRotate: boolean;
  update: () => void;
}

function CameraDirector({ scenario, phase, reducedMotion, compact }: {
  scenario: QueryScenario;
  phase: QueryPhase;
  reducedMotion: boolean;
  compact: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null;
  const gl = useThree((s) => s.gl);

  const target = useMemo(() => {
    // Aim slightly south of the site so the reticle sits above center and clears the HUD.
    const { latitude, longitude } = scenario.observation;
    return latLngToVector3(latitude - 8, longitude, 1).normalize();
  }, [scenario]);

  const focused = phaseAtLeast(phase, 'REGION');
  const snapped = useRef(false);

  useEffect(() => {
    // Let touch scrolling pass through the canvas on small screens.
    if (compact) gl.domElement.style.touchAction = 'pan-y';
  });

  useFrame((_, delta) => {
    if (!controls) return;
    controls.enableRotate = !compact;
    controls.autoRotate = !focused && !reducedMotion;

    const dir = camera.position.clone().normalize();
    let dist = camera.position.length();

    if (reducedMotion) {
      if (!snapped.current) {
        camera.position.copy(target.clone().multiplyScalar(FOCUS_DISTANCE));
        controls.update();
        snapped.current = true;
      }
      return;
    }

    const k = 1 - Math.exp(-delta * 1.8);
    if (focused) {
      dir.lerp(target, k).normalize();
      dist = THREE.MathUtils.lerp(dist, FOCUS_DISTANCE, k);
    } else {
      dist = THREE.MathUtils.lerp(dist, IDLE_DISTANCE, k * 0.6);
    }
    camera.position.copy(dir.multiplyScalar(dist));
  });

  return null;
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export default function SatQueryGlobe({ scenario, phase, reducedMotion, compact, active }: SatQueryGlobeProps) {
  const textureUrl = useConsoleEarthTexture();
  const animate = !reducedMotion;

  const config = useMemo(
    () =>
      textureUrl
        ? {
            radius: RADIUS,
            textureUrl,
            bumpMapUrl: textureUrl,
            bumpScale: 0.4,
            // Upstream atmosphere renders as a hard-edged band at this palette;
            // GlobeStage draws a soft CSS halo instead.
            showAtmosphere: false,
            fillLightColor: '#E6E2D6',
            autoRotateSpeed: reducedMotion ? 0 : 0.35,
            enableZoom: false,
            enablePan: false,
            minDistance: FOCUS_DISTANCE - 0.2,
            maxDistance: IDLE_DISTANCE + 1,
            ambientIntensity: 1.5,
            pointLightIntensity: 0.9,
          }
        : null,
    [textureUrl, reducedMotion]
  );

  if (!config) return null;

  return (
    <Globe3D
      className="h-full w-full"
      config={config}
      frameloop={active ? 'always' : 'never'}
      dpr={compact ? [1, 1.5] : [1, 2]}
    >
      <RegistrySites targetId={scenario.observation.id} />
      <OrbitTrack inclinationDeg={98} raanDeg={25} periodS={34} phaseOffset={0} animate={animate} />
      {!compact && (
        <OrbitTrack inclinationDeg={98} raanDeg={115} periodS={34} phaseOffset={Math.PI} animate={animate} />
      )}
      <MatchArcs scenario={scenario} phase={phase} animate={animate} limit={compact ? 3 : 4} />
      <TargetRegion scenario={scenario} phase={phase} animate={animate} />
      <CameraDirector scenario={scenario} phase={phase} reducedMotion={reducedMotion} compact={compact} />
    </Globe3D>
  );
}
