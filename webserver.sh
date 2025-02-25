#!/bin/bash
cd "$(dirname "$0")"  # Change to the script's directory
python3 -m http.server 8000
