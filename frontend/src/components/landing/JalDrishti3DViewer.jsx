import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_PATH = '/models/ollantaytambo_archaeological_site.glb';

// Preload GLB model asset for optimal performance
try {
  useGLTF.preload(MODEL_PATH);
} catch (e) {
  console.warn('Preload notice for GLB model:', e);
}

// ------------------------------------------------------------
// 1. TERRAIN GLB MODEL COMPONENT (FAITHFUL 3D GLB RENDER)
// ------------------------------------------------------------
function TerrainModel({ showGrid }) {
  const { scene } = useGLTF(MODEL_PATH);
  
  // Clone scene and compute proper scaling and centering
  const { clonedScene, groupPosition, groupScale } = useMemo(() => {
    const cloned = scene.clone(true);

    // Compute bounding box of the cloned scene
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Desired max dimension in scene space (35 units)
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 35 / maxDim : 1;

    // Calculate group position so that the model's center lands EXACTLY at [0, 0, 0]
    const pos = [
      -center.x * scale,
      -center.y * scale,
      -center.z * scale,
    ];

    return {
      clonedScene: cloned,
      groupPosition: pos,
      groupScale: scale,
    };
  }, [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  return (
    <group position={groupPosition} scale={groupScale}>
      <primitive object={clonedScene} />
      {showGrid && (
        <gridHelper args={[60, 30, '#0f4c81', '#8fd3e8']} position={[0, 0, 0]} opacity={0.35} transparent />
      )}
    </group>
  );
}

// ------------------------------------------------------------
// 2. RESTRUCTURED HIMALAYAN VALLEY TERRAIN & NATURAL LANDFORMS
// ------------------------------------------------------------
function HimalayanValley() {
  return (
    <group position={[0, 0, 0]}>
      {/* Broad Main Valley Floor Base (Natural Alpine Silt & Grass Tone) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 5]}>
        <planeGeometry args={[240, 240, 48, 48]} />
        <meshStandardMaterial
          color="#1e3a2e"
          roughness={0.88}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* West Mountain Flank (Left Slope framing the valley) */}
      <mesh receiveShadow position={[-38, 8, -5]} rotation={[-Math.PI / 2.3, 0.25, 0.4]}>
        <planeGeometry args={[75, 90, 24, 24]} />
        <meshStandardMaterial color="#234538" roughness={0.82} metalness={0.08} />
      </mesh>

      {/* East Mountain Flank (Right Ridge framing the background) */}
      <mesh receiveShadow position={[42, 10, -15]} rotation={[-Math.PI / 2.2, -0.3, -0.35]}>
        <planeGeometry args={[70, 85, 24, 24]} />
        <meshStandardMaterial color="#1b382d" roughness={0.85} metalness={0.06} />
      </mesh>

      {/* Elevated Village Terrace Plateau (Right Bank Meadow for Settlement) */}
      <group position={[20, 0, 5]}>
        {/* Main Terrace Elevated Mound */}
        <mesh receiveShadow position={[0, 1.2, 0]} rotation={[-Math.PI / 2, 0, -0.05]}>
          <planeGeometry args={[42, 45, 16, 16]} />
          <meshStandardMaterial color="#2e5745" roughness={0.78} metalness={0.04} />
        </mesh>
        
        {/* Gentle Terrace Slope leading down to River */}
        <mesh receiveShadow position={[-16, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0.22]}>
          <planeGeometry args={[14, 45, 8, 8]} />
          <meshStandardMaterial color="#254a3a" roughness={0.82} metalness={0.04} />
        </mesh>
      </group>

      {/* Carved Riverbed Depression Trench (Moist Dark Earth Silt) */}
      <mesh receiveShadow position={[0, 0.05, 5]} rotation={[-Math.PI / 2, 0, 0.58]}>
        <planeGeometry args={[130, 18, 16, 16]} />
        <meshStandardMaterial color="#142921" roughness={0.95} metalness={0.02} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------
// 3. MOUNTAIN WATERFALL, STREAM & WINDING VALLEY RIVER
// ------------------------------------------------------------
function HimalayanRiver() {
  const riverMatRef = useRef();

  // Create procedural flow texture for realistic water stream movement
  const waterTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.35, '#38bdf8');
    grad.addColorStop(0.7, '#0284c7');
    grad.addColorStop(1, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 60; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 30 + 10, 2.5);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 1);
    return tex;
  }, []);

  // Main River Curve: Visually originates high in rear mountain clefts -> waterfall cascade -> valley floor -> downstream
  const mainRiverCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-22, 22.0, -42), // High Mountain Peak Source
      new THREE.Vector3(-18, 15.0, -32), // Steep Rocky Mountain Slope
      new THREE.Vector3(-14, 8.5, -22),  // Mountain Stream Cascade / Waterfall Foot
      new THREE.Vector3(-8, 3.2, -10),   // Entry to Valley Floor Channel
      new THREE.Vector3(-2, 1.4, 0),     // Winding Valley Bed
      new THREE.Vector3(5, 1.1, 12),     // Bending near Village Slope
      new THREE.Vector3(14, 0.8, 25),    // Lower Valley Curve
      new THREE.Vector3(26, 0.4, 40),    // Downstream Exit
      new THREE.Vector3(42, 0.1, 58)
    ]);
  }, []);

  useFrame((state, delta) => {
    if (waterTexture) {
      waterTexture.offset.x -= delta * 0.28; // Smooth downstream water flow animation
    }
  });

  return (
    <group>
      {/* Main Himalayan River Body */}
      <mesh receiveShadow position={[0, 0.12, 0]}>
        <tubeGeometry args={[mainRiverCurve, 100, 2.5, 10, false]} />
        <meshStandardMaterial
          ref={riverMatRef}
          map={waterTexture}
          color="#38bdf8"
          roughness={0.12}
          metalness={0.78}
          transparent={true}
          opacity={0.9}
        />
      </mesh>

      {/* Mountain Waterfall Cascade Spray / Whitewater Foam at Origin */}
      <mesh position={[-18, 15.0, -32]} scale={[1.4, 0.2, 1.4]}>
        <sphereGeometry args={[2.0, 10, 10]} />
        <meshStandardMaterial color="#f0f9ff" roughness={0.05} transparent opacity={0.8} />
      </mesh>
      <mesh position={[-14, 8.5, -22]} scale={[1.8, 0.25, 1.8]}>
        <sphereGeometry args={[2.4, 10, 10]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.08} transparent opacity={0.75} />
      </mesh>
      <mesh position={[-8, 3.2, -10]} scale={[1.6, 0.2, 1.6]}>
        <sphereGeometry args={[2.0, 10, 10]} />
        <meshStandardMaterial color="#bae6fd" roughness={0.1} transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------
// 4. HIMALAYAN VILLAGE HOUSES, VEGETATION & RIVER BED ROCKS
// ------------------------------------------------------------
function HimalayanHouse({ position, rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Stone Foundation Slab */}
      <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[1.7, 0.3, 1.5]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>

      {/* Timber & Stone Walls */}
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[1.5, 0.9, 1.3]} />
        <meshStandardMaterial color="#5c4d41" roughness={0.75} metalness={0.08} />
      </mesh>

      {/* Pitched Himalayan Slate Roof */}
      <mesh castShadow position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.35, 0.95, 4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.25} />
      </mesh>

      {/* Warm Cozy Window Illumination */}
      <mesh position={[0, 0.8, 0.66]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function HimalayanPineTree({ position, scale = 1.0 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Tree Trunk */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 1.2, 6]} />
        <meshStandardMaterial color="#3b291d" roughness={0.95} />
      </mesh>

      {/* Layered Conical Pine Foliage */}
      <mesh castShadow position={[0, 1.6, 0]}>
        <coneGeometry args={[1.05, 1.8, 6]} />
        <meshStandardMaterial color="#143829" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 2.4, 0]}>
        <coneGeometry args={[0.8, 1.5, 6]} />
        <meshStandardMaterial color="#1b4734" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 3.1, 0]}>
        <coneGeometry args={[0.55, 1.1, 6]} />
        <meshStandardMaterial color="#235741" roughness={0.8} />
      </mesh>
    </group>
  );
}

