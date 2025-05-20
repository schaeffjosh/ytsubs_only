import axios from 'axios';
import moment from 'moment';
import { YOUTUBE_API_KEY, YOUTUBE_API_BASE_URL, DAYS_LOOKBACK, MAX_RESULTS } from '../config';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
}

// Check if token is expired - with more lenient checking
const isTokenExpired = () => {
  const tokenExpiry = localStorage.getItem('youtube_token_expiry');
  const token = localStorage.getItem('youtube_access_token');
  
  // If no token, consider it expired
  if (!token) {
    console.warn('No token found in localStorage');
    return true;
  }
  
  // If no expiry time, assume token is valid
  if (!tokenExpiry) {
    console.warn('No token expiry found, assuming token is valid');
    return false;
  }
  
  // Check if token is expired (with 5 minute buffer)
  const isExpired = moment().isAfter(moment(parseInt(tokenExpiry)).subtract(5, 'minutes'));
  console.log('Token expiry check:', {
    currentTime: moment().format(),
    expiryTime: moment(parseInt(tokenExpiry)).format(),
    isExpired
  });
  
  return isExpired;
};

// Handle 403 errors by clearing the token and redirecting to auth
const handleAuthError = () => {
  console.error('Authentication error detected. Clearing token and redirecting to auth page.');
  localStorage.removeItem('youtube_access_token');
  localStorage.removeItem('youtube_token_expiry');
  // Don't redirect, just log the error
  console.error('Auth error details:', {
    token: localStorage.getItem('youtube_access_token') ? 'Present' : 'Missing',
    expiry: localStorage.getItem('youtube_token_expiry') ? 'Present' : 'Missing',
    currentTime: moment().format()
  });
};

const youtubeApi = axios.create({
  baseURL: YOUTUBE_API_BASE_URL,
  params: {
    key: YOUTUBE_API_KEY,
  },
});

// Add request interceptor to include auth token
youtubeApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('youtube_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 403 errors
youtubeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      console.error('403 error detected in interceptor:', error.response.data);
      // Only handle auth errors if we have a token
      if (localStorage.getItem('youtube_access_token')) {
        handleAuthError();
      }
    }
    return Promise.reject(error);
  }
);

export const getSubscriptions = async () => {
  try {
    console.log('Fetching subscriptions...');
    
    // Check if token is expired
    if (isTokenExpired()) {
      console.error('Token is expired or missing');
      console.error('Token details:', {
        token: localStorage.getItem('youtube_access_token') ? 'Present' : 'Missing',
        expiry: localStorage.getItem('youtube_token_expiry') ? 'Present' : 'Missing',
        currentTime: moment().format()
      });
      handleAuthError();
      return [];
    }
    
    // Define request parameters
    const requestParams = {
      part: 'snippet',
      mine: true,
      maxResults: MAX_RESULTS,
      key: YOUTUBE_API_KEY
    };
    
    // Log the full request URL and parameters
    const requestUrl = `${YOUTUBE_API_BASE_URL}/subscriptions`;
    console.log('Request URL:', requestUrl);
    console.log('Request params:', requestParams);
    
    const response = await youtubeApi.get('/subscriptions', {
      params: requestParams
    });
    console.log('Subscriptions response:', response.status, response.statusText);
    return response.data.items;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
      
      // Check for specific error messages
      if (error.response?.data?.error) {
        console.error('Error message:', error.response.data.error.message);
        console.error('Error code:', error.response.data.error.code);
        console.error('Error status:', error.response.data.error.status);
      }
      
      // Only handle auth errors if we have a token
      if (error.response?.status === 403 && localStorage.getItem('youtube_access_token')) {
        handleAuthError();
      }
    }
    throw error;
  }
};

