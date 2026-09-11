import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import HimalayanValleyScene from '../components/simulation/HimalayanValleyScene';
import stationsService from '../services/stationsService';
import hardwareService from '../services/hardwareService';
import { createTimer } from 'animejs';

// 7 Approved Scenario Stages Across 30 Mins Timeline
const SCENARIO_STAGES = [
  {
    index: 0,
    time: '00:00',
    title: 'NORMAL',
    riskClass: 'LOW',
    rainfallMmH: 0,
    waterLevelM: 1.8,
    levelChangeM: '+0.0',
    runoffMm: 12,
    affectedAreaKm2: 0,
    evacuationStatus: 'STANDBY',
    description: 'Normal seasonal river flow. Multi-sensor telemetry online & clear weather.',
  },
  {
    index: 1,
    time: '05:00',
    title: 'HEAVY RAIN',
    riskClass: 'WATCH',
    rainfallMmH: 28,
    waterLevelM: 2.2,
    levelChangeM: '+0.4',
    runoffMm: 28,
    affectedAreaKm2: 0.8,
    evacuationStatus: 'STANDBY',
    description: 'Monsoonal rainband intensifies over upper Himalayan catchment.',
  },
  {
    index: 2,
    time: '10:00',
    title: 'RUNOFF INCREASE',
    riskClass: 'WARNING',
    rainfallMmH: 45,
    waterLevelM: 2.9,
    levelChangeM: '+1.1',
    runoffMm: 68,
    affectedAreaKm2: 2.4,
    evacuationStatus: 'STANDBY',
    description: 'Steep hillslopes saturated. SCS-CN direct surface runoff Q accelerating.',
  },
  {
    index: 3,
    time: '15:00',
    title: 'WATER LEVEL RISING',
    riskClass: 'HIGH',
    rainfallMmH: 65,
    waterLevelM: 3.8,
    levelChangeM: '+2.0',
    runoffMm: 98,
    affectedAreaKm2: 5.6,
    evacuationStatus: 'MONITORING',
    description: 'River water level approaching official CWC Warning Stage (339.5m).',
  },
  {
    index: 4,
    time: '20:00',
    title: 'FLASH FLOOD',
    riskClass: 'EXTREME',
    rainfallMmH: 85,
    waterLevelM: 4.8,
    levelChangeM: '+3.0',
    runoffMm: 142,
    affectedAreaKm2: 9.8,
    evacuationStatus: 'ADVISED',
    description: 'Torrential cloudburst surge breaches official CWC Danger Stage (340.5m).',
  },
  {
    index: 5,
    time: '25:00',
    title: 'ROAD INUNDATION',
    riskClass: 'EXTREME',
    rainfallMmH: 92,
    waterLevelM: 5.2,
    levelChangeM: '+3.4',
    runoffMm: 168,
    affectedAreaKm2: 12.6,
    evacuationStatus: 'ADVISED',
    description: 'Floodwaters overflow riverbank and inundate low-lying NH-58 highway segment.',
  },
  {
    index: 6,
    time: '30:00',
    title: 'EVACUATION',
    riskClass: 'EXTREME',
    rainfallMmH: 95,
    waterLevelM: 5.4,
    levelChangeM: '+3.6',
    runoffMm: 175,
    affectedAreaKm2: 14.2,
    evacuationStatus: 'EVACUATING',
    description: 'State Emergency SOP triggered. Active evacuation along designated highland route.',
  },
];

// Timeline Outlook Chart Data (00:00 to 30:00 mins)
const OUTLOOK_CHART_DATA = SCENARIO_STAGES.map((s) => ({
  time: s.time,
  rainfall: s.rainfallMmH,
  runoff: s.runoffMm,
  waterLevel: s.waterLevelM,
}));

// Default Locations
const LOCATIONS = [
  { name: 'Alaknanda River Basin (Rishikesh)', lat: 30.108, lon: 78.298 },
  { name: 'Chamoli Catchment (Joshimath)', lat: 30.556, lon: 79.568 },
  { name: 'Bhagirathi Basin (Uttarkashi)', lat: 30.727, lon: 78.435 },
  { name: 'Mandakini Basin (Rudraprayag)', lat: 30.285, lon: 78.981 },
];

