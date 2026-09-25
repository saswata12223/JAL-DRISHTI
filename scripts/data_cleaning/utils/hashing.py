import hashlib
from pathlib import Path

def calculate_sha256(filepath: Path, chunk_size: int = 8192) -> str:
    """Calculates SHA-256 for a given file in chunks to handle large files."""
    sha256_hash = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(chunk_size), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception as e:
        return f"ERROR: {str(e)}"
