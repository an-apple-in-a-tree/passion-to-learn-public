#!/bin/bash

# Check if python3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed or not in PATH"
    exit 1
fi

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Download NLTK data
python3 -c "import nltk; nltk.download('punkt')"

# Create necessary directories
mkdir -p models

echo "Setup completed successfully!" 