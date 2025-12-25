#include "server.h"
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <cstring>
#include <sstream>
#include <iostream>

namespace cloudvm {

Server::Server(const std::string& host, int port, int num_threads)
    : host_(host), port_(port), socket_fd_(-1), running_(false) {
    thread_pool_ = std::make_unique<ThreadPool>(num_threads);
    router_ = std::make_unique<Router>();
}

Server::~Server() {
    stop();
}

void Server::start() {
    // Create socket
    socket_fd_ = socket(AF_INET, SOCK_STREAM, 0);
    if (socket_fd_ < 0) {
        throw std::runtime_error("Failed to create socket");
    }
    
    // Set socket options
    int opt = 1;
    if (setsockopt(socket_fd_, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt, sizeof(opt))) {
        close(socket_fd_);
        throw std::runtime_error("Failed to set socket options");
    }
    
    // Bind socket
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port_);
    
    if (bind(socket_fd_, (struct sockaddr*)&address, sizeof(address)) < 0) {
        close(socket_fd_);
        throw std::runtime_error("Failed to bind socket");
    }
    
    // Listen
    if (listen(socket_fd_, 128) < 0) {
        close(socket_fd_);
        throw std::runtime_error("Failed to listen on socket");
    }
    
    running_.store(true);
    std::cout << "Server running on " << host_ << ":" << port_ << std::endl;
    
    // Start accepting connections in a separate thread
    accept_thread_ = std::thread(&Server::accept_connections, this);
}

void Server::stop() {
    if (running_.load()) {
        running_.store(false);
        
        if (socket_fd_ >= 0) {
            close(socket_fd_);
            socket_fd_ = -1;
        }
        
        if (accept_thread_.joinable()) {
            accept_thread_.join();
        }
        
        std::cout << "Server stopped" << std::endl;
    }
}

Router& Server::get_router() {
    return *router_;
}

bool Server::is_running() const {
    return running_.load();
}

void Server::accept_connections() {
    while (running_.load()) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        
        int client_fd = accept(socket_fd_, (struct sockaddr*)&client_addr, &client_len);
        if (client_fd < 0) {
            if (running_.load()) {
                std::cerr << "Failed to accept connection" << std::endl;
            }
            continue;
        }
        
        // Handle client in thread pool
        thread_pool_->submit([this, client_fd]() {
            handle_client(client_fd);
        });
    }
}

void Server::handle_client(int client_fd) {
    char buffer[8192];
    std::memset(buffer, 0, sizeof(buffer));
    
    ssize_t bytes_read = read(client_fd, buffer, sizeof(buffer) - 1);
    if (bytes_read <= 0) {
        close(client_fd);
        return;
    }
    
    std::string raw_request(buffer, bytes_read);
    
    Request req;
    Response res;
    
    try {
        parse_request(raw_request, req);
        router_->handle(req, res);
    } catch (const std::exception& e) {
        res.set_status(500);
        res.json(R"({"error": "Internal server error"})");
    }
    
    std::string response = build_response(res);
    write(client_fd, response.c_str(), response.length());
    close(client_fd);
}

void Server::parse_request(const std::string& raw_req, Request& req) {
    std::istringstream stream(raw_req);
    std::string line;
    
    // Parse request line
    std::getline(stream, line);
    std::istringstream line_stream(line);
    std::string method_str, path_with_query, version;
    line_stream >> method_str >> path_with_query >> version;
    
    // Parse method
    if (method_str == "GET") req.method = HttpMethod::GET;
    else if (method_str == "POST") req.method = HttpMethod::POST;
    else if (method_str == "PUT") req.method = HttpMethod::PUT;
    else if (method_str == "PATCH") req.method = HttpMethod::PATCH;
    else if (method_str == "DELETE") req.method = HttpMethod::DELETE;
    else if (method_str == "OPTIONS") req.method = HttpMethod::OPTIONS;
    
    // Parse path and query
    size_t query_pos = path_with_query.find('?');
    if (query_pos != std::string::npos) {
        req.path = path_with_query.substr(0, query_pos);
        std::string query = path_with_query.substr(query_pos + 1);
        // Parse query parameters (simplified)
        // In production, use proper URL decoding
    } else {
        req.path = path_with_query;
    }
    
    // Parse headers
    while (std::getline(stream, line) && line != "\r") {
        size_t colon_pos = line.find(':');
        if (colon_pos != std::string::npos) {
            std::string key = line.substr(0, colon_pos);
            std::string value = line.substr(colon_pos + 2);
            if (!value.empty() && value.back() == '\r') {
                value.pop_back();
            }
            req.headers[key] = value;
        }
    }
    
    // Parse body
    std::string body_content;
    while (std::getline(stream, line)) {
        body_content += line;
    }
    req.body = body_content;
}

std::string Server::build_response(const Response& res) {
    std::ostringstream response;
    response << "HTTP/1.1 " << res.status_code << " ";
    
    // Status text
    switch (res.status_code) {
        case 200: response << "OK"; break;
        case 201: response << "Created"; break;
        case 400: response << "Bad Request"; break;
        case 401: response << "Unauthorized"; break;
        case 404: response << "Not Found"; break;
        case 500: response << "Internal Server Error"; break;
        default: response << "Unknown";
    }
    response << "\r\n";
    
    // Headers
    response << "Content-Length: " << res.body.length() << "\r\n";
    for (const auto& [key, value] : res.headers) {
        response << key << ": " << value << "\r\n";
    }
    response << "\r\n";
    
    // Body
    response << res.body;
    
    return response.str();
}

} // namespace cloudvm
