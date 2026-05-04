import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

import GetStartedScreen from '../screens/GetStartedScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ActivityScreen from '../screens/ActivityScreen';
import GoviMartScreen from '../screens/GoviMartScreen';
import ForumScreen from '../screens/ForumScreen';
import CropAdvisoryScreen from '../screens/CropAdvisoryScreen';
import ExpertDashboardScreen from '../screens/ExpertDashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ExpertPastBlogsScreen from '../screens/ExpertPastBlogsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import AdminExpertRequestsScreen from '../screens/AdminExpertRequestsScreen';
import ExpertRegistrationPendingScreen from '../screens/ExpertRegistrationPendingScreen';
import ExpertResubmitScreen from '../screens/ExpertResubmitScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AddProductScreen from '../screens/AddProductScreen';
import MyProductsScreen from '../screens/MyProductsScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// --- CUSTOM DRAWER CONTENT ---
const CustomDrawerContent = (props) => {
  const { signOut, userRole } = React.useContext(AuthContext);
  const isGuest = userRole === 'Guest';

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out of Govi Connect?');
      if (confirmed) {
        await signOut();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to log out of Govi Connect?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            onPress: async () => {
              await signOut();
            } 
          }
        ]
      );
    }
  };

  const handleLoginRedirect = async () => {
    // For guest users, signing out clears the guest token and shows auth stack
    await signOut();
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{flex: 1, backgroundColor: '#fff'}}>
      <View style={styles.drawerHeader}>
         <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={40} color="#2E7D32" />
         </View>
         <Text style={styles.drawerTitle}>Govi Connect</Text>
         <Text style={styles.drawerSubtitle}>Cultivating the Future</Text>
      </View>
      
      <View style={styles.drawerItemsContainer}>
        <DrawerItemList {...props} />
      </View>

      {/* Auth Section at bottom */}
      <View style={styles.authSection}>
        {isGuest ? (
          <TouchableOpacity style={styles.loginButton} onPress={handleLoginRedirect}>
            <Ionicons name="log-in-outline" size={22} color="#2E7D32" />
            <Text style={styles.loginText}>Login to System</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#f44336" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </DrawerContentScrollView>
  );
};

// --- MAIN DRAWER NAVIGATOR ---
const MainDrawer = () => {
  return (
    <Drawer.Navigator 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        drawerActiveTintColor: '#2E7D32',
        drawerLabelStyle: { fontWeight: 'bold' },
        headerShown: false
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabNavigator} 
        options={{ 
          title: 'Home',
          drawerIcon: ({color}) => <Ionicons name="home-outline" size={22} color={color} />,
          headerShown: false // Prevent double header
        }} 
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'My Profile',
          drawerIcon: ({color}) => <Ionicons name="person-outline" size={22} color={color} />,
          headerShown: false
        }} 
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ 
          title: 'Notifications',
          drawerIcon: ({color}) => <Ionicons name="notifications-outline" size={22} color={color} />,
          headerShown: false
        }} 
      />
      <Drawer.Screen 
        name="MyProducts" 
        component={MyProductsScreen} 
        options={{ 
          title: 'My Product Listings',
          drawerIcon: ({color}) => <Ionicons name="list-outline" size={22} color={color} />,
          headerShown: false
        }} 
      />
    </Drawer.Navigator>
  );
};

// --- MAIN TAB NAVIGATOR ---
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'GoviMart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Forum') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'CropAdvisory') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'FarmerTracker') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 5 },
        tabBarStyle: { height: 65, paddingBottom: 5, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
        headerShown: false, // Hide headers for individual tabs as they'll have their own or use the drawer header
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="GoviMart" component={GoviMartScreen} options={{ title: 'Mart' }} />
      <Tab.Screen name="Forum" component={ForumScreen} options={{ title: 'Forum' }} />
      <Tab.Screen name="CropAdvisory" component={CropAdvisoryScreen} options={{ title: 'Advisory' }} />
      <Tab.Screen name="FarmerTracker" component={ActivityScreen} options={{ title: 'Tasks' }} />
    </Tab.Navigator>
  );
};

