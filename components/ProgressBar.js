import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function ProgressBar({ progress }) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBarFill, { width }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressBarBg: {
    flex: 1,
    backgroundColor: '#eee',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1a4d2e',
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: -15,
    fontSize: 10,
    color: '#666',
  },
});