export const getRecentVideos = async (page = 1, perPage = 50) => {
  try {
    console.log('Starting getRecentVideos...');
    
    // Check if token is expired
    if (isTokenExpired()) {
      console.error('Token is expired or missing');
      console.error('Token details:', {
        token: localStorage.getItem('youtube_access_token') ? 'Present' : 'Missing',
        expiry: localStorage.getItem('youtube_token_expiry') ? 'Present' : 'Missing',
        currentTime: moment().format()
      });
      handleAuthError();
      return { videos: [], totalCount: 0 };
    }
    
    const subscriptions = await getSubscriptions();
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found');
      return { videos: [], totalCount: 0 };
    }
    
    console.log(`Found ${subscriptions.length} subscriptions`);
    const channelIds = subscriptions.map((sub: any) => sub.snippet.resourceId.channelId);
    
    const publishedAfter = moment()
      .subtract(DAYS_LOOKBACK, 'days')
      .toISOString();
    
    console.log(`Fetching videos published after: ${publishedAfter}`);

    const videos: Video[] = [];
    const seenVideoIds = new Set<string>(); // Track unique video IDs

    for (const channelId of channelIds) {
      try {
        console.log(`Fetching videos for channel: ${channelId}`);
        
        // First, get the channel's uploads playlist ID
        const channelResponse = await youtubeApi.get('/channels', {
          params: {
            part: 'contentDetails',
            id: channelId,
            key: YOUTUBE_API_KEY
          }
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
          console.log(`No channel details found for ${channelId}`);
          continue;
        }

        const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;
        console.log(`Found uploads playlist: ${uploadsPlaylistId}`);

        // Then, get videos from the uploads playlist
        const playlistResponse = await youtubeApi.get('/playlistItems', {
          params: {
            part: 'snippet',
            playlistId: uploadsPlaylistId,
            maxResults: 2, // Limit to 2 videos per channel
            key: YOUTUBE_API_KEY
          }
        });

        if (playlistResponse.data.items && playlistResponse.data.items.length > 0) {
          console.log(`Found ${playlistResponse.data.items.length} videos for channel ${channelId}`);
          
          // Filter videos by publish date and remove duplicates
          const channelVideos = playlistResponse.data.items
            .filter((item: any) => {
              const videoId = item.snippet.resourceId.videoId;
              const publishedAt = item.snippet.publishedAt;
              
              // Skip if we've seen this video before
              if (seenVideoIds.has(videoId)) {
                return false;
              }
              
              // Skip if video is older than our lookback period
              if (moment(publishedAt).isBefore(publishedAfter)) {
                return false;
              }
              
              seenVideoIds.add(videoId);
              return true;
            })
            .map((item: any) => ({
              id: item.snippet.resourceId.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail: item.snippet.thumbnails.medium.url,
              publishedAt: item.snippet.publishedAt,
              channelTitle: item.snippet.channelTitle,
            }));

          videos.push(...channelVideos);
        } else {
          console.log(`No videos found for channel ${channelId}`);
        }
      } catch (error) {
        console.error(`Error fetching videos for channel ${channelId}:`, error);
        if (axios.isAxiosError(error)) {
          console.error('Response data:', error.response?.data);
          console.error('Response status:', error.response?.status);
          console.error('Response headers:', error.response?.headers);
          
          // Check for specific error messages
          if (error.response?.data?.error) {
            console.error('Error message:', error.response.data.error.message);
            console.error('Error code:', error.response.data.error.code);
            console.error('Error status:', error.response.data.error.status);
          }
          
          // Only handle auth errors if we have a token
          if (error.response?.status === 403 && localStorage.getItem('youtube_access_token')) {
            handleAuthError();
          }
        }
        // Continue with other channels even if one fails
      }
    }

    console.log(`Total videos found: ${videos.length}`);
    
    // Sort by published date
    const sortedVideos = videos.sort((a, b) => 
      moment(b.publishedAt).valueOf() - moment(a.publishedAt).valueOf()
    );
    
    // Calculate pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedVideos = sortedVideos.slice(startIndex, endIndex);
    
    console.log(`Returning page ${page} with ${paginatedVideos.length} videos`);
    
    return {
      videos: paginatedVideos,
      totalCount: sortedVideos.length
    };
  } catch (error) {
    console.error('Error in getRecentVideos:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
      
      // Check for specific error messages
      if (error.response?.data?.error) {
        console.error('Error message:', error.response.data.error.message);
        console.error('Error code:', error.response.data.error.code);
        console.error('Error status:', error.response.data.error.status);
      }
      
      // Only handle auth errors if we have a token
      if (error.response?.status === 403 && localStorage.getItem('youtube_access_token')) {
        handleAuthError();
      }
    }
    throw error;
  }
};