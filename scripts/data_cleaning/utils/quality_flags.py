class QualityFlags:
    VALID = "valid"
    SUSPICIOUS = "suspicious"
    INVALID = "invalid"
    EXCLUDED = "excluded"
    UNCERTAIN = "uncertain"

def determine_quality(value, valid_min, valid_max):
    try:
        val = float(value)
        if valid_min is not None and val < valid_min:
            return QualityFlags.INVALID
        if valid_max is not None and val > valid_max:
            # We don't mark as invalid for extremes, just suspicious
            return QualityFlags.SUSPICIOUS
        return QualityFlags.VALID
    except:
        return QualityFlags.INVALID
