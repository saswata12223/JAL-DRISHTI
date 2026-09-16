import React, { useState, useEffect, useMemo } from 'react';

const RESOURCES = [
  {
    id: 1,
    title: 'Uttarakhand State Disaster Management Authority (USDMA)',
    description: 'Official state authority responsible for disaster-management planning, coordination, preparedness, mitigation and monitoring in Uttarakhand.',
    category: 'Government',
    type: 'Official Government',
    icon: 'account_balance',
    links: [
      { label: 'Visit USDMA', url: 'https://usdma.uk.gov.in/' },
      { label: 'USDMA Documents', url: 'https://usdma.uk.gov.in/documents/' }
    ]
  },
  {
    id: 2,
    title: 'National Disaster Management Authority (NDMA)',
    description: 'National-level disaster-management resources, guidance and early-warning information.',
    category: 'Government',
    type: 'Official Government',
    icon: 'account_balance',
    links: [
      { label: 'Visit NDMA', url: 'https://ndma.gov.in/' }
    ]
  },
  {
    id: 3,
    title: 'SACHET — National Disaster Alert Portal',
    description: 'National disaster alert platform providing geo-targeted alerts and information through multiple communication channels.',
    category: 'Government',
    type: 'Official Government',
    icon: 'campaign',
    links: [
      { label: 'Visit SACHET', url: 'https://sachet.ndma.gov.in/' }
    ]
  },
  {
    id: 4,
    title: 'Central Water Commission (CWC)',
    description: 'Official hydrological information and flood-forecasting resources including river observations and flood-forecasting information.',
    category: 'Hydrology',
    type: 'Official Government',
    icon: 'waves',
    links: [
      { label: 'Visit CWC', url: 'https://cwc.gov.in/' },
      { label: 'Flood Forecasting & Warning Resources', url: 'https://cwc.gov.in/' }
    ]
  },
  {
    id: 5,
    title: 'NASA GPM IMERG',
    description: 'Satellite precipitation product providing rainfall estimates at approximately 0.1° spatial spacing and 30-minute temporal resolution.',
    category: 'Satellite',
    type: 'Official NASA',
    icon: 'satellite_alt',
    links: [
      { label: 'NASA GPM IMERG Documentation', url: 'https://gpm.nasa.gov/data/imerg' },
      { label: 'NASA GPM Data Directory', url: 'https://gpm.nasa.gov/data/directory' }
    ]
  },
  {
    id: 6,
    title: 'NASA SMAP',
    description: 'SMAP L4 Global 3-hourly 9 km Surface and Root Zone Soil Moisture — Version 8',
    category: 'Satellite',
    type: 'Official NASA',
    icon: 'water_drop',
    links: [
      { label: 'Visit Source', url: 'https://nsidc.org/data/spl4smgp/versions/8' }
    ]
  },
  {
    id: 7,
    title: 'NOAA Global Forecast System (GFS)',
    description: 'Global numerical weather prediction system providing atmospheric and land-surface forecast variables used for broader-scale forecast context.',
    category: 'Weather',
    type: 'Official NOAA',
    icon: 'air',
    links: [
      { label: 'NOAA GFS Documentation', url: 'https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast' }
    ]
  },
  {
    id: 8,
    title: 'Digital Elevation & Terrain Data',
    description: 'Elevation and terrain-derived information provides geographic context for slope, drainage and runoff-related analysis.',
    category: 'Terrain',
    type: 'Technical Documentation',
    icon: 'terrain',
    links: [
      { label: 'Documentation Unavailable', url: '#' }
    ]
  },
  {
    id: 9,
    title: 'Geological Survey of India — Bhusanket',
    description: 'Official geological and landslide information resources, including landslide inventory and reporting resources.',
    category: 'Geology',
    type: 'Official Government',
    icon: 'landslide',
    links: [
      { label: 'Visit Bhusanket', url: 'https://bhusanket.gsi.gov.in/' },
      { label: 'National Landslide Forecasting Centre', url: 'https://bhusanket.gsi.gov.in/about.html' }
    ]
  },
  {
    id: 10,
    title: 'Jal Drishti Technical Documentation',
    description: 'System Architecture, Data Pipeline, Model Methodology, Data Dictionary, API Documentation, and Known Limitations.',
    category: 'Technical',
    type: 'Project Documentation',
    icon: 'menu_book',
    links: [
      { label: 'Technical documentation is being prepared', url: '#' }
    ]
  }
];

const FILTERS = ['All', 'Government', 'Hydrology', 'Weather', 'Satellite', 'Terrain', 'Geology', 'Technical'];

