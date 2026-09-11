import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_PATH = '/models/jal-drishti-terrain.glb';

// Preload the GLB model asset once for maximum performance
try {
  useGLTF.preload(MODEL_PATH);
} catch (e) {
  console.warn('Preload notice for GLB terrain model:', e);
}

// ------------------------------------------------------------
// 1. TERRAIN GLB MODEL COMPONENT
// ------------------------------------------------------------
function TerrainModel({ showGrid }) {
  const { scene } = useGLTF(MODEL_PATH);
  
  // Clone scene to allow isolated mutations
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.roughness = 0.65;
          child.material.metalness = 0.15;
        }
      }
    });
  }, [clonedScene]);

  return (
    <group>
      <Center top>
        <primitive object={clonedScene} scale={1.0} />
      </Center>
      {showGrid && (
        <gridHelper args={[140, 28, '#14b8a6', '#064e4b']} position={[0, -0.1, 0]} />
      )}
    </group>
  );
}

// ------------------------------------------------------------
// 2. DYNAMIC WATER / FLOOD LAYER (PHASE 1)
// ------------------------------------------------------------
function WaterLayer({ waterLevelState }) {
  const meshRef = useRef();

  // Water level Y offset configuration based on simulation state
  const waterHeights = {
    NORMAL: 1.5,
    HEAVY_RAIN: 3.2,
    RUNOFF_INCREASE: 4.8,
    WATER_LEVEL_RISING: 6.5,
    FLASH_FLOOD: 8.8,
    ROAD_INUNDATION: 10.5,
    EVACUATION: 11.8,
  };

  const targetY = waterHeights[waterLevelState] ?? 1.5;

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Smooth lerp transition for rising water height
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, delta * 2.5);

    // Subtle wave ripple simulation
    const time = state.clock.getElapsedTime();
    if (meshRef.current.material) {
      meshRef.current.material.opacity = 0.72 + Math.sin(time * 2.0) * 0.06;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, targetY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[120, 120, 64, 64]} />
      <meshStandardMaterial
        color={waterLevelState === 'FLASH_FLOOD' || waterLevelState === 'EVACUATION' ? '#0891b2' : '#0d9488'}
        roughness={0.1}
        metalness={0.8}
        transparent={true}
        opacity={0.75}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ------------------------------------------------------------
// 3. RAIN PARTICLE SYSTEM COMPONENT
// ------------------------------------------------------------
function RainParticles({ activeState }) {
  const pointsRef = useRef();
  
  const particleCount = useMemo(() => {
    if (activeState === 'NORMAL') return 0;
    if (activeState === 'HEAVY_RAIN') return 500;
    if (activeState === 'RUNOFF_INCREASE') return 900;
    return 1400; // FLASH_FLOOD & EVACUATION
  }, [activeState]);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 140;
      pos[i * 3 + 1] = Math.random() * 60 + 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 140;
      vel[i] = Math.random() * 25 + 20;
    }
    return { positions: pos, velocities: vel };
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!pointsRef.current || particleCount === 0) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    if (!posAttr) return;

    const arr = posAttr.array;
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3 + 1] -= velocities[i] * delta;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 60;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (particleCount === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.65}
        color="#5eead4"
        transparent={true}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ------------------------------------------------------------
// 4. SCENE LIGHTING COMPONENT
// ------------------------------------------------------------
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[50, 75, 40]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight skyColor="#5eead4" groundColor="#061412" intensity={0.5} />
      <pointLight position={[-30, 20, -30]} intensity={0.6} color="#06b6d4" />
    </>
  );
}

