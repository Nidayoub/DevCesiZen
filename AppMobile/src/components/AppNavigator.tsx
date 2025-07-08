import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { TouchableOpacity, Alert } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ResourceDetailsScreen from '../screens/ResourceDetailsScreen';
import DiagnosticScreen from '../screens/DiagnosticScreen';
import ProfileScreen from '../screens/ProfileScreen';
import InfoScreen from '../screens/InfoScreen';
import InfoDetailsScreen from '../screens/InfoDetailsScreen';
import DiagnosticResultScreen from '../screens/DiagnosticResultScreen';
import LikedResourcesScreen from '../screens/LikedResourcesScreen';
import DiagnosticHistoryScreen from '../screens/DiagnosticHistoryScreen';
import DiagnosticStatsScreen from '../screens/DiagnosticStatsScreen';
import CreateResourceScreen from '../screens/CreateResourceScreen';
import EditResourceScreen from '../screens/EditResourceScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';

import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Navigation par onglets principale (visible pour tous)
const MainTabNavigator = () => {
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Resources') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Diagnostic') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f0f0f0',
          paddingTop: 8,
          paddingBottom: 25,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#4f46e5',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => isAuthenticated ? (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 16, padding: 4 }}
          >
            <Ionicons name="log-out-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={{ marginRight: 16, padding: 4 }}
          >
            <Ionicons name="log-in-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Accueil',
          tabBarLabel: 'Accueil',
        }} 
      />
      <Tab.Screen 
        name="Resources" 
        component={ResourcesScreen} 
        options={{ 
          title: 'Ressources',
          tabBarLabel: 'Ressources',
        }} 
      />
      <Tab.Screen 
        name="Diagnostic" 
        component={DiagnosticScreen} 
        options={{ 
          title: 'Diagnostic',
          tabBarLabel: 'Diagnostic',
        }} 
      />
      {isAuthenticated && (
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ 
            title: 'Profil',
            tabBarLabel: 'Profil',
          }} 
        />
      )}
    </Tab.Navigator>
  );
};

// Stack principal avec navigation par onglets + écrans modaux
const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4f46e5',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Navigation par onglets comme écran principal */}
      <Stack.Screen 
        name="Main" 
        component={MainTabNavigator} 
        options={{ headerShown: false }} 
      />

      {/* Écrans modaux et détails */}
      <Stack.Screen 
        name="ResourceDetails" 
        component={ResourceDetailsScreen} 
        options={{ title: 'Détails de la ressource' }} 
      />
      <Stack.Screen 
        name="DiagnosticResult" 
        component={DiagnosticResultScreen} 
        options={{ title: 'Résultats du diagnostic' }} 
      />
      <Stack.Screen 
        name="InfoDetails" 
        component={InfoDetailsScreen} 
        options={{ title: 'Détails de l\'article' }} 
      />

      {/* Écrans d'authentification */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Connexion' }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Inscription' }} 
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ title: 'Mot de passe oublié' }} 
      />

      {/* Écrans nécessitant une authentification */}
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Tableau de bord' }} 
      />
      <Stack.Screen 
        name="LikedResources" 
        component={LikedResourcesScreen} 
        options={{ title: 'Mes ressources likées' }} 
      />
      <Stack.Screen 
        name="DiagnosticHistory" 
        component={DiagnosticHistoryScreen} 
        options={{ title: 'Historique des diagnostics' }} 
      />
      <Stack.Screen 
        name="DiagnosticStats" 
        component={DiagnosticStatsScreen} 
        options={{ title: 'Statistiques du diagnostic' }} 
      />
      <Stack.Screen 
        name="CreateResource" 
        component={CreateResourceScreen} 
        options={{ title: 'Créer une ressource' }} 
      />
      <Stack.Screen 
        name="EditResource" 
        component={EditResourceScreen} 
        options={{ title: 'Modifier la ressource' }} 
      />
      
      {/* Écrans légaux */}
      <Stack.Screen 
        name="Terms" 
        component={TermsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
};

// Navigateur principal de l'application
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <AppStack />
    </NavigationContainer>
  );
};

export default AppNavigator; 