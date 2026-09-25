# Jal Drishti: Google Hydrological Forecast Integration

This document outlines the final integration architecture linking the locally validated Google Flood Forecasting (`google-floodhub-nse-filtered`) PyTorch CMAL checkpoint into the Jal Drishti operational backend.

## 1. Architectural Overview

The Google Hydrological forecast operates strictly as an **auxiliary layer** decoupled from the primary XGBoost severity engine.

### Constraints & Safeguards Implemented
- **Feature Flagged:** Toggled via `GOOGLE_HYDROLOGICAL_FORECAST_ENABLED=True` in `.env`.
- **Non-blocking Execution:** The prediction is executed in a background thread in `prediction_service.py` to ensure it does not block the FastAPI event loop.
- **Strict Timeout Budget:** The inference is forcefully terminated if it exceeds a 3-second latency limit, failing gracefully and returning `status="UNAVAILABLE"`.
- **Scientific Honesty Validation:** As validated in Phase 7.7, the Google model currently lacks target historical reference data (MultiMet variables) for Uttarakhand. Therefore, for all live Uttarakhand queries, the service bypasses deep model execution and correctly returns a predefined state:
  ```json
  "status": "REFERENCE_DATA_UNAVAILABLE"
  "indicator": {
      "status": "GEOGRAPHIC_MAPPING_UNAVAILABLE",
      "meaning": "Target coordinates (Uttarakhand) lack MultiMet historical ground-truth for calibration."
  }
  ```

---

## 2. API Contract Updates

The `/api/v1/predictions/infer` endpoint's `LiveInferenceResponse` has been enhanced with the `hydrological_forecast` property.

Example output:
```json
{
  "probability": 0.9279,
  "risk_class": "EXTREME",
  "decision_threshold": 0.40,
  "is_alarm": true,
  "scs_direct_runoff_q_mm": 5.1,
  "scs_potential_retention_s_mm": 2.2,
  "model_name": "XGBoost_PPT_Upgraded",
  "model_version": "6.1.0",
  "hydrological_forecast": {
    "status": "REFERENCE_DATA_UNAVAILABLE",
    "source": "Google Flood Forecasting",
    "model_version": "google-floodhub-settings-55-epochs-nse-filtered-0.5-85-epochs",
    "forecast_generated_at": "2026-09-17T04:16:11+00:00",
    "forecast": null,
    "uncertainty": null,
    "indicator": {
      "value": null,
      "status": "GEOGRAPHIC_MAPPING_UNAVAILABLE",
      "meaning": "Target coordinates (Uttarakhand) lack MultiMet historical ground-truth for calibration."
    }
  }
}
```

---

## 3. Flutter / UI Implementation Guide

Because the Flutter application lives in a separate workspace (`Software_SIH_2026`), copy the following Dart modifications directly into your UI codebase to visualize this new data layer.

### Step A: Update `schemas.dart`

Add the new classes to `lib/shared/models/schemas.dart` (or your equivalent DTO mapping file):

```dart
class HydrologicalForecastIndicator {
  final double? value;
  final String status;
  final String meaning;

  HydrologicalForecastIndicator({this.value, required this.status, required this.meaning});

  factory HydrologicalForecastIndicator.fromJson(Map<String, dynamic> json) {
    return HydrologicalForecastIndicator(
      value: json['value']?.toDouble(),
      status: json['status'],
      meaning: json['meaning'],
    );
  }
}

class HydrologicalForecastValues {
  final double? p10_m3s;
  final double? p50_m3s;
  final double? p90_m3s;

  HydrologicalForecastValues({this.p10_m3s, this.p50_m3s, this.p90_m3s});

  factory HydrologicalForecastValues.fromJson(Map<String, dynamic> json) {
    return HydrologicalForecastValues(
      p10_m3s: json['p10_m3s']?.toDouble(),
      p50_m3s: json['p50_m3s']?.toDouble(),
      p90_m3s: json['p90_m3s']?.toDouble(),
    );
  }
}

class HydrologicalForecastUncertainty {
  final double? spread_m3s;

  HydrologicalForecastUncertainty({this.spread_m3s});

  factory HydrologicalForecastUncertainty.fromJson(Map<String, dynamic> json) {
    return HydrologicalForecastUncertainty(
      spread_m3s: json['spread_m3s']?.toDouble(),
    );
  }
}

class GoogleHydrologicalForecast {
  final String status;
  final String source;
  final String modelVersion;
  final String? forecastGeneratedAt;
  final HydrologicalForecastValues? forecast;
  final HydrologicalForecastUncertainty? uncertainty;
  final HydrologicalForecastIndicator? indicator;

  GoogleHydrologicalForecast({
    required this.status,
    required this.source,
    required this.modelVersion,
    this.forecastGeneratedAt,
    this.forecast,
    this.uncertainty,
    this.indicator,
  });

  factory GoogleHydrologicalForecast.fromJson(Map<String, dynamic> json) {
    return GoogleHydrologicalForecast(
      status: json['status'],
      source: json['source'] ?? 'Google Flood Forecasting',
      modelVersion: json['model_version'] ?? '',
      forecastGeneratedAt: json['forecast_generated_at'],
      forecast: json['forecast'] != null ? HydrologicalForecastValues.fromJson(json['forecast']) : null,
      uncertainty: json['uncertainty'] != null ? HydrologicalForecastUncertainty.fromJson(json['uncertainty']) : null,
      indicator: json['indicator'] != null ? HydrologicalForecastIndicator.fromJson(json['indicator']) : null,
    );
  }
}
```