function HimalayanRiverRock({ position, scale = [1, 1, 1], rotation = [0, 0, 0] }) {
  return (
    <mesh castShadow receiveShadow position={position} scale={scale} rotation={rotation}>
      <dodecahedronGeometry args={[0.6, 1]} />
      <meshStandardMaterial color="#475569" roughness={0.88} metalness={0.12} />
    </mesh>
  );
}

function HimalayanVillageAndVegetation() {
  // 12 Village Houses safely positioned on the elevated Right-Bank Valley Terrace (Y: 1.4 ~ 2.0)
  // Perfectly visible in front of mountains, 100% outside mountain mesh collisions
  const housePositions = useMemo(() => [
    { pos: [14, 1.4, -5], rot: [0, 0.3, 0], scale: [1.0, 1.0, 1.0] },
    { pos: [19, 1.5, -2], rot: [0, -0.4, 0], scale: [1.1, 1.1, 1.1] },
    { pos: [24, 1.7, -6], rot: [0, 0.6, 0], scale: [0.95, 0.95, 0.95] },
    { pos: [15, 1.4, 5], rot: [0, 0.2, 0], scale: [1.0, 1.0, 1.0] },
    { pos: [20, 1.6, 4], rot: [0, -0.3, 0], scale: [1.05, 1.05, 1.05] },
    { pos: [26, 1.8, 2], rot: [0, 0.5, 0], scale: [1.1, 1.1, 1.1] },
    { pos: [17, 1.5, 13], rot: [0, 0.35, 0], scale: [0.95, 0.95, 0.95] },
    { pos: [22, 1.7, 11], rot: [0, -0.25, 0], scale: [1.0, 1.0, 1.0] },
    { pos: [28, 1.9, 10], rot: [0, 0.45, 0], scale: [1.05, 1.05, 1.05] },
    { pos: [19, 1.6, 21], rot: [0, -0.15, 0], scale: [1.1, 1.1, 1.1] },
    { pos: [25, 1.8, 19], rot: [0, 0.3, 0], scale: [1.0, 1.0, 1.0] },
    { pos: [30, 2.0, 17], rot: [0, -0.5, 0], scale: [1.05, 1.05, 1.05] }
  ], []);

  // 26 Himalayan Pine Trees distributed across valley slopes and around the village
  const treePositions = useMemo(() => [
    { pos: [10, 0.8, -8], scale: 1.1 },
    { pos: [12, 1.2, 1], scale: 0.95 },
    { pos: [13, 1.3, 10], scale: 1.05 },
    { pos: [15, 1.4, 18], scale: 1.2 },
    { pos: [17, 1.5, 27], scale: 1.25 },
    { pos: [31, 2.1, -4], scale: 1.3 },
    { pos: [33, 2.2, 6], scale: 1.35 },
    { pos: [34, 2.3, 15], scale: 1.4 },
    { pos: [32, 2.1, 24], scale: 1.3 },
    { pos: [-12, 2.8, -12], scale: 1.4 },
    { pos: [-20, 5.2, -6], scale: 1.5 },
    { pos: [-28, 7.5, 0], scale: 1.6 },
    { pos: [-16, 4.0, 12], scale: 1.35 },
    { pos: [-24, 6.2, 18], scale: 1.45 },
    { pos: [-30, 8.5, 24], scale: 1.55 },
    { pos: [-6, 1.2, -26], scale: 1.25 },
    { pos: [4, 1.8, -28], scale: 1.3 },
    { pos: [14, 2.4, -24], scale: 1.4 },
    { pos: [25, 3.2, -22], scale: 1.5 },
    { pos: [-34, 9.8, -18], scale: 1.6 },
    { pos: [36, 2.5, 30], scale: 1.3 },
    { pos: [22, 1.7, 32], scale: 1.2 },
    { pos: [10, 0.6, 34], scale: 1.15 },
    { pos: [3, 0.4, 38], scale: 1.1 },
    { pos: [-8, 0.8, 32], scale: 1.2 },
    { pos: [-14, 1.5, 36], scale: 1.3 }
  ], []);

  // Riverbed Boulders along the water channel
  const rockPositions = useMemo(() => [
    { pos: [-17, 13.5, -30], scale: [1.8, 1.2, 1.6], rot: [0.2, 0.5, 0.1] },
    { pos: [-13, 7.2, -20], scale: [2.2, 1.4, 1.8], rot: [0.1, -0.3, 0.4] },
    { pos: [-9, 2.8, -8], scale: [1.5, 1.0, 1.3], rot: [0.4, 0.2, -0.2] },
    { pos: [-3, 1.0, 2], scale: [1.2, 0.8, 1.4], rot: [-0.1, 0.7, 0.3] },
    { pos: [3, 0.7, 14], scale: [1.4, 0.9, 1.1], rot: [0.3, -0.4, 0.1] },
    { pos: [11, 0.5, 27], scale: [1.6, 1.1, 1.5], rot: [0.2, 0.8, -0.3] },
    { pos: [22, 0.3, 42], scale: [2.0, 1.3, 1.7], rot: [-0.2, 0.4, 0.2] }
  ], []);

  return (
    <group>
      {/* Village Houses Cluster */}
      {housePositions.map((h, i) => (
        <HimalayanHouse key={`village-house-${i}`} position={h.pos} rotation={h.rot} scale={h.scale} />
      ))}

      {/* Mountain Pine Vegetation Cluster */}
      {treePositions.map((t, i) => (
        <HimalayanPineTree key={`pine-tree-${i}`} position={t.pos} scale={t.scale} />
      ))}

      {/* Riverbed Boulder Formations */}
      {rockPositions.map((r, i) => (
        <HimalayanRiverRock key={`river-rock-${i}`} position={r.pos} scale={r.scale} rotation={r.rotation} />
      ))}
    </group>
  );
}

