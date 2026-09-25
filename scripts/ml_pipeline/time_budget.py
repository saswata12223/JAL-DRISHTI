import time
import csv
import json
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
import shutil

class TimeBudget:
    def __init__(self, global_limit_minutes, phase_limit_minutes=None):
        self.global_limit = global_limit_minutes * 60
        self.phase_limit = phase_limit_minutes * 60 if phase_limit_minutes else None
        self.global_start = time.time()
        self.phase_start = None

    def start_phase(self):
        self.phase_start = time.time()

    def check_global(self):
        if time.time() - self.global_start > self.global_limit:
            return False
        return True

    def check_phase(self):
        if not self.phase_limit:
            return True
        if self.phase_start is None:
            return True
        if time.time() - self.phase_start > self.phase_limit:
            return False
        return True

    def is_safe(self):
        return self.check_global() and self.check_phase()

class CheckpointManager:
    def __init__(self, repo_root):
        self.recovery_dir = Path(repo_root) / "data" / "processed" / "extraction" / "recovery"
        self.recovery_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoint_csv = self.recovery_dir / "recovery_checkpoint.csv"
        self.state_json = self.recovery_dir / "recovery_run_state.json"
        
        self.fields = [
            "source_file", "source_sha256", "content_unit", "page", 
            "phase", "priority", "status", "output_path", 
            "started_at", "completed_at", "error", "attempt_count"
        ]
        
        if not self.checkpoint_csv.exists():
            with open(self.checkpoint_csv, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(self.fields)
                
    def load_completed(self):
        completed = set()
        if not self.checkpoint_csv.exists():
            return completed
            
        with open(self.checkpoint_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["status"] in ["COMPLETE", "DEFERRED_NON_CRITICAL", "FAILED", "NOT_REQUIRED"]:
                    # Unique key: source_file + phase + content_unit
                    key = f"{row['source_file']}|{row['phase']}|{row['content_unit']}"
                    completed.add(key)
        return completed
        
    def write_checkpoint(self, record):
        # Atomic append strategy: write to temp file then replace, 
        # or append with lock. For simple CSV append, we just open in append mode.
        with open(self.checkpoint_csv, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.fields)
            writer.writerow(record)
            f.flush()
            os.fsync(f.fileno())
            
    def update_run_state(self, state):
        state["last_updated"] = time.time()
        with NamedTemporaryFile('w', dir=str(self.recovery_dir), delete=False, encoding="utf-8") as tf:
            json.dump(state, tf, indent=2)
            temp_name = tf.name
        shutil.move(temp_name, str(self.state_json))
