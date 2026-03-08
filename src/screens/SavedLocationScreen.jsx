// screens/SavedLocationsScreen.js

import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';

const SavedLocationScreen = ({ navigation }) => {
  const { userId, setActiveLocation, t, lang } = useContext(AppContext);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Speaker state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerSpeaking, setIsSpeakerSpeaking] = useState(false);
  
  const BACKEND_API_URL = "https://your-backend-api.com/api"; // Update this

  // speak function
  const speak = (msg) => {
    if (isMuted) return;
    
    Speech.stop();
    setIsSpeakerSpeaking(true);
    
    Speech.speak(msg, { 
      rate: 1.0, 
      pitch: 1.0, 
      language: lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" : "en-US",
      onDone: () => {
        setIsSpeakerSpeaking(false);
      },
      onError: () => {
        setIsSpeakerSpeaking(false);
      }
    });
  };

  // toggle mute function
  const toggleMute = () => {
    if (!isMuted) {
      Speech.stop();
      setIsSpeakerSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  // Stop all speech when screen gains focus AND when navigating away
  useFocusEffect(
    React.useCallback(() => {
      // Clean up speech when screen comes into focus
      Speech.stop();
      setIsSpeakerSpeaking(false);
      
      // Add navigation listener to stop speech when navigating away
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // Stop any ongoing speech before navigating away
        Speech.stop();
        setIsSpeakerSpeaking(false);
      });
      
      return () => {
        // Clean up speech when screen loses focus
        Speech.stop();
        setIsSpeakerSpeaking(false);
        unsubscribe();
      };
    }, [navigation])
  );

  // Also clean up on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
      setIsSpeakerSpeaking(false);
    };
  }, []);

  const loadSavedLocations = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/user/${userId}/locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.log('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = async (location) => {
    try {
      // IMMEDIATELY stop all speech before navigation
      Speech.stop();
      setIsSpeakerSpeaking(false);
      
      setLoading(true);
      // Set this location as active - BACKEND HANDLES STORAGE
      const response = await fetch(`${BACKEND_API_URL}/user/locations/${location.id}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update context with active location
        setActiveLocation(location);
        // Navigate to Home - speech already stopped
        navigation.replace('Home');
      } else {
        throw new Error('Failed to activate location');
      }
    } catch (error) {
      console.log('Error activating location:', error);
      Alert.alert(t.error || 'Error', t.failedToSelect || 'Failed to select location');
      setLoading(false);
    }
  };

  const addNewLocation = () => {
    // IMMEDIATELY stop all speech before navigation
    Speech.stop();
    setIsSpeakerSpeaking(false);
    // Navigate to LocationScreen with flag to add new location
    navigation.navigate('Location', { isAddingNewLocation: true });
  };

  const formatAddress = (location) => {
    if (location.address) return location.address;
    if (location.details?.formatted_address) return location.details.formatted_address;
    if (location.details?.place_name) return location.details.place_name;
    return `${location.coordinates?.latitude?.toFixed(4) || ''}, ${location.coordinates?.longitude?.toFixed(4) || ''}`;
  };

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.locationCard}
      onPress={() => selectLocation(item)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={item.isActive ? ['#2E7D32', '#1B5E20'] : ['#fff', '#f9f9f9']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, item.isActive && styles.activeIconContainer]}>
            <Ionicons 
              name={item.isActive ? "home" : "location"} 
              size={24} 
              color={item.isActive ? "#fff" : "#2E7D32"} 
            />
          </View>
          
          <View style={styles.locationInfo}>
            <Text style={[styles.locationName, item.isActive && styles.activeLocationName]}>
              {item.name}
            </Text>
            <Text style={[styles.locationAddress, item.isActive && styles.activeLocationAddress]} numberOfLines={2}>
              {formatAddress(item)}
            </Text>
            {item.isActive && (
              <View style={styles.activeIndicator}>
                <View style={styles.activeDot} />
                <Text style={styles.activeIndicatorText}>{t.currentlyActive || 'Currently Active'}</Text>
              </View>
            )}
          </View>

          <View style={styles.chevronContainer}>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={item.isActive ? "#fff" : "#999"} 
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ImageBackground
        source={require("../assets/locationbg.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(210, 243, 144, 0.5)",
        }} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.centered}>
            <LinearGradient
              colors={["#2E7D32", "#1B5E20"]}
              style={styles.loadingIcon}
            >
              <Ionicons name="location" size={40} color="#fff" />
            </LinearGradient>
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
            <Text style={styles.loadingText}>{t.loadingFarms || 'Loading your farms...'}</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/locationbg.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(210, 243, 144, 0.5)",
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header - Only location icon */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={["#2E7D32", "#1B5E20"]}
              style={styles.headerIcon}
            >
              <Ionicons name="location" size={30} color="#fff" />
            </LinearGradient>
            <Text style={styles.headerTitle}>{t.yourFarms || 'Your Farms'}</Text>
            <Text style={styles.headerSubtitle}>{t.selectFarm || 'Select a farm to continue'}</Text>
          </View>

          {/* Locations List */}
          {locations.length > 0 ? (
            <FlatList
              data={locations}
              renderItem={renderLocationItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={styles.listHeader}>{t.savedFarms || 'Saved Farms'}</Text>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={["#2E7D32", "#1B5E20"]}
                style={styles.emptyIcon}
              >
                <Ionicons name="location-outline" size={50} color="#fff" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>{t.noFarmsYet || 'No Farms Yet'}</Text>
              <Text style={styles.emptyText}>
                {t.addFirstFarm || 'You haven\'t added any farms yet. Add your first farm to get started.'}
              </Text>
            </View>
          )}

          {/* Add New Location Button - Gradient style */}
          <TouchableOpacity
            onPress={addNewLocation}
            activeOpacity={0.8}
            style={styles.addButtonContainer}
          >
            <LinearGradient
              colors={["#2E7D32", "#1B5E20"]}
              style={styles.addButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.addButtonText}>{t.addNewFarm || 'Add New Farm'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Speaker Button */}
      <View style={styles.speakerFixedContainer}>
        <TouchableOpacity 
          style={[
            styles.speakerButton,
            isMuted ? styles.mutedButton : styles.activeButton
          ]}
          onPress={toggleMute}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isMuted ? "volume-mute" : "volume-high"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        
        {isSpeakerSpeaking && !isMuted && (
          <View style={styles.waveContainer}>
            <View style={styles.wave1} />
            <View style={styles.wave2} />
            <View style={styles.wave3} />
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#1B5E20',
    fontWeight: '500',
  },
  // Header Styles
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  // List Styles
  listContainer: {
    paddingBottom: 20,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 15,
    marginLeft: 5,
  },
  locationCard: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activeIconContainer: {
    backgroundColor: '#2E7D32',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activeLocationName: {
    color: '#2E7D32',
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  activeLocationAddress: {
    color: '#444',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  activeIndicatorText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  chevronContainer: {
    marginLeft: 10,
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Add Button Styles
  addButtonContainer: {
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Speaker button styles
  speakerFixedContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  speakerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  activeButton: {
    backgroundColor: '#2E7D32',
  },
  mutedButton: {
    backgroundColor: '#D32F2F',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  wave1: {
    width: 4,
    height: 12,
    backgroundColor: '#2E7D32',
    marginHorizontal: 2,
    borderRadius: 2,
    opacity: 0.7,
  },
  wave2: {
    width: 4,
    height: 20,
    backgroundColor: '#2E7D32',
    marginHorizontal: 2,
    borderRadius: 2,
    opacity: 1,
  },
  wave3: {
    width: 4,
    height: 12,
    backgroundColor: '#2E7D32',
    marginHorizontal: 2,
    borderRadius: 2,
    opacity: 0.7,
  },
});

export default SavedLocationScreen;