// ------------------------------------------------------------
// 5. 3-LAYER 3D RAIN PARTICLE SYSTEM (DEPTH & WIND ANGLE)
// ------------------------------------------------------------
function RainParticles({ activeState }) {
  const fgPointsRef = useRef();
  const mgPointsRef = useRef();
  const bgPointsRef = useRef();

  const isRainActive = activeState !== 'NORMAL';

  // Layer 1: Foreground Rain Particles (Faster, Larger, Clearer)
  const fgParticles = useMemo(() => {
    const count = isRainActive ? 600 : 0;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 160;
      pos[i * 3 + 1] = Math.random() * 80 + 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 160;
      vel[i] = Math.random() * 20 + 35;
    }
    return { count, pos, vel };
  }, [isRainActive]);

  // Layer 2: Midground Rain Particles (Medium Speed & Size)
  const mgParticles = useMemo(() => {
    const count = isRainActive ? 900 : 0;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 180;
      pos[i * 3 + 1] = Math.random() * 80 + 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 180;
      vel[i] = Math.random() * 15 + 25;
    }
    return { count, pos, vel };
  }, [isRainActive]);

  // Layer 3: Background Atmospheric Rain Mist Particles (Slow, Small, Soft Haze)
  const bgParticles = useMemo(() => {
    const count = isRainActive ? 1200 : 0;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = Math.random() * 80 + 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
      vel[i] = Math.random() * 10 + 18;
    }
    return { count, pos, vel };
  }, [isRainActive]);

  useFrame((state, delta) => {
    if (!isRainActive) return;

    // Update Foreground Particles
    if (fgPointsRef.current && fgParticles.count > 0) {
      const posAttr = fgPointsRef.current.geometry.attributes.position;
      if (posAttr) {
        const arr = posAttr.array;
        for (let i = 0; i < fgParticles.count; i++) {
          arr[i * 3 + 1] -= fgParticles.vel[i] * delta;
          arr[i * 3] -= fgParticles.vel[i] * 0.12 * delta; // Subtle wind slant
          if (arr[i * 3 + 1] < 0) {
            arr[i * 3 + 1] = 80;
            arr[i * 3] = (Math.random() - 0.5) * 160;
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    // Update Midground Particles
    if (mgPointsRef.current && mgParticles.count > 0) {
      const posAttr = mgPointsRef.current.geometry.attributes.position;
      if (posAttr) {
        const arr = posAttr.array;
        for (let i = 0; i < mgParticles.count; i++) {
          arr[i * 3 + 1] -= mgParticles.vel[i] * delta;
          arr[i * 3] -= mgParticles.vel[i] * 0.1 * delta;
          if (arr[i * 3 + 1] < 0) {
            arr[i * 3 + 1] = 80;
            arr[i * 3] = (Math.random() - 0.5) * 180;
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    // Update Background Particles
    if (bgPointsRef.current && bgParticles.count > 0) {
      const posAttr = bgPointsRef.current.geometry.attributes.position;
      if (posAttr) {
        const arr = posAttr.array;
        for (let i = 0; i < bgParticles.count; i++) {
          arr[i * 3 + 1] -= bgParticles.vel[i] * delta;
          arr[i * 3] -= bgParticles.vel[i] * 0.08 * delta;
          if (arr[i * 3 + 1] < 0) {
            arr[i * 3 + 1] = 80;
            arr[i * 3] = (Math.random() - 0.5) * 200;
          }
        }
        posAttr.needsUpdate = true;
      }
    }
  });

  if (!isRainActive) return null;

  return (
    <group>
      {/* Foreground Rain Layer */}
      <points ref={fgPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={fgParticles.count} array={fgParticles.pos} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.75} color="#7dd3fc" transparent opacity={0.65} blending={THREE.AdditiveBlending} />
      </points>

      {/* Midground Rain Layer */}
      <points ref={mgPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={mgParticles.count} array={mgParticles.pos} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.55} color="#38bdf8" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </points>

      {/* Background Rain Haze Layer */}
      <points ref={bgPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={bgParticles.count} array={bgParticles.pos} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.38} color="#0284c7" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

// ------------------------------------------------------------
// 6. DYNAMIC WATER / FLOOD SIMULATION PREPARATION LAYER
// ------------------------------------------------------------
function WaterLayer({ waterLevelState }) {
  const meshRef = useRef();

  const waterHeights = {
    NORMAL: -100, // Completely dry terrain in NORMAL mode
    HEAVY_RAIN: 2.2,
    RUNOFF_INCREASE: 3.5,
    WATER_LEVEL_RISING: 4.8,
    FLASH_FLOOD: 6.5,
    ROAD_INUNDATION: 8.2,
    EVACUATION: 10.0,
  };

  const targetY = waterHeights[waterLevelState] ?? -100;

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, delta * 2.5);
    const time = state.clock.getElapsedTime();
    if (meshRef.current.material) {
      meshRef.current.material.opacity = 0.65 + Math.sin(time * 2.0) * 0.05;
    }
  });

  if (waterLevelState === 'NORMAL' || targetY < -50) return null;

  return (
    <mesh ref={meshRef} position={[0, targetY, 5]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[180, 180, 64, 64]} />
      <meshStandardMaterial
        color={waterLevelState === 'FLASH_FLOOD' || waterLevelState === 'EVACUATION' ? '#0284c7' : '#0ea5e9'}
        roughness={0.1}
        metalness={0.8}
        transparent={true}
        opacity={0.68}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ------------------------------------------------------------
// 7. HIMALAYAN ATMOSPHERIC MIST & SCENE LIGHTING
// ------------------------------------------------------------
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[30, 60, 40]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-30, 40, -40]} intensity={1.2} />
      <hemisphereLight skyColor="#ffffff" groundColor="#334155" intensity={0.9} />
    </>
  );
}

// ------------------------------------------------------------
// 8. LOADING & ERROR FALLBACK OVERLAYS
// ------------------------------------------------------------
function LoadingFallback() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#F8FAFC]/90 backdrop-blur-sm select-none">
      <div className="w-12 h-12 rounded-2xl bg-white border border-[#0F4C81]/20 flex items-center justify-center mb-3 animate-pulse shadow-sm">
        <span className="material-symbols-outlined text-[#0F4C81] text-2xl animate-spin">sync</span>
      </div>
      <span className="text-xs font-extrabold text-[#0F4C81] uppercase tracking-widest font-mono">
        LOADING 3D DIGITAL TWIN
      </span>
      <span className="text-[10.5px] text-[#334155] mt-1 font-mono font-semibold">
        Fetching 3D Model Asset (/models/ollantaytambo_archaeological_site.glb)...
      </span>
    </div>
  );
}

class ErrorBoundary3D extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('JalDrishti3DViewer 3D rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center">
          <span className="material-symbols-outlined text-[#D97706] text-4xl mb-2">warning</span>
          <h4 className="text-sm font-bold text-[#0F4C81] uppercase tracking-wider font-mono">
            3D TERRAIN UNAVAILABLE
          </h4>
          <p className="text-xs text-[#334155] max-w-sm my-2">
            Failed to render 3D terrain model. Check console for technical details.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-1.5 rounded-lg bg-[#0F4C81] border border-[#0F4C81] text-white font-bold text-xs hover:bg-[#0B3B66] transition-all cursor-pointer"
          >
            Retry Loading 3D Model
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ------------------------------------------------------------
// 9. MAIN JAL DRISHTI 3D VIEWER CONTAINER
// ------------------------------------------------------------
export default function JalDrishti3DViewer({
  simulationState = 'NORMAL',
  onStateChange,
  showControls = true,
}) {
  const [showWater, setShowWater] = useState(false); // Default: DRY terrain in NORMAL initial state
  const [showRain, setShowRain] = useState(false);  // Default: DRY atmosphere in NORMAL initial state
  const [showGrid, setShowGrid] = useState(false); // Default: NO debug grid visible
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef();

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    if (onStateChange) {
      onStateChange('NORMAL');
    }
    setShowWater(false);
    setShowRain(false);
  };

  const SIMULATION_STATES = [
    'NORMAL',
    'HEAVY_RAIN',
    'RUNOFF_INCREASE',
    'WATER_LEVEL_RISING',
    'FLASH_FLOOD',
    'ROAD_INUNDATION',
    'EVACUATION',
  ];

  return (
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[540px] rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden flex flex-col select-none group font-sans shadow-sm">
      
      {/* TOP OVERLAY HEADER BAR */}
      <div className="relative z-20 px-4 py-2.5 bg-white border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#0F4C81]/10 border border-[#0F4C81]/20 text-[#0F4C81] font-mono text-[10.5px] font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#0F4C81] animate-pulse" />
            <span>3D DIGITAL TWIN • ARCHAEOLOGICAL SITE MODEL</span>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-extrabold text-[#0F4C81] tracking-tight uppercase">
              OLLANTAYTAMBO ARCHAEOLOGICAL SITE DIGITAL TWIN
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] font-mono">
              Faithful 3D GLB Render • 360° Interactive View
            </span>
          </div>
        </div>

        {/* TOP COMPACT CONTROLS */}
        {showControls && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                autoRotate
                  ? 'bg-[#0F4C81] border-[#0F4C81] text-white'
                  : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F4C81]'
              }`}
              title="Toggle 360° Slow Cinematic Rotation"
            >
              <span className="material-symbols-outlined text-sm">360</span>
              <span className="hidden md:inline">Rotate</span>
            </button>

            <button
              onClick={() => setShowWater(!showWater)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                showWater
                  ? 'bg-[#0F4C81] border-[#0F4C81] text-white'
                  : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F4C81]'
              }`}
              title="Toggle Water Layer"
            >
              <span className="material-symbols-outlined text-sm">water</span>
              <span className="hidden md:inline">Water</span>
            </button>

            <button
              onClick={() => setShowRain(!showRain)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                showRain
                  ? 'bg-[#0F4C81] border-[#0F4C81] text-white'
                  : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F4C81]'
              }`}
              title="Toggle 3D Rain Particle Simulation"
            >
              <span className="material-symbols-outlined text-sm">rainy</span>
              <span className="hidden md:inline">Rain</span>
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                showGrid
                  ? 'bg-[#0F4C81] border-[#0F4C81] text-white'
                  : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F4C81]'
              }`}
              title="Toggle Terrain Grid"
            >
              <span className="material-symbols-outlined text-sm">grid_4x4</span>
              <span className="hidden md:inline">Grid</span>
            </button>

            <button
              onClick={handleResetCamera}
              className="px-2.5 py-1 rounded bg-white border border-[#E2E8F0] text-[#0F4C81] text-[11px] font-bold hover:bg-[#F1F5F9] transition-all flex items-center gap-1 cursor-pointer"
              title="Reset Camera View"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* THREE.JS CANVAS VIEWPORT */}
      <div className="relative flex-1 w-full h-full bg-[#F8FAFC]">
        <ErrorBoundary3D>
          <Suspense fallback={<LoadingFallback />}>
            <Canvas shadows gl={{ antialias: true, alpha: false }}>
              <PerspectiveCamera makeDefault position={[0, 20, 50]} fov={45} near={0.1} far={2000} />
              
              {/* Mountain Atmospheric Fog */}
              <fog attach="fog" args={['#f8fafc', 60, 400]} />

              <SceneLighting />
              
              {/* Core 3D Model Group */}
              <group>
                <TerrainModel showGrid={showGrid} />
                {showWater && <WaterLayer waterLevelState={simulationState} />}
                {showRain && <RainParticles activeState={simulationState} />}
              </group>

              {/* Automatic Smooth 360° Slow Cinematic Camera Rotation Target focused on Model Center */}
              <OrbitControls
                ref={controlsRef}
                target={[0, 0, 0]}
                enableDamping={true}
                dampingFactor={0.05}
                maxPolarAngle={Math.PI / 2.05}
                minDistance={10}
                maxDistance={250}
                autoRotate={autoRotate}
                autoRotateSpeed={0.5}
              />
            </Canvas>
          </Suspense>
        </ErrorBoundary3D>
      </div>

      {/* BOTTOM SCENARIO STATE CONTROLLER & METADATA BAR */}
      <div className="relative z-20 px-4 py-2 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          <span className="text-[#64748B] font-bold uppercase tracking-wider shrink-0 text-[10px]">
            Scenario Stage:
          </span>
          {SIMULATION_STATES.map((st) => (
            <button
              key={st}
              onClick={() => onStateChange && onStateChange(st)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer ${
                simulationState === st
                  ? 'bg-[#0F4C81] text-white border border-[#0F4C81]'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F4C81] border border-[#E2E8F0]'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[#64748B]">
          <span className="text-[#0F4C81] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F4C81] animate-pulse" />
            Asset: ollantaytambo_archaeological_site.glb
          </span>
        </div>
      </div>
    </div>
  );
}

