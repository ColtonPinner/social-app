import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

const LoadingOverlay = ({ label = 'Loading...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  label: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16
  }
});

export default LoadingOverlay;
