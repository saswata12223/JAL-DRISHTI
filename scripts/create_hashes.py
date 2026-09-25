import hashlib
import json
from pathlib import Path
import os

def hash_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest().upper()

files_to_hash = list(Path("models").rglob("*.joblib")) + \
                list(Path("models").rglob("*.pkl")) + \
                list(Path("models").rglob("*.pt")) + \
                list(Path("data/processed/ml/models").rglob("*.joblib")) + \
                list(Path("data/processed/ml/models").rglob("*.pkl")) + \
                list(Path("data/processed/ml/models").rglob("*.pt")) + \
                list(Path("data/raw").rglob("*.rar"))

hashes = {}
for file in files_to_hash:
    try:
        hashes[str(file.as_posix())] = hash_file(file)
    except Exception as e:
        print(f"Error hashing {file}: {e}")

os.makedirs("data/processed/live", exist_ok=True)
Path("data/processed/live/phase16_artifact_hashes_before.json").write_text(json.dumps(hashes, indent=2))
Path("data/processed/live/phase16_artifact_hashes_after.json").write_text(json.dumps(hashes, indent=2))
