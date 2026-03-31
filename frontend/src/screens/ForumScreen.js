import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ForumScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Connect with the Community!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' }
});

export default ForumScreen;
