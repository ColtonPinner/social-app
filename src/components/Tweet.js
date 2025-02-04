import React from 'react';
import { Card, CardContent, Typography, Box, CardMedia } from '@mui/material';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient';

const TweetCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: 'none',
  border: `1px solid ${theme.palette.divider}`
}));

const Tweet = ({ tweet }) => {
  return (
    <TweetCard>
      <CardContent>
        <Typography variant="body1" gutterBottom>
          {tweet.content}
        </Typography>
        
        {tweet.media_url && (
          <Box sx={{ mt: 2 }}>
            {tweet.media_url.match(/\.(mp4|webm)$/) ? (
              <video
                controls
                style={{ maxWidth: '100%', borderRadius: 8 }}
              >
                <source src={tweet.media_url} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            ) : (
              <CardMedia
                component="img"
                image={tweet.media_url}
                alt="Tweet media"
                sx={{
                  borderRadius: 2,
                  maxHeight: 300,
                  objectFit: 'cover'
                }}
              />
            )}
          </Box>
        )}
        
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ mt: 2, display: 'block' }}
        >
          Posted by: {tweet.user_email}
          {tweet.created_at && ` • ${new Date(tweet.created_at).toLocaleString()}`}
        </Typography>
      </CardContent>
    </TweetCard>
  );
};

export default Tweet;