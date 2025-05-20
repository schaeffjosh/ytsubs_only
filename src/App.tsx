import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container, CircularProgress, Box } from '@mui/material';
import Auth from './components/Auth';
import SubscriptionList from './components/SubscriptionList';
import VideoList from './components/VideoList';
import Navbar from './components/Navbar';
import moment from 'moment';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('youtube_access_token');
      const expiry = localStorage.getItem('youtube_token_expiry');
      
      console.log('Checking authentication status:', {
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 10) + '...' : 'none',
        expiry: expiry ? moment(parseInt(expiry)).format() : 'none',
        currentTime: moment().format()
      });

      if (token) {
        // If we have a token but no expiry, assume it's valid
        if (!expiry) {
          console.log('Token found but no expiry, assuming valid');
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        const expiryTime = parseInt(expiry);
        const currentTime = moment().valueOf();
        
        // Add 5-minute buffer to prevent edge cases
        const isValid = currentTime < (expiryTime - 5 * 60 * 1000);
        
        console.log('Token validation:', {
          isValid,
          currentTime: moment(currentTime).format(),
          expiryTime: moment(expiryTime).format(),
          timeRemaining: moment(expiryTime).fromNow()
        });

        setIsAuthenticated(isValid);
      } else {
        console.log('No token found in localStorage');
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      {isAuthenticated && <Navbar />}
      <Container>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <VideoList />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/subscriptions"
            element={
              isAuthenticated ? (
                <SubscriptionList />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/auth"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Auth />
              )
            }
          />
          <Route
            path="/auth/callback"
            element={<Auth />}
          />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;