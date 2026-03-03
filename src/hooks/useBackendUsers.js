import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getAuthToken } from '../lib/apiClient';

function isEnabledWithToken(enabled) {
  return Boolean(getAuthToken()) && enabled;
}

export function useBackendUsersQuery(search = '', options = {}) {
  return useQuery({
    queryKey: ['users', 'list', search, options.limit || 20],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (search && String(search).trim()) {
        params.set('query', String(search).trim());
      }

      if (options.limit) {
        params.set('limit', String(options.limit));
      }

      const suffix = params.toString() ? `?${params.toString()}` : '';
      const result = await apiClient.get(`/api/users${suffix}`);
      return result.items || [];
    },
    enabled: isEnabledWithToken(options.enabled ?? true),
  });
}

export function useBackendUserByIdQuery(userId, options = {}) {
  return useQuery({
    queryKey: ['users', 'detail', userId],
    queryFn: async () => {
      const result = await apiClient.get(`/api/users/${userId}`);
      return result.user;
    },
    enabled: isEnabledWithToken(Boolean(userId) && (options.enabled ?? true)),
  });
}

export function useUpdateBackendProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, fullName, avatarUrl, coverImageUrl }) => {
      const result = await apiClient.patch('/api/users/me', {
        username,
        fullName,
        avatarUrl,
        coverImageUrl,
      });
      return result.user;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      queryClient.setQueryData(['users', 'detail', updatedUser.id], updatedUser);
      queryClient.setQueryData(['auth', 'me'], updatedUser);
    },
  });
}

export function useBackendUserPostsQuery(userId, options = {}) {
  return useQuery({
    queryKey: ['users', 'posts', userId],
    queryFn: async () => {
      const result = await apiClient.get(`/api/users/${userId}/posts`);
      return result.items || [];
    },
    enabled: isEnabledWithToken(Boolean(userId) && (options.enabled ?? true)),
  });
}

export function useBackendUserFollowersQuery(userId, options = {}) {
  return useQuery({
    queryKey: ['users', 'followers', userId],
    queryFn: async () => {
      const result = await apiClient.get(`/api/users/${userId}/followers`);
      return {
        items: result.items || [],
        count: result.count || 0,
      };
    },
    enabled: isEnabledWithToken(Boolean(userId) && (options.enabled ?? true)),
  });
}

export function useBackendUserFollowingQuery(userId, options = {}) {
  return useQuery({
    queryKey: ['users', 'following', userId],
    queryFn: async () => {
      const result = await apiClient.get(`/api/users/${userId}/following`);
      return {
        items: result.items || [],
        count: result.count || 0,
      };
    },
    enabled: isEnabledWithToken(Boolean(userId) && (options.enabled ?? true)),
  });
}

export function useBackendFollowStatusQuery(userId, options = {}) {
  return useQuery({
    queryKey: ['users', 'follow-status', userId],
    queryFn: async () => {
      const result = await apiClient.get(`/api/users/${userId}/follow-status`);
      return Boolean(result.following);
    },
    enabled: isEnabledWithToken(Boolean(userId) && (options.enabled ?? true)),
  });
}

export function useFollowUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }) => {
      await apiClient.post(`/api/users/${userId}/follow`, {});
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'followers', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'following', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'follow-status', variables.userId] });
    },
  });
}

export function useUnfollowUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }) => {
      await apiClient.delete(`/api/users/${userId}/follow`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'followers', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'following', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'follow-status', variables.userId] });
    },
  });
}