// --- EXPERT DRAWER NAVIGATOR ---
const ExpertDrawer = () => {
  return (
    <Drawer.Navigator 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#1F9A4E' }, // Match expert theme
        headerTintColor: '#fff',
        drawerActiveTintColor: '#1F9A4E',
        drawerLabelStyle: { fontWeight: 'bold' },
        headerShown: false
      }}
    >
      <Drawer.Screen 
        name="ExpertHome" 
        component={ExpertDashboardScreen} 
        options={{ 
          title: 'Write Blogs',
          drawerIcon: ({color}) => <Ionicons name="create-outline" size={22} color={color} />,
          headerShown: false 
        }} 
      />
      <Drawer.Screen 
        name="MyBlogs" 
        component={ExpertPastBlogsScreen} 
        options={{ 
          title: 'View Past Blogs',
          drawerIcon: ({color}) => <Ionicons name="document-text-outline" size={22} color={color} />,
          headerShown: false
        }} 
      />
      <Drawer.Screen 
        name="Forum" 
        component={ForumScreen} 
        options={{ 
          title: 'Community Forum',
          drawerIcon: ({color}) => <Ionicons name="chatbubbles-outline" size={22} color={color} />,
          headerShown: false
        }} 
      />
      <Drawer.Screen 
        name="CropProfile" 
        component={CropAdvisoryScreen} 
        options={{ 
          title: 'Crop Advisory',
          drawerIcon: ({color}) => <Ionicons name="leaf-outline" size={22} color={color} />,
          headerShown: false
        }} 
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'My Profile',
          drawerIcon: ({color}) => <Ionicons name="person-outline" size={22} color={color} />,
          headerShown: false
        }} 
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ 
          title: 'Notifications',
          drawerIcon: ({color}) => <Ionicons name="notifications-outline" size={22} color={color} />,
          headerShown: false
        }} 
      />
    </Drawer.Navigator>
  );
};

// --- ADMIN DRAWER NAVIGATOR ---
const AdminDrawer = () => {
  return (
    <Drawer.Navigator 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#115C39' },
        headerTintColor: '#fff',
        drawerActiveTintColor: '#115C39',
        drawerLabelStyle: { fontWeight: 'bold' },
        headerShown: false
      }}
    >
      <Drawer.Screen 
        name="AdminOverview" 
        component={AdminDashboardScreen} 
        options={{ 
          title: 'System Overview',
          drawerIcon: ({color}) => <Ionicons name="grid-outline" size={22} color={color} />,
          headerShown: false 
        }} 
      />
      <Drawer.Screen 
        name="AdminUsers" 
        component={AdminUsersScreen} 
        options={{ 
          title: 'Users & Experts',
          drawerIcon: ({color}) => <Ionicons name="people-outline" size={22} color={color} />,
          headerShown: false
        }} 
      />
      <Drawer.Screen 
        name="AdminExpertRequests" 
        component={AdminExpertRequestsScreen} 
        options={{ 
          title: 'Expert Requests',
          drawerIcon: ({color}) => <Ionicons name="shield-checkmark-outline" size={22} color={color} />,
          headerShown: true,
          headerStyle: { backgroundColor: '#115C39' },
          headerTintColor: '#fff'
        }} 
      />
      <Drawer.Screen 
        name="AdminMarketApprovals" 
        component={ActivityScreen} 
        options={{ 
          title: 'Market Approvals',
          drawerIcon: ({color}) => <Ionicons name="cart-outline" size={22} color={color} />,
          headerShown: true,
          headerStyle: { backgroundColor: '#115C39' },
          headerTintColor: '#fff'
        }} 
      />
      <Drawer.Screen 
        name="AdminProfile" 
        component={ProfileScreen} 
        options={{ 
          title: 'My Profile',
          drawerIcon: ({color}) => <Ionicons name="person-outline" size={22} color={color} />,
          headerShown: false
        }} 
      />
    </Drawer.Navigator>
  );
};


// --- APP NAVIGATOR ENTRY POINT ---
const AppNavigator = ({ userToken, userRole, userStatus }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          // AUTH STACK
          <>
            <Stack.Screen name="GetStarted" component={GetStartedScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : userRole === 'Admin' ? (
          // ADMIN APP STACK
          <>
            <Stack.Screen name="AdminMain" component={AdminDrawer} />
          </>
        ) : userRole === 'Expert' ? (
          // EXPERT APP STACK
          userStatus === 'Pending' ? (
            <>
              <Stack.Screen name="ExpertPending" component={ExpertRegistrationPendingScreen} />
            </>
          ) : userStatus === 'Rejected' ? (
            <>
              <Stack.Screen name="ExpertRejected" component={ExpertResubmitScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="ExpertMain" component={ExpertDrawer} />
              <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
            </>
          )
        ) : (
          // MAIN APP STACK (User Drawer + Sub-screens)
          <>
            <Stack.Screen name="Main" component={MainDrawer} />
            <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
            <Stack.Screen 
              name="Activities" 
              component={ActivityScreen} 
              options={{ 
                headerShown: true, 
                title: 'Farming Workspace',
                headerStyle: { backgroundColor: '#2E7D32' },
                headerTintColor: '#fff'
              }} 
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddProduct"
              component={AddProductScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MyProducts"
              component={MyProductsScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    height: 220,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10
  },
  logoCircle: {
     width: 80,
     height: 80,
     borderRadius: 40,
     backgroundColor: '#E8F5E9',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 12,
     shadowColor: '#2E7D32',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.1,
     shadowRadius: 8,
     elevation: 2
  },
  drawerTitle: {
    color: '#2E7D32',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  drawerSubtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic'
  },
  drawerItemsContainer: {
    flex: 1,
    paddingTop: 10
  },
  authSection: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'center'
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f44336',
    marginLeft: 10
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E7D32'
  },
  loginText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginLeft: 10
  }
});

export default AppNavigator;
