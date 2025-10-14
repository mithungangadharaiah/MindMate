import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mic, Heart, Users, MapPin, Lock, User, Mail } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      // Create a demo user directly without API call
      const demoUser = {
        id: 'demo-user',
        email: 'demo@mindmate.app',
        display_name: 'Demo User',
        city: 'San Francisco',
        age: 25,
        interests: ['technology', 'mindfulness', 'music'],
        created_at: new Date().toISOString()
      };
      
      setUser(demoUser);
      toast.success('Welcome to MindMate! 🎉', {
        style: {
          background: '#10B981',
          color: 'white',
        },
      });
      navigate('/');
    } catch (error) {
      toast.error('Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // For full mode, create user directly without backend validation
      if (formData.email && formData.password) {
        const user = {
          id: `user_${Date.now()}`,
          email: formData.email,
          display_name: formData.email.split('@')[0],
          city: 'San Francisco',
          age: 28,
          interests: ['meditation', 'technology', 'fitness'],
          created_at: new Date().toISOString()
        };
        
        setUser(user);
        toast.success(`Welcome back, ${formData.email.split('@')[0]}! 🌟`, {
          style: {
            background: '#8B5CF6',
            color: 'white',
          },
        });
        navigate('/');
      } else {
        toast.error('Please enter both email and password');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo & Brand */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mb-4">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            MindMate
          </h1>
          <p className="text-gray-600 mt-2">Your voice-first emotional companion</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Welcome Back</h2>
          
          {/* Demo Login Button - Make it prominent */}
          <motion.button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 mb-6"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Loading...' : '🚀 Try Demo Mode (Recommended)'}
          </motion.button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or sign in with your account</span>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-gray-600 mt-4 text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Sign up
            </button>
          </p>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          className="mt-8 grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Mic className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs text-gray-600">Voice Analysis</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs text-gray-600">Friend Matching</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-xs text-gray-600">Place Discovery</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;