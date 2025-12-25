#include "thread_pool.h"
#include <stdexcept>

namespace cloudvm {

ThreadPool::ThreadPool(size_t num_threads) : shutdown_(false) {
    if (num_threads == 0) {
        throw std::invalid_argument("Thread pool size must be positive");
    }
    
    threads_.reserve(num_threads);
    for (size_t i = 0; i < num_threads; ++i) {
        threads_.emplace_back(&ThreadPool::worker_thread, this);
    }
}

ThreadPool::~ThreadPool() {
    {
        std::unique_lock<std::mutex> lock(queue_mutex_);
        shutdown_.store(true);
    }
    
    condition_.notify_all();
    
    for (auto& thread : threads_) {
        if (thread.joinable()) {
            thread.join();
        }
    }
}

void ThreadPool::worker_thread() {
    while (true) {
        std::function<void()> task;
        
        {
            std::unique_lock<std::mutex> lock(queue_mutex_);
            
            // Wait for task or shutdown
            condition_.wait(lock, [this] {
                return shutdown_.load() || !tasks_.empty();
            });
            
            if (shutdown_.load() && tasks_.empty()) {
                return;
            }
            
            if (!tasks_.empty()) {
                task = std::move(tasks_.front());
                tasks_.pop();
            }
        }
        
        // Execute task outside the lock
        if (task) {
            try {
                task();
            } catch (const std::exception& e) {
                // Log error but don't crash the worker
                // In production, use proper logging
            }
        }
    }
}

} // namespace cloudvm
