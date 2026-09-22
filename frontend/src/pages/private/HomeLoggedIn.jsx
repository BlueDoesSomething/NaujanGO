import React from 'react';
import { useAuth } from '../../context/AuthContext';
import EcoHomeLayout from '../../components/EcoHomeLayout';

const HomeLoggedIn = () => {
  const { user: authUser } = useAuth();
  return <EcoHomeLayout variant="user" userId={authUser?.id || null} />;
};

export default HomeLoggedIn;