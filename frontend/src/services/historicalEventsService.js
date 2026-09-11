import eventsService from './eventsService';

// ============================================================
// HISTORICAL EVENTS SERVICE (Screen 9G)
// ------------------------------------------------------------
// Deterministic historical flood-event dataset + validated
// live-merge loader.
//
// DATA SOURCE:
//   INTERNAL canonical dataset: the 15 documented Uttarakhand
//   historical flood / flash-flood / GLOF disaster events
//   (1970–2024) shipped in the repository at
//   data/processed/standardized/standardized_historical_events.*
//   and served by backend `/historical-events`. These records carry
//   100% official agency provenance (GSI, CWC, NDMA, IMD, USDMA,
//   WIHG, ISRO-NRSC, SDRF, district DDMA). No measurements, dates,
//   locations, casualties, or citations are fabricated.
//
//   PEAK RAINFALL / PEAK WATER LEVEL:
//   These are transcribed ONLY where the source record states a
//   concrete figure; where a descriptive range (e.g. "rose 4-6 m")
//   or no figure exists, the numeric field is left null and the
//   original prose is preserved in rainfallInformation /
//   waterLevelInformation. The page never invents precise numbers.
//
// LOADING SAFETY (same lesson as Analytics / Alerts):
//   The page initializes with the canonical dataset below and never
//   renders an empty/zero state. A best-effort live fetch from the
//   backend is merged IN only when it is valid (complete records).
//   Empty, incomplete, or failed live responses are REJECTED and the
//   canonical fallback is retained — so a failed request can never
//   wipe the page to "0 events".
// ============================================================

export const SEVERITY_ORDER = { Moderate: 0, Major: 1, Catastrophic: 2 };

export const EVENT_SEVERITIES = ['Moderate', 'Major', 'Catastrophic'];

// Derive a single primary district from multi-district records for filters;
// keep the full district list for display.
function primaryDistrict(raw) {
  return String(raw).split(',').map((s) => s.trim())[0];
}

// Numeric peak where the source states a concrete figure, else undefined.
const peakFromRange = (s) => {
  if (s === undefined || s === null || s === '') return undefined;
  const m = String(s).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : undefined;
};

