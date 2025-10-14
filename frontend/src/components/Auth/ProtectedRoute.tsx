import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, setUser, isLoading } = useAuthStore();

  // Auto-login demo user if no user exists
  useEffect(() => {
    if (!user && !isLoading) {
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
    }
  }, [user, isLoading, setUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MindMate...</p>
        </div>
      </div>
    );
  }

  // Always render children - no authentication required
  return <>{children}</>;
};

export default ProtectedRoute;