export default function FloodSimulationPage() {
  // Mode selection: 'DEMONSTRATION' vs 'LIVE_HARDWARE'
  const [mode, setMode] = useState('DEMONSTRATION');
  const [sendDemoAlertToHw, setSendDemoAlertToHw] = useState(false);
  
  const [selectedLocIndex, setSelectedLocIndex] = useState(0);
  const [locations, setLocations] = useState(LOCATIONS);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Hardware Live Telemetry State
  const [hwStatus, setHwStatus] = useState(null);
  const [hwLoading, setHwLoading] = useState(false);
  const [hwError, setHwError] = useState(null);
  const [buzzerMessage, setBuzzerMessage] = useState(null);
  const [simulatingEvent, setSimulatingEvent] = useState(false);

  const timelineRef = useRef(null);
  const maxDurationMs = 30000; // 30 seconds maps to 30 mins scenario time

  // Instantiate real Anime.js 4.5.0 Timer for 100% reliable timeline progression in DEMONSTRATION mode
  useEffect(() => {
    const timer = createTimer({
      duration: maxDurationMs,
      autoplay: false,
      speed: speed,
      onUpdate: (self) => {
        if (mode === 'DEMONSTRATION') {
          setCurrentTimeMs(self.currentTime);
          setIsPlaying(!self.paused);
        }
      },
      onPause: () => {
        setIsPlaying(false);
      },
      onComplete: () => {
        setIsPlaying(false);
      },
    });

    timelineRef.current = timer;

    return () => {
      if (timelineRef.current) {
        timelineRef.current.pause();
      }
    };
  }, [mode]);

  // Sync speed changes to Anime.js timer
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.speed = speed;
    }
  }, [speed]);

  // Hardware status polling (3-second interval)
  const fetchHwStatus = useCallback(async () => {
    try {
      setHwLoading(true);
      const data = await hardwareService.getHardwareStatus();
      setHwStatus(data?.data || data);
      setHwError(null);
    } catch (err) {
      console.warn('[FloodSimulationPage] Hardware status poll failed:', err);
      setHwError('HARDWARE LINK OFFLINE');
    } finally {
      setHwLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHwStatus();
    const interval = setInterval(fetchHwStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchHwStatus]);

  // Load locations dynamically from backend stations
  useEffect(() => {
    async function loadStations() {
      try {
        const res = await stationsService.getStations();
        if (res?.data && res.data.length > 0) {
          const mapped = res.data.map((st) => ({
            name: `${st.station_name} (${st.river_name || 'Catchment'})`,
            lat: st.latitude,
            lon: st.longitude,
          }));
          setLocations([LOCATIONS[0], ...mapped]);
        }
      } catch (e) {
        console.warn('[FloodSimulationPage] Failed to load stations:', e);
      }
    }
    loadStations();
  }, []);

  // Compute progress fraction (0.0 to 1.0) depending on mode
  let progressFraction = 0;
  let currentMetrics = SCENARIO_STAGES[0];

  if (mode === 'LIVE_HARDWARE') {
    if (hwStatus && hwStatus.latest_telemetry) {
      const wl = hwStatus.latest_telemetry.water_level_m || 1.8;
      // Map water level from 1.8m (normal) to 5.4m (extreme) -> [0.0, 1.0]
      progressFraction = Math.max(0, Math.min(1.0, (wl - 1.8) / (5.4 - 1.8)));
      
      const riskClass = hwStatus.current_risk_state || 'NORMAL';
      let stageIdx = 0;
      if (riskClass === 'EXTREME') stageIdx = 5;
      else if (riskClass === 'HIGH') stageIdx = 3;
      else if (riskClass === 'WARNING') stageIdx = 2;
      else if (riskClass === 'WATCH') stageIdx = 1;

      currentMetrics = {
        index: stageIdx,
        time: hwStatus.latest_telemetry.timestamp_display || 'LIVE',
        title: riskClass,
        riskClass: riskClass,
        rainfallMmH: hwStatus.latest_telemetry.rainfall_mm_h || 0,
        waterLevelM: hwStatus.latest_telemetry.water_level_m || 1.8,
        levelChangeM: hwStatus.rate_of_rise || '+0.0 m/min',
        runoffMm: Math.round(progressFraction * 175),
        affectedAreaKm2: Number((progressFraction * 14.2).toFixed(1)),
        evacuationStatus: riskClass === 'EXTREME' ? 'EVACUATING' : riskClass === 'HIGH' ? 'ADVISED' : 'STANDBY',
        description: `Live ESP32 telemetry ingested. Decision Engine output: ${riskClass}.`,
      };
    } else {
      progressFraction = 0;
      currentMetrics = {
        ...SCENARIO_STAGES[0],
        description: 'Waiting for live ESP32 hardware telemetry stream...',
      };
    }
  } else {
    // DEMONSTRATION mode
    progressFraction = Math.min(currentTimeMs / maxDurationMs, 1.0);
    const currentStageIndex = Math.min(
      Math.floor(progressFraction * SCENARIO_STAGES.length),
      SCENARIO_STAGES.length - 1
    );
    currentMetrics = SCENARIO_STAGES[currentStageIndex];
  }

  // Playback Control Handlers (Anime.js 4.5.0 Timer API)
  const handlePlayPause = () => {
    if (mode === 'LIVE_HARDWARE') return;
    if (!timelineRef.current) return;
    if (isPlaying) {
      timelineRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTimeMs >= maxDurationMs) {
        timelineRef.current.seek(0);
        setCurrentTimeMs(0);
      }
      timelineRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if (!timelineRef.current) return;
    timelineRef.current.pause();
    timelineRef.current.seek(0);
    setCurrentTimeMs(0);
    setIsPlaying(false);
  };

  const handleSeek = (e) => {
    if (mode === 'LIVE_HARDWARE') return;
    const val = Number(e.target.value);
    if (timelineRef.current) {
      timelineRef.current.seek(val);
      setCurrentTimeMs(val);
    }
  };

  const handleStageClick = (idx) => {
    if (mode === 'LIVE_HARDWARE') return;
    const targetMs = (idx / (SCENARIO_STAGES.length - 1)) * maxDurationMs;
    if (timelineRef.current) {
      timelineRef.current.seek(targetMs);
      setCurrentTimeMs(targetMs);
    }
  };

  // Test Buzzer Trigger Handler
  const handleTestBuzzer = async () => {
    try {
      setBuzzerMessage('DISPATCHING TEST COMMAND VIA BACKEND FASTAPI...');
      const res = await hardwareService.triggerTestBuzzer();
      setBuzzerMessage(`COMMAND DISPATCHED: ${res.data?.last_buzzer_command || res.command || 'ALERT_TEST'}`);
      fetchHwStatus();
      setTimeout(() => setBuzzerMessage(null), 5000);
    } catch (e) {
      setBuzzerMessage('BUZZER COMMAND FAILED');
      setTimeout(() => setBuzzerMessage(null), 5000);
    }
  };

  // Simulate Sensor Flash Flood Event Handler
  const handleTriggerSimulatedFlood = async () => {
    try {
      setSimulatingEvent(true);
      setBuzzerMessage('SIMULATING EXTREME FLASH FLOOD TELEMETRY STREAM...');
      
      // Step 1: Moderate Rain & Water Level Rise
      await hardwareService.sendTelemetry({
        sensor_id: 'ESP32_STATION_001',
        water_level_m: 2.8,
        rainfall_mm_h: 45.0,
        rainfall_accum_mm: 35.0,
        battery_v: 3.88,
        is_simulated: true,
      });
      await fetchHwStatus();

      // Step 2: Extreme Rain & Water Surge causing EXTREME state transition after 1.5s
      setTimeout(async () => {
        await hardwareService.sendTelemetry({
          sensor_id: 'ESP32_STATION_001',
          water_level_m: 5.4,
          rainfall_mm_h: 95.0,
          rainfall_accum_mm: 110.0,
          battery_v: 3.88,
          is_simulated: true,
        });
        await fetchHwStatus();
        setBuzzerMessage('EXTREME RISK TRIGGERED — EMERGENCY_ALERT_ON DISPATCHED TO ESP32');
        setSimulatingEvent(false);
        setTimeout(() => setBuzzerMessage(null), 6000);
      }, 1500);

    } catch (e) {
      console.error('Failed to trigger simulated flood event:', e);
      setBuzzerMessage('SIMULATION FAILED');
      setSimulatingEvent(false);
      setTimeout(() => setBuzzerMessage(null), 4000);
    }
  };

  const activeLoc = locations[selectedLocIndex] || LOCATIONS[0];

  return (
    <div className="flex flex-col gap-3 w-full font-sans select-none">
      {/* 0. Page Header with Mode Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[rgba(16,42,46,0.08)] pb-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[18px] font-bold text-[#102A2E] tracking-tight font-sans flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0C6E78] text-[22px]">
                water_do
              </span>
              REAL-TIME FLOOD DIGITAL TWIN
            </h1>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                mode === 'LIVE_HARDWARE'
                  ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 animate-pulse'
                  : 'bg-[#A5F1F7]/40 text-[#102A2E] border-[#A5F1F7]'
              }`}
            >
              {mode === 'LIVE_HARDWARE' ? 'LIVE HARDWARE' : 'DEMONSTRATION SCENARIO'}
            </span>
          </div>
          <p className="text-[11.5px] text-[#5F777C] mt-0.5">
            Complete Jal Drishti workflow: ESP32 Sensors &rarr; Telemetry &rarr; ML/Physics Engine &rarr; Actuator Buzzer
          </p>
        </div>

        {/* Controls: Mode Switcher & Location Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center glass-panel-level2 p-1 rounded-lg bg-white/80 border border-[rgba(16,42,46,0.08)]">
            <button
              onClick={() => setMode('DEMONSTRATION')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                mode === 'DEMONSTRATION'
                  ? 'bg-[#A5F1F7] text-[#102A2E] border border-[#A5F1F7] shadow-xs'
                  : 'text-[#5F777C] hover:text-[#102A2E]'
              }`}
            >
              DEMO SCENARIO
            </button>
            <button
              onClick={() => setMode('LIVE_HARDWARE')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'LIVE_HARDWARE'
                  ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 shadow-xs'
                  : 'text-[#5F777C] hover:text-[#102A2E]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              LIVE HARDWARE
            </button>
          </div>

          {/* Location Dropdown */}
          <div className="flex items-center gap-2 glass-panel-level2 px-3 py-1 rounded-lg bg-white/80 border border-[rgba(16,42,46,0.08)]">
            <span className="material-symbols-outlined text-[#102A2E] text-[16px]">
              location_on
            </span>
            <select
              value={selectedLocIndex}
              onChange={(e) => setSelectedLocIndex(Number(e.target.value))}
              className="bg-transparent text-[11.5px] font-semibold text-[#102A2E] outline-none cursor-pointer font-sans"
            >
              {locations.map((loc, idx) => (
                <option key={idx} value={idx} className="bg-white text-[#102A2E]">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. Main Central Split: Hero Simulation Scene + Right Operational Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left 8 Cols: Hero Environmental Scene + Controls */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Hero Scene Component */}
          <HimalayanValleyScene
            stageIndex={currentMetrics.index || 0}
            progressFraction={progressFraction}
            currentMetrics={currentMetrics}
          />

          {/* Timeline Playback Controls Bar */}
          <div className="glass-panel-level1 p-3 rounded-xl flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Play / Pause / Reset Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePlayPause}
                  disabled={mode === 'LIVE_HARDWARE'}
                  className={`px-3 py-1.5 text-[12px] font-bold flex items-center gap-1 transition-all rounded-lg border ${
                    mode === 'LIVE_HARDWARE'
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-[#A5F1F7] hover:bg-[#8BE5EC] text-[#102A2E] border-[#A5F1F7] cursor-pointer shadow-xs active:scale-98'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                  <span>{isPlaying ? 'PAUSE' : 'PLAY SCENARIO'}</span>
                </button>

                <button
                  onClick={handleReset}
                  disabled={mode === 'LIVE_HARDWARE'}
                  className="p-1.5 bg-white text-[#102A2E] border border-[rgba(16,42,46,0.12)] hover:bg-[#F2FAFB] rounded-lg transition-all cursor-pointer disabled:opacity-40 shadow-xs"
                  title="Reset Timeline"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                </button>
              </div>

              {/* Current Time Display */}
              <div className="text-center font-mono">
                <span className="text-[9.5px] font-bold text-[#5F777C] uppercase tracking-wider block">
                  {mode === 'LIVE_HARDWARE' ? 'LIVE SENSOR TIME' : 'SCENARIO TIME'}
                </span>
                <span className="text-[16px] font-bold text-[#102A2E]">
                  {mode === 'LIVE_HARDWARE'
                    ? (hwStatus?.latest_telemetry?.timestamp_display || '12:04:18 IST')
                    : `${currentMetrics.time} / 30:00 MIN`}
                </span>
              </div>

              {/* Speed Buttons / Demo Hardware Alert Toggle */}
              <div className="flex items-center gap-2">
                {mode === 'DEMONSTRATION' ? (
                  <div className="flex items-center gap-2.5">
                    <label className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[#102A2E] cursor-pointer bg-white border border-[rgba(16,42,46,0.08)] px-2.5 py-1 rounded shadow-xs">
                      <input
                        type="checkbox"
                        checked={sendDemoAlertToHw}
                        onChange={(e) => setSendDemoAlertToHw(e.target.checked)}
                        className="accent-[#102A2E] rounded cursor-pointer"
                      />
                      <span>SEND DEMO ALERT TO HARDWARE</span>
                    </label>

                    <div className="flex items-center gap-0.5 bg-white border border-[rgba(16,42,46,0.08)] p-0.5 rounded-lg shadow-xs">
                      {[0.5, 1, 2, 4].map((sp) => (
                        <button
                          key={sp}
                          onClick={() => setSpeed(sp)}
                          className={`px-2 py-0.5 text-[10.5px] font-mono font-bold rounded transition-all cursor-pointer ${
                            speed === sp
                              ? 'bg-[#A5F1F7] text-[#102A2E]'
                              : 'text-[#5F777C] hover:text-[#102A2E]'
                          }`}
                        >
                          {sp}x
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE SENSOR STREAM
                  </span>
                )}
              </div>
            </div>

            {/* Scrubbable Timeline Slider */}
            {mode === 'DEMONSTRATION' && (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max={maxDurationMs}
                  value={currentTimeMs}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#102A2E]"
                />
              </div>
            )}
          </div>

          {/* 7 Stage Selector Cards Grid (Always Visible, 7 Columns on Desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {SCENARIO_STAGES.map((stg, i) => {
              const isActive = i === currentMetrics.index;
              let borderStyle = 'border-[rgba(16,42,46,0.08)] text-[#5F777C] hover:text-[#102A2E] hover:bg-[#F2FAFB]';

              if (isActive) {
                if (stg.riskClass === 'EXTREME') borderStyle = 'border-red-500 bg-red-500/15 text-red-700 font-bold shadow-xs';
                else if (stg.riskClass === 'HIGH') borderStyle = 'border-orange-500 bg-orange-500/15 text-orange-700 font-bold shadow-xs';
                else if (stg.riskClass === 'WARNING') borderStyle = 'border-amber-500 bg-amber-500/15 text-amber-700 font-bold shadow-xs';
                else if (stg.riskClass === 'WATCH') borderStyle = 'border-blue-500 bg-blue-500/15 text-blue-700 font-bold shadow-xs';
                else borderStyle = 'border-[#A5F1F7] bg-[#A5F1F7]/40 text-[#102A2E] font-bold shadow-xs';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleStageClick(i)}
                  disabled={mode === 'LIVE_HARDWARE'}
                  className={`glass-panel-level1 p-2 rounded-lg border flex flex-col items-center text-center justify-center gap-0.5 transition-all cursor-pointer h-[66px] ${borderStyle}`}
                >
                  <span className="text-[9.5px] font-mono font-semibold tracking-wider opacity-80">
                    {stg.time}
                  </span>
                  <span className="text-[11px] font-bold tracking-tight leading-tight truncate w-full">
                    {stg.title}
                  </span>
                  <span className="text-[9px] font-semibold tracking-wide uppercase opacity-75">
                    {stg.riskClass}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Operational Event Timeline Feed */}
          <div className="glass-panel-level1 p-3 rounded-xl flex flex-col gap-1.5 font-sans">
            <div className="flex items-center justify-between border-b border-[rgba(16,42,46,0.08)] pb-1.5">
              <h3 className="text-[11px] font-semibold text-[#102A2E] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#102A2E] text-[16px]">
                  format_list_bulleted
                </span>
                Operational Event Feed
              </h3>
              <span className="text-[10px] font-mono text-[#5F777C]">
                {mode === 'LIVE_HARDWARE' ? 'LIVE STREAM' : 'SIMULATED FEED'}
              </span>
            </div>

            <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto custom-scrollbar pr-1">
              {(hwStatus?.event_timeline || []).length > 0 ? (
                hwStatus.event_timeline.slice(0, 5).map((evt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10.5px] bg-[#F2FAFB] p-1.5 rounded border border-[rgba(16,42,46,0.08)]">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[#102A2E] font-semibold text-[10px]">{evt.timestamp}</span>
                      <span className="text-[#102A2E] font-normal truncate">{evt.message}</span>
                    </div>
                    {evt.is_simulated ? (
                      <span className="text-[9px] text-[#5F777C] font-mono uppercase shrink-0">SIM</span>
                    ) : (
                      <span className="text-[9px] text-emerald-600 font-mono uppercase shrink-0 font-bold">HW</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-[#5F777C] italic p-1.5">
                  No events logged yet. Sensor updates and buzzer dispatches will appear here.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Live Telemetry, Actuator Control, and Charts */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          
          {/* 1. LIVE SENSOR TELEMETRY PANEL */}
          <div className="glass-panel-level1 p-3 rounded-xl flex flex-col gap-2.5 font-sans">
            <div className="flex items-center justify-between border-b border-teal-500/10 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-cyan-400 text-[18px]">
                  sensors
                </span>
                <h3 className="text-[12.5px] font-semibold text-slate-200 tracking-wide">
                  Live Sensor Telemetry
                </h3>
              </div>

              <span
                className={`text-[9.5px] font-semibold px-2 py-0.5 rounded border uppercase ${
                  hwStatus?.esp32_status === 'CONNECTED'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {hwStatus?.esp32_status || 'CONNECTED'}
              </span>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-2 rounded-lg">
                <span className="text-[9px] font-semibold text-[#5F777C] uppercase block">
                  Water Level
                </span>
                <span className="text-[15px] font-bold text-[#102A2E] font-mono">
                  {currentMetrics.waterLevelM} m
                </span>
              </div>

              <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-2 rounded-lg">
                <span className="text-[9px] font-semibold text-[#5F777C] uppercase block">
                  Rate of Rise
                </span>
                <span className="text-[12px] font-bold text-amber-600 font-mono block mt-0.5">
                  {hwStatus?.rate_of_rise || currentMetrics.levelChangeM || 'STABLE'}
                </span>
              </div>

              <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-2 rounded-lg">
                <span className="text-[9px] font-semibold text-[#5F777C] uppercase block">
                  Rainfall Rate
                </span>
                <span className="text-[15px] font-bold text-[#102A2E] font-mono">
                  {currentMetrics.rainfallMmH} mm/h
                </span>
              </div>

              <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-2 rounded-lg">
                <span className="text-[9px] font-semibold text-[#5F777C] uppercase block">
                  Accum Rain
                </span>
                <span className="text-[15px] font-bold text-[#102A2E] font-mono">
                  {hwStatus?.latest_telemetry?.rainfall_accum_mm || Math.round(currentMetrics.rainfallMmH * 1.4)} mm
                </span>
              </div>
            </div>

            {/* Hardware Status Summary Lines */}
            <div className="flex flex-col gap-1 text-[10.5px] border-t border-teal-500/10 pt-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Sensor Node:</span>
                <span className="font-semibold text-emerald-400">{hwStatus?.sensor_status || 'ONLINE'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Telemetry Sync:</span>
                <span className="font-mono text-cyan-300">{hwStatus?.latest_telemetry?.timestamp_display || '12:04:18 IST'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data Quality:</span>
                <span className="font-semibold text-emerald-400">{hwStatus?.data_quality || 'GOOD (100%)'}</span>
              </div>
            </div>
          </div>

          {/* 2. EMERGENCY ACTUATOR (PHYSICAL BUZZER) PANEL */}
          <div className="glass-panel-level1 p-3 rounded-xl flex flex-col gap-2 font-sans">
            <div className="flex items-center justify-between border-b border-teal-500/10 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-red-400 text-[18px]">
                  campaign
                </span>
                <h3 className="text-[12.5px] font-semibold text-slate-200 tracking-wide">
                  Emergency Actuator
                </h3>
              </div>

              <span
                className={`text-[9.5px] font-semibold px-2 py-0.5 rounded border uppercase ${
                  hwStatus?.buzzer_state === 'ALERTING'
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                    : hwStatus?.buzzer_state === 'ARMED'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700'
                }`}
              >
                BUZZER: {hwStatus?.buzzer_state || 'STANDBY'}
              </span>
            </div>

            <div className="flex flex-col gap-1 text-[10.5px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Last Command:</span>
                <span className="font-mono text-amber-300 font-semibold">{hwStatus?.last_buzzer_command || 'NONE'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Acknowledgement:</span>
                {hwStatus?.ack_received ? (
                  <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[9.5px]">
                    ACK RECEIVED
                  </span>
                ) : (
                  <span className="font-semibold text-slate-400">STANDBY</span>
                )}
              </div>
            </div>

            {buzzerMessage && (
              <div className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 p-1.5 rounded border border-cyan-500/30">
                {buzzerMessage}
              </div>
            )}

            {/* Hardware Actuator Action Buttons */}
            <div className="flex items-center gap-2 mt-0.5">
              <button
                onClick={handleTestBuzzer}
                className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">notifications_active</span>
                <span>TEST BUZZER</span>
              </button>

              <button
                onClick={handleTriggerSimulatedFlood}
                disabled={simulatingEvent}
                className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[15px]">warning</span>
                <span>{simulatingEvent ? 'SIMULATING...' : 'TRIGGER FLOOD'}</span>
              </button>
            </div>
          </div>

          {/* 3. Operational Risk Status Card */}
          <div className="glass-panel-level1 p-3 rounded-xl flex flex-col gap-1.5 font-sans">
            <div className="flex items-center justify-between border-b border-[rgba(16,42,46,0.08)] pb-1.5">
              <div>
                <span className="text-[9.5px] font-bold text-[#5F777C] uppercase tracking-wider block">
                  Operational Stage
                </span>
                <h3 className="text-[13.5px] font-bold text-[#102A2E]">
                  {currentMetrics.title}
                </h3>
              </div>

              {/* Risk Class Badge */}
              <span
                className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                  currentMetrics.riskClass === 'EXTREME'
                    ? 'bg-red-500/15 text-red-700 border-red-500/30 animate-pulse'
                    : currentMetrics.riskClass === 'HIGH'
                    ? 'bg-orange-500/15 text-orange-700 border-orange-500/30'
                    : currentMetrics.riskClass === 'WARNING'
                    ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                    : currentMetrics.riskClass === 'WATCH'
                    ? 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                    : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                }`}
              >
                {currentMetrics.riskClass} RISK
              </span>
            </div>

            <p className="text-[11px] text-[#5F777C] leading-snug font-medium">
              {currentMetrics.description}
            </p>
          </div>

          {/* 4. Precipitation & Runoff Outlook Chart (Recharts) */}
          <div className="glass-panel-level1 p-3 rounded-xl flex flex-col gap-1.5 font-sans">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-cyan-400 text-[16px]">
                  area_chart
                </span>
                Rainfall & Runoff Outlook
              </h3>
              <span className="text-[10px] font-mono text-slate-400">00:00 – 30:00 Mins</span>
            </div>

            <div className="w-full h-[120px] mt-0.5">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={OUTLOOK_CHART_DATA} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 42, 46, 0.08)" />
                  <XAxis dataKey="time" stroke="#5F777C" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#102A2E" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(16, 42, 46, 0.12)',
                      borderRadius: '8px',
                      color: '#102A2E',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                  <Area type="monotone" dataKey="runoff" name="Direct Runoff Q (mm)" fill="#A5F1F7" fillOpacity={0.4} stroke="#0C6E78" strokeWidth={1.8} />
                  <Line type="monotone" dataKey="rainfall" name="Rainfall (mm/h)" stroke="#102A2E" strokeWidth={2} dot={{ r: 2.5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
