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
  const prevValue = React.useRef(null);
  const targetValue = typeof value === 'string' ? parseFloat(value) : value;

  useEffect(() => {
    // Only trigger animation if the target value changed and is valid
    if (targetValue !== prevValue.current && !isNaN(targetValue)) {
      prevValue.current = targetValue;
      count.value = 0;
      count.value = withDelay(delay, withTiming(targetValue, {
        duration: duration,
        easing: Easing.out(Easing.exp),
      }));
    }
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
      defaultValue="0"
      style={[styles.defaultStyle, style, { pointerEvents: 'none' }]}
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
