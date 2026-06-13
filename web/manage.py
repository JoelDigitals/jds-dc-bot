#!/usr/bin/env python
import os
import sys
from pathlib import Path

# Load .env before Django starts
try:
    from dotenv import load_dotenv
    dotenv_path = Path(__file__).resolve().parent.parent / '.env'
    load_dotenv(dotenv_path)
except ImportError:
    pass

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_overlay.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError:
        raise ImportError("Django nicht installiert. pip install django")
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
