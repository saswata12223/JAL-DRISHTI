import os
import glob
import re

frontend_dir = r"d:\Github\JAL_DRISTI_TEAM_READY_2026-09\frontend\src"

for filepath in glob.iglob(frontend_dir + '/**/*.jsx', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(r'Flood Probability', 'ML Risk Score', content, flags=re.IGNORECASE)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for filepath in glob.iglob(frontend_dir + '/**/*.js', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Do not replace code variables like floodProbability or flood_probability
    # Only replace literal 'Flood Probability' strings
    new_content = content.replace('Flood Probability', 'ML Risk Score')
    new_content = new_content.replace('flood probability', 'ML risk score')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
