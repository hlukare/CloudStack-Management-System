#pragma once

#include <string>
#include <memory>
#include <mutex>
#include <optional>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>

namespace cloudvm {

class DatabaseService {
public:
    static DatabaseService& instance();
    
    // Initialize database connection
    void initialize(const std::string& uri, const std::string& db_name);
    
    // Get database
    mongocxx::database& get_database();
    
    // Connection pool operations
    bool is_connected() const;
    
private:
    DatabaseService();
    ~DatabaseService();
    
    // Prevent copying
    DatabaseService(const DatabaseService&) = delete;
    DatabaseService& operator=(const DatabaseService&) = delete;
    
    std::unique_ptr<mongocxx::instance> instance_;
    std::unique_ptr<mongocxx::client> client_;
    std::string db_name_;
    mutable std::mutex db_mutex_;
    bool initialized_;
};

} // namespace cloudvm
