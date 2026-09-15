import React, { useState, useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import StatCard from '../components/common/StatCard';
import RiskOverviewMap from '../components/map/RiskOverviewMap';
import DecisionIntelligenceCard from '../components/decision/DecisionIntelligenceCard';
import DashboardTrends from '../components/charts/DashboardTrends';
import riskService from '../services/riskService';
import stationsService from '../services/stationsService';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('12:04:18 IST');
  const containerRef = useRef(null);

  const [summaryData, setSummaryData] = useState({
    activeExtreme: 1,
    activeHigh: 3,
    activeAlerts: 2,
  });

  const [selectedLocation, setSelectedLocation] = useState({
    name: 'Alaknanda River Basin (Rishikesh)',
    lat: 30.108,
    lon: 78.298,
    mlProbability: 0.94,
    rainfall: 'HIGH',
    soilSaturation: 'HIGH',
    cwcStage: 'DANGER',
    runoff: 'HIGH',
    finalRisk: 'EXTREME',
  });

  const [stationsList, setStationsList] = useState([]);

  // Load Dashboard Data from Backend Services
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';
        setLastUpdatedTime(nowTime);

        const [summaryRes, alertsRes, stationsRes, latestDecisionsRes] = await Promise.allSettled([
          riskService.getRiskSummary(),
          riskService.getActiveAlerts(),
          stationsService.getStations(),
          riskService.getLatestDecisions(),
        ]);

        let riskDecisionMap = {};
        if (latestDecisionsRes.status === 'fulfilled' && latestDecisionsRes.value?.data) {
          const decisions = latestDecisionsRes.value.data;
          if (Array.isArray(decisions)) {
            decisions.forEach(d => {
              if (d.spatial_id) {
                riskDecisionMap[d.spatial_id] = d;
              }
            });
          }
        }

        if (stationsRes.status === 'fulfilled' && stationsRes.value?.data) {
          const rawStations = stationsRes.value.data;
          const mapped = rawStations.map((st, i) => {
            const dec = riskDecisionMap[st.station_id] || {};
            const risk = dec.final_risk_class || st.latest_alert_stage || 'LOW';
            const prob = dec.flood_probability !== undefined ? dec.flood_probability : 0.12;
            const stage = dec.cwc_threshold_status || st.latest_alert_stage || 'NORMAL';

            return {
              id: st.station_id || `STN-${i}`,
              name: st.station_name,
              district: st.district,
              river: st.river_name || 'River Basin',
              lat: st.latitude,
              lon: st.longitude,
              risk: risk,
              prob: prob,
              stage: stage,
            };
          });
          setStationsList(mapped);
        }

        if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
          const s = summaryRes.value.data;
          const extCount = s.risk_class_counts?.EXTREME ?? 1;
          const highCount = s.risk_class_counts?.HIGH ?? 3;
          const critAlerts = s.alert_priority_counts?.CRITICAL ?? 1;
          const warnAlerts = s.alert_priority_counts?.WARNING ?? 1;

          setSummaryData({
            activeExtreme: extCount,
            activeHigh: highCount,
            activeAlerts: critAlerts + warnAlerts,
          });
        }

        if (alertsRes.status === 'fulfilled' && alertsRes.value?.data?.alerts) {
          const rawAlerts = alertsRes.value.data.alerts;
          if (Array.isArray(rawAlerts) && rawAlerts.length > 0) {
            const topAlert = rawAlerts[0];
            const level = topAlert.final_risk_class || (topAlert.alert_priority === 'CRITICAL' ? 'EXTREME' : 'HIGH');
            setSelectedLocation({
              name: topAlert.station_name ? `${topAlert.station_name} Basin` : `${topAlert.district} Catchment`,
              lat: topAlert.latitude || 30.108,
              lon: topAlert.longitude || 78.298,
              mlProbability: topAlert.flood_probability || 0.88,
              rainfall: topAlert.rainfall_intensity_mmh > 50 ? 'CRITICAL' : topAlert.rainfall_intensity_mmh > 25 ? 'HIGH' : 'NORMAL',
              soilSaturation: topAlert.soil_saturation_pct > 80 ? 'HIGH' : 'MODERATE',
              cwcStage: topAlert.cwc_threshold_status || (level === 'EXTREME' ? 'DANGER' : 'WARNING'),
              runoff: topAlert.direct_runoff_q_mm > 30 ? 'HIGH' : 'NORMAL',
              finalRisk: level,
            });
          }
        }
      } catch (e) {
        console.warn('Dashboard live fetch error:', e);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Anime.js 4.5.0 Mount Animations
  useEffect(() => {
    if (!loading && containerRef.current) {
      animate('.kpi-card', {
        opacity: [0, 1],
        translateY: [16, 0],
        delay: stagger(70),
        duration: 450,
        easing: 'easeOutQuad',
      });
    }
  }, [loading]);

  const handleSelectLocation = (loc) => {
    setSelectedLocation({
      name: `${loc.name} (${loc.river || 'River Basin'})`,
      lat: loc.lat || 30.0668,
      lon: loc.lon || 79.0193,
      mlProbability: loc.prob || 0.85,
      rainfall: loc.prob > 0.7 ? 'CRITICAL' : loc.prob > 0.4 ? 'HIGH' : 'NORMAL',
      soilSaturation: loc.prob > 0.7 ? 'HIGH' : 'MODERATE',
      cwcStage: loc.stage || 'NORMAL',
      runoff: loc.prob > 0.4 ? 'HIGH' : 'NORMAL',
      finalRisk: loc.risk || 'LOW',
    });
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-8 w-full font-sans select-none">
      {/* 1. Primary Operational Section: 70% Map + 30% Risk Decision Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-6 w-full items-stretch min-h-[500px]">
        {/* Left 70%: Primary Risk Map */}
        <div className="flex flex-col w-full h-full min-h-[480px] lg:min-h-[520px]">
          <RiskOverviewMap
            stations={stationsList.length > 0 ? stationsList : undefined}
            onSelectLocation={handleSelectLocation}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* Right 30%: Risk Decision & Telemetry Sidebar */}
        <div className="flex flex-col gap-6 w-full h-full">
          <DecisionIntelligenceCard
            locationName={selectedLocation.name}
            mlProbability={selectedLocation.mlProbability}
            rainfallStatus={selectedLocation.rainfall}
            soilSaturationStatus={selectedLocation.soilSaturation}
            cwcStage={selectedLocation.cwcStage}
            runoffStatus={selectedLocation.runoff}
            finalRiskState={selectedLocation.finalRisk}
          />
        </div>
      </div>

      {/* 2. Metric Summary Row (3 Equal-Width Aligned Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <StatCard
          label="EXTREME"
          value={loading ? '-' : summaryData.activeExtreme}
          icon="warning"
          type="extreme"
        />
        <StatCard
          label="HIGH"
          value={loading ? '-' : summaryData.activeHigh}
          icon="trending_up"
          type="high"
        />
        <StatCard
          label="ALERTS"
          value={loading ? '-' : summaryData.activeAlerts}
          icon="notifications"
          type="alerts"
        />
      </div>

      {/* 3. Analytical Chart Row (2 Equal-Width Aligned Cards) */}
      <DashboardTrends />
    </div>
  );
}