Update your `LiveInferenceResponse` class:
```dart
class LiveInferenceResponse {
  // Existing fields
  final double probability;
  final String riskClass;
  // ...
  final GoogleHydrologicalForecast? hydrologicalForecast;

  LiveInferenceResponse({
    required this.probability,
    required this.riskClass,
    // ...
    this.hydrologicalForecast,
  });

  factory LiveInferenceResponse.fromJson(Map<String, dynamic> json) {
    return LiveInferenceResponse(
      probability: json['probability']?.toDouble() ?? 0.0,
      riskClass: json['risk_class'] ?? 'UNKNOWN',
      // ...
      hydrologicalForecast: json['hydrological_forecast'] != null 
          ? GoogleHydrologicalForecast.fromJson(json['hydrological_forecast'])
          : null,
    );
  }
}
```

### Step B: Create `HydrologicalForecastCard` Widget

You can display this data using a clean, non-intrusive card in your UI:

```dart
import 'package:flutter/material.dart';
import 'package:jal_drishti/shared/models/schemas.dart'; // Adjust import

class HydrologicalForecastCard extends StatelessWidget {
  final GoogleHydrologicalForecast? forecastData;

  const HydrologicalForecastCard({Key? key, this.forecastData}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (forecastData == null) {
      return const SizedBox.shrink(); // Hide if completely disabled
    }

    final isUnavailable = forecastData!.status == 'REFERENCE_DATA_UNAVAILABLE' || 
                          forecastData!.status == 'UNAVAILABLE';
                          
    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.water_drop, color: Colors.blueAccent),
                const SizedBox(width: 8),
                const Text(
                  'Google Hydrological Forecast',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                Tooltip(
                  message: 'Powered by Google Floodhub AI Model',
                  child: Icon(Icons.info_outline, size: 16, color: Colors.grey[600]),
                ),
              ],
            ),
            const Divider(),
            if (isUnavailable) ...[
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        forecastData!.indicator?.meaning ?? 'Data currently unavailable for this region.',
                        style: TextStyle(color: Colors.orange[800], fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ] else if (forecastData!.forecast != null) ...[
              // Active data display
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildDataColumn('P10 (Min)', '${forecastData!.forecast!.p10_m3s?.toStringAsFixed(1)} m³/s'),
                  _buildDataColumn('Median', '${forecastData!.forecast!.p50_m3s?.toStringAsFixed(1)} m³/s', isPrimary: true),
                  _buildDataColumn('P90 (Max)', '${forecastData!.forecast!.p90_m3s?.toStringAsFixed(1)} m³/s'),
                ],
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildDataColumn(String label, String value, {bool isPrimary = false}) {
    return Column(
      children: [
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
        const SizedBox(height: 4),
        Text(
          value, 
          style: TextStyle(
            fontSize: isPrimary ? 18 : 14,
            fontWeight: isPrimary ? FontWeight.bold : FontWeight.w500,
            color: isPrimary ? Colors.blue[800] : Colors.black87,
          ),
        ),
      ],
    );
  }
}
```

This completes the end-to-end integration of Phase 7.8!
