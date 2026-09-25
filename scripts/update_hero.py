from pathlib import Path

p = Path('frontend/src/components/landing/LiveSituationStrip.jsx')
content = p.read_text(encoding='utf-8')
content = content.replace('Real-time data from multiple sources', '{isHistorical ? "Verified historical model output" : "Real-time data from multiple sources"}')
p.write_text(content, encoding='utf-8')

p2 = Path('frontend/src/components/landing/HeroSection.jsx')
content2 = p2.read_text(encoding='utf-8')
content2 = content2.replace('Explore Live Risk', 'Explore Risk Dashboard')
content2 = content2.replace('Real-time risk intelligence', 'Risk intelligence')
p2.write_text(content2, encoding='utf-8')
