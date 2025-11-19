import { formatDistanceToNow } from 'date-fns';

export const timeAgo = (date) => {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    return '';
  }
};
