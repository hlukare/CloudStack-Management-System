#pragma once

#include <vector>
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <atomic>
#include <memory>

namespace cloudvm {

class ThreadPool {
public:
    explicit ThreadPool(size_t num_threads);
    ~ThreadPool();
    
    // Delete copy constructor and assignment
    ThreadPool(const ThreadPool&) = delete;
    ThreadPool& operator=(const ThreadPool&) = delete;
    
    // Submit a task to the thread pool
    template<typename F>
    void submit(F&& task);
    
    // Get number of active threads
    size_t size() const { return threads_.size(); }
    
    // Check if pool is shutting down
    bool is_shutdown() const { return shutdown_.load(); }
    
private:
    std::vector<std::thread> threads_;
    std::queue<std::function<void()>> tasks_;
    
    mutable std::mutex queue_mutex_;
    std::condition_variable condition_;
    std::atomic<bool> shutdown_;
    
    void worker_thread();
};

template<typename F>
void ThreadPool::submit(F&& task) {
    if (shutdown_.load()) {
        throw std::runtime_error("ThreadPool is shutting down");
    }
    
    {
        std::unique_lock<std::mutex> lock(queue_mutex_);
        tasks_.emplace(std::forward<F>(task));
    }
    condition_.notify_one();
}

} // namespace cloudvm
