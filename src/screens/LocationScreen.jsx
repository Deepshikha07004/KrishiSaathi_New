import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Alert, TextInput, Platform, Vibration, Keyboard, ImageBackground, KeyboardAvoidingView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../context/AppContext";

const LocationScreen = ({ navigation }) => {
  const { t, setLocation, lang, isManualLocation, setIsManualLocation, convertDigits } = useContext(AppContext);

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

  const speechInProgressRef = useRef(false);

  // Backend API URL - Replace with your actual backend URL
  const BACKEND_API_URL = "https://your-backend-api.com/api"; // Update this

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
      confirmLocation: "Confirm Location",
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
      selectLocation: "Select Your Location",
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
      locationOnMap: "Your location on map",
      skipToNext: "SKIP TO NEXT PAGE (TEMP)",
    }
  };

  const msg = messages.en;

  // ============ PURE FRONTEND: ONLY GET COORDINATES ============

  // Get coordinates from device
  const getDeviceCoordinates = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      };
    } catch (error) {
      console.log("Error getting coordinates:", error);
      return null;
    }
  };

  // ============ BACKEND API CALLS ============

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

      const text = await response.text();
      
      // Check if response is HTML
      if (text.trim().startsWith('<')) {
        throw new Error('Invalid response');
      }

      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        throw new Error('Invalid response');
      }
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

      const text = await response.text();
      
      if (text.trim().startsWith('<')) {
        throw new Error('Invalid response');
      }

      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.log("Geocoding error:", error);
      throw error;
    }
  };

  // ============ MAIN LOCATION FLOW ============

  // Update map with coordinates
  const updateMapWithCoordinates = (lat, lon) => {
    setMapRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setShowMap(true);
  };

  // Main function to get location (auto mode)
  const getLocation = async () => {
    if (Platform.OS !== "web") Vibration.vibrate(30);
    
    setIsGettingLocation(true);
    setPermissionDenied(false);
    setApiError(false);
    setShowMap(false);
    await speakText(msg.usingGPS);

    try {
      // Step 1: Get coordinates from device
      const coords = await getDeviceCoordinates();
      
      if (!coords) {
        if (!permissionDenied) {
          setApiError(true);
        }
        setIsGettingLocation(false);
        return;
      }

      // Step 2: Store coordinates locally
      setCoordinates(coords);
      
      // Step 3: Show map immediately with coordinates
      updateMapWithCoordinates(coords.latitude, coords.longitude);

      await speakText(msg.sendingToServer);

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

      // Save to storage
      await AsyncStorage.setItem('user-location', JSON.stringify({
        ...locationData,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: Date.now()
      }));

      await speakText(msg.locationFound);
      setApiError(false);
      
    } catch (error) {
      console.log("Location flow error:", error);
      setApiError(true);
      Alert.alert(msg.error, msg.serverError);
      await speakText(msg.locationFailed);
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

      await speakText(msg.locationFound);
      setApiError(false);
      
    } catch (error) {
      console.log("Manual submission error:", error);
      setApiError(true);
      Alert.alert(msg.error, msg.serverError);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Confirm location and navigate
  const confirmLocation = () => {
    if (locationDetails || manualLocationDetails) {
      speakText(msg.continue);
      navigation.replace("Home");
    }
  };

  const speakText = async (text) => {
    if (speechInProgressRef.current) return;
    speechInProgressRef.current = true;
    setIsSpeaking(true);

    try {
      const speechLang = lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" : "en-US";
      await Speech.speak(text, {
        language: speechLang,
        rate: 0.85,
        pitch: 1.0,
        onDone: () => {
          setIsSpeaking(false);
          speechInProgressRef.current = false;
        },
        onError: () => {
          setIsSpeaking(false);
          speechInProgressRef.current = false;
        }
      });
    } catch (e) {
      setIsSpeaking(false);
      speechInProgressRef.current = false;
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
    if (!isManualMode) {
      getLocation();
    }

    return () => {
      Speech.stop();
      speechInProgressRef.current = false;
    };
  }, [isManualMode]);

  const displayLocation = isManualMode ? manualLocationDetails : locationDetails;

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
          backgroundColor: "rgba(223, 239, 192, 0.7)",
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={{ alignItems: "center", marginTop: 25, marginBottom: 20 }}>
              <LinearGradient
                colors={["#2E7D32", "#1B5E20"]}
                style={{ padding: 15, borderRadius: 50, marginBottom: 15, elevation: 8 }}
              >
                <Ionicons name="location" size={40} color="#fff" />
              </LinearGradient>
              <Text style={{ fontSize: 26, fontWeight: "bold", color: "#1B5E20" }}>
                {msg.selectLocation}
              </Text>
            </View>

            {/* TEMPORARY SKIP BUTTON - Added near header */}
            {!isGettingLocation && (
              <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                <TouchableOpacity
                  onPress={() => navigation.replace("Home")}
                  style={{
                    backgroundColor: "#9C27B0",
                    padding: 15,
                    borderRadius: 12,
                    alignItems: "center",
                    elevation: 5,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                    {msg.skipToNext}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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

            {/* Simple Error Display - Just "Try Again" */}
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
                    onPress={isManualMode ? handleManualSubmit : getLocation}
                    style={{
                      backgroundColor: "#2196F3",
                      paddingVertical: 12,
                      paddingHorizontal: 30,
                      borderRadius: 8,
                    }}
                  >
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
                  <Ionicons name="warning" size={40} color="#FF5252" />
                  <Text style={{ color: "#D32F2F", textAlign: "center", marginTop: 10, fontSize: 16, marginBottom: 15 }}>
                    {msg.permissionDenied}
                  </Text>
                  <TouchableOpacity
                    onPress={getLocation}
                    style={{
                      backgroundColor: "#2196F3",
                      paddingVertical: 12,
                      paddingHorizontal: 30,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {msg.retry}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Mode Toggle - Show only when no error and not loading */}
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
                      alignItems: "center"
                    }}
                  >
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
                      alignItems: "center"
                    }}
                  >
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

            {/* Main Content - Show only when no error */}
            {!apiError && !permissionDenied && (
              <View style={{ paddingHorizontal: 20 }}>
                {isManualMode ? (
                  /* Manual Mode */
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
                        opacity: isGettingLocation ? 0.5 : 1
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                        {msg.findOnMap}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Auto Mode - Get Location Button */
                  <TouchableOpacity
                    onPress={getLocation}
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
                )}

                {/* Map Display */}
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
                                backgroundColor: '#FF0000',
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                borderWidth: 3,
                                borderColor: '#FFFFFF',
                                elevation: 5
                              }} />
                              <View style={{
                                width: 2,
                                height: 8,
                                backgroundColor: '#FF0000',
                                marginTop: -1,
                              }} />
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
                        <View style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#4CAF50",
                          marginRight: 5,
                        }} />
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
                        <Text style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{msg.placeName}</Text>
                        <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                          <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
                            {displayLocation.place_name}
                          </Text>
                        </View>
                      </View>
                    )}

                    {displayLocation.formatted_address && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{msg.fullAddress}</Text>
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
                          <Text style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{msg.city}</Text>
                          <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                            <Text style={{ fontSize: 14, color: "#333" }}>{displayLocation.city}</Text>
                          </View>
                        </View>
                      )}
                      {displayLocation.district && (
                        <View style={{ flex: 1, marginLeft: 5 }}>
                          <Text style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{msg.district}</Text>
                          <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                            <Text style={{ fontSize: 14, color: "#333" }}>{displayLocation.district}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: "row", marginBottom: 12 }}>
                      {displayLocation.state && (
                        <View style={{ flex: 1, marginRight: 5 }}>
                          <Text style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{msg.state}</Text>
                          <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                            <Text style={{ fontSize: 14, color: "#333" }}>{displayLocation.state}</Text>
                          </View>
                        </View>
                      )}
                      {displayLocation.postal_code && (
                        <View style={{ flex: 1, marginLeft: 5 }}>
                          <Text style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{msg.pinCode}</Text>
                          <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10 }}>
                            <Text style={{ fontSize: 14, color: "#333" }}>{displayLocation.postal_code}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {displayLocation.country && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{msg.country}</Text>
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
                          <Text style={{ fontSize: 10, color: "#888" }}>{msg.latitude}</Text>
                          <View style={{ backgroundColor: "#E8F5E9", borderRadius: 6, padding: 8 }}>
                            <Text style={{ fontSize: 12, color: "#2E7D32", fontWeight: "500" }}>
                              {formatCoordinate(coordinates.latitude)}
                            </Text>
                          </View>
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                          <Text style={{ fontSize: 10, color: "#888" }}>{msg.longitude}</Text>
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
                        <Text style={{ fontSize: 10, color: "#888" }}>{msg.accuracy}</Text>
                        <View style={{ backgroundColor: "#E3F2FD", borderRadius: 6, padding: 8 }}>
                          <Text style={{ fontSize: 12, color: "#1976D2", fontWeight: "500" }}>
                            {formatAccuracy(coordinates.accuracy)}
                          </Text>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={confirmLocation}
                      style={{
                        borderRadius: 15,
                        overflow: "hidden",
                        marginTop: 20
                      }}
                    >
                      <LinearGradient
                        colors={["#2E7D32", "#1B5E20"]}
                        style={{ paddingVertical: 15, alignItems: "center" }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                          {msg.confirmLocation}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={isManualMode ? handleManualSubmit : getLocation}
                      style={{
                        padding: 12,
                        alignItems: "center",
                        marginTop: 5
                      }}
                    >
                      <Text style={{ color: "#2E7D32", fontWeight: "600" }}>
                        {msg.detectAgain}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Voice Indicator */}
      {isSpeaking && (
        <View style={{
          position: "absolute",
          bottom: 30,
          right: 20,
          backgroundColor: "#2196F3",
          padding: 12,
          borderRadius: 30,
          flexDirection: "row",
          alignItems: "center",
          elevation: 5,
        }}>
          <Ionicons name="volume-high" size={20} color="#fff" />
          <Text style={{ color: "#fff", marginLeft: 8, fontSize: 12 }}>
            {msg.speaking}
          </Text>
        </View>
      )}
    </ImageBackground>
  );
};

export default LocationScreen;