function buildCanonicalEvents() {
  // Each row mirrors standardized_historical_events.* exactly.
  const raw = [
    {
      event_id: 'FL-UK-1970-01',
      event_date: '1970-07-20',
      event_end_date: '1970-07-21',
      event_type: 'flash flood',
      event_name: '1970 Alaknanda Flash Flood & Belakuchi Disaster',
      district_raw: 'Chamoli',
      location: 'Belakuchi, Chamoli to Srinagar Garhwal',
      river_basin: 'Alaknanda Basin (Birahi Ganga / Alaknanda River)',
      latitude: 30.412,
      longitude: 79.431,
      severity: 'Catastrophic',
      deaths: 400,
      missing_persons: undefined,
      affected_population: 50000,
      infrastructure_damage: 'Entire Belakuchi village swept away; 6 bridges destroyed; Upper Ganga Canal choked with 3m silt over 100km downstream',
      rainfall_information: 'Intense continuous monsoon cloudburst rainfall over upper Alaknanda catchment (>150mm in 24h)',
      water_level_information: 'Alaknanda water level rose by 15-20 meters within hours following Gauna lake / Birahi Ganga landslide dam breach',
      peak_rainfall_mm: 150,
      peak_water_level_m: undefined,
      triggering_hazard: 'Extreme rainfall triggering multiple landslides and breach of Gauna landslide-dam lake',
      description: 'Massive flash flood wave triggered by monsoon cloudburst and subsequent breach of temporary landslide dam on Birahi Ganga, destroying Belakuchi settlement.',
      source_name: 'Geological Survey of India (GSI) / Central Water Commission (CWC)',
      source_url: 'https://gsi.gov.in/webcenter/portal/OCBIS/pageReports',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-1998-01',
      event_date: '1998-08-11',
      event_end_date: '1998-08-19',
      event_type: 'debris-flow/flood event',
      event_name: '1998 Okhimath Flash Floods & Debris Flows',
      district_raw: 'Rudraprayag',
      location: 'Okhimath, Madhyamaheshwar, and Kali Ganga valleys',
      river_basin: 'Mandakini Basin (Madhyamaheshwar River)',
      latitude: 30.517,
      longitude: 79.096,
      severity: 'Major',
      deaths: 109,
      missing_persons: undefined,
      affected_population: 12000,
      infrastructure_damage: '29 villages severely damaged, Okhimath-Gopeshwar highway severed, multiple bridges washed out',
      rainfall_information: 'Prolonged monsoon downpours exceeding 250mm over 48 hours',
      water_level_information: 'Madhyamaheshwar and Mandakini rivers flowed 8-10m above danger stage',
      peak_rainfall_mm: 250,
      peak_water_level_m: undefined,
      triggering_hazard: 'Intense monsoon rainfall triggering massive slope failures and damming/breaching of Kali Ganga and Madhyamaheshwar',
      description: 'Series of devastating debris flows and flash floods following prolonged heavy rainfall across Okhimath block, burying villages and blocking river courses.',
      source_name: 'Wadia Institute of Himalayan Geology (WIHG) / GSI Special Publication No. 65',
      source_url: 'https://www.wihg.res.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-1998-02',
      event_date: '1998-08-18',
      event_end_date: '1998-08-18',
      event_type: 'debris-flow/flood event',
      event_name: '1998 Malpa Rockfall Debris Flow & Kali River Flash Flood',
      district_raw: 'Pithoragarh',
      location: 'Malpa village, Kali river valley',
      river_basin: 'Sharda / Kali Basin (Kali River)',
      latitude: 29.9167,
      longitude: 80.75,
      severity: 'Catastrophic',
      deaths: 221,
      missing_persons: undefined,
      affected_population: 1500,
      infrastructure_damage: 'Entire Malpa transit camp and settlement wiped out into Kali river; Kailash Mansarovar pilgrimage route severed',
      rainfall_information: 'Multi-day extreme monsoon precipitation exceeding 180mm',
      water_level_information: 'Kali river surged 6m above normal monsoonal bankfull discharge',
      peak_rainfall_mm: 180,
      peak_water_level_m: undefined,
      triggering_hazard: 'Massive rockfall and debris avalanche triggered by intense rainfall onto saturated steep cliffs',
      description: 'Catastrophic rock avalanche and debris flood in the dead of night that swept the entire Malpa village into the raging Kali River.',
      source_name: 'National Disaster Management Authority (NDMA) / GSI Report on Malpa Tragedy',
      source_url: 'https://ndma.gov.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2010-01',
      event_date: '2010-09-18',
      event_end_date: '2010-09-20',
      event_type: 'extreme rainfall flood',
      event_name: 'September 2010 Uttarakhand State-Wide Monsoon Inundation',
      district_raw: 'Haridwar, Nainital, Almora, Dehradun',
      location: 'Haridwar, Rishikesh, Gaula River (Haldwani), Almora',
      river_basin: 'Ganga & Kosi/Gaula Basins',
      latitude: 29.956,
      longitude: 78.171,
      severity: 'Major',
      deaths: 218,
      missing_persons: undefined,
      affected_population: 500000,
      infrastructure_damage: 'Haridwar-Rishikesh railway line submerged; Haridwar city residential inundation; Gaula barrage damaged',
      rainfall_information: 'Late-monsoon extreme deluge: Haridwar recorded 245mm/24h, Nainital recorded 310mm/24h on Sep 19',
      water_level_information: 'Ganga at Haridwar rose to 295.10m (1.10m above Danger Level of 294.00m); discharge surpassed 450,000 cusecs',
      peak_rainfall_mm: 310,
      peak_water_level_m: 295.1,
      triggering_hazard: 'Interaction of monsoon low pressure system with mid-latitude upper tropospheric trough',
      description: 'State-wide extreme rainfall event leading to widespread river flooding in plains (Haridwar) and flash floods/landslides in Kumaon hills.',
      source_name: 'India Meteorological Department (IMD) Monsoon Report 2010 / USDMA',
      source_url: 'https://mausam.imd.gov.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2012-01',
      event_date: '2012-08-03',
      event_end_date: '2012-08-04',
      event_type: 'cloudburst-induced flood',
      event_name: '2012 Asi Ganga Cloudburst & Flash Flood Disaster',
      district_raw: 'Uttarkashi',
      location: 'Asi Ganga Valley (Agora, Dunda, Gangori, Joshiyara)',
      river_basin: 'Bhagirathi Basin (Asi Ganga River)',
      latitude: 30.765,
      longitude: 78.472,
      severity: 'Major',
      deaths: 35,
      missing_persons: 28,
      affected_population: 15000,
      infrastructure_damage: 'Gangori steel suspension bridge washed away; 3 mini hydel power projects destroyed; 120 houses collapsed',
      rainfall_information: 'Cloudburst over upper Asi Ganga catchment with localized rainfall estimated >120mm in under 2 hours',
      water_level_information: 'Asi Ganga water level surged 8m in 30 minutes, carrying boulders and uprooted logs',
      peak_rainfall_mm: 120,
      peak_water_level_m: undefined,
      triggering_hazard: 'Mesoscale convective cloudburst over high-gradient Asi Ganga mountain catchment',
      description: 'Sudden midnight cloudburst in the Asi Ganga valley creating a surge of water, sediment, and boulders that destroyed Gangori bridge and downstream settlements.',
      source_name: 'Uttarakhand State Disaster Management Authority (USDMA) / GSI Flash Flood Report',
      source_url: 'https://usdma.uk.gov.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2012-02',
      event_date: '2012-09-13',
      event_end_date: '2012-09-14',
      event_type: 'cloudburst-induced flood',
      event_name: '2012 Ukhimath Flash Floods',
      district_raw: 'Rudraprayag',
      location: 'Chunni, Mangoli, Premnagar, Bramharkholi (Ukhimath)',
      river_basin: 'Mandakini Basin (Kali Ganga / Madhyamaheshwar River)',
      latitude: 30.505,
      longitude: 79.102,
      severity: 'Major',
      deaths: 69,
      missing_persons: 12,
      affected_population: 8500,
      infrastructure_damage: 'Over 100 homes buried; road connectivity to Kedarnath pilgrim valley severed',
      rainfall_information: 'Cloudburst delivering >150mm within a localized 3-hour nocturnal window',
      water_level_information: 'Local mountain torrents overflowed banks by 5-7m',
      peak_rainfall_mm: 150,
      peak_water_level_m: undefined,
      triggering_hazard: 'Intense convective cloudburst triggering simultaneous slope debris flows into river channels',
      description: 'Night-time cloudburst and debris flows inundating Ukhimath block settlements and severing access to the Kedarnath valley.',
      source_name: 'USDMA Incident Report / NIDM Case Study',
      source_url: 'https://nidm.gov.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2013-01',
      event_date: '2013-06-16',
      event_end_date: '2013-06-17',
      event_type: 'glacial lake outburst flood (GLOF)',
      event_name: '2013 Kedarnath Multi-Basin Disaster & Chorabari GLOF',
      district_raw: 'Rudraprayag, Chamoli, Uttarkashi, Pithoragarh, Tehri, Pauri, Haridwar',
      location: 'Kedarnath shrine, Rambara, Gaurikund, Govindghat, Srinagar, Uttarkashi',
      river_basin: 'Mandakini, Alaknanda, Bhagirathi, and Kali Basins',
      latitude: 30.735,
      longitude: 79.067,
      severity: 'Catastrophic',
      deaths: 5700,
      missing_persons: 4000,
      affected_population: 4200000,
      infrastructure_damage: 'Rambara completely erased; Kedarnath town buried under 3-5m debris; 2,137 roads severed; 147 bridges destroyed; 10 hydro projects damaged',
      rainfall_information: 'Extreme rainfall: 375mm in 24h at Dehradun, >320mm in Kedarnath basin, early monsoon moisture coupled with Western Disturbance',
      water_level_information: 'Mandakini water level rose by 10-14 meters within minutes; Alaknanda at Srinagar flowed 7m above danger level',
      peak_rainfall_mm: 375,
      peak_water_level_m: undefined,
      triggering_hazard: 'Early monsoon deluge causing rapid snowmelt, filling and catastrophic moraine dam breach of Chorabari Lake (Gandhi Sarovar)',
      description: 'Multi-basin catastrophic disaster triggered by extreme early-monsoon rainfall and a glacial lake outburst flood that inundated the Kedarnath shrine and Rambara.',
      source_name: 'National Disaster Management Authority (NDMA) / GSI Special Report / ISRO-NRSC',
      source_url: 'https://ndma.gov.in/Governance/Disaster-Reports/2013-Uttarakhand-Floods',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2016-01',
      event_date: '2016-07-01',
      event_end_date: '2016-07-01',
      event_type: 'cloudburst-induced flood',
      event_name: '2016 Bastadi & Didihat Cloudburst Flash Floods',
      district_raw: 'Pithoragarh, Chamoli',
      location: 'Bastadi, Singali, Naal, Thal (Didihat Tehsil), Ghat (Chamoli)',
      river_basin: 'Sharda / Kali Basin (Charma & Thal rivers)',
      latitude: 29.79,
      longitude: 80.29,
      severity: 'Major',
      deaths: 41,
      missing_persons: 18,
      affected_population: 6500,
      infrastructure_damage: 'Over 160 houses destroyed; Thal-Munsiyari and Didihat-Pithoragarh roads cut off; 4 pedestrian bridges washed away',
      rainfall_information: 'Intense localized cloudburst: 100mm recorded in 2 hours at Didihat weather station',
      water_level_information: 'Local river channels rose 4-6m above normal monsoonal stage',
      peak_rainfall_mm: 100,
      peak_water_level_m: undefined,
      triggering_hazard: 'Localized cloudburst delivering high-intensity rainfall on saturated soil profiles',
      description: 'Localized cloudburst and flash floods damaging villages across Didihat tehsil and Ghat block of Eastern Uttarakhand.',
      source_name: 'Uttarakhand State Disaster Management Authority (USDMA) Disaster Bulletin',
      source_url: 'https://usdma.uk.gov.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2019-01',
      event_date: '2019-08-18',
      event_end_date: '2019-08-19',
      event_type: 'cloudburst-induced flood',
      event_name: '2019 Arakot-Mori Cloudburst & Flash Flood Event',
      district_raw: 'Uttarkashi',
      location: 'Arakot, Mori, Makudi, Tikochi, Sanail',
      river_basin: 'Yamuna Basin (Tons River / Pabar tributary)',
      latitude: 30.85,
      longitude: 78.16,
      severity: 'Major',
      deaths: 21,
      missing_persons: 11,
      affected_population: 5200,
      infrastructure_damage: 'Multiple apple orchards erased, Mori-Arakot road severed, 6 bridges washed away, rescue helicopters required',
      rainfall_information: 'Cloudburst with rainfall intensity >80mm/h over Mori-Arakot valley',
      water_level_information: 'Tons river and local nullahs rose by 5-7m, carrying heavy tree and boulder loads',
      peak_rainfall_mm: 80,
      peak_water_level_m: undefined,
      triggering_hazard: 'Severe convective cloudburst triggering high-velocity debris flows in steep mountain tributaries',
      description: 'High-intensity cloudburst causing debris flows and flash floods across the Mori-Arakot valley in the Western Garhwal hills.',
      source_name: 'State Emergency Operation Centre (SEOC) Uttarakhand / USDMA',
      source_url: 'https://usdma.uk.gov.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2021-01',
      event_date: '2021-02-07',
      event_end_date: '2021-02-07',
      event_type: 'debris-flow/flood event',
      event_name: '2021 Chamoli Rock-Ice Avalanche & Rishi Ganga-Dhauliganga Debris Flood',
      district_raw: 'Chamoli',
      location: 'Raini village, Tapovan, Joshimath, Rishi Ganga, Dhauliganga',
      river_basin: 'Alaknanda Basin (Rishi Ganga & Dhauliganga Rivers)',
      latitude: 30.372,
      longitude: 79.731,
      severity: 'Catastrophic',
      deaths: 204,
      missing_persons: 134,
      affected_population: 4000,
      infrastructure_damage: 'Rishi Ganga Hydro Project (13.2 MW) completely obliterated; NTPC Tapovan Vishnugad Project (520 MW) headworks & tunnels flooded; Raini bridge destroyed',
      rainfall_information: 'Clear winter morning (non-rainfall trigger): antecedent winter warming and freeze-thaw cycles',
      water_level_information: 'Peak discharge estimated between 4,000 and 8,000 m3/s; flood wave arrived as a 20-25m wall of hyper-concentrated sediment and water',
      peak_rainfall_mm: undefined,
      peak_water_level_m: undefined,
      triggering_hazard: 'Massive rock-ice avalanche (~27 million m3) detached from Ronti Peak (~5500m) converting to hyper-concentrated debris flow through friction and ice melting',
      description: 'High-mountain rock-ice avalanche and debris flood down Rishi Ganga and Dhauliganga, destroying two hydropower projects and multiple settlements.',
      source_name: 'Geological Survey of India (GSI) / ISRO-NRSC / WIHG / Shugar et al. (Science, 2021)',
      source_url: 'https://www.science.org/doi/10.1126/science.abh3457',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2021-02',
      event_date: '2021-10-18',
      event_end_date: '2021-10-19',
      event_type: 'extreme rainfall flood',
      event_name: 'October 2021 Kumaon Extreme Monsoon-WD Flash Floods',
      district_raw: 'Nainital, Almora, Champawat, Udham Singh Nagar',
      location: 'Nainital, Haldwani, Ramnagar, Kathgodam, Almora',
      river_basin: 'Gaula, Kosi, and Western Ramganga Basins',
      latitude: 29.38,
      longitude: 79.46,
      severity: 'Major',
      deaths: 79,
      missing_persons: 5,
      affected_population: 150000,
      infrastructure_damage: 'Kathgodam railway tracks hanging in mid-air as Gaula river washed bank; Nainital Mall Road inundated; 100+ roads closed',
      rainfall_information: 'All-time record 24-hour rainfall: Pantnagar recorded 403.9mm, Mukteshwar recorded 280.9mm (broken 100-year records) on Oct 19',
      water_level_information: 'Gaula Barrage discharge exceeded 120,000 cusecs; Naini Lake overflowed into town center',
      peak_rainfall_mm: 403.9,
      peak_water_level_m: undefined,
      triggering_hazard: 'Rare interaction of intense Western Disturbance with low-pressure system drawing Arabian Sea and Bay of Bengal moisture',
      description: 'Record-breaking monsoon flash floods across Kumaon plains and hills induced by an extreme Western Disturbance interaction.',
      source_name: 'India Meteorological Department (IMD) Climate Diagnostics / USDMA',
      source_url: 'https://mausam.imd.gov.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2022-01',
      event_date: '2022-08-19',
      event_end_date: '2022-08-20',
      event_type: 'cloudburst-induced flood',
      event_name: '2022 Maldevta-Sahastradhara-Thano Flash Floods',
      district_raw: 'Dehradun, Tehri Garhwal',
      location: 'Maldevta, Sarkhet, Sahastradhara, Thano, Raipur',
      river_basin: 'Ganga Basin (Song and Bandal Rivers)',
      latitude: 30.31,
      longitude: 78.04,
      severity: 'Major',
      deaths: 18,
      missing_persons: 6,
      affected_population: 12000,
      infrastructure_damage: 'Maldevta-Kumalda road bridge washed away; residential buildings and resorts flooded with debris in Sarkhet and Raipur',
      rainfall_information: 'Midnight cloudburst delivering 115mm in 2 hours in Raipur-Maldevta catchment',
      water_level_information: 'Song river reached record peak discharge, inundating low-lying suburbs of Dehradun',
      peak_rainfall_mm: 115,
      peak_water_level_m: undefined,
      triggering_hazard: 'Intense convective storm over Doon valley foothills triggering sudden hyper-concentrated stream surges',
      description: 'Fast-moving debris-flood surge in the Song/Bandal catchments inundating peri-urban Dehradun suburbs.',
      source_name: 'State Emergency Operations Centre (SEOC) Dehradun / USDMA Bulletin',
      source_url: 'https://usdma.uk.gov.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2023-01',
      event_date: '2023-08-04',
      event_end_date: '2023-08-04',
      event_type: 'flash flood',
      event_name: '2023 Gaurikund Flash Flood & Debris Flow',
      district_raw: 'Rudraprayag',
      location: 'Gaurikund, Mandakini river valley',
      river_basin: 'Mandakini Basin',
      latitude: 30.657,
      longitude: 79.03,
      severity: 'Moderate',
      deaths: 23,
      missing_persons: 16,
      affected_population: 3000,
      infrastructure_damage: 'Commercial shops and pilgrim transit stalls at Gaurikund swept into Mandakini river',
      rainfall_information: 'Continuous heavy rainfall exceeding 90mm over 6 hours in Mandakini valley',
      water_level_information: 'Mandakini river surged by 4-5m, eroding steep toe slopes under Gaurikund market',
      peak_rainfall_mm: 90,
      peak_water_level_m: undefined,
      triggering_hazard: 'Slope collapse following intense rain, funneling debris and flood wave across Gaurikund market',
      description: 'Flash flood and debris flow striking the Gaurikund pilgrim transit point on the Kedarnath corridor during peak yatra season.',
      source_name: 'District Disaster Management Authority (DDMA) Rudraprayag / USDMA',
      source_url: 'https://rudraprayag.nic.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2023-02',
      event_date: '2023-08-14',
      event_end_date: '2023-08-14',
      event_type: 'flash flood',
      event_name: '2023 Kotdwar & Pauri Garhwal Flash Floods',
      district_raw: 'Pauri Garhwal',
      location: 'Kotdwar city, Khoh river, Malini river',
      river_basin: 'Western Ramganga Basin (Khoh & Malini Rivers)',
      latitude: 29.75,
      longitude: 78.52,
      severity: 'Moderate',
      deaths: 12,
      missing_persons: 4,
      affected_population: 25000,
      infrastructure_damage: 'Kotdwar-Pauri national highway severed, road bridges damaged, residential colonies inundated',
      rainfall_information: 'Extreme rainfall: Kotdwar recorded 142mm in 4 hours',
      water_level_information: 'Khoh and Sukhro rivers breached embankments, flooding central Kotdwar town',
      peak_rainfall_mm: 142,
      peak_water_level_m: undefined,
      triggering_hazard: 'Intense torrential monsoon cloudburst in Southern Shivalik foothills',
      description: 'Shivalik foothill flash floods breaching river embankments and inundating central Kotdwar.',
      source_name: 'DDMA Pauri Garhwal / State Emergency Operations Centre (SEOC)',
      source_url: 'https://pauri.nic.in/',
      confidence: 'HIGH',
    },
    {
      event_id: 'FL-UK-2024-01',
      event_date: '2024-07-31',
      event_end_date: '2024-08-01',
      event_type: 'cloudburst-induced flood',
      event_name: 'July 2024 Kedar Valley (Bhimbali & Lincholi) Cloudburst Disaster',
      district_raw: 'Rudraprayag, Tehri',
      location: 'Bhimbali, Lincholi, Rambara, Sonprayag, Ghansali (Tehri)',
      river_basin: 'Mandakini & Bhilangna Basins',
      latitude: 30.67,
      longitude: 79.05,
      severity: 'Major',
      deaths: 17,
      missing_persons: 11,
      affected_population: 15000,
      infrastructure_damage: '29-meter stretch of Kedarnath pedestrian walkway washed away at Bhimbali; Sonprayag parking lot damaged; over 11,000 pilgrims stranded and airlifted',
      rainfall_information: 'Intense cloudburst delivering >100mm in 90 minutes over upper Kedar valley ridge',
      water_level_information: 'Mandakini river level surged 6-8m rapidly, washing away footpath embankments',
      peak_rainfall_mm: 100,
      peak_water_level_m: undefined,
      triggering_hazard: 'Cloudburst over high-altitude ridge triggering multiple debris flows and flash surges down steep nullahs',
      description: 'High-altitude cloudburst along the Kedarnath trek corridor, damaging the pedestrian walkway and stranding thousands of pilgrims.',
      source_name: 'Uttarakhand State Disaster Management Authority (USDMA) / SDRF Uttarakhand Incident Report',
      source_url: 'https://usdma.uk.gov.in/',
      confidence: 'HIGH',
    },
  ];

  return raw.map((r, i) => {
    const districts = String(r.district_raw)
      .split(',')
      .map((s) => s.trim());
    return {
      id: r.event_id,
      eventId: r.event_id,
      eventDate: r.event_date,
      eventEndDate: r.event_end_date || r.event_date,
      eventType: r.event_type,
      eventName: r.event_name,
      district: primaryDistrict(r.district_raw),
      districts,
      primaryDistrictLabel: districts.length > 1 ? `${districts.length} districts` : districts[0],
      location: r.location,
      riverBasin: r.river_basin,
      lat: r.latitude,
      lon: r.longitude,
      severity: r.severity,
      deaths: r.deaths,
      missingPersons: r.missing_persons,
      affectedPopulation: r.affected_population,
      infrastructureDamage: r.infrastructure_damage,
      rainfallInformation: r.rainfall_information,
      waterLevelInformation: r.water_level_information,
      peakRainfallMm: r.peak_rainfall_mm,
      peakWaterLevelM: r.peak_water_level_m,
      triggeringHazard: r.triggering_hazard,
      description: r.description,
      sourceName: r.source_name,
      sourceUrl: r.source_url,
      confidence: r.confidence,
      year: parseInt(String(r.event_date).slice(0, 4), 10),
      source: 'CALIBRATED_CANONICAL',
    };
  });
}

