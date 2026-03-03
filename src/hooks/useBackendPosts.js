import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getAuthToken } from '../lib/apiClient';

function isEnabledWithToken(enabled) {
  return Boolean(getAuthToken()) && enabled;
}

export function useCreatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, images = [] }) => {
      const result = await apiClient.post('/api/posts', { text, images });
      return result.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'items'] });
    },
  });
}

export function usePostCommentsQuery(postId, options = {}) {
  return useQuery({
    queryKey: ['post', postId, 'comments'],
    queryFn: async () => {
      const result = await apiClient.get(`/api/posts/${postId}/comments`);
      return {
        items: result.items || [],
        count: result.count || 0,
      };
    },
    enabled: isEnabledWithToken(Boolean(postId) && (options.enabled ?? true)),
  });
}

export function useCreateCommentMutation(postId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content }) => {
      const result = await apiClient.post(`/api/posts/${postId}/comments`, { content });
      return result.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'items'] });
    },
  });
}

export function usePostLikesQuery(postId, options = {}) {
  return useQuery({
    queryKey: ['post', postId, 'likes'],
    queryFn: async () => {
      const result = await apiClient.get(`/api/posts/${postId}/likes`);
      return {
        liked: Boolean(result.liked),
        count: result.count || 0,
      };
    },
    enabled: isEnabledWithToken(Boolean(postId) && (options.enabled ?? true)),
  });
}

export function useLikePostMutation(postId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post(`/api/posts/${postId}/likes`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId, 'likes'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'items'] });
    },
  });
}

export function useUnlikePostMutation(postId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/posts/${postId}/likes`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId, 'likes'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'items'] });
    },
  });
}
