from pathlib import Path

def remove_reference(file_path):
    content = Path(file_path).read_text(encoding='utf-8')
    content = content.replace('REFERENCE_DECISIONS_WITH_ACTIONS[0]', 'null')
    content = content.replace('useState(REFERENCE_DECISIONS_WITH_ACTIONS)', 'useState([])')
    content = content.replace('REFERENCE_DECISIONS_WITH_ACTIONS.map', 'decisions.map')
    # Remove import
    content = content.replace('REFERENCE_DECISIONS_WITH_ACTIONS,', '')
    Path(file_path).write_text(content, encoding='utf-8')
    print(f"Updated {file_path}")

remove_reference('frontend/src/pages/AnalyticsPage.jsx')
remove_reference('frontend/src/pages/ModelIntelligencePage.jsx')

# Now remove it from modelIntelligenceService.js
p = Path('frontend/src/services/modelIntelligenceService.js')
content = p.read_text(encoding='utf-8')
import re
# Remove the buildReferenceDecisions block and export
content = re.sub(r'// CANONICAL CALIBRATED REFERENCE DECISIONS.*?export const REFERENCE_DECISIONS_WITH_ACTIONS = [^\n]*\n\s*\.\.\.d,\n.*?\}\);', '', content, flags=re.DOTALL)
# Also remove MODEL_DISTRICTS which depends on REFERENCE_DECISIONS
content = re.sub(r'export const MODEL_DISTRICTS = Array\.from\([\s\S]*?\}\);', '', content, flags=re.DOTALL)

p.write_text(content, encoding='utf-8')
