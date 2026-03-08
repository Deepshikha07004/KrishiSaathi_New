// screens/LocationScreen.js

import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Alert, TextInput, Platform, Vibration, Keyboard, ImageBackground, KeyboardAvoidingView,
  StyleSheet, FlatList, Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppContext } from "../context/AppContext";
import { useFocusEffect } from '@react-navigation/native';

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
  
  // Manual mode states
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [manualLocationDetails, setManualLocationDetails] = useState(null);

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
      loadSavedLocations();
      
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

  // Load saved locations from backend
  const loadSavedLocations = async () => {
    try {
      // Get user's saved locations from backend
      const response = await fetch(`${BACKEND_API_URL}/user/locations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token if needed
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

  // Save location to backend (called after both auto and manual modes)
  const saveLocationToBackend = async (locationData, isManual = false) => {
    try {
      // If locationName is empty, create a default name
      const nameToSave = locationName.trim() || 
        (isManual ? "Manual Address" : "Current Location");
      
      const response = await fetch(`${BACKEND_API_URL}/user/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameToSave,
          address: locationData.formatted_address || locationData.place_name || manualAddress,
          details: locationData,
          coordinates: coordinates,
          isManual: isManual,
          timestamp: Date.now()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success', 'Location saved successfully');
        loadSavedLocations(); // Reload locations
        setIsAddingLocation(false);
        setLocationName("");
      }
    } catch (error) {
      console.log('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location');
    }
  };

  // Delete location from backend
  const deleteLocation = async (locationId) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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

  // Language-specific messages
  const messages = {
    en: {
      digits: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      locating: "Getting your location...",
      locationFound: "Location found successfully",
      locationFailed: "Failed to get location. Please try again.",
      permissionDenied: "Location permission denied. Please enable in settings.",
      enterManually: "Enter Manually",
      detectAutomatically: "Detect Automatically",
      confirmLocation: "CONFIRM LOCATION",
      placeName: "Place Name",
      fullAddress: "Full Address",
      district: "District",
      state: "State",
      pinCode: "PIN Code",
      youAreHere: "You are here",
      locationActive: "LOCATION ACTIVE",
      manualMode: "MANUAL MODE ACTIVE",
      useGPS: "Use GPS",
      detecting: "Detecting...",
      detectAgain: "Detect Again",
      continue: "Continue",
      live: "LIVE",
      accuracy: "Accuracy",
      meters: "meters",
      selectLocation: "Select Your Farm Location",
      latitude: "Latitude",
      longitude: "Longitude",
      unknown: "Unknown location",
      error: "Error",
      pleaseFillFields: "Please fill in all required fields",
      speaking: "Speaking...",
      enterManuallyTitle: "Enter Location Manually",
      city: "City",
      country: "Country",
      searching: "Searching...",
      usingGPS: "Using GPS...",
      getCurrentLocation: "Get Current Location",
      gpsAcquired: "GPS Location Acquired",
      retry: "Try Again",
      findOnMap: "Find on Map",
      enterAddress: "Enter your address",
      sendingToServer: "Getting location details...",
      serverError: "Something went wrong. Please try again.",
      retryButton: "Try Again",
      manualAddressPlaceholder: "Enter your address manually",
      getLocationButton: "Get My Location",
      mapLoading: "Loading map...",
      locationOnMap: "Your farm location on map",
      enterFarmName: "Enter your farm name (e.g., My Farm, Home, Shop)",
      farmNameRequired: "Please enter a farm name",
      savingLocation: "Saving your farm...",
      locationSaved: "Location saved successfully",
      // New strings for multiple locations
      savedLocations: "Saved Locations",
      addNewLocation: "Add New Location",
      useCurrentLocation: "Use Current Location",
      saveLocation: "Save Location",
      locationName: "Location Name",
      deliveryHere: "Deliver Here",
      edit: "Edit",
      delete: "Delete",
      otherAddresses: "Other Addresses",
      saveThisLocation: "Save this location?",
      enterNameForLocation: "Enter a name for this location (e.g., My Farm, Home, Shop)",
      notNow: "Not Now",
      // 👇 ADDED: Skip button text
      skip: "SKIP TO HOME (TEMP)",
    }
  };

  const msg = messages.en;

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
      Alert.alert(msg.error, msg.farmNameRequired);
      return false;
    }

    // Validate that we have location data
    if (!locationDetails || !coordinates) {
      Alert.alert(msg.error, "Please detect your location first");
      return false;
    }

    setIsGettingLocation(true);
    speak(msg.savingLocation);

    try {
      // Prepare location data
      const locationData = {
        name: farmName.trim(),
        address: locationDetails.formatted_address || locationDetails.place_name || manualAddress,
        details: locationDetails,
        coordinates: coordinates,
        isManual: isManualMode,
        isActive: true,
        timestamp: Date.now()
      };

      const response = await fetch(`${BACKEND_API_URL}/user/locations/save-and-activate`, {
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

      speak(msg.locationFound);
      
      // IMMEDIATELY stop speech before navigation
      Speech.stop();
      setIsSpeakerSpeaking(false);
      
      // Navigate to Home screen
      navigation.replace("Home");
      
      return true;
    } catch (error) {
      console.log("Error saving location:", error);
      Alert.alert(msg.error, msg.serverError);
      return false;
    } finally {
      setIsGettingLocation(false);
    }
  };

  // 👇 ADDED: Temporary skip function for testing
  const skipToHome = () => {
    Alert.alert(
      "Skip to Home",
      "This will bypass location detection and go to Home screen.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          onPress: () => {
            // IMMEDIATELY stop speech before navigation
            Speech.stop();
            setIsSpeakerSpeaking(false);
            navigation.replace("Home");
          }
        }
      ]
    );
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

  const toggleMute = () => {
    if (!isMuted) {
      Speech.stop();
      setIsSpeakerSpeaking(false);
    }
    setIsMuted(!isMuted);
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
      speak(msg.serverError);
    } else if (permissionDenied) {
      speak(msg.permissionDenied);
    }
  }, [apiError, permissionDenied, isMuted]);

  // Main function to get location (auto mode) - FASTER
  const getLocation = async (quick = true) => {
    if (Platform.OS !== "web") Vibration.vibrate(30);
    
    setIsGettingLocation(true);
    setPermissionDenied(false);
    setApiError(false);
    setShowMap(false);
    
    speak(msg.usingGPS);

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

      speak(msg.sendingToServer);

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

      speak(msg.locationFound);
      setApiError(false);
      
    } catch (error) {
      console.log("Location flow error:", error);
      setApiError(true);
      Alert.alert(msg.error, msg.serverError);
      speak(msg.locationFailed);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle manual address submission
  const handleManualSubmit = async () => {
    if (!manualAddress.trim()) {
      Alert.alert(msg.error, msg.pleaseFillFields);
      return;
    }

    setIsGettingLocation(true);
    setShowMap(false);
    setApiError(false);
    
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

      speak(msg.locationFound);
      setApiError(false);
      
    } catch (error) {
      console.log("Manual submission error:", error);
      setApiError(true);
      Alert.alert(msg.error, msg.serverError);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Select a saved location
  const selectSavedLocation = (location) => {
    setSelectedLocation(location);
    setCoordinates(location.coordinates);
    setLocationDetails(location.details);
    setFarmName(location.name); // Set farm name from saved location
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

  // Confirm location and navigate
  const confirmLocation = () => {
    if (locationDetails || manualLocationDetails || selectedLocation) {
      speak(msg.continue);
      
      // IMMEDIATELY stop speech before navigation
      Speech.stop();
      setIsSpeakerSpeaking(false);
      
      navigation.replace("Home");
    }
  };

  const formatCoordinate = (coordinate) => {
    if (!coordinate) return "";
    return coordinate.toFixed(6);
  };

  const formatAccuracy = (accuracy) => {
    if (!accuracy) return "";
    return `${accuracy.toFixed(2)} ${msg.meters}`;
  };

  // Auto-detect on mount if not in manual mode
  useEffect(() => {
    if (!isManualMode && savedLocations.length === 0) {
      getLocation(true); // true = quick mode
    }

    return () => {
      Speech.stop();
      speechInProgressRef.current = false;
    };
  }, [isManualMode]);

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
            {/* Location Icon and Title - Separate container */}
            <View style={styles.locationIconContainer}>
              <LinearGradient
                colors={["#2E7D32", "#1B5E20"]}
                style={styles.iconGradient}
              >
                <Ionicons name="compass" size={40} color="#fff" />
              </LinearGradient>
              <Text style={styles.titleText}>
                {msg.selectLocation}
              </Text>
            </View>

            {/* 👇 ADDED: Temporary Skip Button */}
            <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
              <TouchableOpacity
                onPress={skipToHome}
                style={{
                  backgroundColor: "#9C27B0",
                  padding: 15,
                  borderRadius: 12,
                  alignItems: "center",
                  elevation: 5,
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="arrow-forward-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                  {msg.skip}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Loading/Status Indicator */}
            {isGettingLocation && (
              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <View style={{
                  backgroundColor: "#E3F2FD",
                  padding: 15,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ActivityIndicator size="small" color="#1976D2" />
                  <Text style={{ marginLeft: 10, color: "#1976D2", fontWeight: "600" }}>
                    {msg.sendingToServer}
                  </Text>
                </View>
              </View>
            )}

            {/* Error Display */}
            {apiError && !isGettingLocation && (
              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <View style={{
                  backgroundColor: "#FFEBEE",
                  padding: 20,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#FF5252",
                  alignItems: "center"
                }}>
                  <Ionicons name="alert-circle" size={40} color="#D32F2F" />
                  <Text style={{ 
                    color: "#D32F2F", 
                    textAlign: "center", 
                    fontSize: 16,
                    marginTop: 10,
                    marginBottom: 15
                  }}>
                    {msg.serverError}
                  </Text>
                  <TouchableOpacity
                    onPress={isManualMode ? handleManualSubmit : () => getLocation(true)}
                    style={{
                      backgroundColor: "#2196F3",
                      paddingVertical: 12,
                      paddingHorizontal: 30,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                      {msg.retryButton}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Permission Denied */}
            {permissionDenied && !isGettingLocation && !apiError && (
              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <View style={{
                  backgroundColor: "#FFEBEE",
                  padding: 20,
                  borderRadius: 10,
                  alignItems: "center"
                }}>
                  <Ionicons name="ban" size={40} color="#FF5252" />
                  <Text style={{ color: "#D32F2F", textAlign: "center", marginTop: 10, fontSize: 16, marginBottom: 15 }}>
                    {msg.permissionDenied}
                  </Text>
                  <TouchableOpacity
                    onPress={() => getLocation(true)}
                    style={{
                      backgroundColor: "#2196F3",
                      paddingVertical: 12,
                      paddingHorizontal: 30,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {msg.retry}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Mode Toggle */}
            {!apiError && !permissionDenied && (
              <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <View style={{
                  flexDirection: "row",
                  backgroundColor: "#fff",
                  borderRadius: 15,
                  padding: 5,
                  elevation: 3
                }}>
                  <TouchableOpacity
                    onPress={() => setIsManualMode(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: !isManualMode ? "#2E7D32" : "transparent",
                      alignItems: "center",
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons 
                      name="locate" 
                      size={18} 
                      color={!isManualMode ? "#fff" : "#666"} 
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{
                      fontWeight: "bold",
                      color: !isManualMode ? "#fff" : "#666"
                    }}>
                      {msg.detectAutomatically}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsManualMode(true)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: isManualMode ? "#2E7D32" : "transparent",
                      alignItems: "center",
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons 
                      name="create" 
                      size={18} 
                      color={isManualMode ? "#fff" : "#666"} 
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{
                      fontWeight: "bold",
                      color: isManualMode ? "#fff" : "#666"
                    }}>
                      {msg.enterManually}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Main Content */}
            {!apiError && !permissionDenied && (
              <View style={{ paddingHorizontal: 20 }}>
                {isManualMode ? (
                  /* Manual Mode Input */
                  <View style={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 25,
                    padding: 25,
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: "#4CAF50",
                    marginBottom: 20
                  }}>
                    <Text style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#1B5E20",
                      marginBottom: 20,
                      textAlign: "center"
                    }}>
                      {msg.enterManuallyTitle}
                    </Text>

                    <TextInput
                      style={{
                        backgroundColor: "#F5F5F5",
                        borderRadius: 10,
                        padding: 15,
                        fontSize: 16,
                        color: "#333",
                        minHeight: 100,
                        textAlignVertical: "top"
                      }}
                      placeholder={msg.manualAddressPlaceholder}
                      placeholderTextColor="#999"
                      value={manualAddress}
                      onChangeText={setManualAddress}
                      multiline={true}
                      numberOfLines={4}
                    />

                    <TouchableOpacity
                      onPress={handleManualSubmit}
                      disabled={isGettingLocation}
                      style={{
                        backgroundColor: "#FF9800",
                        padding: 15,
                        borderRadius: 12,
                        alignItems: "center",
                        marginTop: 20,
                        opacity: isGettingLocation ? 0.5 : 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="map" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                        {msg.findOnMap}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Auto Mode - Get Location Button (only show if no location yet) */
                  !locationDetails && !isGettingLocation && (
                    <TouchableOpacity
                      onPress={() => getLocation(true)}
                      disabled={isGettingLocation}
                      style={{
                        backgroundColor: "#2196F3",
                        padding: 15,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                        opacity: isGettingLocation ? 0.5 : 1
                      }}
                    >
                      <Ionicons name="locate" size={24} color="#fff" />
                      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16, marginLeft: 10 }}>
                        {msg.getLocationButton}
                      </Text>
                    </TouchableOpacity>
                  )
                )}

                {/* Farm Name Input - REQUIRED field shown when location is detected */}
                {locationDetails && !isGettingLocation && (
                  <View style={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 25,
                    padding: 20,
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: "#4CAF50",
                    marginBottom: 20
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#1B5E20",
                      marginBottom: 10
                    }}>
                      {msg.enterFarmName} <Text style={{color: 'red'}}>*</Text>
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: "#F5F5F5",
                        borderRadius: 10,
                        padding: 15,
                        fontSize: 16,
                        color: "#333",
                        borderWidth: 1,
                        borderColor: farmName.trim() ? "#4CAF50" : "#E0E0E0"
                      }}
                      placeholder={msg.enterNameForLocation}
                      placeholderTextColor="#999"
                      value={farmName}
                      onChangeText={setFarmName}
                    />
                  </View>
                )}

                {/* Map Display with "You are here" marker */}
                {showMap && mapRegion && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ 
                      fontSize: 14, 
                      color: "#1B5E20", 
                      fontWeight: "600", 
                      marginBottom: 8,
                      marginLeft: 5 
                    }}>
                      {msg.locationOnMap}
                    </Text>
                    <View style={{
                      height: 250,
                      borderRadius: 20,
                      overflow: "hidden",
                      borderWidth: 2,
                      borderColor: "#4CAF50",
                      elevation: 5
                    }}>
                      {isGettingLocation ? (
                        <View style={{
                          flex: 1,
                          backgroundColor: "#f5f5f5",
                          justifyContent: "center",
                          alignItems: "center"
                        }}>
                          <ActivityIndicator size="large" color="#2E7D32" />
                          <Text style={{ marginTop: 10, color: "#666" }}>
                            {msg.mapLoading}
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
                              <View style={{
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
                              }} />
                              <View style={{
                                width: 4,
                                height: 10,
                                backgroundColor: '#FF6B6B',
                                marginTop: -2,
                              }} />
                              <Text style={{
                                fontSize: 12,
                                fontWeight: 'bold',
                                color: '#333',
                                marginTop: 4,
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 10,
                              }}>
                                {msg.youAreHere}
                              </Text>
                            </View>
                          </Marker>
                        </MapView>
                      )}
                      
                      <View style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        backgroundColor: "rgba(255,255,255,0.9)",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 15,
                        flexDirection: "row",
                        alignItems: "center",
                      }}>
                        <Ionicons name="radio" size={12} color="#4CAF50" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 10, fontWeight: "bold", color: "#333" }}>
                          {msg.live}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Location Details */}
                {displayLocation && !isGettingLocation && (
                  <View style={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 25,
                    padding: 20,
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: "#4CAF50",
                    marginBottom: 20
                  }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: "#1B5E20",
                      marginBottom: 15,
                      textAlign: "center"
                    }}>
                      {msg.locationFound}
                    </Text>

                    {displayLocation.place_name && (
                      <View style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Ionicons name="business" size={14} color="#666" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 12, color: "#888" }}>Place Name</Text>
                        </View>
                        <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                          <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
                            {displayLocation.place_name}
                          </Text>
                        </View>
                      </View>
                    )}

                    {displayLocation.formatted_address && (
                      <View style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Ionicons name="location" size={14} color="#666" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 12, color: "#888" }}>{msg.fullAddress}</Text>
                        </View>
                        <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                          <Text style={{ fontSize: 14, color: "#333" }}>
                            {displayLocation.formatted_address}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={{ flexDirection: "row", marginBottom: 12 }}>
                      {displayLocation.city && (
                        <View style={{ flex: 1, marginRight: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons name="business" size={12} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 10, color: "#888" }}>{msg.city}</Text>
                          </View>
                          <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                            <Text style={{ fontSize: 14, color: "#333" }}>{displayLocation.city}</Text>
                          </View>
                        </View>
                      )}
                      {displayLocation.district && (
                        <View style={{ flex: 1, marginLeft: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons name="map" size={12} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 10, color: "#888" }}>{msg.district}</Text>
                          </View>
                          <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                            <Text style={{ fontSize: 14, color: "#333" }}>{displayLocation.district}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: "row", marginBottom: 12 }}>
                      {displayLocation.state && (
                        <View style={{ flex: 1, marginRight: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons name="flag" size={12} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 10, color: "#888" }}>{msg.state}</Text>
                          </View>
                          <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                            <Text style={{ fontSize: 14, color: "#333" }}>{displayLocation.state}</Text>
                          </View>
                        </View>
                      )}
                      {displayLocation.postal_code && (
                        <View style={{ flex: 1, marginLeft: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons name="mail" size={12} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 10, color: "#888" }}>{msg.pinCode}</Text>
                          </View>
                          <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                            <Text style={{ fontSize: 14, color: "#333" }}>{displayLocation.postal_code}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {displayLocation.country && (
                      <View style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Ionicons name="earth" size={14} color="#666" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 12, color: "#888" }}>{msg.country}</Text>
                        </View>
                        <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                          <Text style={{ fontSize: 14, color: "#333" }}>{displayLocation.country}</Text>
                        </View>
                      </View>
                    )}

                    {coordinates && (
                      <View style={{ 
                        flexDirection: "row", 
                        marginTop: 10, 
                        paddingTop: 10, 
                        borderTopWidth: 1, 
                        borderTopColor: "#E0E0E0" 
                      }}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons name="resize" size={10} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 10, color: "#888" }}>{msg.latitude}</Text>
                          </View>
                          <View style={{ backgroundColor: "#E8F5E9", borderRadius: 6, padding: 8 }}>
                            <Text style={{ fontSize: 12, color: "#2E7D32", fontWeight: "500" }}>
                              {formatCoordinate(coordinates.latitude)}
                            </Text>
                          </View>
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons name="resize" size={10} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 10, color: "#888" }}>{msg.longitude}</Text>
                          </View>
                          <View style={{ backgroundColor: "#E8F5E9", borderRadius: 6, padding: 8 }}>
                            <Text style={{ fontSize: 12, color: "#2E7D32", fontWeight: "500" }}>
                              {formatCoordinate(coordinates.longitude)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {coordinates?.accuracy && (
                      <View style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Ionicons name="speedometer" size={12} color="#666" style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 10, color: "#888" }}>{msg.accuracy}</Text>
                        </View>
                        <View style={{ backgroundColor: "#E3F2FD", borderRadius: 6, padding: 8 }}>
                          <Text style={{ fontSize: 12, color: "#1976D2", fontWeight: "500" }}>
                            {formatAccuracy(coordinates.accuracy)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* "Detect Again" option */}
                    <TouchableOpacity
                      onPress={isManualMode ? handleManualSubmit : () => getLocation(true)}
                      style={{
                        padding: 12,
                        alignItems: "center",
                        marginTop: 5,
                        flexDirection: 'row',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="refresh" size={18} color="#2E7D32" style={{ marginRight: 6 }} />
                      <Text style={{ color: "#2E7D32", fontWeight: "600" }}>
                        {msg.detectAgain}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* CONFIRM LOCATION BUTTON - Only one button */}
                {locationDetails && (
                  <TouchableOpacity
                    onPress={saveAndActivateLocation}
                    disabled={!isConfirmEnabled()}
                    style={{
                      borderRadius: 15,
                      overflow: "hidden",
                      marginTop: 10,
                      marginBottom: 20,
                      opacity: isConfirmEnabled() ? 1 : 0.5
                    }}
                  >
                    <LinearGradient
                      colors={isConfirmEnabled() ? ["#2E7D32", "#1B5E20"] : ["#999", "#666"]}
                      style={{ 
                        paddingVertical: 18, 
                        alignItems: "center", 
                        flexDirection: 'row', 
                        justifyContent: 'center' 
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
                        {msg.confirmLocation}
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
              <Text style={styles.menuTitle}>{msg.otherAddresses}</Text>
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
                <Text style={styles.emptyMenuText}>No saved locations yet</Text>
                <TouchableOpacity
                  style={styles.addFirstLocationBtn}
                  onPress={() => {
                    setShowLocationMenu(false);
                    getLocation(true);
                  }}
                >
                  <Text style={styles.addFirstLocationText}>Add your first location</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.menuAddButton}
              onPress={() => {
                setShowLocationMenu(false);
                getLocation(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color="#2E7D32" />
              <Text style={styles.menuAddText}>{msg.addNewLocation}</Text>
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
  // Hamburger container - separate
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
  // Location icon container - separate
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
  // Save location styles
  saveLocationContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveLocationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  locationNameInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  saveActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelSaveBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  confirmSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
    marginLeft: 8,
  },
  confirmSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});

export default LocationScreen;