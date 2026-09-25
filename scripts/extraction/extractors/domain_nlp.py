import re

# Hydrological keywords
KEYWORDS = [
    r'rainfall', r'precipitation', r'cloudburst', r'flood', r'flash flood',
    r'water level', r'discharge', r'hfl', r'lwl', r'danger level',
    r'warning level', r'dam', r'reservoir', r'storage', r'spillway',
    r'catchment', r'watershed', r'basin', r'runoff', r'river',
    r'hydrograph', r'cross section', r'elevation', r'landslide',
    r'debris', r'sediment'
]

# Simple value extraction pattern (matches numbers possibly followed by units)
VALUE_PATTERN = re.compile(r'(\d+(?:\.\d+)?)\s*(m3/s|cumecs|mm|m|km2|km|%|cm)?', re.IGNORECASE)

def extract_entities(text, source_file, page, section="native_text"):
    """
    Extract hydrological entities from text using NLP / Regex.
    Returns a list of extracted entities with provenance.
    """
    entities = []
    text_lower = text.lower()
    
    # Simple sentence segmentation (split by newlines or periods)
    sentences = re.split(r'[\.\n]', text)
    
    for sentence in sentences:
        if not sentence.strip():
            continue
            
        sentence_lower = sentence.lower()
        
        for keyword in KEYWORDS:
            if re.search(r'\b' + keyword + r'\b', sentence_lower):
                # We found a keyword, try to find a value near it
                match = VALUE_PATTERN.search(sentence)
                if match:
                    value = match.group(1)
                    unit = match.group(2) if match.group(2) else "unknown"
                    
                    entities.append({
                        "source_document": source_file,
                        "page": page,
                        "section": section,
                        "table": "None",
                        "entity_type": keyword,
                        "value": value,
                        "unit": unit,
                        "original_context": sentence.strip()[:200], # First 200 chars
                        "confidence": "LOW" # Basic regex is inherently low confidence
                    })
    
    return entities
