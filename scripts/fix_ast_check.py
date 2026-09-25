import ast
from pathlib import Path

def fix_ast_check(filepath):
    p = Path(filepath)
    c = p.read_text(encoding='utf-8')
    
    # We need to replace the ast.Name check with an ast.Attribute check
    c = c.replace(
        "if isinstance(target, ast.Name) and target.id == '_predictors':",
        "if isinstance(target, ast.Attribute) and target.attr == '_predictors':"
    )
    p.write_text(c, encoding='utf-8')
    print(f"Fixed {filepath}")

fix_ast_check('scripts/audit_phase14_live_integration.py')
fix_ast_check('tests/test_phase14_live_integration.py')
