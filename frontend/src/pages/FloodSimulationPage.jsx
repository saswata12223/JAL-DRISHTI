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
import FloodForecastCard from '../components/monitoring/FloodForecastCard';
import Esp32CamEvidence from '../components/monitoring/Esp32CamEvidence';
import RainfallHistoryTrendChart from '../components/charts/RainfallHistoryTrendChart';
import stationsService from '../services/stationsService';
import hardwareService from '../services/hardwareService';
import floodForecastService from '../services/floodForecastService';
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
  const mode = 'LIVE_HARDWARE';
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

  // ML Flood Forecasting State
  const [liveForecast, setLiveForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [rainfallHistory, setRainfallHistory] = useState([]);

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

  // ML Flood Forecast polling (3-second interval)
  const fetchForecast = useCallback(async () => {
    try {
      setForecastLoading(true);
      const [fcRes, histRes] = await Promise.allSettled([
        floodForecastService.getLatestForecast('ARDUINO_UNO_001'),
        floodForecastService.getRainfallHistory(30),
      ]);
      if (fcRes.status === 'fulfilled' && fcRes.value?.data) {
        setLiveForecast(fcRes.value.data);
      }
      if (histRes.status === 'fulfilled' && histRes.value?.data) {
        setRainfallHistory(histRes.value.data);
      }
    } catch (err) {
      console.warn('[FloodSimulationPage] Flood forecast poll failed:', err);
    } finally {
      setForecastLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHwStatus();
    fetchForecast();
    const interval = setInterval(() => {
      fetchHwStatus();
      fetchForecast();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchHwStatus, fetchForecast]);

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
      {/* Title & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex flex-col">
          <h1 className="text-[17px] font-bold text-[#102A2E] tracking-tight uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#0C6E78]">water_drop</span>
            REAL-TIME FLOOD DIGITAL TWIN
            <span className="text-[9.5px] font-semibold text-emerald-800 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
              LIVE HARDWARE
            </span>
          </h1>
          <span className="text-[11.5px] text-[#5F777C] font-medium ml-7 mt-0.5 tracking-wide">
            Complete Jal Drishti workflow: ESP32 Sensors → Telemetry → ML/Physics Engine → Actuator Buzzer
          </span>
        </div>

      </div>

      {/* 1. Main Central Split: Hero Simulation Scene + Right Operational Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left 8 Cols: Hero Environmental Scene + Controls */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* ESP32-CAM Feed (Replaces Himalayan Valley) */}
          <Esp32CamEvidence 
            className="w-full min-h-[400px]"
            cameraDetails={
              mode === 'DEMONSTRATION' 
                ? {
                    brightness: currentMetrics.waterLevelM > 3.0 ? 85 : 120,
                    dark_cloud_score: currentMetrics.rainfallMmH > 50 ? 80 : 20,
                    visual_rain_score: currentMetrics.rainfallMmH > 0 ? Math.min(100, currentMetrics.rainfallMmH) : 0,
                    connected: true
                  }
                : liveForecast?.components?.camera_details 
                  ? liveForecast.components.camera_details
                  : { connected: false }
            } 
          />

          {/* Live Readings Grid (Replaces Timeline) */}
          {(() => {
            const demoReadings = {
              rain_raw: currentMetrics.rainfallMmH > 80 ? 100 : currentMetrics.rainfallMmH > 40 ? 300 : 800,
              rain_level: currentMetrics.rainfallMmH > 80 ? 'VERY HEAVY' : currentMetrics.rainfallMmH > 40 ? 'MODERATE' : 'NO RAIN',
              rain_intensity: currentMetrics.rainfallMmH,
              soil_raw: currentMetrics.runoffMm > 100 ? 250 : 500,
              soil_moisture: currentMetrics.runoffMm > 100 ? 95 : 45,
              alert: currentMetrics.riskClass === 'EXTREME' || currentMetrics.riskClass === 'HIGH'
            };
            const readings = mode === 'DEMONSTRATION' ? demoReadings : liveForecast?.components?.readings || {};
            const cameraDetails = mode === 'DEMONSTRATION' ? { connected: true } : liveForecast?.components?.camera_details || { connected: false };
            
            return (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="glass-panel-level1 p-4 rounded-xl flex flex-col items-center justify-center text-center border border-[rgba(16,42,46,0.1)] shadow-sm bg-white/90">
                  <h2 className="text-[12px] font-bold text-[#5F777C] uppercase tracking-wider">Rain Sensor</h2>
                  <div className="text-[32px] font-bold text-[#102A2E] mt-2 font-mono">{readings.rain_raw ?? '--'}</div>
                  <p className="text-[10px] text-[#5F777C] mt-1">Raw Sensor Value</p>
                </div>
                <div className="glass-panel-level1 p-4 rounded-xl flex flex-col items-center justify-center text-center border border-[rgba(16,42,46,0.1)] shadow-sm bg-white/90">
                  <h2 className="text-[12px] font-bold text-[#5F777C] uppercase tracking-wider">Rain Level</h2>
                  <div className="text-[22px] font-bold text-[#0C6E78] mt-2">{readings.rain_level || 'WAITING...'}</div>
                </div>
                <div className="glass-panel-level1 p-4 rounded-xl flex flex-col items-center justify-center text-center border border-[rgba(16,42,46,0.1)] shadow-sm bg-white/90">
                  <h2 className="text-[12px] font-bold text-[#5F777C] uppercase tracking-wider">Rain Intensity</h2>
                  <div className="text-[32px] font-bold text-[#102A2E] mt-2 font-mono">{readings.rain_intensity ?? '--'}%</div>
                </div>
                <div className="glass-panel-level1 p-4 rounded-xl flex flex-col items-center justify-center text-center border border-[rgba(16,42,46,0.1)] shadow-sm bg-white/90">
                  <h2 className="text-[12px] font-bold text-[#5F777C] uppercase tracking-wider">Soil Moisture</h2>
                  <div className="text-[32px] font-bold text-[#102A2E] mt-2 font-mono">{readings.soil_moisture ?? '--'}%</div>
                  <p className="text-[10px] text-[#5F777C] mt-1">Raw: {readings.soil_raw ?? '--'}</p>
                </div>
                <div className="glass-panel-level1 p-4 rounded-xl flex flex-col items-center justify-center text-center border border-[rgba(16,42,46,0.1)] shadow-sm bg-white/90">
                  <h2 className="text-[12px] font-bold text-[#5F777C] uppercase tracking-wider">Arduino Alert</h2>
                  <div className={`text-[18px] font-bold mt-2 ${readings.alert ? 'text-red-600' : 'text-emerald-600'}`}>
                    {readings.alert ? 'HEAVY RAIN ALERT' : 'NO ALERT'}
                  </div>
                </div>
                <div className="glass-panel-level1 p-4 rounded-xl flex flex-col items-center justify-center text-center border border-[rgba(16,42,46,0.1)] shadow-sm bg-white/90">
                  <h2 className="text-[12px] font-bold text-[#5F777C] uppercase tracking-wider">Data Status</h2>
                  <div className="text-[12px] font-bold mt-2 flex flex-col gap-1 w-full px-2">
                    <div className="flex justify-between w-full">
                      <span className="text-[#5F777C]">Arduino:</span>
                      <span className={mode === 'DEMONSTRATION' || hwStatus?.esp32_status === 'CONNECTED' ? 'text-emerald-600' : 'text-amber-600'}>
                        {mode === 'DEMONSTRATION' ? 'CONNECTED' : hwStatus?.esp32_status || 'CONNECTING...'}
                      </span>
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="text-[#5F777C]">Camera:</span>
                      <span className={cameraDetails?.connected ? 'text-emerald-600' : 'text-amber-600'}>
                        {cameraDetails?.connected ? 'CONNECTED' : 'CONNECTING...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right 4 Cols: Live Telemetry, Actuator Control, and Charts */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          


          {/* 1.5 REAL-TIME ML FLOOD FORECAST CARD */}
          <FloodForecastCard 
            forecast={mode === 'DEMONSTRATION' ? {
              status: 'VALID',
              is_sufficient: true,
              flood_probability: currentMetrics.riskClass === 'EXTREME' ? 0.95 : currentMetrics.riskClass === 'HIGH' ? 0.8 : currentMetrics.riskClass === 'WARNING' ? 0.6 : 0.2,
              risk_level: currentMetrics.riskClass,
              forecast_horizon: '15-30 min',
              model_confidence: 85.5,
              current_rain_intensity: currentMetrics.rainfallMmH,
              rainfall_trend: currentMetrics.levelChangeM.startsWith('+') ? 'RISING' : 'STEADY',
              components: {
                rain: Math.min(100, currentMetrics.rainfallMmH),
                soil: Math.min(100, currentMetrics.runoffMm),
                rain_trend: currentMetrics.levelChangeM.startsWith('+') ? 1 : 0,
                soil_trend: currentMetrics.runoffMm > 50 ? 1 : 0,
                camera: currentMetrics.waterLevelM > 4.0 ? 80 : 0,
                external_water: currentMetrics.waterLevelM > 3.0 ? 1 : 0,
                soil_rise: currentMetrics.waterLevelM > 4.5 ? 1 : 0
              },
              reason: currentMetrics.description
            } : liveForecast} 
            loading={mode === 'DEMONSTRATION' ? false : forecastLoading} 
          />


          {/* 3. Operational Risk Status Card */}
          <div className="glass-panel-level1 p-3 rounded-xl flex flex-col gap-1.5 font-sans bg-white/90 border border-[rgba(16,42,46,0.1)] shadow-sm">
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
          <div className="glass-panel-level1 p-3 rounded-xl flex flex-col gap-1.5 font-sans bg-white/90 border border-[rgba(16,42,46,0.1)] shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-[#102A2E] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0C6E78] text-[16px]">
                  area_chart
                </span>
                Rainfall & Runoff Outlook
              </h3>
              <span className="text-[10px] font-mono text-[#5F777C]">00:00 – 30:00 Mins</span>
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

      {/* 2. Full-Width Historical Rainfall & ML Forecast Trend Chart */}
      <RainfallHistoryTrendChart
        historyData={rainfallHistory}
        currentIntensity={
          liveForecast?.features?.current_intensity !== undefined
            ? Math.round(liveForecast.features.current_intensity * 100)
            : (hwStatus?.latest_telemetry?.rainfall_mm_h || 0)
        }
      />
    </div>
  );
}
