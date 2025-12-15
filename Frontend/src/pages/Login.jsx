import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield, Github } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_BASE_URL = API_BASE_URL.replace('/api', '');

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        toast.success('Login successful!');
      } else {
        await register(formData);
        toast.success('Registration successful!');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleLogin = () => {
    window.location.href = `${AUTH_BASE_URL}/auth/google`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${AUTH_BASE_URL}/auth/github`;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Cloud VM</h1>
                <h2 className="text-3xl font-bold tracking-tight">Management System</h2>
              </div>
            </div>
            <div className="h-1 w-24 bg-orange-500 mb-8"></div>
            <p className="text-lg text-blue-200 leading-relaxed">
              Secure cloud infrastructure management platform for monitoring and managing virtual machines across multiple cloud providers.
            </p>
          </div>
          
          <div className="space-y-4 text-blue-100 mt-8">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-sm">Multi-cloud support: AWS, Azure, GCP</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-sm">Real-time monitoring and analytics</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-sm">Automated snapshot management</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-sm">Cost optimization and alerts</p>
            </div>
          </div>

          {/* Demo Info Box */}
          <div className="mt-12 border-l-4 border-orange-500 bg-blue-950 bg-opacity-50 p-5 rounded">
            <h3 className="text-white font-semibold mb-3 text-sm">Demo Access</h3>
            <div className="space-y-2 text-xs text-blue-100">
              <p className="leading-relaxed">
                <span className="font-medium text-white">For demo:</span> Login with <span className="text-sm font-semibold text-orange-400">demo@cloudstack.com / demo123</span> to see example VMs and data
              </p>
              <p className="leading-relaxed mt-3">
                <span className="font-medium text-white">For real monitoring:</span> Sign up as new user and add your actual VM instance IDs to track live metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <Shield className="w-12 h-12 text-blue-900" strokeWidth={1.5} />
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Cloud VM</h1>
                <p className="text-sm text-gray-600">Management System</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-sm p-8 shadow-sm">
            {/* Header */}
            <div className="border-l-4 border-orange-500 pl-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Sign In' : 'Register'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {isLogin ? 'Access your account' : 'Create new account'}
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {!isLogin && (
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required={!isLogin}
                    value={formData.username}
                    onChange={handleChange}
                    className="appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Enter your username"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-sm bg-white hover:bg-gray-50 transition-colors"
                  title="Sign in with Google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleGithubLogin}
                  className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-sm bg-white hover:bg-gray-50 transition-colors"
                  title="Sign in with GitHub"
                >
                  <Github className="w-5 h-5 text-gray-900" />
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm font-medium text-blue-900 hover:text-blue-700 transition-colors"
                >
                  {isLogin ? "Don't have an account? Register here" : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              © 2025 Cloud VM Management System. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