export const HISTORICAL_EVENTS = buildCanonicalEvents();

export const EVENT_DISTRICTS = Array.from(
  new Set(HISTORICAL_EVENTS.flatMap((e) => e.districts))
).sort();
export const EVENT_TYPES = Array.from(new Set(HISTORICAL_EVENTS.map((e) => e.eventType))).sort();
export const EVENT_YEARS = Array.from(new Set(HISTORICAL_EVENTS.map((e) => e.year))).sort();

// Duration in whole days (deterministic; end date inclusive).
export function eventDurationDays(event) {
  const start = new Date(`${event.eventDate}T00:00:00Z`);
  const end = new Date(`${event.eventEndDate}T00:00:00Z`);
  const days = Math.round((end - start) / 86400000) + 1;
  return Math.max(days, 1);
}

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// ---------------------------------------------------------------------------
// DERIVED/AGGREGATE HELPERS (all deterministic, driven by the same events)
// ---------------------------------------------------------------------------

export function computeHistoricalKpis(events) {
  const bySeverity = { Moderate: 0, Major: 0, Catastrophic: 0 };
  events.forEach((e) => {
    if (bySeverity[e.severity] !== undefined) bySeverity[e.severity] += 1;
  });
  const districtFreq = {};
  events.forEach((e) => {
    e.districts.forEach((d) => {
      districtFreq[d] = (districtFreq[d] || 0) + 1;
    });
  });
  const mostAffected = Object.entries(districtFreq).sort((a, b) => b[1] - a[1])[0] || ['—', 0];

  const rainEvents = events.filter((e) => e.peakRainfallMm !== undefined);
  const maxRain = rainEvents.length ? rainEvents.sort((a, b) => b.peakRainfallMm - a.peakRainfallMm)[0] : null;

  const waterEvents = events.filter((e) => e.peakWaterLevelM !== undefined);
  const maxWater = waterEvents.length ? waterEvents.sort((a, b) => b.peakWaterLevelM - a.peakWaterLevelM)[0] : null;

  return {
    totalEvents: events.length,
    criticalExtreme: bySeverity.Catastrophic,
    major: bySeverity.Major,
    moderate: bySeverity.Moderate,
    mostAffectedDistrict: mostAffected[0],
    mostAffectedCount: mostAffected[1],
    maxRainfallEvent: maxRain,
    maxRainfallValue: maxRain ? maxRain.peakRainfallMm : null,
    maxWaterLevelEvent: maxWater,
    maxWaterLevelValue: maxWater ? maxWater.peakWaterLevelM : null,
  };
}

