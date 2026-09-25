# RiverMamba Input Contract

This document specifies all input variables required by RiverMamba, based on `config.py`.

## 1. GloFAS Variables (4)
**Dataset:** GloFAS Reanalysis / Forecast
**Source:** Copernicus CDS

| Variable | Required? | Dataset | Source | Resolution | Frequency | Units | Transformation | Realtime availability | Latency |
| -------- | --------- | ------- | ------ | ---------- | --------- | ----- | -------------- | --------------------- | ------- |
| `acc_rod24` | YES | GloFAS | Copernicus CDS | 0.1° | Daily | mm | None | OPERATIONAL (Forecast) / REANALYSIS | 1-3 days (Reanalysis) |
| `dis24` | YES | GloFAS | Copernicus CDS | 0.1° | Daily | m³/s | None | OPERATIONAL (Forecast) / REANALYSIS | 1-3 days (Reanalysis) |
| `sd` | YES | GloFAS | Copernicus CDS | 0.1° | Daily | m | None | OPERATIONAL (Forecast) / REANALYSIS | 1-3 days (Reanalysis) |
| `swi` | YES | GloFAS | Copernicus CDS | 0.1° | Daily | - | None | OPERATIONAL (Forecast) / REANALYSIS | 1-3 days (Reanalysis) |

## 2. ERA5-Land Variables (32)
**Dataset:** ERA5-Land Reanalysis
**Source:** Copernicus CDS
*Note: Only 32 of the 35 ERA5-Land variables are used by default.*

| Variable | Required? | Dataset | Source | Resolution | Frequency | Units | Transformation | Realtime availability | Latency |
| -------- | --------- | ------- | ------ | ---------- | --------- | ----- | -------------- | --------------------- | ------- |
| `d2m`, `e`, `es`, `evabs`, `evaow`, `evatc`, `evavt`, `lai_hv`, `lai_lv`, `pev`, `sf`, `skt`, `slhf`, `smlt`, `sp`, `src`, `sro`, `sshf`, `ssr`, `ssrd`, `ssro`, `stl1`, `str`, `strd`, `swvl1`, `swvl2`, `swvl3`, `swvl4`, `t2m`, `tp`, `u10`, `v10` | YES | ERA5-Land | Copernicus CDS | 0.1° | Hourly/Daily | Various | None | REANALYSIS ONLY | **REALTIME_INPUT_GAP** (~5 days latency) |

## 3. ECMWF HRES Forecast Variables (7)
**Dataset:** ECMWF HRES Forecast
**Source:** ECMWF MARS / OpenData

| Variable | Required? | Dataset | Source | Resolution | Frequency | Units | Transformation | Realtime availability | Latency |
| -------- | --------- | ------- | ------ | ---------- | --------- | ----- | -------------- | --------------------- | ------- |
| `e`, `sf`, `sp`, `ssr`, `str`, `t2m`, `tp` | YES | HRES | ECMWF | 0.1° | Daily (Lead) | Various | None | FORECAST / OPERATIONAL | ~6-12 hours |

## 4. CPC Precipitation (1)
**Dataset:** CPC Global Unified Gauge-Based Analysis
**Source:** NOAA PSL

| Variable | Required? | Dataset | Source | Resolution | Frequency | Units | Transformation | Realtime availability | Latency |
| -------- | --------- | ------- | ------ | ---------- | --------- | ----- | -------------- | --------------------- | ------- |
| `precip` | YES | CPC | NOAA | 0.5° | Daily | mm | Log1p | NEAR-REAL-TIME | ~1-2 days |

## 5. LISFLOOD Static Variables (99)
**Dataset:** GloFAS Static (LISFLOOD)
**Source:** Copernicus

| Variable | Required? | Dataset | Source | Resolution | Frequency | Units | Transformation | Realtime availability | Latency |
| -------- | --------- | ------- | ------ | ---------- | --------- | ----- | -------------- | --------------------- | ------- |
| 99 variables including `CalChanMan1`, `GwLoss`, `chanbw`, `ksat1`, `upArea`, etc. | YES | LISFLOOD | Copernicus | 0.1° | Static | Various | Log1p (for 10 vars) | STATIC | 0 (Downloaded once) |

> **Log1p Transformation Note:** The following static variables require `log1p`: `chanbw`, `chanflpn`, `elvstd`, `ksat1`, `ksat2`, `ksat3`, `soildepth2`, `soildepth3`, `upArea`, `waterregions`.

---

## Critical Realtime Feasibility Assessment

There is a **REALTIME_INPUT_GAP** for ERA5-Land variables. ERA5-Land operates at a roughly 5-day latency behind real time. Since RiverMamba is trained explicitly to rely on these 32 ERA5-Land historical variables (representing the `delta_t` lookback period), running a true "Live" forecast for today is currently blocked unless the model architecture supports imputing or substituting HRES analysis/forecast fields for ERA5-Land. Without this substitution, the system can only run a hindcast up to T-5 days.
