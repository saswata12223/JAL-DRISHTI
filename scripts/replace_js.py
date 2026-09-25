import sys
from pathlib import Path

js_path = Path('frontend/src/services/modelIntelligenceService.js')
js_content = js_path.read_text(encoding='utf-8')

# Remove REFERENCE_DECISIONS_WITH_ACTIONS fallback
old_load = '''export async function loadModelDecisions() {
  try {
    const res = await riskService.getLatestDecisions({ limit: 100 });
    const payload = Array.isArray(res) ? res : res?.data;
    const raw = Array.isArray(payload) ? payload : [];
    if (!raw.length) {
      devWarning('Live decisions empty \u2014 retaining calibrated reference.');
      return { decisions: REFERENCE_DECISIONS_WITH_ACTIONS, source: 'CALIBRATED_REFERENCE', reason: 'Live /risk/latest returned no records.' };
    }
    const mapped = raw.map(mapLiveDecision);
    const { valid, reasons, records } = validateLiveDecisions(mapped);
    if (valid && records.length > 0) {
      devWarning(Adopting validated live decisions ( + "$" + {records.length}).);
      return { decisions: records, source: 'LIVE_BACKEND', reason: null };
    }
    devWarning(Live decisions rejected ( + "$" + {reasons.join('; ')}). Retaining calibrated reference.);
    return {
      decisions: REFERENCE_DECISIONS_WITH_ACTIONS,
      source: 'CALIBRATED_REFERENCE',
      reason: Live model snapshot rejected:  + "$" + {reasons.join('; ')}.,
    };
  } catch (err) {
    devWarning('Live decisions fetch failed; retaining calibrated reference.', err);
    return {
      decisions: REFERENCE_DECISIONS_WITH_ACTIONS,
      source: 'CALIBRATED_REFERENCE',
      reason: 'Live /risk/latest request failed. Showing calibrated reference.',
    };
  }
}'''

# Note: The text in the file has a literal '?"' due to encoding issues with em-dash in Windows PS output. We'll use regex or simple string replacement on just the function block.
import re

new_load = '''export async function loadModelDecisions() {
  try {
    const res = await riskService.getOfflineDecisions({ limit: 100 });
    const payload = Array.isArray(res) ? res : res?.data;
    const raw = Array.isArray(payload) ? payload : [];
    if (!raw.length) {
      return { decisions: [], source: 'UNAVAILABLE', reason: 'No historical ML records.' };
    }
    const mapped = raw.map(mapLiveDecision);
    return { decisions: mapped, source: 'HISTORICAL_MODEL_OUTPUT', reason: null };
  } catch (err) {
    return { decisions: [], source: 'UNAVAILABLE', reason: 'Failed to fetch historical ML records.' };
  }
}'''

js_content = re.sub(r'export async function loadModelDecisions\(\)\s*\{.*?(?=\n// -{20,})', new_load + '\n\n', js_content, flags=re.DOTALL)
js_path.write_text(js_content, encoding='utf-8')
print("Replaced loadModelDecisions")
