"""

Unit & Integration Test Suite for ML Phase 7 Rolling Data Pipeline



Tests date range logic, quality gates, feature contract compliance,

cache inspection, timing rules, and dry-run functionality.

"""



import sys

import unittest

from datetime import datetime, timedelta, timezone

from pathlib import Path



# Add project directory to sys.path

PROJECT_DIR = Path(__file__).resolve().parent.parent

sys.path.insert(0, str(PROJECT_DIR))



import numpy as np

import pandas as pd



from scripts.orchestrate_rolling_pipeline import (

    EXPECTED_34_PREDICTORS,

    RollingPipelineOrchestrator,

    parse_date_utc,

)





class TestRollingPipelineOrchestrator(unittest.TestCase):

    """Test cases for RollingPipelineOrchestrator."""



    def test_parse_date_utc_valid(self):

        """Test valid ISO and YYYY-MM-DD date parsing."""

        dt1 = parse_date_utc("2026-08-15")

        self.assertIsNotNone(dt1)

        self.assertEqual(dt1.year, 2026)

        self.assertEqual(dt1.month, 8)

        self.assertEqual(dt1.day, 15)



        dt2 = parse_date_utc("2026-08-15T12:30:00Z")

        self.assertIsNotNone(dt2)

        self.assertEqual(dt2.hour, 12)

        self.assertEqual(dt2.minute, 30)



    def test_parse_date_utc_invalid(self):

        """Test invalid date parsing raises ValueError."""

        with self.assertRaises(ValueError):

            parse_date_utc("invalid-date-format")



    def test_default_15_day_rolling_window(self):

        """Test default 15-day window setup."""

        orchestrator = RollingPipelineOrchestrator(rolling_days=15)

        self.assertEqual(orchestrator.rolling_days, 15)

        self.assertEqual(orchestrator.mode, "LIVE_ROLLING")

        delta = orchestrator.end_date_utc - orchestrator.start_date_utc

        self.assertAlmostEqual(delta.total_seconds() / 86400.0, 15.0, delta=0.1)



    def test_30_day_rolling_window(self):

        """Test 30-day maximum rolling window setup."""

        orchestrator = RollingPipelineOrchestrator(rolling_days=30)

        self.assertEqual(orchestrator.rolling_days, 30)

        self.assertEqual(orchestrator.mode, "LIVE_ROLLING")



    def test_invalid_rolling_window_rejection(self):

        """Test rejection of rolling window values outside 15–30 range."""

        with self.assertRaises(ValueError):

            RollingPipelineOrchestrator(rolling_days=10)



        with self.assertRaises(ValueError):

            RollingPipelineOrchestrator(rolling_days=45)



    def test_future_date_rejection(self):

        """Test rejection of future start or end dates."""

        future_start = (datetime.now(timezone.utc) + timedelta(days=10)).strftime("%Y-%m-%d")

        future_end = (datetime.now(timezone.utc) + timedelta(days=25)).strftime("%Y-%m-%d")

        with self.assertRaises(ValueError):

            RollingPipelineOrchestrator(start_date=future_start, end_date=future_end)



    def test_start_greater_than_end_rejection(self):

        """Test rejection when start_date > end_date."""

        with self.assertRaises(ValueError):

            RollingPipelineOrchestrator(start_date="2026-08-20", end_date="2026-08-10")



    def test_explicit_backfill_mode(self):

        """Test explicit historical start/end dates set BACKFILL mode."""

        orchestrator = RollingPipelineOrchestrator(

            start_date="2026-08-01", end_date="2026-08-10", dry_run=True

        )

        self.assertEqual(orchestrator.mode, "BACKFILL")

        self.assertTrue(orchestrator.dry_run)



    def test_exact_34_feature_contract(self):

        """Test feature matrix generation produces exact 34 predictors matching allowlist."""

        orchestrator = RollingPipelineOrchestrator(rolling_days=15, dry_run=True)

        df_34, metadata = orchestrator.build_rolling_feature_matrix()



        self.assertEqual(df_34.shape[1], 34)

        self.assertListEqual(list(df_34.columns), EXPECTED_34_PREDICTORS)



        # Verify prohibited columns are excluded

        self.assertNotIn("soil_moisture_missing", df_34.columns)

        self.assertNotIn("sample_id", df_34.columns)

        self.assertNotIn("timestamp_utc", df_34.columns)



    def test_quality_gates(self):

        """Test execution of 15 quality gates."""

        orchestrator = RollingPipelineOrchestrator(rolling_days=15, dry_run=True)

        df_34, _ = orchestrator.build_rolling_feature_matrix()

        passed, gates = orchestrator.execute_quality_gates(df_34)



        self.assertEqual(len(gates), 15)

        self.assertTrue(gates["12_exact_34_feature_count"]["passed"])

        self.assertTrue(gates["13_no_nan_inf_in_predictors"]["passed"])



    def test_dry_run_execution(self):

        """Test dry-run mode returns summary without errors."""

        orchestrator = RollingPipelineOrchestrator(rolling_days=15, dry_run=True)

        res = orchestrator.run()



        self.assertTrue(res["dry_run"])

        self.assertEqual(res["34_feature_contract"], "PASS")





if __name__ == "__main__":

    unittest.main()
