cmake_minimum_required(VERSION 3.15)
project(CloudVMBackend VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -O2 -pthread")

# Find required packages
find_package(Threads REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(CURL REQUIRED)

# Include directories
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${CMAKE_SOURCE_DIR}/third_party
)

# Source files
set(SOURCES
    src/main.cpp
    src/server.cpp
    src/router.cpp
    src/controllers/auth_controller.cpp
    src/controllers/vm_controller.cpp
    src/controllers/snapshot_controller.cpp
    src/controllers/monitoring_controller.cpp
    src/models/user.cpp
    src/models/vm.cpp
    src/models/snapshot.cpp
    src/services/database_service.cpp
    src/services/auth_service.cpp
    src/services/vm_service.cpp
    src/services/monitoring_service.cpp
    src/services/cost_service.cpp
    src/utils/jwt_util.cpp
    src/utils/hash_util.cpp
    src/utils/logger.cpp
    src/utils/thread_pool.cpp
    src/middleware/auth_middleware.cpp
    src/middleware/cors_middleware.cpp
)

# Create executable
add_executable(${PROJECT_NAME} ${SOURCES})

# Link libraries
target_link_libraries(${PROJECT_NAME}
    Threads::Threads
    OpenSSL::SSL
    OpenSSL::Crypto
    CURL::libcurl
    mongocxx
    bsoncxx
)

# Installation
install(TARGETS ${PROJECT_NAME} DESTINATION bin)
