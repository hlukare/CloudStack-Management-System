#pragma once

#include <string>
#include <optional>
#include <memory>

namespace cloudvm {

struct User {
    std::string id;
    std::string email;
    std::string username;
    std::string password_hash;
    std::string provider;
    std::string provider_id;
    long long created_at;
    long long updated_at;
    
    // Convert to JSON
    std::string to_json() const;
    
    // Create from JSON
    static std::optional<User> from_json(const std::string& json);
    
    // Validate user data
    bool validate() const;
};

} // namespace cloudvm
