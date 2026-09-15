import unittest
import os
import pandas as pd

class TestHistoricalEventCatalogue(unittest.TestCase):

    def setUp(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.csv_path = os.path.join(self.base_dir, 'data', 'processed', 'events', 'historical_flood_events.csv')
        self.parquet_path = os.path.join(self.base_dir, 'data', 'processed', 'events', 'historical_flood_events.parquet')

    def test_file_existence(self):
        self.assertTrue(os.path.exists(self.csv_path), "CSV file must exist")
        self.assertTrue(os.path.exists(self.parquet_path), "Parquet file must exist")

    def test_event_count(self):
        df_csv = pd.read_csv(self.csv_path)
        df_parquet = pd.read_parquet(self.parquet_path)
        self.assertEqual(len(df_csv), 15, "CSV must contain exactly 15 verified records")
        self.assertEqual(len(df_parquet), 15, "Parquet must contain exactly 15 verified records")

    def test_no_duplicates(self):
        df = pd.read_csv(self.csv_path)
        self.assertEqual(df['event_id'].nunique(), 15, "Event IDs must be unique")
        # Check no duplicate date/location combinations
        dup_date_loc = df.duplicated(subset=['event_date', 'location_description']).sum()
        self.assertEqual(dup_date_loc, 0, "No duplicate event_date + location combinations allowed")

    def test_null_timestamp_preservation(self):
        df_parquet = pd.read_parquet(self.parquet_path)
        # Verify event_start_datetime and event_end_datetime are 100% null (None/NaN)
        self.assertTrue(df_parquet['event_start_datetime'].isna().all(), "event_start_datetime must be 100% null")
        self.assertTrue(df_parquet['event_end_datetime'].isna().all(), "event_end_datetime must be 100% null")

    def test_coordinate_integrity(self):
        df = pd.read_parquet(self.parquet_path)
        self.assertIn('coord_class', df.columns)
        self.assertTrue(set(df['coord_class']).issubset({'DIRECT', 'DERIVED'}))
        self.assertEqual((df['coord_class'] == 'DIRECT').sum(), 6)
        self.assertEqual((df['coord_class'] == 'DERIVED').sum(), 9)
        # Lat/Lon bounds for Uttarakhand (~28.5 to ~31.5 Lat, ~77.5 to ~81.5 Lon)
        self.assertTrue((df['latitude'] >= 28.0).all() and (df['latitude'] <= 32.0).all())
        self.assertTrue((df['longitude'] >= 77.0).all() and (df['longitude'] <= 82.0).all())

    def test_taxonomy_and_target_eligibility(self):
        df = pd.read_parquet(self.parquet_path)
        valid_classes = {'FLASH_FLOOD', 'CLOUDBURST', 'GLOF', 'LLOF', 'DEBRIS_FLOW', 'RIVER_FLOOD', 'OTHER'}
        self.assertTrue(set(df['target_class']).issubset(valid_classes))
        
        # Check flash flood target eligibility rules
        # FLASH_FLOOD -> TRUE
        # CLOUDBURST -> TRUE
        # GLOF / LLOF -> FALSE
        # DEBRIS_FLOW -> FALSE
        # RIVER_FLOOD -> FALSE
        eligible_mask = df['target_class'].isin(['FLASH_FLOOD', 'CLOUDBURST'])
        self.assertTrue((df.loc[eligible_mask, 'flash_flood_target_eligible'] == True).all())
        self.assertTrue((df.loc[~eligible_mask, 'flash_flood_target_eligible'] == False).all())
        self.assertEqual(df['flash_flood_target_eligible'].sum(), 8)

    def test_parquet_csv_identity(self):
        df_csv = pd.read_csv(self.csv_path)
        df_parquet = pd.read_parquet(self.parquet_path)
        self.assertEqual(list(df_csv.columns), list(df_parquet.columns))
        self.assertEqual(len(df_csv), len(df_parquet))
        for col in df_csv.columns:
            if col in ['event_start_datetime', 'event_end_datetime']:
                continue
            pd.testing.assert_series_equal(df_csv[col], df_parquet[col], check_names=False)

if __name__ == '__main__':
    unittest.main()
