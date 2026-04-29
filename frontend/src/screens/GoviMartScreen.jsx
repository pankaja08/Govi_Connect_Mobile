import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GoviMartScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Govi Mart Platform!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' }
});

export default GoviMartScreen;