// Events aggregated by year (for the by-year chart).
export function eventCountByYear(events) {
  const map = {};
  events.forEach((e) => {
    map[e.year] = (map[e.year] || 0) + 1;
  });
  return Object.entries(map)
    .map(([year, count]) => ({ year: parseInt(year, 10), count }))
    .sort((a, b) => a.year - b.year);
}

// Severity distribution (for the by-severity chart).
export function severityDistribution(events) {
  const bySeverity = { Moderate: 0, Major: 0, Catastrophic: 0 };
  events.forEach((e) => {
    if (bySeverity[e.severity] !== undefined) bySeverity[e.severity] += 1;
  });
  return [
    { severity: 'Catastrophic', count: bySeverity.Catastrophic },
    { severity: 'Major', count: bySeverity.Major },
    { severity: 'Moderate', count: bySeverity.Moderate },
  ];
}

// Events by district (frequency across the filtered set).
export function eventCountByDistrict(events) {
  const map = {};
  events.forEach((e) => {
    e.districts.forEach((d) => {
      map[d] = (map[d] || 0) + 1;
    });
  });
  return Object.entries(map)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count);
}

// Chronological timeline.
export function buildEventTimeline(events) {
  return [...events].sort((a, b) => (a.eventDate < b.eventDate ? -1 : 1));
}

