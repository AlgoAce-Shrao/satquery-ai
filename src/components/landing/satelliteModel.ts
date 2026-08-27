/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface SatelliteComponents {
  rootGroup: THREE.Group;
  satelliteBody: THREE.Group;
  solarLeft: THREE.Mesh;
  solarRight: THREE.Mesh;
  swathBeam: THREE.Mesh;
  groundFootprint: THREE.Mesh;
  dishGroup: THREE.Group;
  updateAnimation: (time: number, isScanning: boolean) => void;
}

/**
 * Constructs a physically authentic Earth-Observation (EO) Satellite
 * with gold MLI thermal blanket, photovoltaic solar wings, synthetic aperture radar (SAR)
 * reflector, Nadir optical sensor barrel, and restrained observation swath footprint.
 */
export function createEOSatellite(): SatelliteComponents {
  const rootGroup = new THREE.Group();
  const satBody = new THREE.Group();
  rootGroup.add(satBody);

  // 1. Realistic Aerospace Materials
  // Authentic Gold Multi-Layer Insulation (MLI) Thermal Blanket
  const mliGoldMat = new THREE.MeshStandardMaterial({
    color: 0xbe9035, // Muted aerospace gold foil
    metalness: 0.82,
    roughness: 0.42,
    envMapIntensity: 1.0,
  });

  // Matte Anodized Dark Spacecraft Titanium
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c20,
    metalness: 0.85,
    roughness: 0.45,
  });

  // Carbon Fiber Composite Truss
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x24262c,
    metalness: 0.4,
    roughness: 0.7,
  });

  // Deep Silicon Photovoltaic Solar Cells (Dark navy/indigo with bus bar texture)
  const solarCellMat = new THREE.MeshStandardMaterial({
    color: 0x0c182a,
    emissive: 0x020810,
    metalness: 0.88,
    roughness: 0.25,
  });

  // Optical Sensor Lens Barrel (High-index glass)
  const lensGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0a1624,
    metalness: 0.9,
    roughness: 0.08,
  });

  // Synthetic Aperture Radar (SAR) Reflector Mesh (Gold Mylar / Carbon lattice)
  const sarMeshMat = new THREE.MeshStandardMaterial({
    color: 0xb88e36,
    metalness: 0.75,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  // 2. Spacecraft Main Bus (Realistic proportions)
  const busGeo = new THREE.BoxGeometry(2.6, 2.0, 2.0);
  const busMesh = new THREE.Mesh(busGeo, mliGoldMat);
  busMesh.castShadow = true;
  satBody.add(busMesh);

  // Top Avionics & Instrument Deck
  const deckGeo = new THREE.BoxGeometry(2.62, 0.16, 2.02);
  const deckMesh = new THREE.Mesh(deckGeo, darkMetalMat);
  deckMesh.position.y = 1.05;
  satBody.add(deckMesh);

  // Star Trackers
  for (let i = -1; i <= 1; i += 2) {
    const starTracker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 0.35, 12),
      darkMetalMat
    );
    starTracker.position.set(i * 0.75, 1.25, 0.45);
    starTracker.rotation.x = -Math.PI / 4;
    satBody.add(starTracker);
  }

  // 3. Nadir Earth-Observation Optical Sensor
  const sensorBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.78, 1.2, 24),
    darkMetalMat
  );
  sensorBarrel.rotation.x = Math.PI / 2;
  sensorBarrel.position.set(0, 0, 1.2);
  satBody.add(sensorBarrel);

  const lensMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 24),
    lensGlassMat
  );
  lensMesh.position.set(0, 0, 1.81);
  satBody.add(lensMesh);

  // 4. Synthetic Aperture Radar (SAR) Reflector Dish
  const dishGroup = new THREE.Group();
  const dishGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.1, 32);
  const dishMesh = new THREE.Mesh(dishGeo, sarMeshMat);
  dishMesh.rotation.x = Math.PI / 5;
  dishGroup.add(dishMesh);

  const boom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8),
    carbonMat
  );
  boom.position.set(0, 0.5, 0.7);
  boom.rotation.x = Math.PI / 3;
  dishGroup.add(boom);

  dishGroup.position.set(0, -1.3, 0.35);
  satBody.add(dishGroup);

  // 5. Deployable Photovoltaic Solar Wings
  const solarWidth = 6.2;
  const solarHeight = 1.5;
  const solarDepth = 0.1;

  // Left Wing Group
  const leftWingGroup = new THREE.Group();
  const solarLeft = new THREE.Mesh(
    new THREE.BoxGeometry(solarWidth, solarHeight, solarDepth),
    solarCellMat
  );
  solarLeft.position.x = -solarWidth / 2 - 1.1;
  leftWingGroup.add(solarLeft);

  const leftTruss = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 1.2, 12),
    darkMetalMat
  );
  leftTruss.rotation.z = Math.PI / 2;
  leftTruss.position.x = -0.6;
  leftWingGroup.add(leftTruss);
  satBody.add(leftWingGroup);

  // Right Wing Group
  const rightWingGroup = new THREE.Group();
  const solarRight = new THREE.Mesh(
    new THREE.BoxGeometry(solarWidth, solarHeight, solarDepth),
    solarCellMat
  );
  solarRight.position.x = solarWidth / 2 + 1.1;
  rightWingGroup.add(solarRight);

  const rightTruss = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 1.2, 12),
    darkMetalMat
  );
  rightTruss.rotation.z = Math.PI / 2;
  rightTruss.position.x = 0.6;
  rightWingGroup.add(rightTruss);
  satBody.add(rightWingGroup);

  // 6. RCS Hydrazine Thruster Clusters
  const thrusterMat = new THREE.MeshStandardMaterial({
    color: 0x6a6d75,
    metalness: 0.85,
    roughness: 0.3,
  });
  const createRCSQuad = () => {
    const quad = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 8), thrusterMat);
      cone.rotation.z = (j * Math.PI) / 2;
      cone.position.set(Math.cos((j * Math.PI) / 2) * 0.09, Math.sin((j * Math.PI) / 2) * 0.09, 0);
      quad.add(cone);
    }
    return quad;
  };

  const rcs1 = createRCSQuad();
  rcs1.position.set(1.35, 0.9, 0.9);
  satBody.add(rcs1);

  const rcs2 = createRCSQuad();
  rcs2.position.set(-1.35, 0.9, 0.9);
  satBody.add(rcs2);

  // 7. Restrained Scientific Remote-Sensing Swath (Muted gold/amber, low opacity)
  const beamLength = 48;
  const beamRadius = 10.5;
  const beamGeo = new THREE.ConeGeometry(beamRadius, beamLength, 32, 1, true);
  beamGeo.translate(0, -beamLength / 2, 0);
  beamGeo.rotateX(-Math.PI / 2);

  const beamMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0xc88a45) }, // Muted satellite amber
      opacity: { value: 0.12 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      uniform float opacity;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        // Subtle, quiet scan pulse
        float pulse = sin(vUv.y * 18.0 - time * 2.5) * 0.5 + 0.5;
        pulse = pow(pulse, 4.0) * 0.25;

        float edge = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.2);
        float alpha = (vUv.y * 0.25 + pulse) * edge * opacity;

        gl_FragColor = vec4(color + vec3(pulse * 0.2), alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const swathBeam = new THREE.Mesh(beamGeo, beamMat);
  swathBeam.position.set(0, 0, 1.3);
  satBody.add(swathBeam);

  // 8. Ground Target Footprint Reticle (Subtle, thin boundary)
  const footprintGeo = new THREE.RingGeometry(1.8, 1.95, 32);
  const footprintMat = new THREE.MeshBasicMaterial({
    color: 0xc88a45,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const groundFootprint = new THREE.Mesh(footprintGeo, footprintMat);
  groundFootprint.position.set(0, 0, beamLength);
  satBody.add(groundFootprint);

  const updateAnimation = (time: number, isScanning: boolean) => {
    beamMat.uniforms.time.value = time;
    const targetOpacity = isScanning ? 0.14 : 0.04;
    beamMat.uniforms.opacity.value += (targetOpacity - beamMat.uniforms.opacity.value) * 0.05;

    leftWingGroup.rotation.x = Math.sin(time * 0.2) * 0.08;
    rightWingGroup.rotation.x = Math.sin(time * 0.2) * 0.08;

    groundFootprint.rotation.z = time * 0.25;
  };

  return {
    rootGroup,
    satelliteBody: satBody,
    solarLeft,
    solarRight,
    swathBeam,
    groundFootprint,
    dishGroup,
    updateAnimation,
  };
}
