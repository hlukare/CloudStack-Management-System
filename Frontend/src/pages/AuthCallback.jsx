import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      
      // Fetch user data with token
      axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          const userData = res.data;
          updateUser(userData);
          toast.success('Login successful!');
          navigate('/');
        })
        .catch((error) => {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed');
          localStorage.removeItem('token');
          navigate('/login');
        });
    } else {
      toast.error('No authentication token received');
      navigate('/login');
    }
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}