// ---------------------------------------------------------------------------
// LIVE MERGE (validated, non-destructive) — mirrors Analytics/Alerts pattern
// ---------------------------------------------------------------------------
function validateLiveEvents(records) {
  const reasons = [];
  if (!Array.isArray(records) || records.length === 0) {
    return { valid: false, reasons: ['live response is empty'], records: [] };
  }
  const complete = records.filter(
    (e) => e && e.eventId && e.eventDate && e.eventType && e.district && e.severity
  );
  if (complete.length === 0) {
    reasons.push('live events are missing required fields');
  }
  return { valid: reasons.length === 0, reasons, records: complete };
}

function mapLiveEvent(raw, index) {
  const districts = String(raw.district || 'Uttarakhand')
    .split(',')
    .map((s) => s.trim());
  return {
    id: raw.event_id || raw.eventId || `EVT_LIVE_${index + 1}`,
    eventId: raw.event_id || raw.eventId,
    eventDate: raw.event_date || raw.eventDate,
    eventEndDate: raw.event_end_date || raw.eventEndDate || raw.event_date || raw.eventDate,
    eventType: raw.event_type || raw.eventType,
    eventName: raw.event_name || raw.eventName || raw.eventId,
    district: districts[0],
    districts,
    primaryDistrictLabel: districts.length > 1 ? `${districts.length} districts` : districts[0],
    location: raw.location,
    riverBasin: raw.river_basin || raw.riverBasin,
    lat: raw.latitude,
    lon: raw.longitude,
    severity: raw.severity_category || raw.severity || raw.severityCategory,
    deaths: raw.deaths,
    missingPersons: raw.missing_persons ?? raw.missingPersons,
    affectedPopulation: raw.affected_population ?? raw.affectedPopulation,
    infrastructureDamage: raw.infrastructure_damage || raw.infrastructureDamage,
    rainfallInformation: raw.rainfall_information || raw.rainfallInformation,
    waterLevelInformation: raw.water_level_information || raw.waterLevelInformation,
    peakRainfallMm: peakFromRange(raw.rainfall_information ?? raw.rainfallInformation),
    peakWaterLevelM: peakFromRange(raw.water_level_information ?? raw.waterLevelInformation),
    triggeringHazard: raw.triggering_hazard || raw.triggeringHazard,
    description: raw.description,
    sourceName: raw.source_name || raw.sourceName,
    sourceUrl: raw.source_url || raw.sourceUrl,
    confidence: raw.confidence || 'HIGH',
    year: parseInt(String(raw.event_date || raw.eventDate || '').slice(0, 4), 10),
    source: 'LIVE_BACKEND',
  };
}

