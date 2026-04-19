import React, { useEffect } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/**
 * A high-performance CountUp component that animates numeric values.
 * Uses Reanimated to run on the UI thread for maximum smoothness.
 * 
 * @param {number|string} value - The target number to count up to
 * @param {number} duration - Duration of the animation in ms (default: 800)
 * @param {number} delay - Delay before starting the animation in ms (default: 0)
 * @param {object} style - Styling for the number text
 */
const CountUp = ({ value, duration = 1000, delay = 0, style }) => {
  const count = useSharedValue(0);
  const targetValue = typeof value === 'string' ? parseFloat(value) : value;

  useEffect(() => {
    // Reset and animate with delay when value changes
    count.value = 0;
    count.value = withDelay(delay, withTiming(targetValue || 0, {
      duration: duration,
      easing: Easing.out(Easing.exp), // Provides that premium "settling" feel
    }));
  }, [targetValue, duration, delay]);

  const animatedProps = useAnimatedProps(() => {
    // Round to nearest integer for the counter effect
    return {
      text: `${Math.floor(count.value)}`,
    };
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      pointerEvents="none"
      defaultValue="0"
      style={[styles.defaultStyle, style]}
      animatedProps={animatedProps}
    />
  );
};

const styles = StyleSheet.create({
  defaultStyle: {
    padding: 0,
    margin: 0,
    includeFontPadding: false, // For better alignment on Android
    textAlignVertical: 'center',
  },
});

export default CountUp;
