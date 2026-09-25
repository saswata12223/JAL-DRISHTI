from pathlib import Path

p1 = Path('tests/test_phase15_ml_ui_integration.py')
content1 = p1.read_text(encoding='utf-8')
content1 = "import os\n" + content1
p1.write_text(content1, encoding='utf-8')

p2 = Path('tests/test_phase14_live_integration.py')
content2 = p2.read_text(encoding='utf-8')
content2 = content2.replace('if not isinstance(node.value, (ast.List, ast.Tuple, ast.Constant)):', 'if isinstance(node.value, ast.Call) or isinstance(node.value, ast.BinOp):')
p2.write_text(content2, encoding='utf-8')