// ------------------------------------------------------------
// 5. LOADING & ERROR FALLBACK OVERLAYS
// ------------------------------------------------------------
function LoadingFallback() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#F7FCFD]/90 backdrop-blur-sm select-none">
      <div className="w-12 h-12 rounded-2xl bg-[#EAF8FA] border border-[#A5F1F7] flex items-center justify-center mb-3 animate-pulse">
        <span className="material-symbols-outlined text-[#102A2E] text-2xl animate-spin">sync</span>
      </div>
      <span className="text-xs font-bold text-[#102A2E] uppercase tracking-widest font-mono">
        LOADING 3D GLB DIGITAL TWIN
      </span>
      <span className="text-[10.5px] text-[#24464B] mt-1 font-mono font-semibold">
        Fetching Himalayan Terrain Asset (/models/jal-drishti-terrain.glb)...
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
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#F7FCFD] p-6 text-center">
          <span className="material-symbols-outlined text-[#D97706] text-4xl mb-2">warning</span>
          <h4 className="text-sm font-bold text-[#102A2E] uppercase tracking-wider font-mono">
            3D TERRAIN UNAVAILABLE
          </h4>
          <p className="text-xs text-[#6B858A] max-w-sm my-2">
            Failed to render 3D terrain model. Check console for technical details.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#A5F1F7] to-[#D9F9FB] border border-[#A5F1F7] text-[#102A2E] font-bold text-xs hover:shadow-xs transition-all"
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
// 6. MAIN JAL DRISHTI 3D VIEWER CONTAINER
// ------------------------------------------------------------
export default function JalDrishti3DViewer({
  simulationState = 'NORMAL',
  onStateChange,
  showControls = true,
}) {
  const [showWater, setShowWater] = useState(true);
  const [showRain, setShowRain] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const controlsRef = useRef();

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
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
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[540px] rounded-lg border border-[#152C31]/15 bg-white overflow-hidden flex flex-col select-none group font-sans shadow-sm">
      
      {/* TOP OVERLAY HEADER BAR */}
      <div className="relative z-20 px-4 py-2.5 bg-white border-b border-[#152C31]/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#A5F1F7] border border-[#152C31]/20 text-[#152C31] font-mono text-[10.5px] font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#152C31] animate-pulse" />
            <span>REAL 3D DIGITAL TWIN</span>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-[#152C31] tracking-tight uppercase">
              JAL DRISTI HIMALAYAN TERRAIN MODEL
            </span>
            <span className="text-[10px] font-semibold text-[#647A7F] font-mono">
              3D GLB Model Asset • Interactive Geospatial Elevation Surface
            </span>
          </div>
        </div>

        {/* TOP COMPACT CONTROLS */}
        {showControls && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWater(!showWater)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                showWater
                  ? 'bg-[#A5F1F7] border-[#A5F1F7] text-[#152C31]'
                  : 'bg-white border-[#152C31]/20 text-[#647A7F] hover:text-[#152C31]'
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
                  ? 'bg-[#A5F1F7] border-[#A5F1F7] text-[#152C31]'
                  : 'bg-white border-[#152C31]/20 text-[#647A7F] hover:text-[#152C31]'
              }`}
              title="Toggle Rain Particles"
            >
              <span className="material-symbols-outlined text-sm">rainy</span>
              <span className="hidden md:inline">Rain</span>
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                showGrid
                  ? 'bg-[#A5F1F7] border-[#A5F1F7] text-[#152C31]'
                  : 'bg-white border-[#152C31]/20 text-[#647A7F] hover:text-[#152C31]'
              }`}
              title="Toggle Terrain Grid"
            >
              <span className="material-symbols-outlined text-sm">grid_4x4</span>
              <span className="hidden md:inline">Grid</span>
            </button>

            <button
              onClick={handleResetCamera}
              className="px-2.5 py-1 rounded bg-white border border-[#152C31]/20 text-[#152C31] text-[11px] font-bold hover:bg-[#F7FCFD] transition-all flex items-center gap-1 cursor-pointer"
              title="Reset Camera View"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* THREE.JS CANVAS VIEWPORT */}
      <div className="relative flex-1 w-full h-full bg-[#F7FCFD]">
        <ErrorBoundary3D>
          <Suspense fallback={<LoadingFallback />}>
            <Canvas shadows gl={{ antialias: true, alpha: false }}>
              <PerspectiveCamera makeDefault position={[48, 42, 64]} fov={45} near={0.1} far={1000} />
              <SceneLighting />
              <TerrainModel showGrid={showGrid} />
              {showWater && <WaterLayer waterLevelState={simulationState} />}
              {showRain && <RainParticles activeState={simulationState} />}
              <OrbitControls
                ref={controlsRef}
                enableDamping={true}
                dampingFactor={0.05}
                maxPolarAngle={Math.PI / 2.15}
                minDistance={15}
                maxDistance={220}
                autoRotate={false}
              />
            </Canvas>
          </Suspense>
        </ErrorBoundary3D>
      </div>

      {/* BOTTOM SCENARIO STATE CONTROLLER & METADATA BAR */}
      <div className="relative z-20 px-4 py-2 bg-white border-t border-[#152C31]/10 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          <span className="text-[#647A7F] font-bold uppercase tracking-wider shrink-0 text-[10px]">
            Scenario Stage:
          </span>
          {SIMULATION_STATES.map((st) => (
            <button
              key={st}
              onClick={() => onStateChange && onStateChange(st)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer ${
                simulationState === st
                  ? 'bg-[#A5F1F7] text-[#152C31] border border-[#A5F1F7]'
                  : 'bg-[#F7FCFD] text-[#647A7F] hover:text-[#152C31] border border-[#152C31]/15'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[#647A7F]">
          <span className="text-[#152C31] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#152C31] animate-pulse" />
            Asset: jal-drishti-terrain.glb
          </span>
        </div>
      </div>
    </div>
  );
}

