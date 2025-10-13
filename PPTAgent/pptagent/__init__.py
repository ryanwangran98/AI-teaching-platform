"""PPTAgent: Generating and Evaluating Presentations Beyond Text-to-Slides.

This package provides tools to automatically generate presentations from documents,
following a two-phase approach of Analysis and Generation.

For more information, visit: https://github.com/icip-cas/PPTAgent
"""

__version__ = "0.2.0"
__author__ = "Hao Zheng"
__email__ = "wszh712811@gmail.com"


# Check the version of python and python-pptx

from packaging.version import Version
from pptx import __version__ as PPTXVersion

try:
    # Try to parse version with Mark first (for custom version)
    PPTXVersion, Mark = PPTXVersion.split("+")
    assert Version(PPTXVersion) >= Version("1.0.4") and Mark == "PPTAgent"
except Exception as _:
    try:
        # If custom version check fails, check for standard version
        assert Version(PPTXVersion) >= Version("1.0.2")
        print(f"Warning: Using standard python-pptx version {PPTXVersion}. Some features may not work as expected.")
    except Exception as __:
        raise ImportError(
            "You should install python-pptx version >= 1.0.2 for this project"
        )

# __init__.py
from .pptgen import PPTAgent
from .document import Document
from .presentation import Presentation
from .utils import Config, Language
from .model_utils import ModelManager
from .multimodal import ImageLabler
from .llms import LLM, AsyncLLM
from .mcp_server import PPTAgentServer

__all__ = [
    "__version__",
    "__author__",
    "__email__",
    "PPTAgent",
    "PPTAgentServer",
    "Document",
    "Presentation",
    "Config",
    "Language",
    "ModelManager",
    "ImageLabler",
    "LLM",
    "AsyncLLM",
]
