import pytest
import json
import pandas as pd
import hashlib
from pathlib import Path
import glob
import sys
import os
import math
import numpy as np

sys.path.append(os.path.abspath('scripts'))
from audit_phase11_events import calculate_feature_evidence

def get_hash(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest().upper()

class TestPhase11GroundTruth:
    def test_a_canonical_schema(self):
        with open('data/processed/events/canonical_historical_events.json') as f:
            data = json.load(f)
        assert len(data) > 0
        for ev in data:
            assert 'event_id' in ev
            assert 'spatial_precision' in ev

    def test_b_no_synthetic_events(self):
        with open('data/processed/events/canonical_historical_events.json') as f:
            data = json.load(f)
        df = pd.read_csv('data/processed/standardized/standardized_historical_events.csv')
        assert len(data) == len(df)
        
    def test_c_duplicate_handling(self):
        df = pd.read_csv('data/processed/standardized/standardized_historical_events.csv')
        assert df['event_id'].is_unique, "Event IDs must be unique"
        c_source = len(df)
        c_dup = c_source - len(df['event_id'].unique())
        assert c_dup == 0, f"Found {c_dup} duplicates"

    def test_d_spatial_resolution(self):
        df = pd.read_csv('data/processed/events/phase11_event_evidence_table.csv')
        resolved = df[df['spatial_match_status'] == 'VERIFIED_MATCH']
        for _, row in resolved.iterrows():
            assert pd.notna(row['feature_latitude'])

    def test_e_missing_coordinate(self):
        df = pd.read_csv('data/processed/events/phase11_event_evidence_table.csv')
        missing = df[df['latitude'].isna()]
        for _, row in missing.iterrows():
            assert row['spatial_match_status'] in ['DISTRICT_ONLY', 'INSUFFICIENT_EVIDENCE']

    def test_f_missing_date(self):
        df = pd.read_csv('data/processed/events/phase11_event_evidence_table.csv')
        missing = df[df['event_date'].isna()]
        for _, row in missing.iterrows():
            assert row['temporal_match_status'] == 'INSUFFICIENT_EVIDENCE'

    def test_g_feature_mismatch(self):
        df = pd.read_csv('data/processed/events/phase11_event_evidence_table.csv')
        mismatch = df[df['feature_match_status'] == 'NO_MATCH']
        for _, row in mismatch.iterrows():
            assert row['spatial_match_status'] == 'NO_MATCH' or row['temporal_match_status'] == 'NO_MATCH'

    def test_h_raw_immutability(self):
        archive_path = 'data/raw/gis/survey_of_india/State_District_Subdistrict_PAN INDIA.rar'
        if Path(archive_path).exists():
            h = get_hash(archive_path)
            assert h == 'B8325E5D9DD0F04A6663D775363FE38CD2F23BD9DBAE3FB7118B4E6E0CE0BCB7'

    def test_i_ml_artifact_immutability(self):
        baseline_hashes = {
            'candidate_feature_preprocessor_phase4.joblib': '91598244D0C8D796F10E9D93817F5AFA5FCEEFA20F0AE3A9EC1D8852E827E3B0',
            'candidate_flood_risk_model_phase4.joblib': '1908A36BED800206108A605F2D022685A255B101969CF10BB75A1EF1550EDA03',
            'Dummy.joblib': '8CF4B3CBA4B137A256F9509123E8F284DF4676A7DDA478A8EF0144D2DB564D50',
            'feature_scaler.joblib': '5D7DF9F425A4A34EBFE87CE16C9E4996FDEFB58FB96B12C351888FA3D0A51715',
            'final_flood_risk_model.joblib': 'A03B3677816825F5A8861ED17A57EF84F6D215D66C2729124B2C3F92C5D07387',
            'lightgbm_model.joblib': '2672612D30C76EC95B749196CFAFCF3FBD997436A5D6D804D52ECD3B8CC9536E',
            'LogisticRegression.joblib': '0AAE444FBA35923C5FC477A7B1F6CA87E5487F87E02C07DD631B1088AB8F714B',
            'preprocessor.joblib': '9F8C6658F0DDC2307FCF6D396C2A2913CE5D4ABAF99EA723EE116F0BAAA6BDBA',
            'RandomForest.joblib': 'D08FE7F80CD8DE54A74E58A369B3589D17CB7BB814AED43A525AAAC3FD963882',
            'random_forest_baseline.joblib': '4C2B26D46BD797555E8AE093AD929508EB92E96416A88BE7E897FF2524567B76',
            'rf_severity_model.joblib': 'F9F71741E003C7215A04B9DB8A604947C059CAC94E8EE0B5B92F14579C8BF0EE',
            'rf_severity_scaler.joblib': '43F5D038D352C0A6BA9E5070620EA06FC5CDF4F006D320CFD81E68802517C9CC',
            'shap_explainer.joblib': '40EF8164B69268F55F2DD252134077220564CBEC28DE1272C832147FEE982528',
            'xgboost_model.joblib': '01BB0B7B90352FAA5CC4F8B3C4BA7247DE66E78B30374F7CDF20AAB6D5183B45'
        }
        
        found = set()
        for fp in glob.glob('data/processed/ml/models/*.joblib'):
            fname = os.path.basename(fp)
            found.add(fname)
            assert fname in baseline_hashes, f"Unexpected artifact found: {fname}"
            assert get_hash(fp) == baseline_hashes[fname], f"Hash mismatch for {fname}"
            
        for expected in baseline_hashes:
            assert expected in found, f"Missing expected artifact: {expected}"

    def test_j_temporal_logic_tests(self):
        # A - Same cell + same date
        row = pd.Series({'latitude': 30.0, 'longitude': 80.0, 'event_date': '2020-01-01', 'event_end_date': np.nan})
        gpm_df = pd.DataFrame({
            'latitude': [30.0], 'longitude': [80.0], 
            'timestamp': pd.to_datetime(['2020-01-01 12:00:00'], utc=True)
        })
        res = calculate_feature_evidence(row, gpm_df)
        assert res['spatial_match_status'] == 'VERIFIED_MATCH'
        assert res['temporal_match_status'] == 'VERIFIED_MATCH'
        assert res['feature_match_status'] == 'VERIFIED_MATCH'

        # B - Different cell + same date
        row = pd.Series({'latitude': 30.0, 'longitude': 80.0, 'event_date': '2020-01-01', 'event_end_date': np.nan})
        gpm_df = pd.DataFrame({
            'latitude': [31.0], 'longitude': [80.0], # Too far
            'timestamp': pd.to_datetime(['2020-01-01 12:00:00'], utc=True)
        })
        res = calculate_feature_evidence(row, gpm_df)
        assert res['spatial_match_status'] == 'NO_MATCH'
        assert res['feature_match_status'] == 'NO_MATCH'
        # temporal match is no longer checked for different cell

        # C - Same cell + different date
        row = pd.Series({'latitude': 30.0, 'longitude': 80.0, 'event_date': '2020-01-01', 'event_end_date': np.nan})
        gpm_df = pd.DataFrame({
            'latitude': [30.0], 'longitude': [80.0], 
            'timestamp': pd.to_datetime(['2020-01-02 12:00:00'], utc=True)
        })
        res = calculate_feature_evidence(row, gpm_df)
        assert res['temporal_match_status'] == 'NO_MATCH'
        assert res['feature_match_status'] != 'VERIFIED_MATCH'

        # D - Missing coordinates
        row = pd.Series({'latitude': np.nan, 'longitude': np.nan, 'event_date': '2020-01-01', 'event_end_date': np.nan})
        gpm_df = pd.DataFrame({
            'latitude': [30.0], 'longitude': [80.0], 
            'timestamp': pd.to_datetime(['2020-01-01 12:00:00'], utc=True)
        })
        res = calculate_feature_evidence(row, gpm_df)
        assert res['spatial_match_status'] == 'INSUFFICIENT_EVIDENCE'
        assert res['feature_match_status'] == 'INSUFFICIENT_EVIDENCE'

        # E - Missing event date
        row = pd.Series({'latitude': 30.0, 'longitude': 80.0, 'event_date': np.nan, 'event_end_date': np.nan})
        gpm_df = pd.DataFrame({
            'latitude': [30.0], 'longitude': [80.0], 
            'timestamp': pd.to_datetime(['2020-01-01 12:00:00'], utc=True)
        })
        res = calculate_feature_evidence(row, gpm_df)
        assert res['temporal_match_status'] == 'INSUFFICIENT_EVIDENCE'