export default function ResourcesPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredResources = useMemo(() => {
    return RESOURCES.filter(resource => {
      const matchesFilter = activeFilter === 'All' || resource.category === activeFilter;
      const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            resource.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-slate-800 font-sans mt-16 pb-12 pt-10 px-6 sm:px-10 lg:px-16 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        
        {/* HERO */}
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-10">
          <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#0F4C81] uppercase">Knowledge Centre</span>
          <h1 className="text-4xl md:text-5xl font-black text-[#0A2540] tracking-tight leading-tight">
            Resources
          </h1>
          <h2 className="text-lg md:text-xl font-medium text-slate-600 max-w-3xl leading-relaxed mt-2">
            Official data sources, disaster-management references and technical documentation used to understand and develop the Jal Drishti system.
          </h2>
        </section>

        {/* SEARCH & FILTER */}
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Search resources..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${activeFilter === filter ? 'bg-[#0F4C81] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        {/* RESOURCE GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px] items-start">
          {filteredResources.length > 0 ? (
            filteredResources.map(resource => (
              <div key={resource.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded bg-[#0F4C81]/10 flex items-center justify-center text-[#0F4C81]">
                    <span className="material-symbols-outlined">{resource.icon}</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    resource.type.includes('Government') ? 'bg-cyan-50 text-cyan-700' :
                    resource.type.includes('NASA') || resource.type.includes('NOAA') ? 'bg-indigo-50 text-indigo-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {resource.type}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0A2540] mb-2 leading-tight group-hover:text-[#0F4C81] transition-colors">{resource.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6 flex-1">{resource.description}</p>
                
                <div className="flex flex-col gap-2 mt-auto">
                  {resource.links.map((link, idx) => (
                    link.url !== '#' ? (
                      <a 
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-[#0F4C81]/5 border border-slate-100 rounded-lg text-xs font-bold text-[#0F4C81] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                        aria-label={`${link.label} (opens in new tab)`}
                      >
                        {link.label}
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    ) : (
                      <div key={idx} className="flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-400 italic cursor-not-allowed">
                        {link.label}
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-4 opacity-50">search_off</span>
              <p className="text-sm">No resources found matching your search or filter.</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
                className="mt-4 text-xs font-bold text-[#0F4C81] hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>

        {/* SOURCE CITATION */}
        <section className="mt-8 border-t border-slate-200 pt-8 pb-8">
          <h3 className="text-sm font-bold text-[#0A2540] mb-3 tracking-tight">Source & Attribution</h3>
          <p className="text-[12px] text-slate-500 leading-relaxed max-w-4xl mb-6">
            Jal Drishti uses or references publicly documented information from government agencies and scientific data providers. Dataset availability, latency, licensing and access requirements may vary by source.
          </p>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left bg-white text-[11px]">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold tracking-wider uppercase border-r border-slate-200">Provider</th>
                  <th className="px-4 py-3 font-bold tracking-wider uppercase border-r border-slate-200">Dataset / Resource</th>
                  <th className="px-4 py-3 font-bold tracking-wider uppercase border-r border-slate-200">Purpose</th>
                  <th className="px-4 py-3 font-bold tracking-wider uppercase">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 border-r border-slate-100">NASA</td>
                  <td className="px-4 py-3 border-r border-slate-100">GPM IMERG</td>
                  <td className="px-4 py-3 border-r border-slate-100">Precipitation estimates</td>
                  <td className="px-4 py-3"><a href="https://gpm.nasa.gov/data/imerg" target="_blank" rel="noopener noreferrer" className="text-[#0F4C81] hover:underline">Link</a></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 border-r border-slate-100">NASA / NSIDC</td>
                  <td className="px-4 py-3 border-r border-slate-100">SMAP L4 Version 8</td>
                  <td className="px-4 py-3 border-r border-slate-100">Soil moisture representation</td>
                  <td className="px-4 py-3"><a href="https://nsidc.org/data/spl4smgp/versions/8" target="_blank" rel="noopener noreferrer" className="text-[#0F4C81] hover:underline">Link</a></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 border-r border-slate-100">NOAA</td>
                  <td className="px-4 py-3 border-r border-slate-100">Global Forecast System (GFS)</td>
                  <td className="px-4 py-3 border-r border-slate-100">Meteorological forcing</td>
                  <td className="px-4 py-3"><a href="https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast" target="_blank" rel="noopener noreferrer" className="text-[#0F4C81] hover:underline">Link</a></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 border-r border-slate-100">Government of Uttarakhand</td>
                  <td className="px-4 py-3 border-r border-slate-100">USDMA Documentation</td>
                  <td className="px-4 py-3 border-r border-slate-100">Disaster Management Guidelines</td>
                  <td className="px-4 py-3"><a href="https://usdma.uk.gov.in/documents/" target="_blank" rel="noopener noreferrer" className="text-[#0F4C81] hover:underline">Link</a></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 border-r border-slate-100">Geological Survey of India</td>
                  <td className="px-4 py-3 border-r border-slate-100">Bhusanket</td>
                  <td className="px-4 py-3 border-r border-slate-100">Geological context</td>
                  <td className="px-4 py-3"><a href="https://bhusanket.gsi.gov.in/" target="_blank" rel="noopener noreferrer" className="text-[#0F4C81] hover:underline">Link</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
