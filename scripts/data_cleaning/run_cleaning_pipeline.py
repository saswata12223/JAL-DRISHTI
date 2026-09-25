import sys
import subprocess
import os

def run_pipeline():
    print("========================================")
    print("JAL DRISTI DATA CLEANING PIPELINE")
    print("========================================\n")
    
    scripts = [
        "run_phase0_policy.py",
        "run_phase1_inventory_and_hash.py",
        "run_phase2_format_crs_validation.py",
        "run_phase3_spatiotemporal_validation.py",
        "run_phase4_quality_and_events.py",
        "run_phase5_clean_generation.py",
        "run_phase6_final_verification.py"
    ]
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(base_path))
    
    for script in scripts:
        print(f"--- Executing {script} ---")
        script_path = os.path.join(base_path, script)
        result = subprocess.run([sys.executable, script_path], cwd=project_root)
        if result.returncode != 0:
            print(f"CRITICAL ERROR: {script} failed with exit code {result.returncode}.")
            print("PIPELINE STATUS: FAILED")
            print("ML READINESS: BLOCKED")
            sys.exit(result.returncode)
        print()
        
    print("PIPELINE STATUS: PASSED")
    
if __name__ == "__main__":
    run_pipeline()
