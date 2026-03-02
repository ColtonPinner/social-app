import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, setAuthToken, getAuthToken } from '../lib/apiClient';

const authQueryKey = ['auth', 'me'];

export function useCurrentUserQuery() {
  const token = getAuthToken();

  return useQuery({
    queryKey: authQueryKey,
    queryFn: async () => {
      const result = await apiClient.get('/api/auth/me');
      return result.user;
    },
    enabled: Boolean(token),
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const result = await apiClient.post('/api/auth/login', { email, password });
      setAuthToken(result.token);
      return result.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKey, user);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password, username, fullName }) => {
      const result = await apiClient.post('/api/auth/register', {
        email,
        password,
        username,
        fullName,
      });
      setAuthToken(result.token);
      return result.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKey, user);
    },
  });
}

export function logoutBackendUser() {
  setAuthToken(null);
}
