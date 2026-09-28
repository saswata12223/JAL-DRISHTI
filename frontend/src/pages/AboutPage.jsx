import React, { useEffect } from 'react';
import ResourcesSection from '../components/about/ResourcesSection';

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-slate-800 font-sans mt-16 pb-12 pt-10 px-6 sm:px-10 lg:px-16 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-16">
        
        {/* SECTION 1 - HERO */}
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-12">
          <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#0F4C81] uppercase">About</span>
          <h1 className="text-4xl md:text-5xl font-black text-[#0A2540] tracking-tight leading-tight">
            Understanding Jal Drishti
          </h1>
          <h2 className="text-lg md:text-xl font-medium text-slate-600 max-w-3xl leading-relaxed mt-2">
            An integrated hydrological intelligence platform for flash-flood risk monitoring and decision support in mountainous terrain.
          </h2>
          <p className="text-sm md:text-[15px] text-slate-500 max-w-4xl leading-relaxed mt-4">
            Jal Drishti brings together rainfall, soil moisture, terrain, weather, hydrological observations and predictive modelling into a common geospatial decision-support environment.
          </p>
        </section>

        {/* SECTION 2 - THE CHALLENGE */}
        <section className="flex flex-col gap-8">
          <h2 className="text-2xl font-bold text-[#0A2540] tracking-tight">Why Flash Flood Risk Is Difficult in the Himalayas</h2>
          <p className="text-[15px] text-slate-600 max-w-4xl leading-relaxed">
            Mountainous terrain creates complex hydrological conditions where intense rainfall, steep slopes, drainage characteristics, soil wetness and river response can interact over short time periods. The system therefore cannot rely on a single rainfall number or a single sensor.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded bg-[#0F4C81]/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#0F4C81]">rainy</span>
              </div>
              <h3 className="font-bold text-[#0A2540] mb-2">Intense Rainfall</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Short-duration rainfall can rapidly increase runoff.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded bg-[#0F4C81]/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#0F4C81]">terrain</span>
              </div>
              <h3 className="font-bold text-[#0A2540] mb-2">Mountain Terrain</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Slope, elevation and drainage structure influence runoff concentration.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded bg-[#0F4C81]/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#0F4C81]">water_drop</span>
              </div>
              <h3 className="font-bold text-[#0A2540] mb-2">Wet Catchments</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Pre-existing soil moisture affects how much additional rainfall becomes runoff.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded bg-[#0F4C81]/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#0F4C81]">timer</span>
              </div>
              <h3 className="font-bold text-[#0A2540] mb-2">Rapid Response</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Conditions can evolve quickly, requiring timely situational awareness.</p>
            </div>
          </div>
        </section>

        {/* SECTION 2.5 - ARCHITECTURE & SCOPE */}
        <section className="flex flex-col gap-8 bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-[#0A2540] tracking-tight">Geographic Scope & Platform Architecture</h2>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Jal Drishti operates on a layered architecture that differentiates between broad geographic awareness and localized intelligence. While the platform's mapping engine spans the entirety of India, its advanced capabilities are selectively activated based on verified data provenance.
              </p>
            </div>
            <div className="w-full md:w-auto bg-white p-4 border border-slate-200 rounded-xl shadow-sm shrink-0">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-indigo-500">map</span>
                  <div>
                    <div className="text-sm font-bold text-slate-700">Pan-India Coverage</div>
                    <div className="text-[11px] text-slate-500">Administrative Boundaries & GIS</div>
                  </div>
                </div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-500">crisis_alert</span>
                  <div>
                    <div className="text-sm font-bold text-slate-700">Dynamic Risk Zones</div>
                    <div className="text-[11px] text-slate-500">Predictive Modeling & Live Telemetry</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div className="bg-white border-l-4 border-l-indigo-400 p-5 rounded-r-lg shadow-sm">
              <h3 className="font-bold text-slate-700 text-sm mb-2">GIS Context Layer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The platform includes canonical administrative boundaries (State, District, Subdistrict) for all of India, sourced from the Survey of India. This allows users anywhere to navigate and search the map framework.
              </p>
            </div>
            <div className="bg-white border-l-4 border-l-emerald-400 p-5 rounded-r-lg shadow-sm">
              <h3 className="font-bold text-slate-700 text-sm mb-2">Predictive & Live Layer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live gauge telemetry and predictive hydrological analytics are dynamically bounded to regions with verified sensor coverage. The system prioritizes data honesty: it will not fabricate charts or risk metrics for uncalibrated regions.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3 - WHAT JAL DRISHTI DOES */}
        <section className="flex flex-col gap-8 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#0A2540] tracking-tight">From Observations to Risk Intelligence</h2>
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-2 items-center justify-between">
            {/* Box 1 */}
            <div className="flex flex-col items-center gap-3 text-center flex-1 w-full lg:w-auto">
              <div className="w-12 h-12 rounded-xl bg-[#0F4C81] text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[24px]">database</span>
              </div>
              <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">Data</h3>
              <ul className="text-[11px] text-slate-500 flex flex-col gap-1 items-center">
                <li>Rainfall</li>
                <li>Soil moisture</li>
                <li>Weather</li>
                <li>Terrain</li>
                <li>River observations</li>
                <li>Historical events</li>
                <li>Sensor telemetry</li>
              </ul>
            </div>
            
            <span className="material-symbols-outlined text-slate-300 transform rotate-90 lg:rotate-0">arrow_forward</span>

            {/* Box 2 */}
            <div className="flex flex-col items-center gap-3 text-center flex-1 w-full lg:w-auto">
              <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[24px]">memory</span>
              </div>
              <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">Processing</h3>
              <p className="text-[11px] text-slate-500 max-w-[150px]">Data validation, spatial alignment, temporal aggregation and feature generation.</p>
            </div>

            <span className="material-symbols-outlined text-slate-300 transform rotate-90 lg:rotate-0">arrow_forward</span>

            {/* Box 3 */}
            <div className="flex flex-col items-center gap-3 text-center flex-1 w-full lg:w-auto">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[24px]">model_training</span>
              </div>
              <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">Modelling</h3>
              <p className="text-[11px] text-slate-500 max-w-[150px]">Operational and physics-informed indicators are evaluated together.</p>
            </div>

            <span className="material-symbols-outlined text-slate-300 transform rotate-90 lg:rotate-0">arrow_forward</span>

            {/* Box 4 */}
            <div className="flex flex-col items-center gap-3 text-center flex-1 w-full lg:w-auto">
              <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[24px]">analytics</span>
              </div>
              <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">Risk Assessment</h3>
              <p className="text-[11px] text-slate-500 max-w-[150px]">Risk indicators are combined into an interpretable risk classification.</p>
            </div>

            <span className="material-symbols-outlined text-slate-300 transform rotate-90 lg:rotate-0">arrow_forward</span>

            {/* Box 5 */}
            <div className="flex flex-col items-center gap-3 text-center flex-1 w-full lg:w-auto">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[24px]">dashboard</span>
              </div>
              <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">Decision Support</h3>
              <p className="text-[11px] text-slate-500 max-w-[150px]">Maps, trends, alerts and operational views help users investigate changing conditions.</p>
            </div>

          </div>
          <div className="mt-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium text-center">
              <span className="font-bold text-slate-700">Note:</span> The interface distinguishes between LIVE, RECENT, HISTORICAL, and UNAVAILABLE data where appropriate, as not every source is always available in real time.
            </p>
          </div>
        </section>

        {/* SECTION 4 - MULTI-SOURCE DATA */}
        <section className="flex flex-col gap-8">
          <h2 className="text-2xl font-bold text-[#0A2540] tracking-tight">Built Around Multiple Evidence Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-slate-400">satellite_alt</span>
                <h3 className="font-bold text-[#0A2540] text-sm leading-tight">NASA GPM IMERG</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 flex-1">Satellite-based precipitation estimates providing frequent rainfall information at approximately 0.1° spatial spacing and 30-minute temporal resolution.</p>
              <div className="text-[10px] uppercase font-bold text-slate-400">Source: NASA Global Precipitation Measurement Mission</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-slate-400">water_drop</span>
                <h3 className="font-bold text-[#0A2540] text-sm leading-tight">NASA SMAP</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 flex-1">SMAP Level-4 soil-moisture products provide surface and root-zone soil-moisture information at 9 km spatial resolution with 3-hour temporal resolution.</p>
              <div className="text-[10px] uppercase font-bold text-slate-400">Source: NASA / NSIDC</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-slate-400">air</span>
                <h3 className="font-bold text-[#0A2540] text-sm leading-tight">NOAA GFS</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 flex-1">Numerical weather prediction data used as broader-scale atmospheric and precipitation forecast forcing.</p>
              <div className="text-[10px] uppercase font-bold text-slate-400">Source: NOAA</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-slate-400">waves</span>
                <h3 className="font-bold text-[#0A2540] text-sm leading-tight">Central Water Commission</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 flex-1">River and hydrological observations and flood-forecast information where accessible and available to the system.</p>
              <div className="text-[10px] uppercase font-bold text-slate-400">Source: CWC</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-slate-400">terrain</span>
                <h3 className="font-bold text-[#0A2540] text-sm leading-tight">Terrain / Elevation Data</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 flex-1">Digital elevation and terrain-derived information used to represent elevation, slope, drainage and other terrain characteristics.</p>
              <div className="text-[10px] uppercase font-bold text-slate-400">Source: Various / Digital Elevation Models</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-slate-400">landslide</span>
                <h3 className="font-bold text-[#0A2540] text-sm leading-tight">Geological / Landslide Info</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 flex-1">Geological and landslide information can provide additional context for terrain-related hazards and rainfall-triggered slope instability.</p>
              <div className="text-[10px] uppercase font-bold text-slate-400">Source: Geological Survey of India / Bhusanket</div>
            </div>
          </div>
        </section>

        {/* SECTION 5 - HOW RISK IS ASSESSED */}
        <section className="flex flex-col gap-8 bg-[#0A2540] text-white border border-slate-700 rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-bold tracking-tight">How the Risk Assessment Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0F2942] border border-slate-700 rounded-xl p-5">
              <h3 className="font-bold text-cyan-300 text-sm mb-2">1. Data-Driven Model</h3>
              <p className="text-xs text-slate-300">Machine-learning models analyse relationships between environmental and hydrological predictors and historical event information.</p>
            </div>
            <div className="bg-[#0F2942] border border-slate-700 rounded-xl p-5">
              <h3 className="font-bold text-cyan-300 text-sm mb-2">2. Physics-Based Indicators</h3>
              <p className="text-xs text-slate-300">Hydrological indicators such as rainfall accumulation and runoff potential provide physically interpretable signals.</p>
            </div>
            <div className="bg-[#0F2942] border border-slate-700 rounded-xl p-5">
              <h3 className="font-bold text-cyan-300 text-sm mb-2">3. Geospatial Context</h3>
              <p className="text-xs text-slate-300">Terrain, drainage and location characteristics help place environmental conditions in their geographic context.</p>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 opacity-80">Combined Evidence → Risk Level</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <div className="px-4 py-2 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-wide">LOW</div>
              <div className="px-4 py-2 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold tracking-wide">MODERATE</div>
              <div className="px-4 py-2 rounded border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold tracking-wide">HIGH</div>
              <div className="px-4 py-2 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold tracking-wide">EXTREME</div>
            </div>
            <p className="text-[11px] text-slate-400 mt-6 text-center max-w-2xl border-t border-slate-700 pt-4">
              <span className="text-white font-bold">Important:</span> These labels are Jal Drishti system classifications, NOT official government warnings unless explicitly sourced from an official warning system. 
            </p>
          </div>
        </section>

        {/* SECTION 6 - HUMAN-IN-THE-LOOP */}
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-[#0A2540] tracking-tight">Decision Support, Not Decision Replacement</h2>
          <p className="text-[15px] text-slate-600 max-w-4xl leading-relaxed">
            Jal Drishti is designed to support trained disaster-management personnel by bringing multiple information sources into a common operational view. Model outputs should be interpreted alongside official warnings, field observations and responsible-authority decisions.
          </p>
          
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
            <div className="min-w-[700px] flex items-center justify-between text-center gap-2">
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm font-bold text-xs text-slate-700">Data</div>
              <span className="material-symbols-outlined text-slate-400 text-sm">add</span>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm font-bold text-xs text-slate-700">Model</div>
              <span className="material-symbols-outlined text-slate-400 text-sm">add</span>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm font-bold text-xs text-slate-700">Official Information</div>
              <span className="material-symbols-outlined text-slate-400 text-sm">add</span>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm font-bold text-xs text-slate-700">Field Observation</div>
              <span className="material-symbols-outlined text-[#0F4C81] text-lg font-bold mx-2">arrow_forward</span>
              <div className="px-6 py-4 bg-[#0F4C81] border border-[#0F4C81] rounded-lg shadow-md font-black text-sm text-white uppercase tracking-wider">Human Decision</div>
            </div>
          </div>
        </section>

        {/* SECTION 7 - PLATFORM CAPABILITIES */}
        <section className="flex flex-col gap-8">
          <h2 className="text-2xl font-bold text-[#0A2540] tracking-tight">Platform Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
              <div className="text-slate-300 font-black text-xl leading-none">01</div>
              <div>
                <h3 className="font-bold text-[#0A2540] text-sm mb-1">Risk Mapping</h3>
                <p className="text-xs text-slate-600">Spatial visualization of model-derived risk indicators.</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
              <div className="text-slate-300 font-black text-xl leading-none">02</div>
              <div>
                <h3 className="font-bold text-[#0A2540] text-sm mb-1">Live Monitoring</h3>
                <p className="text-xs text-slate-600">Monitoring of available environmental and hydrological observations.</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
              <div className="text-slate-300 font-black text-xl leading-none">03</div>
              <div>
                <h3 className="font-bold text-[#0A2540] text-sm mb-1">Forecast Intelligence</h3>
                <p className="text-xs text-slate-600">Use of available forecast information to assess upcoming conditions.</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
              <div className="text-slate-300 font-black text-xl leading-none">04</div>
              <div>
                <h3 className="font-bold text-[#0A2540] text-sm mb-1">Historical Events</h3>
                <p className="text-xs text-slate-600">Reference catalogue of documented historical disaster events.</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
              <div className="text-slate-300 font-black text-xl leading-none">05</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#0A2540] text-sm">Flood Simulation</h3>
                  <span className="text-[9px] font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded uppercase tracking-wider">Prototype</span>
                </div>
                <p className="text-xs text-slate-600">Scenario-based visualization where the simulation module is available.</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
              <div className="text-slate-300 font-black text-xl leading-none">06</div>
              <div>
                <h3 className="font-bold text-[#0A2540] text-sm mb-1">Alerts & Actions</h3>
                <p className="text-xs text-slate-600">Operational presentation of risk conditions and associated response workflows.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8 - DATA TRANSPARENCY */}
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-[#0A2540] tracking-tight">Data Transparency</h2>
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left bg-white text-sm">
              <thead className="bg-[#0F4C81] text-white">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold tracking-wider uppercase border-r border-[#0B3B66]">Data Type</th>
                  <th className="px-5 py-3 text-xs font-bold tracking-wider uppercase border-r border-[#0B3B66]">Role</th>
                  <th className="px-5 py-3 text-xs font-bold tracking-wider uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-[#0A2540] border-r border-slate-100">Satellite precipitation</td>
                  <td className="px-5 py-3 border-r border-slate-100 text-xs">Rainfall monitoring</td>
                  <td className="px-5 py-3 text-xs font-medium text-emerald-600"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Operational / Available</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                  <td className="px-5 py-3 font-semibold text-[#0A2540] border-r border-slate-100">Soil moisture</td>
                  <td className="px-5 py-3 border-r border-slate-100 text-xs">Catchment wetness</td>
                  <td className="px-5 py-3 text-xs font-medium text-amber-600"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Available with freshness limitations</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-[#0A2540] border-r border-slate-100">Weather forecast</td>
                  <td className="px-5 py-3 border-r border-slate-100 text-xs">Forecast forcing</td>
                  <td className="px-5 py-3 text-xs font-medium text-emerald-600"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Operational</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                  <td className="px-5 py-3 font-semibold text-[#0A2540] border-r border-slate-100">River observations</td>
                  <td className="px-5 py-3 border-r border-slate-100 text-xs">Hydrological context</td>
                  <td className="px-5 py-3 text-xs font-medium text-slate-500"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Source-dependent</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-[#0A2540] border-r border-slate-100">Terrain</td>
                  <td className="px-5 py-3 border-r border-slate-100 text-xs">Static geographic context</td>
                  <td className="px-5 py-3 text-xs font-medium text-slate-500"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Cached / Static</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                  <td className="px-5 py-3 font-semibold text-[#0A2540] border-r border-slate-100">Historical events</td>
                  <td className="px-5 py-3 border-r border-slate-100 text-xs">Model development / evaluation</td>
                  <td className="px-5 py-3 text-xs font-medium text-slate-500"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Historical</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-[#0A2540] border-r border-slate-100">Sensor telemetry</td>
                  <td className="px-5 py-3 border-r border-slate-100 text-xs">Local observations</td>
                  <td className="px-5 py-3 text-xs font-medium text-slate-500"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Deployment-dependent</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 9 - LIMITATIONS */}
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-[#0A2540] tracking-tight">Current Limitations</h2>
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 shadow-sm">
            <ul className="list-disc pl-5 space-y-3 text-[13px] text-slate-700 font-medium">
              <li>Satellite precipitation is spatially coarser than local rain-gauge measurements.</li>
              <li>Mountain terrain can produce highly localized rainfall and runoff behaviour.</li>
              <li>Some external datasets have latency or access restrictions.</li>
              <li>Historical flash-flood event labels are limited compared with ordinary non-event observations.</li>
              <li>Model performance depends on the quality, coverage and representativeness of training data.</li>
              <li>Risk estimates should not be interpreted as guaranteed flood occurrence.</li>
              <li>Official warnings and field information remain essential for operational decisions.</li>
            </ul>
          </div>
        </section>

        {/* SECTION 10 & 11 - STATUS & CONTEXT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="flex flex-col gap-4 bg-slate-100 border border-slate-200 rounded-xl p-6">
            <h2 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Prototype & Research Status</h2>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              Jal Drishti is being developed as a prototype research and decision-support system for the Uttarakhand flash-flood risk management use case.
            </p>
          </section>

          <section className="flex flex-col gap-4 bg-[#0F4C81]/5 border border-[#0F4C81]/10 rounded-xl p-6 h-full">
            <h2 className="text-[11px] font-bold text-[#0F4C81] tracking-wider uppercase">Disaster Management Context</h2>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              Uttarakhand State Disaster Management Authority is responsible for disaster-management policy, planning, coordination and monitoring activities within the state.
            </p>
            <a 
              href="https://usdma.uk.gov.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-auto pt-2 flex items-center gap-1.5 text-xs font-bold text-[#0F4C81] hover:text-cyan-700 transition-colors w-fit focus:outline-none focus:underline"
              aria-label="Visit Uttarakhand State Disaster Management Authority in a new tab"
            >
              Visit Uttarakhand State Disaster Management Authority <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </section>
        </div>

        {/* SECTION 11.5 - RESOURCES */}
        <ResourcesSection />

        {/* SECTION 12 - ABOUT FOOTER */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200 pt-8 mt-4 pb-4">
          <div className="flex flex-col items-start gap-1">
            <span className="font-black text-lg text-[#0A2540]">Jal Drishti</span>
            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest">Hydrological Intelligence System</span>
            <span className="text-xs text-slate-500 mt-2 font-medium">Multi-source hydrological intelligence for informed flash-flood risk assessment.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500">
            <a href="/dashboard" className="hover:text-[#0F4C81] transition-colors focus:outline-none focus:underline">Dashboard</a>
            <a href="/dashboard" className="hover:text-[#0F4C81] transition-colors focus:outline-none focus:underline">Risk Map</a>
            <a href="/live-forecast" className="hover:text-[#0F4C81] transition-colors focus:outline-none focus:underline">Live Forecast</a>
            <a href="/monitoring" className="hover:text-[#0F4C81] transition-colors focus:outline-none focus:underline">Monitoring</a>
            <a href="https://usdma.uk.gov.in/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#0F4C81] transition-colors focus:outline-none focus:underline">Official USDMA <span className="material-symbols-outlined text-[10px]">open_in_new</span></a>
          </div>
        </section>

      </div>
    </div>
  );
}
