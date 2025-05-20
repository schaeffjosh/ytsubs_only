import React, { useEffect } from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl'
].join(' ');

const Auth: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    console.log('Starting login process...');
    console.log('Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
    console.log('Redirect URI:', process.env.REACT_APP_REDIRECT_URI);
    
    const params = new URLSearchParams({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
      redirect_uri: process.env.REACT_APP_REDIRECT_URI || '',
      response_type: 'token',
      scope: SCOPES,
      include_granted_scopes: 'true',
      prompt: 'consent'
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    console.log('Auth URL:', authUrl);
    
    window.location.href = authUrl;
  };

  useEffect(() => {
    // Check if we have a token in the URL (after OAuth redirect)
    const hash = window.location.hash.substring(1);
    console.log('URL hash:', hash);
    
    if (hash) {
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');
      const error = params.get('error');
      
      if (error) {
        console.error('Auth error:', error);
        console.error('Error description:', params.get('error_description'));
        // Clear any existing tokens on error
        localStorage.removeItem('youtube_access_token');
        localStorage.removeItem('youtube_token_expiry');
        navigate('/auth');
      } else if (accessToken) {
        console.log('Access token received');
        
        // Store the token
        localStorage.setItem('youtube_access_token', accessToken);
        
        // Calculate and store token expiration time
        const expirySeconds = expiresIn ? parseInt(expiresIn) : 3600; // Default to 1 hour if not provided
        const expiryTime = moment().add(expirySeconds, 'seconds').valueOf();
        localStorage.setItem('youtube_token_expiry', expiryTime.toString());
        
        console.log('Token stored with expiry:', {
          token: accessToken.substring(0, 10) + '...',
          expiryTime: moment(expiryTime).format(),
          expiresIn: expirySeconds
        });
        
        // Force a page reload to ensure all components pick up the new token
        console.log('Redirecting to home page...');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    }
  }, [navigate]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          YouTube Subscriptions Feed
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
          Please sign in with your Google account to view your YouTube subscriptions.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleLogin}
        >
          Sign in with Google
        </Button>
      </Box>
    </Container>
  );
};

export default Auth; 