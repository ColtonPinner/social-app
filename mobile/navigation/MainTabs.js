import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MessagesScreen from '../screens/MessagesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const MainTabs = ({ currentUser, profile, onSignOut, onProfileUpdated }) => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#09090b',
        borderTopColor: 'rgba(255,255,255,0.05)'
      },
      tabBarActiveTintColor: '#4c6ef5',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarIcon: ({ color, size }) => {
        const iconMap = {
          Feed: 'home',
          Profile: 'person-circle',
          Messages: 'chatbubble-ellipses',
          Settings: 'settings'
        };
        return <Ionicons name={iconMap[route.name]} color={color} size={size} />;
      }
    })}
  >
    <Tab.Screen name="Feed">
      {(props) => (
        <FeedScreen
          {...props}
          currentUser={currentUser}
          profile={profile}
          onProfileUpdated={onProfileUpdated}
        />
      )}
    </Tab.Screen>
    <Tab.Screen name="Profile">
      {(props) => (
        <ProfileScreen
          {...props}
          currentUser={currentUser}
          profile={profile}
          onProfileUpdated={onProfileUpdated}
          onSignOut={onSignOut}
        />
      )}
    </Tab.Screen>
    <Tab.Screen name="Messages">
      {(props) => <MessagesScreen {...props} currentUser={currentUser} />}
    </Tab.Screen>
    <Tab.Screen name="Settings">
      {(props) => <SettingsScreen {...props} onSignOut={onSignOut} />}
    </Tab.Screen>
  </Tab.Navigator>
);

export default MainTabs;
