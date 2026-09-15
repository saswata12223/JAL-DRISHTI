import unittest
import os
import pandas as pd
import numpy as np

class TestHistoricalGpmRainfall(unittest.TestCase):

    def setUp(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.rainfall_dir = os.path.join(self.base_dir, 'data', 'processed', 'rainfall')
        self.events_parquet = os.path.join(self.base_dir, 'data', 'processed', 'events', 'historical_flood_events.parquet')
        self.csv_path = os.path.join(self.rainfall_dir, 'historical_gpm_event_rainfall.csv')
        self.parquet_path = os.path.join(self.rainfall_dir, 'historical_gpm_event_rainfall.parquet')
        self.manifest_path = os.path.join(self.rainfall_dir, 'historical_gpm_source_manifest.csv')
        self.report_path = os.path.join(self.rainfall_dir, 'historical_gpm_rainfall_quality_report.md')

    def test_file_existence(self):
        self.assertTrue(os.path.exists(self.csv_path), "CSV output file must exist")
        self.assertTrue(os.path.exists(self.parquet_path), "Parquet output file must exist")
        self.assertTrue(os.path.exists(self.manifest_path), "Source manifest CSV must exist")
        self.assertTrue(os.path.exists(self.report_path), "Quality report Markdown must exist")

    def test_all_15_events_represented(self):
        df_events = pd.read_parquet(self.events_parquet)
        cat_event_ids = set(df_events['event_id'])
        self.assertEqual(len(cat_event_ids), 15)

        df_manifest = pd.read_csv(self.manifest_path)
        manifest_event_ids = set(df_manifest['event_id'])
        
        # All 15 event IDs must be present in the source manifest
        self.assertTrue(cat_event_ids.issubset(manifest_event_ids), "All 15 catalog event IDs must be in manifest")

    def test_non_negative_rainfall(self):
        if os.path.exists(self.parquet_path) and os.path.getsize(self.parquet_path) > 100:
            df = pd.read_parquet(self.parquet_path)
            if len(df) > 0:
                # Rainfall values (excluding NaN) must be non-negative
                valid_precip = df['gpm_precipitation_mm'].dropna()
                self.assertTrue((valid_precip >= 0).all(), "Rainfall values must be >= 0")

    def test_time_precision_integrity(self):
        if os.path.exists(self.parquet_path) and os.path.getsize(self.parquet_path) > 100:
            df = pd.read_parquet(self.parquet_path)
            if len(df) > 0:
                self.assertIn('event_time_precision', df.columns)
                self.assertTrue(set(df['event_time_precision']).issubset({'EXACT_TIMESTAMP', 'DATE_ONLY'}))
                # Chamoli 2021 must be EXACT_TIMESTAMP
                chamoli_df = df[df['event_id'] == 'FL-UK-2021-01']
                if len(chamoli_df) > 0:
                    self.assertTrue((chamoli_df['event_time_precision'] == 'EXACT_TIMESTAMP').all())

    def test_parquet_csv_equivalence(self):
        if os.path.exists(self.parquet_path) and os.path.getsize(self.parquet_path) > 100:
            df_csv = pd.read_csv(self.csv_path)
            df_parquet = pd.read_parquet(self.parquet_path)
            self.assertEqual(len(df_csv), len(df_parquet))
            self.assertEqual(list(df_csv.columns), list(df_parquet.columns))

if __name__ == '__main__':
    unittest.main()
