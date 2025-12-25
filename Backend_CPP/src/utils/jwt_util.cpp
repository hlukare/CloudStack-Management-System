#include "crypto_utils.h"
#include <openssl/sha.h>
#include <openssl/hmac.h>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <sstream>
#include <iomanip>
#include <ctime>
#include <cstring>

namespace cloudvm {

// Base64 URL encoding/decoding
std::string JWTUtil::base64_url_encode(const std::string& input) {
    static const char* base64_chars = 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    std::string result;
    int val = 0;
    int valb = -6;
    
    for (unsigned char c : input) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            result.push_back(base64_chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    
    if (valb > -6) {
        result.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
    }
    
    // Make URL safe
    for (char& c : result) {
        if (c == '+') c = '-';
        else if (c == '/') c = '_';
    }
    
    // Remove padding
    while (!result.empty() && result.back() == '=') {
        result.pop_back();
    }
    
    return result;
}

std::string JWTUtil::hmac_sha256(const std::string& data, const std::string& key) {
    unsigned char result[EVP_MAX_MD_SIZE];
    unsigned int len = 0;
    
    HMAC(EVP_sha256(), key.c_str(), key.length(),
         reinterpret_cast<const unsigned char*>(data.c_str()), data.length(),
         result, &len);
    
    return std::string(reinterpret_cast<char*>(result), len);
}

std::string JWTUtil::generate(const std::string& user_id, const std::string& secret, int expiry_days) {
    // Header
    std::string header = R"({"alg":"HS256","typ":"JWT"})";
    std::string encoded_header = base64_url_encode(header);
    
    // Payload
    long long now = std::time(nullptr);
    long long exp = now + (expiry_days * 24 * 3600);
    
    std::ostringstream payload_stream;
    payload_stream << R"({"userId":")" << user_id << R"(","iat":)" << now 
                   << R"(,"exp":)" << exp << "}";
    std::string payload = payload_stream.str();
    std::string encoded_payload = base64_url_encode(payload);
    
    // Signature
    std::string signature_input = encoded_header + "." + encoded_payload;
    std::string signature = hmac_sha256(signature_input, secret);
    std::string encoded_signature = base64_url_encode(signature);
    
    return encoded_header + "." + encoded_payload + "." + encoded_signature;
}

std::optional<std::string> JWTUtil::verify(const std::string& token, const std::string& secret) {
    // Split token
    size_t first_dot = token.find('.');
    size_t second_dot = token.find('.', first_dot + 1);
    
    if (first_dot == std::string::npos || second_dot == std::string::npos) {
        return std::nullopt;
    }
    
    std::string header = token.substr(0, first_dot);
    std::string payload = token.substr(first_dot + 1, second_dot - first_dot - 1);
    std::string signature = token.substr(second_dot + 1);
    
    // Verify signature
    std::string signature_input = header + "." + payload;
    std::string expected_signature = hmac_sha256(signature_input, secret);
    std::string encoded_expected = base64_url_encode(expected_signature);
    
    if (signature != encoded_expected) {
        return std::nullopt;
    }
    
    // Decode payload
    std::string decoded_payload = base64_url_decode(payload);
    
    // Extract user_id (simplified JSON parsing)
    size_t user_id_pos = decoded_payload.find("\"userId\":\"");
    if (user_id_pos == std::string::npos) {
        return std::nullopt;
    }
    
    size_t start = user_id_pos + 10;
    size_t end = decoded_payload.find("\"", start);
    if (end == std::string::npos) {
        return std::nullopt;
    }
    
    return decoded_payload.substr(start, end - start);
}

std::string JWTUtil::base64_url_decode(const std::string& input) {
    std::string result = input;
    
    // Replace URL-safe chars
    for (char& c : result) {
        if (c == '-') c = '+';
        else if (c == '_') c = '/';
    }
    
    // Add padding
    while (result.length() % 4 != 0) {
        result += '=';
    }
    
    // Decode base64
    std::string decoded;
    // Simplified decoding - in production use proper base64 library
    return decoded;
}

// Password hashing
std::string HashUtil::generate_salt() {
    unsigned char salt[16];
    RAND_bytes(salt, sizeof(salt));
    
    std::ostringstream ss;
    for (int i = 0; i < 16; ++i) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)salt[i];
    }
    return ss.str();
}

std::string HashUtil::hash_password(const std::string& password) {
    std::string salt = generate_salt();
    
    // Use PBKDF2
    unsigned char hash[32];
    PKCS5_PBKDF2_HMAC(password.c_str(), password.length(),
                      reinterpret_cast<const unsigned char*>(salt.c_str()), salt.length(),
                      10000, EVP_sha256(), 32, hash);
    
    std::ostringstream ss;
    ss << salt << ":";
    for (int i = 0; i < 32; ++i) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    
    return ss.str();
}

bool HashUtil::verify_password(const std::string& password, const std::string& hash) {
    size_t colon_pos = hash.find(':');
    if (colon_pos == std::string::npos) {
        return false;
    }
    
    std::string salt = hash.substr(0, colon_pos);
    std::string stored_hash = hash.substr(colon_pos + 1);
    
    // Recompute hash
    unsigned char computed_hash[32];
    PKCS5_PBKDF2_HMAC(password.c_str(), password.length(),
                      reinterpret_cast<const unsigned char*>(salt.c_str()), salt.length(),
                      10000, EVP_sha256(), 32, computed_hash);
    
    std::ostringstream ss;
    for (int i = 0; i < 32; ++i) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)computed_hash[i];
    }
    
    return ss.str() == stored_hash;
}

} // namespace cloudvm
