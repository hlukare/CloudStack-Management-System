#pragma once

#include <string>
#include <vector>
#include <memory>
#include <thread>
#include <atomic>
#include "router.h"
#include "thread_pool.h"

namespace cloudvm {

class Server {
public:
    Server(const std::string& host, int port, int num_threads = 8);
    ~Server();
    
    // Start the server
    void start();
    
    // Stop the server
    void stop();
    
    // Get router instance
    Router& get_router();
    
    // Check if server is running
    bool is_running() const;
    
private:
    std::string host_;
    int port_;
    int socket_fd_;
    std::atomic<bool> running_;
    std::unique_ptr<ThreadPool> thread_pool_;
    std::unique_ptr<Router> router_;
    std::thread accept_thread_;
    
    void accept_connections();
    void handle_client(int client_fd);
    void parse_request(const std::string& raw_req, Request& req);
    std::string build_response(const Response& res);
};

} // namespace cloudvm
