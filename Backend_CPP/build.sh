#!/bin/bash

echo "========================================="
echo "Building Cloud VM Backend (C++)"
echo "========================================="

# Create build directory
mkdir -p build
cd build

# Configure with CMake
echo "Configuring with CMake..."
cmake .. -DCMAKE_BUILD_TYPE=Release

if [ $? -ne 0 ]; then
    echo "Error: CMake configuration failed"
    exit 1
fi

# Build
echo "Building project..."
make -j$(nproc)

if [ $? -ne 0 ]; then
    echo "Error: Build failed"
    exit 1
fi

echo ""
echo "========================================="
echo "Build successful!"
echo "========================================="
echo "Executable: build/CloudVMBackend"
echo ""
echo "To run:"
echo "  cd build && ./CloudVMBackend"
echo "========================================="
