import React, { useState, useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import StatCard from '../components/common/StatCard';
import RiskOverviewMap from '../components/map/RiskOverviewMap';
import ActiveAlertsPanel from '../components/decision/ActiveAlertsPanel';
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
    monitoredStations: 175,
    stationsOnlineRate: '100% Online',
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

  const [activeAlerts, setActiveAlerts] = useState([]);
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

        let totalStationsCount = 175;
        if (stationsRes.status === 'fulfilled' && stationsRes.value?.data) {
          const rawStations = stationsRes.value.data;
          if (rawStations.length > 0) {
            totalStationsCount = rawStations.length;
          }

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
          const totalPoints = s.total_evaluated_points ?? totalStationsCount;
          const completeCount = s.data_quality_counts?.COMPLETE ?? 175;

          setSummaryData({
            activeExtreme: extCount,
            activeHigh: highCount,
            activeAlerts: critAlerts + warnAlerts,
            monitoredStations: totalPoints > 0 ? totalPoints : 175,
            stationsOnlineRate: '100% Online',
          });
        }

        if (alertsRes.status === 'fulfilled' && alertsRes.value?.data?.alerts) {
          const rawAlerts = alertsRes.value.data.alerts;
          if (Array.isArray(rawAlerts) && rawAlerts.length > 0) {
            const mappedAlerts = rawAlerts.map((a, i) => {
              const level = a.final_risk_class || (a.alert_priority === 'CRITICAL' ? 'EXTREME' : 'HIGH');
              const rainfall = a.rainfall_intensity_mmh > 50 ? 'CRITICAL' : a.rainfall_intensity_mmh > 25 ? 'HIGH' : 'NORMAL';
              const soilSaturation = a.soil_saturation_pct > 80 ? 'HIGH' : 'MODERATE';
              const cwcStage = a.cwc_threshold_status || (level === 'EXTREME' ? 'DANGER' : 'WARNING');
              const runoff = a.direct_runoff_q_mm > 30 ? 'HIGH' : 'NORMAL';

              return {
                id: a.alert_id || `ALT-${i}`,
                level: level,
                title: a.station_name ? `${a.station_name} Basin` : `${a.district} Catchment`,
                description: a.justification || 'Severe surface runoff risk detected.',
                time: a.timestamp_utc ? new Date(a.timestamp_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:42 AM',
                stationId: a.spatial_id,
                prob: a.flood_probability || 0.88,
                rainfall,
                soilSaturation,
                cwcStage,
                runoff,
                lat: a.latitude || 30.108,
                lon: a.longitude || 78.298,
              };
            });
            setActiveAlerts(mappedAlerts);

            const topAlert = mappedAlerts[0];
            setSelectedLocation({
              name: topAlert.title,
              lat: topAlert.lat || 30.108,
              lon: topAlert.lon || 78.298,
              mlProbability: topAlert.prob,
              rainfall: topAlert.rainfall,
              soilSaturation: topAlert.soilSaturation,
              cwcStage: topAlert.cwcStage,
              runoff: topAlert.runoff,
              finalRisk: topAlert.level,
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
      // Staggered entry animation for dashboard glass elements
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

  const handleSelectAlert = (alertItem) => {
    setSelectedLocation({
      name: alertItem.title,
      lat: alertItem.lat || 30.108,
      lon: alertItem.lon || 78.298,
      mlProbability: alertItem.prob,
      rainfall: alertItem.level === 'EXTREME' ? 'CRITICAL' : 'HIGH',
      soilSaturation: 'HIGH',
      cwcStage: alertItem.level === 'EXTREME' ? 'DANGER' : 'WARNING',
      runoff: 'HIGH',
      finalRisk: alertItem.level,
    });
  };

  const handleIssueDeploymentOrder = () => {
    alert(
      `[STATE EMERGENCY OPERATIONS CENTRE — SOP DIRECTIVE]\n\nEmergency deployment order authorized for:\n${selectedLocation.name}\n\nNotified: SDRF Battalions, District Magistrates, and CWC Regional Officers.`
    );
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-4 w-full font-sans select-none">
      {/* 1. Section 1: Hero Map-First Composition + Right Incident Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[520px]">
        {/* Left 8 Cols: Operational GIS Map */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
          <RiskOverviewMap
            stations={stationsList.length > 0 ? stationsList : undefined}
            onSelectLocation={handleSelectLocation}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* Right 4 Cols: Active Incidents & Decision Intelligence */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <ActiveAlertsPanel
            alerts={activeAlerts}
            onSelectAlert={handleSelectAlert}
          />

          <DecisionIntelligenceCard
            locationName={selectedLocation.name}
            mlProbability={selectedLocation.mlProbability}
            rainfallStatus={selectedLocation.rainfall}
            soilSaturationStatus={selectedLocation.soilSaturation}
            cwcStage={selectedLocation.cwcStage}
            runoffStatus={selectedLocation.runoff}
            finalRiskState={selectedLocation.finalRisk}
            onIssueOrder={handleIssueDeploymentOrder}
          />
        </div>
      </div>

      {/* 2. KPI Strip (4 Compact Glass Blocks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="EXTREME"
          value={summaryData.activeExtreme}
          icon="warning"
          type="extreme"
        />
        <StatCard
          label="HIGH"
          value={summaryData.activeHigh}
          icon="trending_up"
          type="high"
        />
        <StatCard
          label="ALERTS"
          value={summaryData.activeAlerts}
          icon="notifications"
          type="alerts"
        />
        <StatCard
          label="STATIONS"
          value={summaryData.monitoredStations}
          icon="sensors"
          type="stations"
        />
      </div>

      {/* 3. Section 2: Secondary Intelligence (Risk Trend Charts) */}
      <DashboardTrends />
    </div>
  );
}
