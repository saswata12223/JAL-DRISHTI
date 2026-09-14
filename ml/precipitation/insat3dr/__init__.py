"""

Phase 8.5 — INSAT-3DR QPE / HEOP Experimental Package



Isolated experimental package for INSAT-3DR acquisition, validation, quality control,

and multi-satellite comparison.

"""



from ml.precipitation.insat3dr.adapter import (

    INSAT3DRDataSequenceAdapter,

    INSAT3DRProductMetadata,

)

from ml.precipitation.insat3dr.quality_control import INSAT3DRQualityControl

from ml.precipitation.insat3dr.validation import INSAT3DRGroundValidator

from ml.precipitation.insat3dr.comparison import INSATvsGPMComparator



__all__ = [

    "INSAT3DRDataSequenceAdapter",

    "INSAT3DRProductMetadata",

    "INSAT3DRQualityControl",

    "INSAT3DRGroundValidator",

    "INSATvsGPMComparator",

]
