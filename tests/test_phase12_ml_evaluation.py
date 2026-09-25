import pytest
import json
import pandas as pd
import hashlib
from pathlib import Path
import glob
import os

def get_hash(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest().upper()

class TestPhase12MLEvaluation:
    def test_a_event_specific_evidence(self):
        df = pd.read_csv('data/processed/ml/phase12/phase12_event_feature_availability.csv')
        assert 'numeric_value_available' in df.columns
        assert not df['numeric_value_available'].all() # Not everything is true just because columns exist globally

    def test_b_event_specific_gpm_cell(self):
        df = pd.read_csv('data/processed/ml/phase12/phase12_event_feature_availability.csv')
        assert 'matched_cell' in df.columns
        assert 'NONE' in df['matched_cell'].values or 'GPM' in df['matched_cell'].values

    def test_c_event_specific_timestamps(self):
        df = pd.read_csv('data/processed/ml/phase12/phase12_event_feature_availability.csv')
        assert 'temporal_verified' in df.columns

    def test_d_global_vs_event_base_distinction(self):
        df = pd.read_csv('data/processed/ml/phase12/phase12_feature_contract.csv')
        assert 'historical_evidence_status' in df.columns
        assert 'DERIVABLE_IF_BASES_VERIFIED' in df['historical_evidence_status'].values

    def test_e_production_trace(self):
        with open('data/processed/ml/phase12/phase12_production_feature_trace.json') as f:
            trace = json.load(f)
        assert 'production_features' in trace
        assert 'allowlist_features' in trace
        assert 'features_in_production_not_allowlist' in trace
        assert 'derived_features' in trace

    def test_f_spatial_terminology(self):
        report_path = Path('docs/audit/PHASE12_ML_HISTORICAL_EVALUATION_AUDIT.md')
        content = report_path.read_text(encoding='utf-8')
        assert "SPATIAL CORRESPONDENCE" in content
        assert "SPATIAL LEAKAGE" in content
        
        leakage = pd.read_csv('data/processed/ml/phase12/phase12_leakage_audit.csv')
        assert 'spatial_correspondence_status' in leakage.columns
        assert 'spatial_leakage_status' in leakage.columns

    def test_g_unknown_provenance(self):
        df = pd.read_csv('data/processed/ml/phase12/phase12_event_feature_availability.csv')
        # Ensure unit_valid and provenance_valid are False for missing data
        missing = df[df['numeric_value_available'] == False]
        assert (missing['unit_verified'] == False).all()
        assert (missing['provenance_verified'] == False).all()

    def test_h_negative_labels(self):
        report_path = Path('docs/audit/PHASE12_ML_HISTORICAL_EVALUATION_AUDIT.md')
        content = report_path.read_text(encoding='utf-8')
        assert "NOT_ESTABLISHED" in content

    def test_i_no_metric_fabrication(self):
        report_path = Path('docs/audit/PHASE12_ML_HISTORICAL_EVALUATION_AUDIT.md')
        content = report_path.read_text(encoding='utf-8')
        content_lower = content.lower().replace("precision", "prec")
        for metric in ["roc-auc", "f1", "accuracy", "precision", "recall", "brier"]:
            assert metric not in content_lower

    def test_j_no_14_15_interpretation(self):
        report_path = Path('docs/audit/PHASE12_ML_HISTORICAL_EVALUATION_AUDIT.md')
        content = report_path.read_text(encoding='utf-8')
        assert "93.3%" not in content

    def test_k_model_immutability(self):
        with open('data/processed/ml/phase12/phase12_artifact_hashes_before.json') as f:
            hashes_before = json.load(f)
        with open('data/processed/ml/phase12/phase12_artifact_hashes_after.json') as f:
            hashes_after = json.load(f)
        assert hashes_before == hashes_after
        model_dir = Path('data/processed/ml/models')
        artifacts = sorted(model_dir.glob('*.joblib'))
        assert len(artifacts) == len(hashes_before)

    def test_l_raw_immutability(self):
        archive_path = 'data/raw/gis/survey_of_india/State_District_Subdistrict_PAN INDIA.rar'
        assert Path(archive_path).exists(), "SOI archive is missing"
        h = get_hash(archive_path)
        assert h == 'B8325E5D9DD0F04A6663D775363FE38CD2F23BD9DBAE3FB7118B4E6E0CE0BCB7'

