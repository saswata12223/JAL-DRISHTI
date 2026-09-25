import os
import sys
import traceback
from pathlib import Path

# Add scripts directory to path to allow imports
repo_root = Path(__file__).resolve().parents[2]
sys.path.append(str(repo_root))

from scripts.forensic_audit import baseline_manager
from scripts.forensic_audit import ocr_recovery
from scripts.forensic_audit import table_recovery
from scripts.forensic_audit import visual_recovery
from scripts.forensic_audit import geospatial_recovery
from scripts.forensic_audit import structured_audit
from scripts.forensic_audit import domain_entities
from scripts.forensic_audit import final_report

def main():
    print("=== Jal Drishti Raw Information Recovery Orchestrator ===")
    
    phases = [
        ("Phase 0 & 1: Freeze Baseline and Raw Inventory", lambda: (
            baseline_manager.freeze_baseline(repo_root),
            baseline_manager.generate_raw_inventory(repo_root, repo_root / "data" / "processed" / "extraction" / "recovery" / "fresh_raw_inventory.csv")
        )),
        ("Phase 3 & 4: OCR Recovery", lambda: ocr_recovery.extract_ocr_pages(repo_root, ocr_recovery.run_ocr_test(repo_root))),
        ("Phase 7-10: Table Recovery", lambda: table_recovery.extract_tables(repo_root)),
        ("Phase 11-17: Visual Recovery", lambda: visual_recovery.extract_and_classify_visuals(repo_root)),
        ("Phase 18-21: Geospatial Recovery", lambda: geospatial_recovery.process_rasters_and_vectors(repo_root)),
        ("Phase 22: Structured Audit", lambda: structured_audit.audit_structured_data(repo_root)),
        ("Phase 23: Domain Entities", lambda: domain_entities.extract_domain_entities(repo_root)),
        ("Phase 24-28: Final Report & Validation", lambda: final_report.generate_final_report(repo_root))
    ]
    
    for phase_name, phase_func in phases:
        print(f"\n--- Starting {phase_name} ---")
        try:
            phase_func()
            print(f"--- Completed {phase_name} ---")
        except Exception as e:
            print(f"!!! ERROR in {phase_name} !!!")
            traceback.print_exc()
            # Do not stop execution for independent phases
            
    print("\n=== All Recovery Phases Completed ===")
    
if __name__ == "__main__":
    main()
