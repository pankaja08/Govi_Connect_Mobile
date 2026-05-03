import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

import GetStartedScreen from '../screens/GetStartedScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ActivityScreen from '../screens/ActivityScreen';
import FarmerTrackerScreen from '../screens/FarmerTrackerScreen';
import GoviMartScreen from '../screens/GoviMartScreen';
import ForumScreen from '../screens/ForumScreen';
import ForumQAScreen from '../screens/ForumQ&AScreen';
import ForumEditQuestionScreen from '../screens/ForumEditQuestionScreen';
import ExpertEditAnswerScreen from '../screens/ExpertEditAnswerScreen';
import CropAdvisoryScreen from '../screens/CropAdvisoryScreen';
import ExpertCropProfileScreen from '../screens/ExpertCropProfileScreen';
import ExpertDashboardScreen from '../screens/ExpertDashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ExpertPastBlogsScreen from '../screens/ExpertPastBlogsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import AdminExpertRequestsScreen from '../screens/AdminExpertRequestsScreen';
import ExpertRegistrationPendingScreen from '../screens/ExpertRegistrationPendingScreen';
import ExpertResubmitScreen from '../screens/ExpertResubmitScreen';
import AddProductScreen from '../screens/AddProductScreen';
import MyProductsScreen from '../screens/MyProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AdminMarketApprovalsScreen from '../screens/AdminMarketApprovalsScreen';
import AdminReportScreen from '../screens/AdminReportScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// --- CUSTOM DRAWER CONTENT ---
const CustomDrawerContent = (props) => {
  const { signOut, userRole } = React.useContext(AuthContext);
  const isGuest = userRole === 'Guest';

  // Live counts for admin badges
  const [pendingExperts, setPendingExperts] = React.useState(0);
  const [pendingProducts, setPendingProducts] = React.useState(0);

  React.useEffect(() => {
    if (userRole !== 'Admin') return;
    const load = async () => {
      try {
        const [eRes, pRes] = await Promise.all([
          apiClient.get('/users/admin/pending-experts'),
          apiClient.get('/products/admin/pending'),
        ]);
        setPendingExperts(eRes.data?.data?.experts?.length ?? eRes.data?.results ?? 0);
        setPendingProducts(pRes.data?.data?.products?.length ?? pRes.data?.results ?? 0);
      } catch (_) { }
    };
    load();
    const interval = setInterval(load, 30000); // refresh every 30 s
    return () => clearInterval(interval);
  }, [userRole]);

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

  // Helper: badge pill
  const Badge = ({ count, color = '#E53935' }) => {
    if (!count || count === 0) return null;
    return (
      <View style={{
        backgroundColor: color,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
      }}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{count > 99 ? '99+' : count}</Text>
      </View>
    );
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.drawerHeader}>
        <View style={styles.logoCircle}>
          <Ionicons name="leaf" size={40} color="#2E7D32" />
        </View>
        <Text style={styles.drawerTitle}>Govi Connect</Text>
        <Text style={styles.drawerSubtitle}>Cultivating the Future</Text>
      </View>

      <View style={styles.drawerItemsContainer}>
        <DrawerItemList
          {...props}
        // Inject count badges via screenOptions override is not possible directly;
        // We pass extra context through props so each screen's drawerLabel can use it.
        // Instead we use the DrawerItemList but override individual items below.
        />
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


// --- ADMIN DRAWER CONTENT (with live count badges) ---
const AdminDrawerContent = (props) => {
  const { signOut } = React.useContext(AuthContext);
  const [pendingExperts, setPendingExperts] = React.useState(0);
  const [pendingProducts, setPendingProducts] = React.useState(0);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [eRes, pRes] = await Promise.all([
          apiClient.get('/users/admin/pending-experts'),
          apiClient.get('/products/admin/pending'),
        ]);
        setPendingExperts(eRes.data?.data?.experts?.length ?? eRes.data?.results ?? 0);
        setPendingProducts(pRes.data?.data?.products?.length ?? pRes.data?.results ?? 0);
      } catch (_) { }
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        await signOut();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: async () => await signOut() },
      ]);
    }
  };

  const CountBadge = ({ count, color = '#E53935' }) => {
    if (!count) return null;
    return (
      <View style={{
        backgroundColor: color, borderRadius: 10,
        minWidth: 22, height: 22, paddingHorizontal: 6,
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    );
  };

  const ADMIN_ITEMS = [
    { name: 'AdminOverview', label: 'System Overview', icon: 'grid-outline' },
    { name: 'AdminUsers', label: 'Users & Experts', icon: 'people-outline' },
    { name: 'AdminExpertRequests', label: 'Expert Requests', icon: 'shield-checkmark-outline', badge: pendingExperts, badgeColor: '#E53935' },
    { name: 'AdminMarketApprovals', label: 'Market Approvals', icon: 'cart-outline', badge: pendingProducts, badgeColor: '#FF8F00' },
    { name: 'AdminProfile', label: 'My Profile', icon: 'person-outline' },
  ];

  const activeRoute = props.state?.routes?.[props.state.index]?.name;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.logoCircle}>
          <Ionicons name="leaf" size={40} color="#2E7D32" />
        </View>
        <Text style={styles.drawerTitle}>Govi Connect</Text>
        <Text style={styles.drawerSubtitle}>Admin Portal</Text>
      </View>

      {/* Items */}
      <View style={styles.drawerItemsContainer}>
        {ADMIN_ITEMS.map(item => {
          const isActive = activeRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => props.navigation.navigate(item.name)}
              style={[
                styles.adminDrawerItem,
                isActive && styles.adminDrawerItemActive,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isActive ? '#115C39' : '#555'}
              />
              <Text style={[styles.adminDrawerLabel, isActive && styles.adminDrawerLabelActive]}>
                {item.label}
              </Text>
              {item.badge > 0 && <CountBadge count={item.badge} color={item.badgeColor} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout */}
      <View style={styles.authSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
          headerShown: false // Prevent double header
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          drawerIcon: ({ color }) => <Ionicons name="notifications-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="MyProducts"
        component={MyProductsScreen}
        options={{
          title: 'My Products',
          drawerIcon: ({ color }) => <Ionicons name="cart-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
    </Drawer.Navigator>
  );
};

// --- MAIN TAB NAVIGATOR ---
const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();

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
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 85 : (insets.bottom > 0 ? 80 : 65),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
          paddingTop: 10,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="GoviMart" component={GoviMartScreen} options={{ title: 'Mart' }} />
      <Tab.Screen name="Forum" component={ForumScreen} options={{ title: 'Forum' }} />
      <Tab.Screen name="CropAdvisory" component={CropAdvisoryScreen} options={{ title: 'Advisory' }} />
      <Tab.Screen name="FarmerTracker" component={FarmerTrackerScreen} options={{ title: 'Tracker' }} />
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
          drawerIcon: ({ color }) => <Ionicons name="create-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="MyBlogs"
        component={ExpertPastBlogsScreen}
        options={{
          title: 'View Past Blogs',
          drawerIcon: ({ color }) => <Ionicons name="document-text-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="MyProducts"
        component={MyProductsScreen}
        options={{
          title: 'My Products',
          drawerIcon: ({ color }) => <Ionicons name="cart-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="Forum"
        component={ForumScreen}
        options={{
          title: 'Community Forum',
          drawerIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="CropProfile"
        component={ExpertCropProfileScreen}
        options={{
          title: 'Crop Profile',
          drawerIcon: ({ color }) => <Ionicons name="leaf-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          drawerIcon: ({ color }) => <Ionicons name="notifications-outline" size={22} color={color} />,
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
      drawerContent={(props) => <AdminDrawerContent {...props} />}
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
          drawerIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{
          title: 'Users & Experts',
          drawerIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color} />,
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="AdminExpertRequests"
        component={AdminExpertRequestsScreen}
        options={{
          title: 'Expert Requests',
          drawerIcon: ({ color }) => <Ionicons name="shield-checkmark-outline" size={22} color={color} />,
          headerShown: true,
          headerStyle: { backgroundColor: '#115C39' },
          headerTintColor: '#fff'
        }}
      />
      <Drawer.Screen
        name="AdminMarketApprovals"
        component={AdminMarketApprovalsScreen}
        options={{
          title: 'Market Approvals',
          drawerIcon: ({ color }) => <Ionicons name="cart-outline" size={22} color={color} />,
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="AdminProfile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
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
            <Stack.Screen name="AdminReport" component={AdminReportScreen} options={{ headerShown: false }} />
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
              <Stack.Screen name="ForumDetail" component={ForumQAScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ForumEditQuestion" component={ForumEditQuestionScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ExpertEditAnswer" component={ExpertEditAnswerScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerShown: false }} />
              <Stack.Screen name="MyProducts" component={MyProductsScreen} options={{ headerShown: false }} />
            </>
          )
        ) : (
          // MAIN APP STACK (User Drawer + Sub-screens)
          <>
            <Stack.Screen name="Main" component={MainDrawer} />
            <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
            <Stack.Screen name="ForumDetail" component={ForumQAScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForumEditQuestion" component={ForumEditQuestionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ExpertEditAnswer" component={ExpertEditAnswerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MyProducts" component={MyProductsScreen} options={{ headerShown: false }} />
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
  },
  // Admin drawer custom items
  adminDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 10,
    gap: 14,
  },
  adminDrawerItemActive: {
    backgroundColor: '#E8F5E9',
  },
  adminDrawerLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  adminDrawerLabelActive: {
    color: '#115C39',
    fontWeight: '800',
  },
});

export default AppNavigator;
