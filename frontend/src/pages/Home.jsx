import React from 'react';
import { useAuth } from '../context/AuthContext';
import HomeLoggedIn from './private/HomeLoggedIn';
import HomeGuest from './public/Home';

const Home = () => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh'
      }}>
        <div style={{
          fontSize: '1.2rem',
          color: '#666'
        }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      {isLoggedIn ? <HomeLoggedIn /> : <HomeGuest />}
    </>
  );
};

export default Home;
