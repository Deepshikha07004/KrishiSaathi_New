import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import LanguageScreen from '../screens/LanguageScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import LocationScreen from '../screens/LocationScreen';
import HomeScreen from '../screens/HomeScreen';
import WeatherScreen from '../screens/WeatherScreen';
import CropRecommendationScreen from '../screens/CropRecommendationScreen';
import CropAdvisoryScreen from '../screens/CropAdvisoryScreen';
import StorageScreen from '../screens/StorageScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#F1F8E9' },
                headerStyle: { backgroundColor: '#2E7D32' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Location" component={LocationScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Weather" component={WeatherScreen} options={{ headerShown: true, title: "Weather" }} />
            <Stack.Screen name="CropRec" component={CropRecommendationScreen} options={{ headerShown: true, title: "Recommendation" }} />
            <Stack.Screen name="CropAdv" component={CropAdvisoryScreen} options={{ headerShown: true, title: "Advisory" }} />
            <Stack.Screen name="Storage" component={StorageScreen} options={{ headerShown: true, title: "Storage" }} />
        </Stack.Navigator>
    );
};

export default AppNavigator;
