# JAL DRISHTI ML DATASET v0.1 — SOURCE MANIFEST & PROVENANCE

This document details the authoritative data providers, products, versions, observation periods, and access methods for all datasets included in the JAL DRISHTI ML DATASET v0.1 package.

---

## 1. NASA GPM IMERG Half-Hourly Precipitation
- **Provider:** NASA Earth Science Data and Information System (ESDIS) / GES DISC
- **Product:** GPM Level 3 IMERG Half Hourly 0.1° x 0.1° (`GPM_3IMERGHH`)
- **Version:** V07B (Retrospective Final Run)
- **Spatial Resolution:** ~0.1 degree (~11 km at equator)
- **Temporal Resolution:** 30 minutes
- **Access Method:** Direct HTTPS download via NASA Earthdata Cloud (`earthaccess` / Earthdata Login)
- **Period of Record:** January 1, 1998 to Present
- **License:** Public Domain / NASA Earth Science Data Policy
- **Limitations:** FL-UK-1970-01 (July 1970) pre-dates satellite constellation launch.

---

## 2. NASA SMAP Level 4 Soil Moisture
- **Provider:** NASA National Snow and Ice Data Center Distributed Active Archive Center (NSIDC DAAC)
- **Product:** SMAP L4 Global 3-hourly 9 km EASE-Grid Surface and Root Zone Soil Moisture Geophysical Data (`SPL4SMGP`)
- **Version:** Version 8 (v8011)
- **Spatial Resolution:** 9 km EASE-Grid 2.0
- **Temporal Resolution:** 3 hours
- **Access Method:** Direct HTTPS download via NSIDC / Earthdata Cloud (`earthaccess`)
- **Period of Record:** March 31, 2015 to Present
- **License:** Open Access / NASA Data Policy
- **Limitations:** Events prior to April 2015 have no SMAP observations.

---

## 3. NOAA Global Forecast System (GFS)
- **Provider:** NOAA National Centers for Environmental Prediction (NCEP)
- **Product:** GFS 0.25 Degree Atmospheric Forecast (`NOAA_GFS_0P25`)
- **Version:** Operational NCEP Forecast System
- **Spatial Resolution:** 0.25 degree (~28 km)
- **Temporal Resolution:** 3 hours
- **Access Method:** NOAA NOMADS Filter Service
- **Status:** Historical forecast-vintage data for 1970-2024 dates unavailable on public rolling NOMADS server. Recorded as missingness=1.0 without zero-filling or synthetic proxy.

---

## 4. NASA / USGS SRTM Digital Elevation Model
- **Provider:** NASA / USGS Shuttle Radar Topography Mission
- **Product:** SRTM 90m (3 arc-second) Digital Elevation Data (`SRTM_V4`)
- **Version:** Version 4.1 (CGIAR-CSI processed)
- **Spatial Resolution:** 3 arc-seconds (~90 meters)
- **Temporal Resolution:** Static (Mission Date 2000)
- **License:** Public Domain

---

## 5. ESA WorldCover Land Cover
- **Provider:** European Space Agency (ESA) WorldCover Consortium
- **Product:** ESA WorldCover 10m Sentinel-1 & Sentinel-2 (`ESA_WORLDCOVER`)
- **Version:** v200
- **Spatial Resolution:** 10 meters
- **Temporal Resolution:** Static annual baseline
- **License:** CC BY 4.0

---

## 6. Central Water Commission (CWC) River Gauge Data
- **Provider:** Central Water Commission / Jal Shakti Ministry / India-WRIS
- **Status:** Historical hourly water levels for specific 1970-2024 flash flood event dates unavailable in open API. Recorded as UNAVAILABLE.
