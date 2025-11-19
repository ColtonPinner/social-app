import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { timeAgo } from '../utils/format';

const PostCard = ({ post, onPress }) => (
  <TouchableOpacity onPress={() => onPress?.(post)} style={styles.card}>
    <Text style={styles.author}>{post.user?.full_name || post.user?.username || 'Unknown'}</Text>
    <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
    <Text style={styles.body}>{post.text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  author: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16
  },
  time: {
    color: colors.accentMuted,
    fontSize: 12,
    marginBottom: 8
  },
  body: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20
  }
});

export default PostCard;
