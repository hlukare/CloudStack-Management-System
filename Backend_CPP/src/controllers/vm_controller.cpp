#include "controllers.h"
#include "database_service.h"
#include <nlohmann/json.hpp>
#include <mongocxx/client.hpp>
#include <bsoncxx/json.hpp>
#include <bsoncxx/builder/stream/document.hpp>

using json = nlohmann::json;
using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::finalize;

namespace cloudvm {

void VMController::register_routes(Router& router) {
    router.get("/api/vms", list_vms);
    router.get("/api/vms/:id", get_vm);
    router.post("/api/vms", create_vm);
    router.patch("/api/vms/:id", update_vm);
    router.del("/api/vms/:id", delete_vm);
}

void VMController::list_vms(const Request& req, Response& res) {
    try {
        auto& db = DatabaseService::instance().get_database();
        auto collection = db["vms"];
        
        // Build query based on user
        document query{};
        if (!req.user_id.empty()) {
            query << "userId" << req.user_id;
        }
        
        // Find VMs
        auto cursor = collection.find(query.view());
        
        json vms_array = json::array();
        for (auto&& doc : cursor) {
            json vm;
            vm["id"] = doc["_id"].get_oid().value.to_string();
            vm["name"] = doc["name"].get_string().value.to_string();
            vm["provider"] = doc["provider"].get_string().value.to_string();
            vm["instanceId"] = doc["instanceId"].get_string().value.to_string();
            vm["status"] = doc["status"].get_string().value.to_string();
            vm["region"] = doc["region"].get_string().value.to_string();
            
            vms_array.push_back(vm);
        }
        
        json response;
        response["vms"] = vms_array;
        response["total"] = vms_array.size();
        
        res.set_status(200);
        res.json(response.dump());
        
    } catch (const std::exception& e) {
        res.set_status(500);
        json error;
        error["error"] = "Failed to retrieve VMs";
        res.json(error.dump());
    }
}

void VMController::get_vm(const Request& req, Response& res) {
    try {
        std::string vm_id = req.params.at("id");
        
        auto& db = DatabaseService::instance().get_database();
        auto collection = db["vms"];
        
        document query{};
        query << "_id" << bsoncxx::oid(vm_id);
        
        auto result = collection.find_one(query.view());
        if (!result) {
            res.set_status(404);
            res.json(R"({"error": "VM not found"})");
            return;
        }
        
        auto doc = result->view();
        json vm;
        vm["id"] = doc["_id"].get_oid().value.to_string();
        vm["name"] = doc["name"].get_string().value.to_string();
        vm["provider"] = doc["provider"].get_string().value.to_string();
        vm["instanceId"] = doc["instanceId"].get_string().value.to_string();
        vm["status"] = doc["status"].get_string().value.to_string();
        vm["region"] = doc["region"].get_string().value.to_string();
        
        res.set_status(200);
        res.json(vm.dump());
        
    } catch (const std::exception& e) {
        res.set_status(500);
        json error;
        error["error"] = "Failed to retrieve VM";
        res.json(error.dump());
    }
}

void VMController::create_vm(const Request& req, Response& res) {
    try {
        json body = json::parse(req.body);
        
        auto& db = DatabaseService::instance().get_database();
        auto collection = db["vms"];
        
        document doc{};
        doc << "name" << body["name"].get<std::string>()
            << "provider" << body["provider"].get<std::string>()
            << "instanceId" << body["instanceId"].get<std::string>()
            << "status" << "unknown"
            << "region" << body["region"].get<std::string>()
            << "userId" << req.user_id
            << "createdAt" << std::time(nullptr)
            << "updatedAt" << std::time(nullptr);
        
        auto insert_result = collection.insert_one(doc.view());
        
        if (insert_result) {
            json response;
            response["id"] = insert_result->inserted_id().get_oid().value.to_string();
            response["message"] = "VM created successfully";
            
            res.set_status(201);
            res.json(response.dump());
        }
        
    } catch (const std::exception& e) {
        res.set_status(500);
        json error;
        error["error"] = "Failed to create VM";
        res.json(error.dump());
    }
}

void VMController::update_vm(const Request& req, Response& res) {
    try {
        std::string vm_id = req.params.at("id");
        json body = json::parse(req.body);
        
        auto& db = DatabaseService::instance().get_database();
        auto collection = db["vms"];
        
        document filter{};
        filter << "_id" << bsoncxx::oid(vm_id);
        
        document update{};
        auto update_doc = update << "$set" << bsoncxx::builder::stream::open_document;
        
        if (body.contains("name")) {
            update_doc << "name" << body["name"].get<std::string>();
        }
        if (body.contains("status")) {
            update_doc << "status" << body["status"].get<std::string>();
        }
        
        update_doc << "updatedAt" << std::time(nullptr)
                   << bsoncxx::builder::stream::close_document;
        
        auto result = collection.update_one(filter.view(), update.view());
        
        if (result && result->modified_count() > 0) {
            res.set_status(200);
            res.json(R"({"message": "VM updated successfully"})");
        } else {
            res.set_status(404);
            res.json(R"({"error": "VM not found"})");
        }
        
    } catch (const std::exception& e) {
        res.set_status(500);
        json error;
        error["error"] = "Failed to update VM";
        res.json(error.dump());
    }
}

void VMController::delete_vm(const Request& req, Response& res) {
    try {
        std::string vm_id = req.params.at("id");
        
        auto& db = DatabaseService::instance().get_database();
        auto collection = db["vms"];
        
        document filter{};
        filter << "_id" << bsoncxx::oid(vm_id);
        
        auto result = collection.delete_one(filter.view());
        
        if (result && result->deleted_count() > 0) {
            res.set_status(200);
            res.json(R"({"message": "VM deleted successfully"})");
        } else {
            res.set_status(404);
            res.json(R"({"error": "VM not found"})");
        }
        
    } catch (const std::exception& e) {
        res.set_status(500);
        json error;
        error["error"] = "Failed to delete VM";
        res.json(error.dump());
    }
}

} // namespace cloudvm
