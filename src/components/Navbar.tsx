import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          YouTube Feed
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{ 
              mx: 1,
              backgroundColor: location.pathname === '/' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            Videos
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/subscriptions"
            sx={{ 
              mx: 1,
              backgroundColor: location.pathname === '/subscriptions' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            Subscriptions
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 