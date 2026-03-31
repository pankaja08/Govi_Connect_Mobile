import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  SafeAreaView, 
  Platform,
  ImageBackground 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LeafAnimation = ({ index }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 4000 + Math.random() * 3000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 4000 + Math.random() * 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50 - Math.random() * 100],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30 + Math.random() * 60],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.6, 0.1],
  });

  return (
    <Animated.View
      style={[
        styles.leaf,
        {
          left: (width / 5) * index,
          transform: [{ translateY }, { translateX }],
          opacity,
        },
      ]}
    >
      <Ionicons name="leaf" size={40 + Math.random() * 40} color="#81C784" />
    </Animated.View>
  );
};

const GetStartedScreen = ({ navigation }) => {
  const chevronAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(chevronAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(chevronAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const chevronTranslate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../assets/agri_bg.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(27, 94, 32, 0.4)', 'rgba(27, 94, 32, 0.6)', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        />
        
        <SafeAreaView style={{ flex: 1 }}>
          {/* Background Animations */}
          {[0, 1, 2, 3, 4].map((i) => (
            <LeafAnimation key={i} index={i} />
          ))}

          <View style={styles.content}>
            <View style={styles.header}>
              <Ionicons name="leaf" size={70} color="#fff" style={styles.logoLogo} />
              <Text style={styles.title}>Welcome to{'\n'}Govi Connect</Text>
              <Text style={styles.subtitle}>Smart Agriculture Platform</Text>
            </View>

            <TouchableOpacity 
              style={styles.pillButton} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.pillText}>Swipe to get started</Text>
              <View style={styles.pillIconContainer}>
                <Animated.View style={{ transform: [{ translateX: chevronTranslate }] }}>
                   <Text style={styles.chevron}>&gt; &gt; &gt;</Text>
                </Animated.View>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  leaf: {
    position: 'absolute',
    bottom: height * 0.2,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 50,
    zIndex: 10,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logoLogo: {
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: '#E8F5E9',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 1,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b8ff1f', // Neon green matching the mockup
    borderRadius: 50,
    paddingVertical: 10,
    paddingLeft: 30,
    paddingRight: 10,
    width: '100%',
    maxWidth: 400,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  pillText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a3300',
  },
  pillIconContainer: {
    backgroundColor: '#000',
    borderRadius: 40,
    paddingHorizontal: 25,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    opacity: 0.8,
  }
});

export default GetStartedScreen;
