import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = ({ onAuthenticated }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login">
      {(props) => <LoginScreen {...props} onAuthenticated={onAuthenticated} />}
    </Stack.Screen>
    <Stack.Screen name="Signup">
      {(props) => <SignupScreen {...props} onAuthenticated={onAuthenticated} />}
    </Stack.Screen>
  </Stack.Navigator>
);

export default AuthNavigator;
