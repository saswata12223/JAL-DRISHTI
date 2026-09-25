import argparse
import sys
import os
from pathlib import Path

# Add repo root to path
repo_root = Path(__file__).resolve().parents[2]
sys.path.append(str(repo_root))

from scripts.ml_pipeline.time_budget import TimeBudget, CheckpointManager

def main():
    parser = argparse.ArgumentParser(description="Jal Drishti ML Orchestrator")
    parser.add_argument("--max-runtime-minutes", type=int, default=60)
    parser.add_argument("--phase-timeout-minutes", type=int, default=20)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--priority", type=str, default="critical")
    parser.add_argument("--workers", type=int, default=1)
    parser.add_argument("--phase", type=str, default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--test-time-budget", action="store_true")

    args = parser.parse_args()

    print("==================================================")
    print("JAL DRISTI ML PIPELINE ORCHESTRATOR")
    print(f"Max Runtime: {args.max_runtime_minutes} minutes")
    print(f"Dry Run: {args.dry_run}")
    print("==================================================")

    budget = TimeBudget(args.max_runtime_minutes, args.phase_timeout_minutes)
    manager = CheckpointManager(repo_root)

    if args.test_time_budget:
        print("Testing time budget...")
        import time
        budget = TimeBudget(0.01) # 0.6 seconds
        while budget.is_safe():
            time.sleep(0.1)
        print("Time budget test passed (exited safely).")
        return

    phases = [
        ("priority_manifest", "scripts.ml_pipeline.classify_priorities", "generate_manifest"),
        ("tier1_extraction", "scripts.ml_pipeline.tier1_extractor", "run_extraction"),
        ("canonicalize", "scripts.ml_pipeline.canonicalize", "run_canonicalize"),
        ("quality_gate", "scripts.ml_pipeline.quality_gate", "run_gate"),
        ("ml_readiness", "scripts.ml_pipeline.ml_readiness", "run_readiness"),
        ("feature_engineering", "scripts.ml_pipeline.feature_engineering", "run_features"),
        ("train_baseline", "scripts.ml_pipeline.train_baseline", "run_training")
    ]

    for phase_name, module_name, func_name in phases:
        if args.phase and args.phase != phase_name:
            continue

        if not budget.is_safe():
            print(f"Global runtime budget exceeded before {phase_name}. Stopping safely.")
            break

        print(f"\n--- Starting Phase: {phase_name} ---")
        budget.start_phase()
        
        try:
            import importlib
            mod = importlib.import_module(module_name)
            func = getattr(mod, func_name)
            
            # Function should accept (repo_root, budget, manager, args)
            success = func(repo_root, budget, manager, args)
            
            if not success:
                print(f"Phase {phase_name} requested halt (or budget exceeded).")
                break
        except Exception as e:
            print(f"Error in phase {phase_name}: {e}")
            break

    print("\nOrchestrator finished.")

if __name__ == "__main__":
    main()
