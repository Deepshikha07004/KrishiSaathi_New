// screens/LocationScreen.js

import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Alert, TextInput, Platform, Vibration, Keyboard, ImageBackground, KeyboardAvoidingView,
  StyleSheet, FlatList, Modal, Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppContext } from "../context/AppContext";
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const LocationScreen = ({ navigation }) => {
  const { t, setLocation, lang, isManualLocation, setIsManualLocation, convertDigits, setActiveLocation } = useContext(AppContext);

  // UI States
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Location States
  const [coordinates, setCoordinates] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [showMap, setShowMap] = useState(false);
  
  // Manual mode states - COMPLETELY SEPARATE
  const [isManualMode, setIsManualMode] = useState(false);
  const [autoModeActive, setAutoModeActive] = useState(true);
  const [manualAddress, setManualAddress] = useState("");
  const [manualLocationDetails, setManualLocationDetails] = useState(null);
  // Separate states for manual mode errors
  const [manualError, setManualError] = useState(false);
  const [manualErrorMessage, setManualErrorMessage] = useState("");
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // Farm name state - REQUIRED for new location
  const [farmName, setFarmName] = useState("");

  // Saved Locations - Multiple addresses like Zomato
  const [savedLocations, setSavedLocations] = useState([]);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Speaker state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerSpeaking, setIsSpeakerSpeaking] = useState(false);

  const speechInProgressRef = useRef(false);

  // Backend API URL - Replace with your actual backend URL
  const BACKEND_API_URL = "https://your-backend-api.com/api"; // Update this

  // Stop all speech when screen gains focus AND when navigating away
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused');
      
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
        console.log('Screen unfocused - stopping speech');
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

  // Load saved locations from backend (for hamburger menu)
  const loadSavedLocations = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/user/locations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedLocations(data.locations || []);
      }
    } catch (error) {
      console.log('Error loading locations:', error);
    }
  };

  // Delete location from backend
  const deleteLocation = async (locationId) => {
    Alert.alert(
      t.delete || 'Delete Location',
      t.deleteConfirm || 'Are you sure you want to delete this location?',
      [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        {
          text: t.delete || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_API_URL}/user/locations/${locationId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                loadSavedLocations(); // Reload locations
              }
            } catch (error) {
              console.log('Error deleting location:', error);
            }
          }
        }
      ]
    );
  };

  // ============ LOCATION DETECTION ============

  // Get coordinates from device - FASTER with lower accuracy first
  const getDeviceCoordinates = async (quick = true) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return null;
      }

      // Try to get last known position first for speed
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown && quick) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          accuracy: lastKnown.coords.accuracy || 100,
          fromCache: true
        };
      }

      // If no last known, get current position with balanced accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 8000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        fromCache: false
      };
    } catch (error) {
      console.log("Error getting coordinates:", error);
      return null;
    }
  };

  // Send coordinates to backend and get location details
  const getLocationFromBackend = async (lat, lon, acc) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/get-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          accuracy: acc,
          language: lang,
          timestamp: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.log("Backend API error:", error);
      throw error;
    }
  };

  // Send manual address to backend for geocoding
  const geocodeAddressWithBackend = async (address) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/geocode-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          language: lang
        }),
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.log("Geocoding error:", error);
      throw error;
    }
  };

  // ============ SAVE AND ACTIVATE LOCATION ============

  // Save location AND set it as active - called by CONFIRM LOCATION button
  const saveAndActivateLocation = async () => {
    // Validate farm name
    if (!farmName.trim()) {
      Alert.alert(t.error, t.farmNameRequired);
      return false;
    }

    // Validate that we have location data
    if (!locationDetails || !coordinates) {
      Alert.alert(t.error, t.locationNotFound || "Please detect your location first");
      return false;
    }

    setIsGettingLocation(true);
    speak(t.savingLocation);

    try {
      // Prepare location data
      const locationData = {
        name: farmName.trim(),
        address: locationDetails.formatted_address || locationDetails.place_name || manualAddress,
        details: locationDetails,
        coordinates: coordinates,
        isManual: isManualMode,
        isActive: true,
        userId: userId,
        timestamp: Date.now()
      };

      // Save to backend - ONE API CALL
      const response = await fetch(`${BACKEND_API_URL}/user/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        throw new Error('Failed to save location');
      }

      const savedLocation = await response.json();

      // Update context with active location
      setActiveLocation(savedLocation);

      speak(t.locationFound);
      
      // Stop speech
      Speech.stop();
      setIsSpeakerSpeaking(false);
      
      // Navigate to Home screen
      navigation.replace("Home");
      
      return true;
    } catch (error) {
      console.log("Error saving location:", error);
      Alert.alert(t.error, t.serverError);
      return false;
    } finally {
      setIsGettingLocation(false);
    }
  };



  // ============ MAIN LOCATION FLOW ============

  // Update map with coordinates and "You are here" marker
  const updateMapWithCoordinates = (lat, lon) => {
    setMapRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setShowMap(true);
  };

  // FIXED speak function - Better Hindi pronunciation
  const speak = (msg) => {
    if (isMuted || !msg) return;
    
    // Stop any ongoing speech
    Speech.stop();
    
    // Map language codes based on selected language
    let languageCode = 'en-US'; // default English
    
    if (lang === 'hi') {
      languageCode = 'hi-IN'; // Hindi
    } else if (lang === 'bn') {
      languageCode = 'bn-IN'; // Bengali
    }
    
    console.log('Speaking in:', languageCode, 'Message:', msg);
    
    // Speech options for better pronunciation
    const speechOptions = {
      language: languageCode,
      pitch: 1.0,
      rate: 0.75, // Slower rate for better clarity in Hindi/Bengali
      onStart: () => {
        console.log('Speech started');
        setIsSpeakerSpeaking(true);
      },
      onDone: () => {
        console.log('Speech finished');
        setIsSpeakerSpeaking(false);
      },
      onError: (error) => {
        console.log('Speech error:', error);
        setIsSpeakerSpeaking(false);
        
        // Fallback to English
        if (languageCode !== 'en-US') {
          console.log('Falling back to English');
          Speech.speak(msg, {
            language: 'en-US',
            pitch: 1.0,
            rate: 0.8,
            onStart: () => setIsSpeakerSpeaking(true),
            onDone: () => setIsSpeakerSpeaking(false),
            onError: () => setIsSpeakerSpeaking(false)
          });
        }
      }
    };
    
    Speech.speak(msg, speechOptions);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState) {
      // If muting, stop any ongoing speech
      Speech.stop();
      setIsSpeakerSpeaking(false);
    }
  };

  useEffect(() => {
    return () => {
      Speech.stop();
      setIsSpeakerSpeaking(false);
    };
  }, []);

  useEffect(() => {
    Speech.stop();
    setIsSpeakerSpeaking(false);
    
    if (isMuted) return;
    
    if (apiError) {
      speak(t.serverError);
    } else if (permissionDenied) {
      speak(t.permissionDenied);
    }
  }, [apiError, permissionDenied, isMuted]);

  // Reset errors when switching modes
  useEffect(() => {
    setApiError(false);
    setPermissionDenied(false);
    setManualError(false);
    setManualErrorMessage("");
  }, [isManualMode]);

  // Auto-detect on mount if auto mode is active
  useEffect(() => {
    if (autoModeActive && !isManualMode) {
      getLocation(true);
    }

    return () => {
      Speech.stop();
      speechInProgressRef.current = false;
    };
  }, [autoModeActive, isManualMode]);

  // Main function to get location (auto mode)
  const getLocation = async (quick = true) => {
    // Don't run if in manual mode or auto mode is not active
    if (isManualMode || !autoModeActive) return;
    
    if (Platform.OS !== "web") Vibration.vibrate(30);
    
    setIsGettingLocation(true);
    setPermissionDenied(false);
    setApiError(false);
    setShowMap(false);
    
    speak(t.usingGPS);

    try {
      // Step 1: Get coordinates from device (faster with quick=true)
      const coords = await getDeviceCoordinates(quick);
      
      if (!coords) {
        if (!permissionDenied) {
          setApiError(true);
        }
        setIsGettingLocation(false);
        return;
      }

      // Step 2: Store coordinates locally
      setCoordinates(coords);
      
      // Step 3: Show map immediately with coordinates and "You are here" marker
      updateMapWithCoordinates(coords.latitude, coords.longitude);

      speak(t.sendingToServer);

      // Step 4: Send to backend for reverse geocoding
      const locationData = await getLocationFromBackend(
        coords.latitude, 
        coords.longitude, 
        coords.accuracy
      );

      // Step 5: Store and display the location data from backend
      setLocationDetails(locationData);
      setManualLocationDetails(locationData);
      
      // Update context with location
      setLocation({
        ...locationData,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });

      speak(t.locationFound);
      setApiError(false);
      
    } catch (error) {
      console.log("Location flow error:", error);
      setApiError(true);
      speak(t.locationFailed);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // FIXED: Handle manual address submission - Voice works exactly like auto mode
  const handleManualSubmit = async () => {
    // Check if address is empty
    if (!manualAddress.trim()) {
      setManualError(true);
      setManualErrorMessage(t.pleaseFillFields || "Please enter an address");
      requestAnimationFrame(() => {
        speak(t.pleaseFillFields || "Please enter an address");
      });
      return;
    }

    // Set loading state for manual mode
    setIsManualSubmitting(true);
    setManualError(false);
    setManualErrorMessage("");
    setMapRegion(null);
    setShowMap(false);
    
    requestAnimationFrame(() => {
      speak(t.sendingToServer);
    });
    
    try {
      const data = await geocodeAddressWithBackend(manualAddress);
      
      setManualLocationDetails(data);
      setLocationDetails(data);
      
      if (data.latitude && data.longitude) {
        updateMapWithCoordinates(data.latitude, data.longitude);
        setCoordinates({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy || null
        });
      }

      setLocation({
        ...data,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });

      requestAnimationFrame(() => {
        speak(t.locationFound);
      });
      setManualError(false);
      
    } catch (error) {
      console.log("Manual submission error:", error);
      setManualError(true);
      setManualErrorMessage(t.serverError || "Something went wrong. Please try again.");
      setShowMap(false);
      
      requestAnimationFrame(() => {
        speak(t.serverError);
      });
    } finally {
      setIsManualSubmitting(false);
    }
  };

  // Select a saved location from hamburger menu
  const selectSavedLocation = (location) => {
    setSelectedLocation(location);
    setCoordinates(location.coordinates);
    setLocationDetails(location.details);
    setFarmName(location.name);
    updateMapWithCoordinates(location.coordinates.latitude, location.coordinates.longitude);
    setShowLocationMenu(false);
    
    setLocation({
      ...location.details,
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    });
  };

  const formatCoordinate = (coordinate) => {
    if (!coordinate) return "";
    return coordinate.toFixed(6);
  };

  const formatAccuracy = (accuracy) => {
    if (!accuracy) return "";
    return `${accuracy.toFixed(2)} ${t.meters}`;
  };

  // Check if confirm button should be enabled
  const isConfirmEnabled = () => {
    return farmName.trim() && locationDetails && coordinates && !isGettingLocation;
  };

  const displayLocation = selectedLocation?.details || (isManualMode ? manualLocationDetails : locationDetails);

  // Render saved location item for menu
  const renderLocationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.menuLocationItem}
      onPress={() => selectSavedLocation(item)}
      activeOpacity={0.7}
    >
      <View style={styles.menuLocationIcon}>
        <Ionicons name="location" size={20} color="#2E7D32" />
      </View>
      <View style={styles.menuLocationInfo}>
        <Text style={styles.menuLocationName}>{item.name}</Text>
        <Text style={styles.menuLocationAddress} numberOfLines={1}>{item.address}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => deleteLocation(item.id)}
        style={styles.menuLocationDelete}
      >
        <Ionicons name="close-circle" size={22} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        {/* Hamburger Menu - Separate container at top */}
        <View style={styles.hamburgerContainer}>
          <TouchableOpacity 
            style={styles.hamburgerButton}
            onPress={() => setShowLocationMenu(true)}
          >
            <Ionicons name="menu" size={28} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Location Icon and Title */}
            <View style={styles.locationIconContainer}>
              <LinearGradient
                colors={["#2E7D32", "#1B5E20"]}
                style={styles.iconGradient}
              >
                <Ionicons name="compass" size={40} color="#fff" />
              </LinearGradient>
              <Text style={styles.titleText}>
                {t.selectLocation}
              </Text>
            </View>



            {/* Loading/Status Indicator */}
            {isGettingLocation && !isManualMode && (
              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color="#1976D2" />
                  <Text style={styles.loadingIndicatorText}>
                    {t.sendingToServer}
                  </Text>
                </View>
              </View>
            )}

            {isManualSubmitting && isManualMode && (
              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <View style={[styles.loadingIndicator, { backgroundColor: "#FFF3E0" }]}>
                  <ActivityIndicator size="small" color="#FF9800" />
                  <Text style={[styles.loadingIndicatorText, { color: "#F57C00" }]}>
                    {t.sendingToServer}
                  </Text>
                </View>
              </View>
            )}

            {/* Auto Mode Error Display */}
            {apiError && !isGettingLocation && !isManualMode && autoModeActive && (
              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={40} color="#D32F2F" />
                  <Text style={styles.errorText}>
                    {t.serverError}
                  </Text>
                  <TouchableOpacity
                    onPress={() => getLocation(true)}
                    style={styles.retryButton}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.retryButtonText}>
                      {t.retryButton}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Permission Denied */}
            {permissionDenied && !isGettingLocation && !apiError && !isManualMode && autoModeActive && (
              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <View style={styles.permissionDeniedContainer}>
                  <Ionicons name="ban" size={40} color="#FF5252" />
                  <Text style={styles.permissionDeniedText}>
                    {t.permissionDenied}
                  </Text>
                  <TouchableOpacity
                    onPress={() => getLocation(true)}
                    style={styles.retryButton}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.retryButtonText}>
                      {t.retry}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Manual Mode Error */}
            {manualError && !isManualSubmitting && isManualMode && (
              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <View style={[styles.errorContainer, { backgroundColor: "#FFF3E0", borderColor: "#FF9800" }]}>
                  <Ionicons name="alert-circle" size={40} color="#FF9800" />
                  <Text style={[styles.errorText, { color: "#F57C00" }]}>
                    {manualErrorMessage || t.serverError}
                  </Text>
                  <TouchableOpacity
                    onPress={handleManualSubmit}
                    style={[styles.retryButton, { backgroundColor: "#FF9800" }]}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.retryButtonText}>
                      {t.retryButton}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Mode Toggle */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <View style={styles.modeToggleContainer}>
                <TouchableOpacity
                  onPress={() => {
                    setIsManualMode(false);
                    setAutoModeActive(true);
                    setApiError(false);
                    setPermissionDenied(false);
                    setManualError(false);
                    setManualErrorMessage("");
                    getLocation(true);
                  }}
                  style={[
                    styles.modeToggleButton,
                    !isManualMode && styles.modeToggleButtonActive
                  ]}
                >
                  <Ionicons 
                    name="locate" 
                    size={20} 
                    color={!isManualMode ? "#fff" : "#666"} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[
                    styles.modeToggleText,
                    !isManualMode && styles.modeToggleTextActive
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}>
                    {t.detectAutomatically}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsManualMode(true);
                    setAutoModeActive(false);
                    setApiError(false);
                    setPermissionDenied(false);
                    setManualError(false);
                    setManualErrorMessage("");
                    setMapRegion(null);
                    setShowMap(false);
                    setCoordinates(null);
                    Speech.stop();
                  }}
                  style={[
                    styles.modeToggleButton,
                    isManualMode && styles.modeToggleButtonActive
                  ]}
                >
                  <Ionicons 
                    name="create" 
                    size={20} 
                    color={isManualMode ? "#fff" : "#666"} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[
                    styles.modeToggleText,
                    isManualMode && styles.modeToggleTextActive
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}>
                    {t.enterManually}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Content */}
            {!apiError && !permissionDenied && (
              <View style={{ paddingHorizontal: 20 }}>
                {isManualMode ? (
                  /* Manual Mode Input */
                  <View style={styles.manualModeContainer}>
                    <Text style={styles.manualModeTitle}>
                      {t.enterManuallyTitle}
                    </Text>

                    <TextInput
                      style={[
                        styles.manualModeInput,
                        manualError && { borderColor: "#FF9800" }
                      ]}
                      placeholder={t.manualAddressPlaceholder || "Enter your address manually"}
                      placeholderTextColor="#999"
                      value={manualAddress}
                      onChangeText={(text) => {
                        setManualAddress(text);
                        if (manualError) {
                          setManualError(false);
                          setManualErrorMessage("");
                        }
                      }}
                      multiline={true}
                      numberOfLines={4}
                      textAlignVertical="top"
                      editable={!isManualSubmitting}
                      autoFocus={true}
                      returnKeyType="done"
                      blurOnSubmit={false}
                    />

                    {manualError && (
                      <Text style={{ color: "#FF9800", fontSize: 12, marginTop: 5, marginLeft: 5 }}>
                        {manualErrorMessage || "Please check your address and try again"}
                      </Text>
                    )}

                    <TouchableOpacity
                      onPress={handleManualSubmit}
                      disabled={isManualSubmitting || !manualAddress.trim()}
                      style={[styles.findOnMapButton, (isManualSubmitting || !manualAddress.trim()) && styles.disabledButton]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.findOnMapButtonText}>
                        {isManualSubmitting ? 'Processing...' : (t.detectLocation || "Detect Location")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Auto Mode - Get Location Button */
                  !locationDetails && !isGettingLocation && (
                    <TouchableOpacity
                      onPress={() => getLocation(true)}
                      disabled={isGettingLocation}
                      style={[styles.getLocationButton, isGettingLocation && styles.disabledButton]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="locate" size={24} color="#fff" />
                      <Text style={styles.getLocationButtonText}>
                        {t.getLocationButton}
                      </Text>
                    </TouchableOpacity>
                  )
                )}

                {/* Farm Name Input */}
                {locationDetails && !isGettingLocation && !isManualSubmitting && (
                  <View style={styles.farmNameContainer}>
                    <Text style={styles.farmNameLabel}>
                      {t.enterFarmName} <Text style={{color: 'red'}}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.farmNameInput,
                        farmName.trim() && styles.farmNameInputValid
                      ]}
                      placeholder={t.enterNameForLocation}
                      placeholderTextColor="#999"
                      value={farmName}
                      onChangeText={setFarmName}
                    />
                  </View>
                )}

                {/* Map Display */}
                {(!isManualMode || (isManualMode && showMap)) && mapRegion &&  (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={styles.mapTitle}>
                      {t.locationOnMap}
                    </Text>
                    <View style={styles.mapContainer}>
                      {isGettingLocation || isManualSubmitting ? (
                        <View style={styles.mapLoadingContainer}>
                          <ActivityIndicator size="large" color="#2E7D32" />
                          <Text style={styles.mapLoadingText}>
                            {t.mapLoading}
                          </Text>
                        </View>
                      ) : (
                        <MapView
                          style={{ flex: 1 }}
                          provider={PROVIDER_GOOGLE}
                          region={mapRegion}
                          showsUserLocation={true}
                          showsMyLocationButton={false}
                        >
                          <Marker coordinate={mapRegion}>
                            <View style={{ alignItems: 'center' }}>
                              <View style={styles.markerDot} />
                              <View style={styles.markerLine} />
                              <Text style={styles.markerText}>
                                {t.youAreHere}
                              </Text>
                            </View>
                          </Marker>
                        </MapView>
                      )}
                      
                      <View style={styles.liveBadge}>
                        <Ionicons name="radio" size={12} color="#4CAF50" style={{ marginRight: 4 }} />
                        <Text style={styles.liveText}>
                          {t.live}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Location Details */}
                {displayLocation && !isGettingLocation && !isManualSubmitting && (
                  <View style={styles.locationDetailsContainer}>
                    <Text style={styles.locationDetailsTitle}>
                      {t.locationFound}
                    </Text>

                    {displayLocation.place_name && (
                      <View style={styles.detailItemContainer}>
                        <View style={styles.detailLabelContainer}>
                          <Ionicons name="business" size={14} color="#666" style={{ marginRight: 6 }} />
                          <Text style={styles.detailLabel}>{t.placeName}</Text>
                        </View>
                        <View style={styles.detailValueContainer}>
                          <Text style={styles.detailValue}>
                            {displayLocation.place_name}
                          </Text>
                        </View>
                      </View>
                    )}

                    {displayLocation.formatted_address && (
                      <View style={styles.detailItemContainer}>
                        <View style={styles.detailLabelContainer}>
                          <Ionicons name="location" size={14} color="#666" style={{ marginRight: 6 }} />
                          <Text style={styles.detailLabel}>{t.fullAddress}</Text>
                        </View>
                        <View style={styles.detailValueContainer}>
                          <Text style={styles.detailValue}>
                            {displayLocation.formatted_address}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      {displayLocation.city && (
                        <View style={styles.detailHalfContainer}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="business" size={12} color="#666" style={{ marginRight: 4 }} />
                            <Text style={styles.detailLabelSmall}>{t.city}</Text>
                          </View>
                          <View style={styles.detailValueContainerSmall}>
                            <Text style={styles.detailValueSmall}>{displayLocation.city}</Text>
                          </View>
                        </View>
                      )}
                      {displayLocation.district && (
                        <View style={styles.detailHalfContainer}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="map" size={12} color="#666" style={{ marginRight: 4 }} />
                            <Text style={styles.detailLabelSmall}>{t.district}</Text>
                          </View>
                          <View style={styles.detailValueContainerSmall}>
                            <Text style={styles.detailValueSmall}>{displayLocation.district}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    <View style={styles.detailRow}>
                      {displayLocation.state && (
                        <View style={styles.detailHalfContainer}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="flag" size={12} color="#666" style={{ marginRight: 4 }} />
                            <Text style={styles.detailLabelSmall}>{t.state}</Text>
                          </View>
                          <View style={styles.detailValueContainerSmall}>
                            <Text style={styles.detailValueSmall}>{displayLocation.state}</Text>
                          </View>
                        </View>
                      )}
                      {displayLocation.postal_code && (
                        <View style={styles.detailHalfContainer}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="mail" size={12} color="#666" style={{ marginRight: 4 }} />
                            <Text style={styles.detailLabelSmall}>{t.pinCode}</Text>
                          </View>
                          <View style={styles.detailValueContainerSmall}>
                            <Text style={styles.detailValueSmall}>{displayLocation.postal_code}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {displayLocation.country && (
                      <View style={styles.detailItemContainer}>
                        <View style={styles.detailLabelContainer}>
                          <Ionicons name="earth" size={14} color="#666" style={{ marginRight: 6 }} />
                          <Text style={styles.detailLabel}>{t.country}</Text>
                        </View>
                        <View style={styles.detailValueContainer}>
                          <Text style={styles.detailValue}>{displayLocation.country}</Text>
                        </View>
                      </View>
                    )}

                    {coordinates && (
                      <View style={styles.coordinateRow}>
                        <View style={styles.coordinateContainer}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="resize" size={10} color="#666" style={{ marginRight: 4 }} />
                            <Text style={styles.detailLabelSmall}>{t.latitude}</Text>
                          </View>
                          <View style={styles.coordinateValueContainer}>
                            <Text style={styles.coordinateValue}>
                              {formatCoordinate(coordinates.latitude)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.coordinateContainer}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="resize" size={10} color="#666" style={{ marginRight: 4 }} />
                            <Text style={styles.detailLabelSmall}>{t.longitude}</Text>
                          </View>
                          <View style={styles.coordinateValueContainer}>
                            <Text style={styles.coordinateValue}>
                              {formatCoordinate(coordinates.longitude)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {coordinates?.accuracy && (
                      <View style={styles.accuracyContainer}>
                        <View style={styles.detailLabelContainer}>
                          <Ionicons name="speedometer" size={12} color="#666" style={{ marginRight: 4 }} />
                          <Text style={styles.detailLabelSmall}>{t.accuracy}</Text>
                        </View>
                        <View style={styles.accuracyValueContainer}>
                          <Text style={styles.accuracyValue}>
                            {formatAccuracy(coordinates.accuracy)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* "Detect Again" option */}
                    <TouchableOpacity
                      onPress={isManualMode ? handleManualSubmit : () => getLocation(true)}
                      style={styles.detectAgainButton}
                    >
                      <Ionicons name="refresh" size={18} color="#2E7D32" style={{ marginRight: 6 }} />
                      <Text style={styles.detectAgainText}>
                        {t.detectAgain}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* CONFIRM LOCATION BUTTON - ONLY ONE SAVE BUTTON */}
                {locationDetails && !isGettingLocation && !isManualSubmitting && (
                  <TouchableOpacity
                    onPress={saveAndActivateLocation}
                    disabled={!isConfirmEnabled()}
                    style={[
                      styles.confirmButton,
                      !isConfirmEnabled() && styles.confirmButtonDisabled
                    ]}
                  >
                    <LinearGradient
                      colors={isConfirmEnabled() ? ["#2E7D32", "#1B5E20"] : ["#999", "#666"]}
                      style={styles.confirmButtonGradient}
                    >
                      <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.confirmButtonText}>
                        {t.confirmLocation}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Location Menu Modal - Hamburger Menu */}
      <Modal
        visible={showLocationMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>{t.otherAddresses}</Text>
              <TouchableOpacity onPress={() => setShowLocationMenu(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {savedLocations.length > 0 ? (
              <FlatList
                data={savedLocations}
                renderItem={renderLocationItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.menuList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyMenu}>
                <Ionicons name="location-outline" size={50} color="#ccc" />
                <Text style={styles.emptyMenuText}>{t.noFarmsYet}</Text>
                <TouchableOpacity
                  style={styles.addFirstLocationBtn}
                  onPress={() => {
                    setShowLocationMenu(false);
                    if (!isManualMode && autoModeActive) {
                      getLocation(true);
                    }
                  }}
                >
                  <Text style={styles.addFirstLocationText}>{t.addNewFarm}</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.menuAddButton}
              onPress={() => {
                setShowLocationMenu(false);
                if (!isManualMode && autoModeActive) {
                  getLocation(true);
                }
              }}
            >
              <Ionicons name="add-circle" size={24} color="#2E7D32" />
              <Text style={styles.menuAddText}>{t.addNewLocation}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  // Hamburger container
  hamburgerContainer: {
    position: 'absolute',
    top: 50,
    left: 15,
    zIndex: 100,
  },
  hamburgerButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  // Location icon container
  locationIconContainer: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 20,
  },
  iconGradient: {
    padding: 15,
    borderRadius: 50,
    marginBottom: 15,
    elevation: 8,
  },
  titleText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1B5E20',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Loading indicator
  loadingIndicator: {
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingIndicatorText: {
    marginLeft: 10,
    color: "#1976D2",
    fontWeight: "600",
    fontSize: 14,
    flexShrink: 1,
  },
  // Error container
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF5252",
    alignItems: "center"
  },
  errorText: {
    color: "#D32F2F",
    textAlign: "center",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Permission denied container
  permissionDeniedContainer: {
    backgroundColor: "#FFEBEE",
    padding: 20,
    borderRadius: 10,
    alignItems: "center"
  },
  permissionDeniedText: {
    color: "#D32F2F",
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  // Mode toggle - INCREASED SIZE FOR HINDI
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 8,
    elevation: 3,
    minHeight: 70,
  },
  modeToggleButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 60,
  },
  modeToggleButtonActive: {
    backgroundColor: "#2E7D32",
  },
  modeToggleText: {
    fontWeight: "bold",
    color: "#666",
    fontSize: 15,
    textAlign: 'center',
    flexShrink: 1,
    maxWidth: '70%',
  },
  modeToggleTextActive: {
    color: "#fff",
  },
  // Manual mode container - FIXED
  manualModeContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 25,
    padding: 25,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginBottom: 20
  },
  manualModeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 20,
    textAlign: "center",
  },
  manualModeInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: "top",
    borderWidth: 2,
    borderColor: "#4CAF50",
    marginBottom: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  findOnMapButton: {
    backgroundColor: "#FF9800",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  findOnMapButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Get location button
  getLocationButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  getLocationButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Farm name container
  farmNameContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 25,
    padding: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginBottom: 20
  },
  farmNameLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B5E20",
    marginBottom: 10,
  },
  farmNameInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  farmNameInputValid: {
    borderColor: "#4CAF50",
  },
  // Map styles
  mapTitle: {
    fontSize: 14,
    color: "#1B5E20",
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 5,
  },
  mapContainer: {
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#4CAF50",
    elevation: 5
  },
  mapLoadingContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center"
  },
  mapLoadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  markerDot: {
    backgroundColor: '#FF6B6B',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerLine: {
    width: 4,
    height: 10,
    backgroundColor: '#FF6B6B',
    marginTop: -2,
  },
  markerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
  },
  // Location details container
  locationDetailsContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 25,
    padding: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginBottom: 20
  },
  locationDetailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 15,
    textAlign: "center",
  },
  detailItemContainer: {
    marginBottom: 15,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: '500',
  },
  detailLabelSmall: {
    fontSize: 12,
    color: "#666",
    fontWeight: '500',
  },
  detailValueContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  detailHalfContainer: {
    flex: 1,
    marginRight: 5,
  },
  detailValueContainerSmall: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 10,
  },
  detailValueSmall: {
    fontSize: 14,
    color: "#333",
  },
  coordinateRow: {
    flexDirection: "row",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    marginBottom: 10,
  },
  coordinateContainer: {
    flex: 1,
    marginRight: 5,
  },
  coordinateValueContainer: {
    backgroundColor: "#E8F5E9",
    borderRadius: 6,
    padding: 10,
  },
  coordinateValue: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "500",
  },
  accuracyContainer: {
    marginTop: 8,
    marginBottom: 10,
  },
  accuracyValueContainer: {
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
    padding: 10,
  },
  accuracyValue: {
    fontSize: 13,
    color: "#1976D2",
    fontWeight: "500",
  },
  detectAgainButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detectAgainText: {
    color: "#2E7D32",
    fontWeight: "600",
    fontSize: 15,
  },
  // Confirm button
  confirmButton: {
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 20,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  menuList: {
    padding: 15,
  },
  menuLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLocationInfo: {
    flex: 1,
  },
  menuLocationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuLocationAddress: {
    fontSize: 12,
    color: '#666',
  },
  menuLocationDelete: {
    padding: 4,
  },
  emptyMenu: {
    padding: 40,
    alignItems: 'center',
  },
  emptyMenuText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    marginBottom: 15,
  },
  addFirstLocationBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addFirstLocationText: {
    color: '#fff',
    fontWeight: '600',
  },
  menuAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
  },
  menuAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
  },
});

export default LocationScreen;