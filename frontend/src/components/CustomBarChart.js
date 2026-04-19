import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const { width: screenWidth } = Dimensions.get('window');

const CustomBarChart = ({ data = [] }) => {
  const chartWidth = screenWidth - 64;
  const chartHeight = 180;
  const barWidth = 35;
  const spacing = data.length > 0 ? (chartWidth - (data.length * barWidth)) / (data.length + 1) : 0;
  
  const maxValue = Math.max(...data.map(d => d.count), 1);
  
  // Single shared value for all bars to ensure stability and follow Hook rules
  const masterProgress = useSharedValue(0);
  const prevDataString = React.useRef('');

  useEffect(() => {
    const dataString = JSON.stringify(data);
    if (dataString !== prevDataString.current) {
      prevDataString.current = dataString;
      masterProgress.value = 0;
      masterProgress.value = withTiming(1, { 
        duration: 1000, 
        easing: Easing.out(Easing.exp) 
      });
    }
  }, [data]);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No geographical data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight + 35}>
        <Line 
          x1="0" y1={chartHeight} 
          x2={chartWidth} y2={chartHeight} 
          stroke="#E0E0E0" strokeWidth="1" 
        />

        {data.map((item, index) => {
          const x = spacing + index * (barWidth + spacing);
          const targetHeight = (item.count / maxValue) * (chartHeight - 30);
          
          return (
            <G key={index}>
              <BarItem 
                x={x} 
                y={chartHeight} 
                width={barWidth} 
                targetHeight={targetHeight} 
                progress={masterProgress}
                index={index}
              />
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight + 20}
                fontSize="10"
                fill="#757575"
                textAnchor="middle"
              >
                {item._id ? (item._id.length > 6 ? item._id.substring(0, 5) + '..' : item._id) : 'Unk.'}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const BarItem = ({ x, y, width, targetHeight, progress, index }) => {
  const animatedProps = useAnimatedProps(() => {
    // Individual stagger effect using the master progress
    const stagger = index * 0.1;
    const adjustedProgress = Math.max(0, Math.min(1, (progress.value - stagger) / (1 - stagger || 1)));
    const h = targetHeight * adjustedProgress;
    return {
      height: h,
      y: y - h,
    };
  });

  return (
    <AnimatedRect
      x={x}
      width={width}
      fill="#4285F4"
      rx="4"
      animatedProps={animatedProps}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    alignItems: 'center',
    width: '100%',
  },
  emptyContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 12,
  },
});

export default CustomBarChart;
