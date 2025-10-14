import React from 'react';
import { motion } from 'framer-motion';

const Profile: React.FC = () => {
  return (
    <motion.div
      className="min-h-screen flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Profile</h1>
        <p className="text-xl text-gray-600">Your MindMate profile</p>
      </div>
    </motion.div>
  );
};

export default Profile;