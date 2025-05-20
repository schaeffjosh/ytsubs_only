import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  CircularProgress,
  Box,
  Paper,
  Button
} from '@mui/material';
import moment from 'moment';
import { YOUTUBE_API_KEY, YOUTUBE_API_BASE_URL } from '../config';

interface Subscription {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
    publishedAt: string;
  };
}

interface CachedData {
  subscriptions: Subscription[];
  timestamp: number;
}

const MAX_RESULTS = 25; // Reduced from 50 to 25

const SubscriptionList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first, but only if not forcing a refresh
      if (!forceRefresh) {
        const cached = localStorage.getItem('youtube_subscriptions_cache');
        if (cached) {
          const { subscriptions: cachedSubs }: CachedData = JSON.parse(cached);
          console.log('Using cached subscriptions');
          setSubscriptions(cachedSubs);
          setLoading(false);
          return;
        }
      }
      
      const token = localStorage.getItem('youtube_access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Only request essential fields to reduce quota usage
      const response = await fetch(
        `${YOUTUBE_API_BASE_URL}/subscriptions?part=snippet&mine=true&maxResults=${MAX_RESULTS}&fields=items(id,snippet(title,description,thumbnails/default/url,publishedAt))&key=${YOUTUBE_API_KEY}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('YouTube API Error:', errorData);
        
        if (response.status === 403) {
          if (errorData.error?.message?.includes('quota')) {
            throw new Error('YouTube API quota exceeded. Please try again later.');
          } else if (errorData.error?.message?.includes('invalid')) {
            // Token might be expired or invalid
            localStorage.removeItem('youtube_access_token');
            localStorage.removeItem('youtube_token_expiry');
            window.location.href = '/auth';
            return;
          }
        }
        
        throw new Error(`YouTube API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched subscriptions:', data);
      
      // Cache the results
      const cacheData: CachedData = {
        subscriptions: data.items,
        timestamp: Date.now()
      };
      localStorage.setItem('youtube_subscriptions_cache', JSON.stringify(cacheData));
      
      setSubscriptions(data.items);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={4}>
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => fetchSubscriptions(true)}
          >
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Your YouTube Subscriptions
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => fetchSubscriptions(true)}
            size="small"
          >
            Refresh
          </Button>
        </Box>
        <Paper elevation={3}>
          <List>
            {subscriptions.map((subscription) => (
              <ListItem key={subscription.id} divider>
                <ListItemAvatar>
                  <Avatar 
                    src={subscription.snippet.thumbnails.default.url} 
                    alt={subscription.snippet.title}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={subscription.snippet.title}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="textPrimary">
                        {subscription.snippet.description}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption" color="textSecondary">
                        Subscribed on: {moment(subscription.snippet.publishedAt).format('MMMM D, YYYY')}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default SubscriptionList; 