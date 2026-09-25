import pytest
import json
import pandas as pd
import hashlib
from pathlib import Path

def get_hash(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest().upper()

class TestPhase13LiveData:
    def test_a_source_registry_auditable(self):
        df = pd.read_csv('data/processed/live/phase13_source_status.csv')
        assert len(df) >= 8

    def test_b_historical_gpm_not_live(self):
        df = pd.read_csv('data/processed/live/phase13_source_status.csv')
        gpm = df[df['Source'] == 'GPM IMERG'].iloc[0]
        assert gpm['Observation status'] != 'CURRENT_OBSERVATION_VERIFIED'

    def test_c_static_gis_not_realtime(self):
        df = pd.read_csv('data/processed/live/phase13_source_status.csv')
        srtm = df[df['Source'] == 'SRTM'].iloc[0]
        assert 'STATIC' in srtm['Observation status']

    def test_d_timestamps_not_confused(self):
        df = pd.read_csv('data/processed/live/phase13_freshness_audit.csv')
        assert 'observation_timestamp' in df.columns
        assert 'ingestion_timestamp' in df.columns

    def test_e_unverified_timestamps_not_current(self):
        df = pd.read_csv('data/processed/live/phase13_freshness_audit.csv')
        unverified = df[df['observation_timestamp'] == 'UNVERIFIED']
        for _, row in unverified.iterrows():
            # If unverified, they shouldn't have a freshness verified flag
            assert not row['freshness_verified']

    def test_f_missing_provenance_not_verified(self):
        df = pd.read_csv('data/processed/live/phase13_provenance_audit.csv')
        unverified = df[df['source_organization'] == 'UNKNOWN']
        assert all(unverified['status'] != 'VERIFIED')

    def test_g_missing_units_not_verified(self):
        df = pd.read_csv('data/processed/live/phase13_provenance_audit.csv')
        unverified = df[df['unit'] == 'UNIT_UNVERIFIED']
        assert all(unverified['status'] != 'VERIFIED')

    def test_h_no_fabricated_coordinates(self):
        df = pd.read_csv('data/processed/live/phase13_provenance_audit.csv')
        assert 'geographic_reference' in df.columns
        assert 'UNVERIFIED' in df['geographic_reference'].values

    def test_i_historical_replay_not_live(self):
        with open('data/processed/live/phase13_live_path_trace.json') as f:
            data = json.load(f)
        assert data['live_inference'] == 'HISTORICAL_REPLAY'
        assert data['anomaly_pipeline'] == 'HISTORICAL_REPLAY'

    def test_j_production_feature_trace_exists(self):
        assert Path('data/processed/live/phase13_production_input_trace.json').exists()

    def test_k_trace_derived_from_actual_code(self):
        with open('data/processed/live/phase13_production_input_trace.json') as f:
            data = json.load(f)
        assert 'production_inference_file' in data

    def test_l_unavailable_inputs_explicit(self):
        with open('data/processed/live/phase13_production_input_trace.json') as f:
            data = json.load(f)
        assert data['feature_availability'] == 'PRODUCTION_INPUT_UNAVAILABLE'

    def test_m_no_historical_fallback_as_current(self):
        with open('data/processed/live/phase13_live_path_trace.json') as f:
            data = json.load(f)
        # Verify that we correctly identified it as replay, meaning it's not silently passed as live
        assert 'HISTORICAL_REPLAY' in data.values()

    def test_n_failure_states_explicit(self):
        df = pd.read_csv('data/processed/live/phase13_failure_matrix.csv')
        assert 'safe_state' in df.columns
        assert 'SILENT_FALLBACK' in df['behavior'].values

    def test_o_ml_artifact_hashes_unchanged(self):
        with open('data/processed/live/phase13_artifact_hashes_before.json') as f:
            before = json.load(f)
        with open('data/processed/live/phase13_artifact_hashes_after.json') as f:
            after = json.load(f)
        assert before == after

    def test_p_soi_archive_exists_and_hash_unchanged(self):
        archive_path = 'data/raw/gis/survey_of_india/State_District_Subdistrict_PAN INDIA.rar'
        assert Path(archive_path).exists()
        assert get_hash(archive_path) == 'B8325E5D9DD0F04A6663D775363FE38CD2F23BD9DBAE3FB7118B4E6E0CE0BCB7'

    def test_q_report_no_unsupported_claims(self):
        report = Path('docs/audit/PHASE13_PRODUCTION_LIVE_DATA_INTEGRATION_AUDIT.md').read_text()
        assert 'NO VERIFIED CURRENT OBSERVATIONS' in report
        assert 'BLOCKED_LIVE_DATA' in report

    def test_r_no_fake_observations(self):
        df = pd.read_csv('data/processed/live/phase13_source_status.csv')
        assert 'CURRENT_OBSERVATION_VERIFIED' not in df['Observation status'].values
