import joblib
import sys
import numpy as np

try:
    model = joblib.load('data/processed/ml/models/final_flood_risk_model.joblib')
    print('TYPE:', type(model))
    
    if hasattr(model, 'classes_'):
        print('CLASSES:', model.classes_)
    else:
        print('CLASSES: Not Found')
        
    if hasattr(model, 'calibrated_classifiers_'):
        print('CALIBRATION_WRAPPER: True')
        print('NUM_CALIBRATED_CLASSIFIERS:', len(model.calibrated_classifiers_))
        if len(model.calibrated_classifiers_) > 0:
            print('CALIBRATION_METHOD:', getattr(model, 'method', 'unknown'))
            base = getattr(model, 'estimator', getattr(model, 'base_estimator', 'unknown'))
            print('BASE_ESTIMATOR_TYPE:', type(base))
    else:
        print('CALIBRATION_WRAPPER: False')
        
except Exception as e:
    print('ERROR:', e)
