import { useQuery } from '@tanstack/react-query';
import { apiClient, getAuthToken } from '../lib/apiClient';

export function useBackendFeedQuery() {
  const token = getAuthToken();

  return useQuery({
    queryKey: ['feed', 'items'],
    queryFn: async () => {
      const result = await apiClient.get('/api/feed');
      return result.items || [];
    },
    enabled: Boolean(token),
  });
}
