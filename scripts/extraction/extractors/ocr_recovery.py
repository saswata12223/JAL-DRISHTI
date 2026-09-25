import cv2
import numpy as np
import pytesseract
from pathlib import Path

def preprocess_image(img, method='adaptive'):
    """Preprocess image for OCR."""
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    if method == 'raw':
        return gray
    elif method == 'grayscale':
        return gray
    elif method == 'adaptive':
        # Adaptive thresholding
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        return thresh
    elif method == 'otsu':
        # Otsu's thresholding
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh
    elif method == 'denoise':
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        return denoised
    return gray

def ocr_page(page_image_array, methods=['raw', 'adaptive', 'otsu']):
    """Run OCR with multi-pass recovery.
    Returns best text, confidence, and method.
    """
    best_text = ""
    best_conf = 0.0
    best_method = "raw"
    
    for method in methods:
        processed_img = preprocess_image(page_image_array, method=method)
        
        # Get OCR data (includes confidence per word)
        try:
            data = pytesseract.image_to_data(processed_img, output_type=pytesseract.Output.DICT)
            text = pytesseract.image_to_string(processed_img)
            
            # Calculate average confidence of valid words
            confidences = [int(conf) for conf in data['conf'] if int(conf) != -1]
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            
            if avg_conf > best_conf:
                best_conf = avg_conf
                best_text = text
                best_method = method
                
            # If confidence is very high, we can short-circuit
            if avg_conf > 90.0:
                break
        except Exception as e:
            # If tesseract fails for any reason
            continue
            
    return best_text, best_conf, best_method
