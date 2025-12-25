// Empty models - data structures defined in headers
#include "user.h"
#include <nlohmann/json.hpp>

namespace cloudvm {

std::string User::to_json() const {
    nlohmann::json j;
    j["id"] = id;
    j["email"] = email;
    j["username"] = username;
    j["provider"] = provider;
    return j.dump();
}

std::optional<User> User::from_json(const std::string& json) {
    try {
        auto j = nlohmann::json::parse(json);
        User user;
        user.id = j.value("id", "");
        user.email = j.value("email", "");
        user.username = j.value("username", "");
        user.provider = j.value("provider", "local");
        return user;
    } catch (...) {
        return std::nullopt;
    }
}

bool User::validate() const {
    return !email.empty() && !username.empty();
}

} // namespace cloudvm
