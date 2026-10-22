"""Compatibility entry point for the current career-experience verification."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('career-experience.py')),run_name='__main__')
