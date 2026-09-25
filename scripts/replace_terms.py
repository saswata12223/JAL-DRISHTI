import os
import re
from pathlib import Path

def replace_terms(file_path):
    content = file_path.read_text(encoding='utf-8')
    orig = content
    
    # Simple regex replace for forbidden terminology
    replacements = [
        (r'Flood Probability', 'Model Probability'),
        (r'Probability of Flood', 'Model Probability'),
        (r'Chance of Flood', 'Model Probability'),
        (r'ML Risk Score', 'Model Probability'),
        (r'Risk Probability', 'Model Probability'),
        (r'Flood Risk Probability', 'Model Probability')
    ]
    
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content, flags=re.IGNORECASE)
        
    if orig != content:
        file_path.write_text(content, encoding='utf-8')
        print(f"Updated {file_path}")

frontend_dir = Path('frontend/src')
for root, _, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith('.jsx') or f.endswith('.js'):
            replace_terms(Path(root) / f)
