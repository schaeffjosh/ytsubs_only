import React, { useState } from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import moment from 'moment';
import VideoPlayer from './VideoPlayer';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    publishedAt: string;
    channelTitle: string;
  };
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const handleClick = () => {
    setIsPlayerOpen(true);
  };

  return (
    <>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.02)',
            transition: 'transform 0.2s ease-in-out',
          },
        }}
        onClick={handleClick}
      >
        <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
          <CardMedia
            component="img"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            image={video.thumbnail}
            alt={video.title}
          />
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
          <Typography gutterBottom variant="subtitle1" component="h2" noWrap sx={{ fontSize: '0.9rem', mb: 0.5 }}>
            {video.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.8rem' }}>
            {video.channelTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {moment(video.publishedAt).fromNow()}
          </Typography>
        </CardContent>
      </Card>
      <VideoPlayer
        videoId={video.id}
        open={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </>
  );
};

export default VideoCard;