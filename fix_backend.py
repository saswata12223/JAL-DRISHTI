import os
import re

# 1. Fix backend/app/api/routes/observations.py
obs_file = 'backend/app/api/routes/observations.py'
if os.path.exists(obs_file):
    with open(obs_file, 'r', encoding='utf-8') as f:
        obs = f.read()
    
    # Remove the mock weather data fallback
    mock_pattern = re.compile(
        r"if not weather_obs:\s+# Fallback to stations with mock observation structure if needed or empty list.*?weather_obs\.append\(\{.*?\n\s+\}\)",
        re.DOTALL
    )
    if mock_pattern.search(obs):
        obs = mock_pattern.sub("if not weather_obs:\n        weather_obs = []", obs)
        with open(obs_file, 'w', encoding='utf-8') as f:
            f.write(obs)
        print("Fixed observations.py")

# 2. Fix backend/app/api/routes/immediate_actions.py
imm_file = 'backend/app/api/routes/immediate_actions.py'
if os.path.exists(imm_file):
    with open(imm_file, 'r', encoding='utf-8') as f:
        imm = f.read()
    
    # We already emptied _SOS_ALERTS and _SHELTER_REGISTRY via tool call.
    # Now empty tactical_data.
    tactical_pattern = re.compile(
        r"tactical_data = \{\s+\"forces\": \[.*?\],\s+\"ingress_routes\": \[.*?\],\s+\"vulnerable_points\": \[.*?\],\s+\}",
        re.DOTALL
    )
    if tactical_pattern.search(imm):
        imm = tactical_pattern.sub("tactical_data = {\n        \"forces\": [],\n        \"ingress_routes\": [],\n        \"vulnerable_points\": []\n    }", imm)
        with open(imm_file, 'w', encoding='utf-8') as f:
            f.write(imm)
        print("Fixed tactical_data in immediate_actions.py")

