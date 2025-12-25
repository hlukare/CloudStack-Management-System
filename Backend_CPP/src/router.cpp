#include "router.h"
#include <algorithm>
#include <sstream>

namespace cloudvm {

void Response::json(const std::string& json_body) {
    body = json_body;
    set_header("Content-Type", "application/json");
}

void Response::set_status(int code) {
    status_code = code;
}

void Response::set_header(const std::string& key, const std::string& value) {
    headers[key] = value;
}

Router::Router() {}

Router::~Router() {}

void Router::get(const std::string& path, RequestHandler handler) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    routes_.push_back({HttpMethod::GET, path, handler, {}});
}

void Router::post(const std::string& path, RequestHandler handler) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    routes_.push_back({HttpMethod::POST, path, handler, {}});
}

void Router::put(const std::string& path, RequestHandler handler) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    routes_.push_back({HttpMethod::PUT, path, handler, {}});
}

void Router::patch(const std::string& path, RequestHandler handler) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    routes_.push_back({HttpMethod::PATCH, path, handler, {}});
}

void Router::del(const std::string& path, RequestHandler handler) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    routes_.push_back({HttpMethod::DELETE, path, handler, {}});
}

void Router::use(Middleware middleware) {
    std::lock_guard<std::mutex> lock(routes_mutex_);
    global_middlewares_.push_back(middleware);
}

bool Router::handle(Request& req, Response& res) {
    // Execute global middlewares
    for (const auto& middleware : global_middlewares_) {
        if (!middleware(req, res)) {
            return false; // Middleware blocked request
        }
    }
    
    // Find matching route
    std::lock_guard<std::mutex> lock(routes_mutex_);
    for (const auto& route : routes_) {
        if (route.method == req.method) {
            if (match_path(route.path, req.path, req.params)) {
                // Execute route-specific middlewares
                for (const auto& middleware : route.middlewares) {
                    if (!middleware(req, res)) {
                        return false;
                    }
                }
                
                // Execute handler
                route.handler(req, res);
                return true;
            }
        }
    }
    
    // No route matched
    res.set_status(404);
    res.json(R"({"error": "Route not found"})");
    return false;
}

bool Router::match_path(const std::string& pattern, const std::string& path,
                       std::map<std::string, std::string>& params) {
    if (pattern == path) {
        return true;
    }
    
    // Simple parameter matching (e.g., /vms/:id)
    std::istringstream pattern_stream(pattern);
    std::istringstream path_stream(path);
    std::string pattern_part, path_part;
    
    while (std::getline(pattern_stream, pattern_part, '/') &&
           std::getline(path_stream, path_part, '/')) {
        if (pattern_part.empty() && path_part.empty()) {
            continue;
        }
        
        if (pattern_part.front() == ':') {
            // Parameter
            std::string param_name = pattern_part.substr(1);
            params[param_name] = path_part;
        } else if (pattern_part != path_part) {
            return false;
        }
    }
    
    // Check if both streams are exhausted
    return pattern_stream.eof() && path_stream.eof();
}

} // namespace cloudvm
