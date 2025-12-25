#include "database_service.h"
#include <iostream>

namespace cloudvm {

DatabaseService& DatabaseService::instance() {
    static DatabaseService instance;
    return instance;
}

DatabaseService::DatabaseService() : initialized_(false) {}

DatabaseService::~DatabaseService() {}

void DatabaseService::initialize(const std::string& uri, const std::string& db_name) {
    std::lock_guard<std::mutex> lock(db_mutex_);
    
    if (initialized_) {
        return;
    }
    
    try {
        instance_ = std::make_unique<mongocxx::instance>();
        client_ = std::make_unique<mongocxx::client>(mongocxx::uri{uri});
        db_name_ = db_name;
        initialized_ = true;
        
        std::cout << "Database connection established" << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Failed to initialize database: " << e.what() << std::endl;
        throw;
    }
}

mongocxx::database& DatabaseService::get_database() {
    std::lock_guard<std::mutex> lock(db_mutex_);
    
    if (!initialized_) {
        throw std::runtime_error("Database not initialized");
    }
    
    return (*client_)[db_name_];
}

bool DatabaseService::is_connected() const {
    std::lock_guard<std::mutex> lock(db_mutex_);
    return initialized_ && client_ != nullptr;
}

} // namespace cloudvm
