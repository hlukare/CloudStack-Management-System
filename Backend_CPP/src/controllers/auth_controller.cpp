#include "controllers.h"
#include "crypto_utils.h"
#include "database_service.h"
#include <nlohmann/json.hpp>
#include <mongocxx/client.hpp>
#include <bsoncxx/json.hpp>
#include <bsoncxx/builder/stream/document.hpp>

using json = nlohmann::json;
using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::finalize;

namespace cloudvm {

void AuthController::register_routes(Router& router) {
    router.post("/api/auth/login", login);
    router.post("/api/auth/register", register_user);
    router.get("/api/auth/me", get_current_user);
}

void AuthController::login(const Request& req, Response& res) {
    try {
        // Parse request body
        json body = json::parse(req.body);
        std::string email = body["email"];
        std::string password = body["password"];
        
        // Find user in database
        auto& db = DatabaseService::instance().get_database();
        auto collection = db["users"];
        
        document query{};
        query << "email" << email;
        
        auto result = collection.find_one(query.view());
        if (!result) {
            res.set_status(401);
            res.json(R"({"error": "Invalid credentials"})");
            return;
        }
        
        // Get password hash from document
        auto doc = result->view();
        std::string stored_hash = doc["password"].get_string().value.to_string();
        
        // Verify password
        if (!HashUtil::verify_password(password, stored_hash)) {
            res.set_status(401);
            res.json(R"({"error": "Invalid credentials"})");
            return;
        }
        
        // Generate JWT token
        std::string user_id = doc["_id"].get_oid().value.to_string();
        std::string token = JWTUtil::generate(user_id, "your_jwt_secret");
        
        // Build response
        json response_json;
        response_json["token"] = token;
        response_json["user"]["id"] = user_id;
        response_json["user"]["email"] = doc["email"].get_string().value.to_string();
        response_json["user"]["username"] = doc["username"].get_string().value.to_string();
        
        res.set_status(200);
        res.json(response_json.dump());
        
    } catch (const std::exception& e) {
        res.set_status(500);
        json error;
        error["error"] = "Internal server error";
        res.json(error.dump());
    }
}

void AuthController::register_user(const Request& req, Response& res) {
    try {
        json body = json::parse(req.body);
        std::string email = body["email"];
        std::string username = body["username"];
        std::string password = body["password"];
        
        // Check if user exists
        auto& db = DatabaseService::instance().get_database();
        auto collection = db["users"];
        
        document query{};
        query << "email" << email;
        
        if (collection.find_one(query.view())) {
            res.set_status(400);
            res.json(R"({"error": "User already exists"})");
            return;
        }
        
        // Hash password
        std::string password_hash = HashUtil::hash_password(password);
        
        // Create user document
        document doc{};
        doc << "email" << email
            << "username" << username
            << "password" << password_hash
            << "provider" << "local"
            << "createdAt" << std::time(nullptr)
            << "updatedAt" << std::time(nullptr);
        
        auto insert_result = collection.insert_one(doc.view());
        
        if (insert_result) {
            std::string user_id = insert_result->inserted_id().get_oid().value.to_string();
            std::string token = JWTUtil::generate(user_id, "your_jwt_secret");
            
            json response_json;
            response_json["token"] = token;
            response_json["user"]["id"] = user_id;
            response_json["user"]["email"] = email;
            response_json["user"]["username"] = username;
            
            res.set_status(201);
            res.json(response_json.dump());
        }
        
    } catch (const std::exception& e) {
        res.set_status(500);
        json error;
        error["error"] = "Internal server error";
        res.json(error.dump());
    }
}

void AuthController::get_current_user(const Request& req, Response& res) {
    try {
        // Get user_id from request (set by auth middleware)
        if (req.user_id.empty()) {
            res.set_status(401);
            res.json(R"({"error": "Unauthorized"})");
            return;
        }
        
        // Find user
        auto& db = DatabaseService::instance().get_database();
        auto collection = db["users"];
        
        document query{};
        query << "_id" << bsoncxx::oid(req.user_id);
        
        auto result = collection.find_one(query.view());
        if (!result) {
            res.set_status(404);
            res.json(R"({"error": "User not found"})");
            return;
        }
        
        auto doc = result->view();
        json response_json;
        response_json["id"] = doc["_id"].get_oid().value.to_string();
        response_json["email"] = doc["email"].get_string().value.to_string();
        response_json["username"] = doc["username"].get_string().value.to_string();
        
        res.set_status(200);
        res.json(response_json.dump());
        
    } catch (const std::exception& e) {
        res.set_status(500);
        json error;
        error["error"] = "Internal server error";
        res.json(error.dump());
    }
}

} // namespace cloudvm
