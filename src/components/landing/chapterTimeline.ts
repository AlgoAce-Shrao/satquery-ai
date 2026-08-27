/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface CameraWaypoint {
  camPos: THREE.Vector3;
  camLookAt: THREE.Vector3;
  globePos: THREE.Vector3;
  globeRotOffset: number;
  satPos: THREE.Vector3;
  isScanning: boolean;
}

export interface ChapterInfo {
  id: string;
  name: string;
  startProgress: number;
  endProgress: number;
}

export const CHAPTERS: ChapterInfo[] = [
  { id: 'hero', name: 'ORBIT / HERO', startProgress: 0.0, endProgress: 0.12 },
  { id: 'problem', name: 'THE PROBLEM', startProgress: 0.12, endProgress: 0.26 },
  { id: 'query', name: 'ASK THE EARTH', startProgress: 0.26, endProgress: 0.40 },
  { id: 'agents', name: 'MULTI-AGENT INTELLIGENCE', startProgress: 0.40, endProgress: 0.56 },
  { id: 'response', name: 'EARTH RESPONDS', startProgress: 0.56, endProgress: 0.72 },
  { id: 'apps', name: 'APPLICATIONS', startProgress: 0.72, endProgress: 0.86 },
  { id: 'future', name: 'FUTURE / VOICE', startProgress: 0.86, endProgress: 0.94 },
  { id: 'cta', name: 'ORBITAL RETURN', startProgress: 0.94, endProgress: 1.0 },
];

// Key Waypoints along the continuous 0.0 -> 1.0 mission narrative
const WAYPOINTS: { progress: number; state: CameraWaypoint }[] = [
  {
    // 0.00: Wide Orbital Opening
    progress: 0.0,
    state: {
      camPos: new THREE.Vector3(15, 12, 195),
      camLookAt: new THREE.Vector3(19, -5, 0),
      globePos: new THREE.Vector3(38, -10, 0),
      globeRotOffset: 0.35,
      satPos: new THREE.Vector3(-42, 38, 55),
      isScanning: false,
    },
  },
  {
    // 0.12: End Hero / Start Problem (Spacecraft approaches)
    progress: 0.12,
    state: {
      camPos: new THREE.Vector3(12, 10, 180),
      camLookAt: new THREE.Vector3(15, -4, 0),
      globePos: new THREE.Vector3(30, -7, 0),
      globeRotOffset: 0.55,
      satPos: new THREE.Vector3(-38, 34, 58),
      isScanning: true,
    },
  },
  {
    // 0.26: End Problem / Start Query (Target locking)
    progress: 0.26,
    state: {
      camPos: new THREE.Vector3(8, 6, 160),
      camLookAt: new THREE.Vector3(10, -2, 0),
      globePos: new THREE.Vector3(20, -4, 0),
      globeRotOffset: 0.85,
      satPos: new THREE.Vector3(-32, 28, 62),
      isScanning: true,
    },
  },
  {
    // 0.40: End Query / Start Multi-Agent (Nadir focus)
    progress: 0.40,
    state: {
      camPos: new THREE.Vector3(2, 4, 142),
      camLookAt: new THREE.Vector3(2, 0, 0),
      globePos: new THREE.Vector3(4, -1, 0),
      globeRotOffset: 1.25,
      satPos: new THREE.Vector3(-25, 22, 65),
      isScanning: true,
    },
  },
  {
    // 0.56: End Agents / Start Earth Response (Deep inspection)
    progress: 0.56,
    state: {
      camPos: new THREE.Vector3(-6, 2, 128),
      camLookAt: new THREE.Vector3(-6, -2, 0),
      globePos: new THREE.Vector3(-12, -4, 0),
      globeRotOffset: 1.65,
      satPos: new THREE.Vector3(18, 16, 62),
      isScanning: true,
    },
  },
  {
    // 0.72: End Response / Start Applications (Global exploration)
    progress: 0.72,
    state: {
      camPos: new THREE.Vector3(4, 5, 140),
      camLookAt: new THREE.Vector3(4, -2, 0),
      globePos: new THREE.Vector3(8, -4, 0),
      globeRotOffset: 2.15,
      satPos: new THREE.Vector3(-28, 24, 60),
      isScanning: false,
    },
  },
  {
    // 0.86: End Applications / Start Voice (Cosmic ascent)
    progress: 0.86,
    state: {
      camPos: new THREE.Vector3(0, -4, 128),
      camLookAt: new THREE.Vector3(0, -18, 0),
      globePos: new THREE.Vector3(0, -22, 0),
      globeRotOffset: 2.6,
      satPos: new THREE.Vector3(-26, 20, 65),
      isScanning: false,
    },
  },
  {
    // 1.00: Orbital Sunrise Horizon / Final CTA
    progress: 1.0,
    state: {
      camPos: new THREE.Vector3(0, -16, 105),
      camLookAt: new THREE.Vector3(0, -32, 0),
      globePos: new THREE.Vector3(0, -36, 0),
      globeRotOffset: 3.1,
      satPos: new THREE.Vector3(-28, 22, 65),
      isScanning: false,
    },
  },
];

/**
 * Calculates smooth interpolated camera, globe, and satellite parameters
 * for any normalized scroll progress p in [0, 1].
 */
export function sampleWaypointTimeline(progress: number): CameraWaypoint {
  const p = Math.max(0, Math.min(1, progress));

  // Find surrounding waypoint brackets
  let lowerIdx = 0;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (p >= WAYPOINTS[i].progress && p <= WAYPOINTS[i + 1].progress) {
      lowerIdx = i;
      break;
    }
  }

  const wp0 = WAYPOINTS[lowerIdx];
  const wp1 = WAYPOINTS[lowerIdx + 1] || wp0;
  const range = wp1.progress - wp0.progress;
  const rawT = range > 0 ? (p - wp0.progress) / range : 0;

  // Smooth Hermite smoothstep interpolation
  const t = rawT * rawT * (3 - 2 * rawT);

  const camPos = new THREE.Vector3().lerpVectors(wp0.state.camPos, wp1.state.camPos, t);
  const camLookAt = new THREE.Vector3().lerpVectors(wp0.state.camLookAt, wp1.state.camLookAt, t);
  const globePos = new THREE.Vector3().lerpVectors(wp0.state.globePos, wp1.state.globePos, t);
  const globeRotOffset = THREE.MathUtils.lerp(wp0.state.globeRotOffset, wp1.state.globeRotOffset, t);
  const satPos = new THREE.Vector3().lerpVectors(wp0.state.satPos, wp1.state.satPos, t);
  const isScanning = t > 0.5 ? wp1.state.isScanning : wp0.state.isScanning;

  return {
    camPos,
    camLookAt,
    globePos,
    globeRotOffset,
    satPos,
    isScanning,
  };
}
