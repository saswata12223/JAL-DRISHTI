// Semantic color maps for Hydraulic Intelligence Core
export const RISK_COLORS = {
  LOW: '#10b981',       // Emerald
  MODERATE: '#f59e0b',  // Amber
  HIGH: '#f97316',      // Orange
  EXTREME: '#ef4444',   // Alert Red
  UNAVAILABLE: '#859491',// Muted Grey
};

export const ALERT_PRIORITY_COLORS = {
  INFORMATION: '#10b981',
  WATCH: '#f59e0b',
  WARNING: '#f97316',
  CRITICAL: '#ef4444',
};

export const CWC_STAGE_COLORS = {
  BELOW_WARNING: '#859491',
  WARNING_ZONE: '#f59e0b',
  DANGER_ZONE: '#f97316',
  ABOVE_HFL: '#ef4444',
  UNAVAILABLE: '#859491',
};

export function getRiskColor(level) {
  return RISK_COLORS[level?.toUpperCase()] || RISK_COLORS.LOW;
}

export function getRiskBgClass(level) {
  switch (level?.toUpperCase()) {
    case 'EXTREME': return 'bg-risk-extreme';
    case 'HIGH': return 'bg-risk-high';
    case 'MODERATE': return 'bg-risk-moderate';
    case 'LOW': return 'bg-risk-low';
    default: return 'bg-outline';
  }
}

export function getRiskTextClass(level) {
  switch (level?.toUpperCase()) {
    case 'EXTREME': return 'text-risk-extreme';
    case 'HIGH': return 'text-risk-high';
    case 'MODERATE': return 'text-risk-moderate';
    case 'LOW': return 'text-risk-low';
    default: return 'text-outline';
  }
}

export function getRiskBorderClass(level) {
  switch (level?.toUpperCase()) {
    case 'EXTREME': return 'border-risk-extreme';
    case 'HIGH': return 'border-risk-high';
    case 'MODERATE': return 'border-risk-moderate';
    case 'LOW': return 'border-risk-low';
    default: return 'border-outline';
  }
}
