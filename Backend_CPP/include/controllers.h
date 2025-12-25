#pragma once

#include "router.h"

namespace cloudvm {

class AuthController {
public:
    static void register_routes(Router& router);
    
private:
    static void login(const Request& req, Response& res);
    static void register_user(const Request& req, Response& res);
    static void get_current_user(const Request& req, Response& res);
};

class VMController {
public:
    static void register_routes(Router& router);
    
private:
    static void list_vms(const Request& req, Response& res);
    static void get_vm(const Request& req, Response& res);
    static void create_vm(const Request& req, Response& res);
    static void update_vm(const Request& req, Response& res);
    static void delete_vm(const Request& req, Response& res);
};

} // namespace cloudvm
