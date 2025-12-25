#include "server.h"
#include "router.h"
#include "controllers.h"
#include "database_service.h"
#include <iostream>
#include <csignal>
#include <memory>

// Declare middleware functions
namespace cloudvm {
    extern bool cors_middleware(Request& req, Response& res);
    extern bool auth_middleware(Request& req, Response& res);
}

using namespace cloudvm;

std::unique_ptr<Server> server_instance;

void signal_handler(int signal) {
    if (signal == SIGINT || signal == SIGTERM) {
        std::cout << "\nShutting down server..." << std::endl;
        if (server_instance) {
            server_instance->stop();
        }
        exit(0);
    }
}

int main() {
    try {
        std::cout << "========================================" << std::endl;
        std::cout << "Cloud VM Management Backend (C++)" << std::endl;
        std::cout << "Production-grade with Multithreading" << std::endl;
        std::cout << "========================================" << std::endl;
        
        // Register signal handlers
        std::signal(SIGINT, signal_handler);
        std::signal(SIGTERM, signal_handler);
        
        // Initialize database
        std::string mongo_uri = "mongodb+srv://dec:Dec123@harish.9dmjd.mongodb.net/?appName=harish";
        std::string db_name = "cloud_vm_management";
        
        DatabaseService::instance().initialize(mongo_uri, db_name);
        
        // Create server with 8 worker threads
        server_instance = std::make_unique<Server>("0.0.0.0", 5001, 8);
        
        // Get router
        Router& router = server_instance->get_router();
        
        // Register global middlewares
        router.use(cors_middleware);
        router.use(auth_middleware);
        
        // Health check endpoint
        router.get("/health", [](const Request& req, Response& res) {
            res.set_status(200);
            res.json(R"({
                "status": "ok",
                "service": "CloudVM Backend C++",
                "timestamp": )" + std::to_string(std::time(nullptr)) + R"(,
                "multithreading": true,
                "memory_safe": true
            })");
        });
        
        // Register controller routes
        AuthController::register_routes(router);
        VMController::register_routes(router);
        
        // Start server
        std::cout << "\n[INFO] Starting server on port 5001..." << std::endl;
        std::cout << "[INFO] Worker threads: 8" << std::endl;
        std::cout << "[INFO] Memory safety: ENABLED (RAII, smart pointers)" << std::endl;
        std::cout << "[INFO] Thread synchronization: ENABLED (mutexes, atomic ops)" << std::endl;
        std::cout << "[INFO] Database: MongoDB (thread-safe connection pool)" << std::endl;
        std::cout << "\n[READY] Server is ready to accept connections!" << std::endl;
        std::cout << "========================================\n" << std::endl;
        
        server_instance->start();
        
        // Keep main thread alive
        while (server_instance->is_running()) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Fatal error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}
