#pragma once

#include <string>
#include <vector>
#include <map>
#include <memory>
#include <functional>
#include <mutex>

namespace cloudvm {

// HTTP Methods
enum class HttpMethod {
    GET,
    POST,
    PUT,
    PATCH,
    DELETE,
    OPTIONS
};

// HTTP Request structure
struct Request {
    HttpMethod method;
    std::string path;
    std::map<std::string, std::string> headers;
    std::map<std::string, std::string> params;
    std::map<std::string, std::string> query;
    std::string body;
    std::string user_id; // Set by auth middleware
};

// HTTP Response structure
struct Response {
    int status_code = 200;
    std::map<std::string, std::string> headers;
    std::string body;
    
    void json(const std::string& json_body);
    void set_status(int code);
    void set_header(const std::string& key, const std::string& value);
};

// Request handler type
using RequestHandler = std::function<void(const Request&, Response&)>;

// Middleware type
using Middleware = std::function<bool(Request&, Response&)>;

// Route structure
struct Route {
    HttpMethod method;
    std::string path;
    RequestHandler handler;
    std::vector<Middleware> middlewares;
};

class Router {
public:
    Router();
    ~Router();
    
    // Route registration
    void get(const std::string& path, RequestHandler handler);
    void post(const std::string& path, RequestHandler handler);
    void put(const std::string& path, RequestHandler handler);
    void patch(const std::string& path, RequestHandler handler);
    void del(const std::string& path, RequestHandler handler);
    
    // Add middleware to route
    void use(Middleware middleware);
    
    // Handle request
    bool handle(Request& req, Response& res);
    
private:
    std::vector<Route> routes_;
    std::vector<Middleware> global_middlewares_;
    std::mutex routes_mutex_;
    
    bool match_path(const std::string& pattern, const std::string& path, 
                   std::map<std::string, std::string>& params);
};

} // namespace cloudvm
