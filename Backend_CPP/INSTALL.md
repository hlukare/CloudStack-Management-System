# Quick Start Guide - C++ Backend

## Prerequisites Installation (Ubuntu/Debian)

```bash
# Update package lists
sudo apt-get update

# Install build tools
sudo apt-get install -y build-essential cmake git

# Install OpenSSL
sudo apt-get install -y libssl-dev

# Install CURL
sudo apt-get install -y libcurl4-openssl-dev

# Install MongoDB C Driver
sudo apt-get install -y libmongoc-1.0-0 libmongoc-dev libbson-1.0-0 libbson-dev

# Install MongoDB C++ Driver
sudo apt-get install -y libmongocxx-dev libbsoncxx-dev

# Install JSON library
sudo apt-get install -y nlohmann-json3-dev
```

## If MongoDB C++ Driver is Not Available

Install from source:

```bash
# Install dependencies
sudo apt-get install -y libssl-dev libsasl2-dev

# Clone MongoDB C++ driver
git clone https://github.com/mongodb/mongo-cxx-driver.git --branch releases/stable --depth 1
cd mongo-cxx-driver/build

# Build and install
cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX=/usr/local \
    -DBSONCXX_POLY_USE_MNMLSTC=1

cmake --build .
sudo cmake --build . --target install

cd ../..
```

## Build the Project

```bash
cd Backend_CPP

# Make build script executable
chmod +x build.sh

# Run build
./build.sh
```

## Run the Server

```bash
cd build
./CloudVMBackend
```

Expected output:
```
========================================
Cloud VM Management Backend (C++)
Production-grade with Multithreading
========================================

Database connection established
[INFO] Starting server on port 5001...
[INFO] Worker threads: 8
[INFO] Memory safety: ENABLED (RAII, smart pointers)
[INFO] Thread synchronization: ENABLED (mutexes, atomic ops)
[INFO] Database: MongoDB (thread-safe connection pool)

[READY] Server is ready to accept connections!
========================================

Server running on 0.0.0.0:5001
```

## Test the Server

```bash
# Health check
curl http://localhost:5001/health

# Register user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "test123"
  }'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

## Troubleshooting

### MongoDB Connection Error

Edit `src/main.cpp` and update:
```cpp
std::string mongo_uri = "your_mongodb_connection_string";
```

### Port Already in Use

Change port in `src/main.cpp`:
```cpp
server_instance = std::make_unique<Server>("0.0.0.0", 5002, 8);
```

### Build Errors

Make sure all dependencies are installed:
```bash
# Check CMake version (need 3.15+)
cmake --version

# Check GCC version (need 7.0+)
g++ --version

# Check pkg-config
pkg-config --list-all | grep mongo
```

## Performance Tuning

### Increase Worker Threads

Edit `src/main.cpp`:
```cpp
// Increase from 8 to 16 threads
server_instance = std::make_unique<Server>("0.0.0.0", 5001, 16);
```

### Optimize Build

```bash
cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS="-O3 -march=native"
make -j$(nproc)
```

## Running in Production

```bash
# Run with systemd
sudo cp build/CloudVMBackend /usr/local/bin/
sudo systemctl enable cloudvm-backend
sudo systemctl start cloudvm-backend

# Or use screen/tmux
screen -S cloudvm
./build/CloudVMBackend
# Ctrl+A, D to detach
```

## Monitoring

```bash
# Check if running
ps aux | grep CloudVMBackend

# Monitor resource usage
htop -p $(pgrep CloudVMBackend)

# Check open connections
netstat -antp | grep 5001
```

## Stopping the Server

```bash
# Graceful shutdown
kill -SIGTERM $(pgrep CloudVMBackend)

# Or Ctrl+C if running in foreground
```

## Next Steps

1. Configure your database connection
2. Update JWT secret in production
3. Enable HTTPS (add SSL/TLS)
4. Set up reverse proxy (nginx)
5. Configure firewall rules
6. Set up logging rotation
7. Add monitoring (Prometheus)

For more details, see the main README.md
