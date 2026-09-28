import os
import glob

frontend_dir = r"d:\Github\JAL_DRISTI_TEAM_READY_2026-09\frontend\src"
files = glob.glob(os.path.join(frontend_dir, "**", "*.jsx"), recursive=True)

replacements = [
    ("const isUttarakhand = !selectedState || selectedState === 'Uttarakhand';", "const isUttarakhand = true;"),
    ("const isUttarakhand = stateName === 'Uttarakhand';", "const isUttarakhand = true;"),
    ("const isUttarakhand = selectedState === 'Uttarakhand';", "const isUttarakhand = true;")
]

for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    for old_str, new_str in replacements:
        new_content = new_content.replace(old_str, new_str)
    
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")
