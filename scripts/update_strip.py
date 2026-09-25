from pathlib import Path
import re

p = Path('frontend/src/components/landing/LiveSituationStrip.jsx')
content = p.read_text(encoding='utf-8')

# Add isHistorical to state
if 'const [isHistorical, setIsHistorical] = useState(false);' not in content:
    content = content.replace(
        'const [lastUpdated, setLastUpdated] = useState(\'\');',
        'const [lastUpdated, setLastUpdated] = useState(\'\');\n  const [isHistorical, setIsHistorical] = useState(false);'
    )

# Update fetchData to set isHistorical
fetch_mod = '''      if (decisionsRes.decisions) {
         if (decisionsRes.source === 'HISTORICAL_MODEL_OUTPUT') {
            setIsHistorical(true);
         } else {
            setIsHistorical(false);
         }'''
content = content.replace('      if (decisionsRes.decisions) {', fetch_mod)

# Update LIVE SITUATION text
content = content.replace('>LIVE SITUATION<', '>{isHistorical ? "HISTORICAL MODEL OUTPUT" : "LIVE SITUATION"}<')

p.write_text(content, encoding='utf-8')
print("Updated LiveSituationStrip.jsx")
