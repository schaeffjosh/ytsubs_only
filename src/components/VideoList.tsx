import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, CircularProgress, Button, Pagination } from '@mui/material';
import VideoCard from './VideoCard';
import { getRecentVideos } from '../services/youtubeApi';

interface Video {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    publishedAt: string;
    channelTitle: string;
}

const VIDEOS_PER_PAGE = 50;

const VideoList: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchVideos = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      
      console.log('Starting to fetch videos...');
      const { videos: recentVideos, totalCount: total } = await getRecentVideos(page, VIDEOS_PER_PAGE);
      console.log(`Fetched ${recentVideos.length} videos`);
      
      setVideos(recentVideos);
      setTotalCount(total);
    } catch (err) {
      console.error('Error in VideoList:', err);
      setError('Failed to fetch videos. Please make sure you are authenticated and try again.');
      
      if (err instanceof Error) {
        setErrorDetails(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [page]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error" variant="h6" gutterBottom>{error}</Typography>
        {errorDetails && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            Error details: {errorDetails}
          </Typography>
        )}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => fetchVideos(true)}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  if (videos.length === 0) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>No videos found</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          There are no recent videos from your subscriptions in the last 3 days.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => fetchVideos(true)}
          sx={{ mt: 2 }}
        >
          Refresh
        </Button>
      </Container>
    );
  }

  const totalPages = Math.ceil(totalCount / VIDEOS_PER_PAGE);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Recent Videos
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => fetchVideos(true)}
          size="small"
        >
          Refresh
        </Button>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
          '& > *': {
            width: '100%',
            height: '100%',
            maxWidth: '400px',
            margin: '0 auto',
          }
        }}
      >
        {videos.map((video: Video) => (
          <Box key={video.id} sx={{ height: '100%' }}>
            <VideoCard video={video} />
          </Box>
        ))}
      </Box>
      
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4} mb={2}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            size="large"
          />
        </Box>
      )}
      
      <Typography variant="body2" color="text.secondary" align="center" mb={4}>
        Showing {((page - 1) * VIDEOS_PER_PAGE) + 1}-{Math.min(page * VIDEOS_PER_PAGE, totalCount)} of {totalCount} videos
      </Typography>
    </Container>
  );
};

export default VideoList;