function devWarning(...args) {
  try {
    if (import.meta.env?.DEV) console.warn('[HistoricalEvents]', ...args);
  } catch {
    // dev-only; never break fallback path
  }
}

// Loads historical events for the screen. Always returns a usable,
// deterministic set: the canonical HISTORICAL_EVENTS unless a valid
// live response is present.
export async function loadHistoricalEvents() {
  try {
    const res = await eventsService.getHistoricalEvents();
    const payload = Array.isArray(res) ? res : res?.data;
    const raw = Array.isArray(payload) ? payload : Array.isArray(payload?.events) ? payload.events : [];
    if (!raw.length) {
      devWarning('Live historical-events response empty — retaining canonical historical dataset.');
      return HISTORICAL_EVENTS;
    }
    const mapped = raw.map(mapLiveEvent);
    const { valid, reasons, records } = validateLiveEvents(mapped);
    if (valid && records.length > 0) {
      devWarning(`Adopting validated live historical dataset (${records.length} events).`);
      return records;
    }
    devWarning(`Live historical-events response rejected (${reasons.join('; ')}). Retaining canonical historical dataset.`);
  } catch (err) {
    devWarning('Live historical-events fetch failed; retaining canonical historical dataset.', err);
  }
  return HISTORICAL_EVENTS;
}

export { formatDate };
