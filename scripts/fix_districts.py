from pathlib import Path

districts = "export const MODEL_DISTRICTS = ['Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'];\n"

p = Path('frontend/src/services/modelIntelligenceService.js')
content = p.read_text(encoding='utf-8')
content += "\n" + districts
p.write_text(content, encoding='utf-8')

# Also fix AnalyticsPage.jsx and ModelIntelligencePage.jsx mapping error
# We replaced REFERENCE_DECISIONS_WITH_ACTIONS.map with decisions.map, which is fine since decisions is state.
# Let's ensure decisions is initialized as an empty array correctly.
for f in ['frontend/src/pages/AnalyticsPage.jsx', 'frontend/src/pages/ModelIntelligencePage.jsx']:
    c = Path(f).read_text(encoding='utf-8')
    c = c.replace('import { MODEL_DISTRICTS,  } from', 'import { MODEL_DISTRICTS } from')
    c = c.replace('import {  MODEL_DISTRICTS } from', 'import { MODEL_DISTRICTS } from')
    c = c.replace('import { MODEL_DISTRICTS } from', 'import { MODEL_DISTRICTS } from')
    Path(f).write_text(c, encoding='utf-8')

print("Fixed MODEL_DISTRICTS")
