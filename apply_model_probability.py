import os
import glob
import re

frontend_dir = r"d:\Github\JAL_DRISTI_TEAM_READY_2026-09\frontend\src"

targets = [
    r'Flood Probability',
    r'flood probability',
    r'Probability of Flood',
    r'Chance of Flood',
    r'ML Risk Score',
    r'ML risk score'
]

for filepath in glob.iglob(frontend_dir + '/**/*.jsx', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for target in targets:
        # Avoid changing variable names if they match
        new_content = re.sub(target, 'Model Probability', new_content, flags=re.IGNORECASE)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for filepath in glob.iglob(frontend_dir + '/**/*.js', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    # For JS files, only exact case replacements to avoid breaking variables
    new_content = new_content.replace('Flood Probability', 'Model Probability')
    new_content = new_content.replace('flood probability', 'Model Probability')
    new_content = new_content.replace('Probability of Flood', 'Model Probability')
    new_content = new_content.replace('Chance of Flood', 'Model Probability')
    new_content = new_content.replace('ML Risk Score', 'Model Probability')
    new_content = new_content.replace('ML risk score', 'Model Probability')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
