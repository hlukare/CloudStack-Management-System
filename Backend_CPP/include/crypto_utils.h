#pragma once

#include <string>
#include <optional>

namespace cloudvm {

class JWTUtil {
public:
    // Generate JWT token
    static std::string generate(const std::string& user_id, const std::string& secret, int expiry_days = 7);
    
    // Verify and decode JWT token
    static std::optional<std::string> verify(const std::string& token, const std::string& secret);
    
private:
    static std::string base64_url_encode(const std::string& input);
    static std::string base64_url_decode(const std::string& input);
    static std::string hmac_sha256(const std::string& data, const std::string& key);
};

class HashUtil {
public:
    // Hash password using bcrypt-like algorithm
    static std::string hash_password(const std::string& password);
    
    // Verify password
    static bool verify_password(const std::string& password, const std::string& hash);
    
private:
    static std::string generate_salt();
};

} // namespace cloudvm
