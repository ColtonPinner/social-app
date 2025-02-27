import React from 'react';
import { Card, CardContent, Typography, Box, CardMedia } from '@mui/material';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const TweetCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: 'none',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '12px',
  width: 'auto', // Changed from 260px to 100% to make it wider
  maxWidth: '360px', // Ensure it doesn't exceed container width
  minWidth: 360, // Added to ensure it doesn't shrink too much
  '&:hover': {
    boxShadow: theme.shadows[1]
  }
}));

const Tweet = ({ tweet }) => {
  const formattedDate = new Date(tweet.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  // For debugging - this will help identify the structure of the tweet object
  console.log("Tweet object:", tweet);

  return (
    <TweetCard>
      <CardContent sx={{ padding: theme => theme.spacing(3) }}>
        <Box display="flex" alignItems="center" mb={2}>
          <img 
            src={tweet.user?.avatar_url || 'https://via.placeholder.com/40'} 
            alt={tweet.user?.username}
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
          />
          <Box sx={{ ml: 2 }}>
            <Link 
              to={`/profile/${tweet.user_id}`}
              style={{ fontWeight: 'bold', color: '#000', textDecoration: 'none' }}
            >
              {tweet.user?.username || "Anonymous"}
            </Link>
            <Typography variant="caption" color="text.secondary" display="block">
              {formattedDate}
            </Typography>
          </Box>
        </Box>

        {/* Try multiple potential field names for content */}
        <Typography variant="body1" gutterBottom>
          {tweet.text || tweet.content || tweet.message || JSON.stringify(tweet)}
        </Typography>
        
        {tweet.image_url && (
          <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden' }}>
            {tweet.image_url.match(/\.(mp4|webm)$/) ? (
              <video
                controls
                style={{ width: '100%', borderRadius: 8 }}
              >
                <source src={tweet.image_url} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            ) : (
              <CardMedia
                component="img"
                image={tweet.image_url}
                alt="Tweet media"
                sx={{
                  borderRadius: 2,
                  maxHeight: 300,
                  objectFit: 'cover',
                  width: '100%'
                }}
              />
            )}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 4, color: 'text.secondary' }}>
          <button style={{ display: 'flex', alignItems: 'center', marginRight: 16, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>
            <HeartIcon style={{ width: 20, height: 20 }} />
            <Typography variant="caption" sx={{ ml: 1 }}>{tweet.likes_count || 0}</Typography>
          </button>
          <button style={{ display: 'flex', alignItems: 'center', color: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChatBubbleLeftIcon style={{ width: 20, height: 20 }} />
            <Typography variant="caption" sx={{ ml: 1 }}>{tweet.comments_count || 0}</Typography>
          </button>
        </Box>
      </CardContent>
    </TweetCard>
  );
};

export default Tweet;