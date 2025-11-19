import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const ProfileStat = ({ label, value }) => (
  <View style={styles.container}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 12
  },
  value: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700'
  },
  label: {
    color: colors.accentMuted,
    fontSize: 12,
    marginTop: 2
  }
});

export default ProfileStat;
