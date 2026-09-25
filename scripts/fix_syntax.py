from pathlib import Path
p = Path('frontend/src/services/modelIntelligenceService.js')
content = p.read_text(encoding='utf-8')
content = content.replace('// ---------------------------------------------------------------------------\n\n}\n\nexport function validateLiveDecisions(records) {', '// ---------------------------------------------------------------------------\n\nexport function validateLiveDecisions(records) {')
p.write_text(content, encoding='utf-8')
