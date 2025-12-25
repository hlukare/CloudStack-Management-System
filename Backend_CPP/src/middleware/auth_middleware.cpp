#include "router.h"
#include "crypto_utils.h"
#include <string>

namespace cloudvm {

// CORS middleware
bool cors_middleware(Request& req, Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set_header("Access-Control-Allow-Credentials", "true");
    
    // Handle preflight requests
    if (req.method == HttpMethod::OPTIONS) {
        res.set_status(200);
        res.json("{}");
        return false; // Stop processing
    }
    
    return true; // Continue processing
}

// Authentication middleware
bool auth_middleware(Request& req, Response& res) {
    // Skip auth for public routes
    if (req.path == "/api/auth/login" || req.path == "/api/auth/register" || req.path == "/health") {
        return true;
    }
    
    // Get token from Authorization header
    auto auth_header = req.headers.find("Authorization");
    if (auth_header == req.headers.end()) {
        res.set_status(401);
        res.json(R"({"error": "No authorization token provided"})");
        return false;
    }
    
    std::string auth_value = auth_header->second;
    if (auth_value.substr(0, 7) != "Bearer ") {
        res.set_status(401);
        res.json(R"({"error": "Invalid authorization format"})");
        return false;
    }
    
    std::string token = auth_value.substr(7);
    
    // Verify token
    auto user_id = JWTUtil::verify(token, "your_jwt_secret");
    if (!user_id) {
        res.set_status(401);
        res.json(R"({"error": "Invalid or expired token"})");
        return false;
    }
    
    // Set user_id in request (mutable)
    const_cast<Request&>(req).user_id = *user_id;
    
    return true; // Continue processing
}

} // namespace cloudvm
