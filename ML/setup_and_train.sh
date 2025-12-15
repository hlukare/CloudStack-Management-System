#!/bin/bash

echo "========================================="
echo "ML Models Setup and Training"
echo "========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Generate datasets
echo ""
echo "========================================="
echo "Generating Datasets..."
echo "========================================="
python generate_datasets.py

# Train models
echo ""
echo "========================================="
echo "Training ML Models..."
echo "========================================="
python train_models.py

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo "To start the ML API server, run:"
echo "  source venv/bin/activate"
echo "  python ml_api_server.py"
echo "========================================="
