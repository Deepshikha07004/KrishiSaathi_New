import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { AppContext } from "../context/AppContext";
import { SafeAreaView } from "react-native-safe-area-context";
import FloatingChatbot from "../components/FloatingChatbot";


const HomeScreen = ({ navigation }) => {
  const {
    t,
    user,
    setUser,
    setChatVisible,
    setChatType,
    location,
    lang,
    setLang,
    convertDigits,
    activeLocation,
    savedLocations,
    setActiveLocation,
  } = useContext(AppContext);
  
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false);
  const [locationDropdownVisible, setLocationDropdownVisible] = useState(false);
 

  // Set immersive mode
  useEffect(() => {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setBarStyle('light-content');
  }, []);

  const toggleChat = (type = "General") => {
    setChatType(type);
    setChatVisible(true);
  };

  const logout = () => {
    setProfileModalVisible(false);
    setUser(null);
    navigation.replace("Login");
  };

  const changeLanguage = (languageCode) => {
    setLang(languageCode);
    setLanguageDropdownVisible(false);
  };

  // Function to change location
  const changeLocation = (newLocation) => {
    setActiveLocation(newLocation);
    setLocationDropdownVisible(false);
  };

  // Get user's display name (only show name if exists, otherwise show translated "Guest")
  const getUserDisplayName = () => {
    if (user?.name) {
      return user.name; // Name from signup (doesn't need translation)
    }
    return t.guest; // Translated "Guest" from language files
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#799844" }}>
      {/* Transparent Status Bar */}
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle="light-content" 
      />

      <ImageBackground
        source={require("../assets/homebg.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        {/* Dark Green Overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(29, 69, 7, 0.5)",
          }}
        />

        <ScrollView 
          contentContainerStyle={{ 
            paddingHorizontal: 20, 
            paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
            paddingBottom: 40 
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Profile Bar with Farm Badge */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginBottom: 25,
            }}
          >
            <TouchableOpacity
              onPress={() => setProfileModalVisible(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(196, 246, 153, 0.25)",
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 30,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.3)",
                elevation: 4,
              }}
            >
              {/* Farm Name Badge */}
              {activeLocation && (
                <View style={{
                  backgroundColor: "#FF9800",
                  borderRadius: 15,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 8,
                }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                    {activeLocation.name}
                  </Text>
                </View>
              )}
              
              <Text
                style={{
                  marginLeft: activeLocation ? 0 : 10,
                  marginRight: 10,
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#0d3706",
                }}
              >
                {t.hello}, {getUserDisplayName()}
              </Text>
              <Ionicons name="menu" size={24} color="#0d3706" />
            </TouchableOpacity>
          </View>

          {/* Weather Card with Arrow */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Weather")}
            activeOpacity={0.9}
            style={{
              height: 180,
              borderRadius: 25,
              overflow: "hidden",
              marginBottom: 20,
              elevation: 10,
              borderWidth:2.5,
              borderColor:"rgba(255, 255, 255, 0.3)"
            }}
          >
            <ImageBackground
              source={require("../assets/weather.jpg")}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(6, 39, 68, 0.3)"]}
                style={{
                  flex: 1,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="weather-partly-cloudy"
                    size={70}
                    color="#fff"
                  />
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "#fff",
                      marginTop: 10,
                    }}
                  >
                    {t.weatherUpdate}
                  </Text>
                  <Text style={{ color: "#E8F5E9", fontSize: 14, opacity: 0.9 }}>
                    {t.forecast}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          {/* Middle Grid Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            {/* Crop Recommendation Card */}
            <TouchableOpacity
              onPress={() => navigation.navigate("CropRec")}
              style={{
                width: "48%",
                height: 180,
                borderRadius: 25,
                overflow: "hidden",
                elevation: 8,
                borderWidth:2.5,
                borderColor:"rgba(255, 255, 255, 0.3)"
              }}
            >
              <ImageBackground
                source={require("../assets/crop.jpg")}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0.4)", "rgba(27, 94, 32, 0.8)"]}
                  style={{
                    flex: 1,
                    padding: 15,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <MaterialCommunityIcons name="leaf" size={35} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: "bold",
                        textAlign: "center",
                        marginTop: 8,
                      }}
                    >
                      {t.cropRec}
                    </Text>
                    <Text
                      style={{
                        color: "#E8F5E9",
                        fontSize: 13,
                        textAlign: "center",
                        marginTop: 2,
                      }}
                    >
                      {t.cropRecDesc}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#fff"
                    style={{ marginLeft: 5 }}
                  />
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>

            {/* Crop Advisory Card */}
            <TouchableOpacity
              onPress={() => navigation.navigate("CropAdv")}
              style={{
                width: "48%",
                height: 180,
                borderRadius: 25,
                overflow: "hidden",
                elevation: 8,
                borderWidth:2.5,
                borderColor:"rgba(255, 255, 255, 0.3)"
              }}
            >
              <ImageBackground
                source={require("../assets/truck.jpg")}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0.4)", "rgba(27, 94, 32, 0.8)"]}
                  style={{
                    flex: 1,
                    padding: 15,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <MaterialCommunityIcons
                      name="comment-question-outline"
                      size={35}
                      color="#fff"
                    />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: "bold",
                        textAlign: "center",
                        marginTop: 8,
                      }}
                    >
                      {t.cropAdv}
                    </Text>
                    <Text
                      style={{
                        color: "#E3F2FD",
                        fontSize: 13,
                        textAlign: "center",
                        marginTop: 2,
                      }}
                    >
                      {t.cropAdvDesc}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#fff"
                    style={{ marginLeft: 5 }}
                  />
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          </View>

          {/* Bottom Full-Width Storage Card */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Storage")}
            style={{
              width: "100%",
              height: 150,
              borderRadius: 25,
              overflow: "hidden",
              elevation: 8,
              marginBottom: 20,
              borderWidth:2.5,
              borderColor:"rgba(255, 255, 255, 0.3)"
            }}
          >
            <ImageBackground
              source={require("../assets/warehouse.jpg")}
              style={{ flex: 1 }}
              blurRadius={1}
            >
              <LinearGradient
                colors={["rgba(0, 0, 0, 0.6)", "rgba(81, 92, 3, 0.2)"]}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <FontAwesome5 name="warehouse" size={40} color="#fff" />
                <View style={{ marginLeft: 20, flex: 1 }}>
                  <Text
                    style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}
                  >
                    {t.storage}
                  </Text>
                  <Text style={{ color: "#f0f0f0", fontSize: 14 }}>
                    {t.cropStorage}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </ScrollView>

        {/* Profile Info Modal */}
        <Modal
          visible={profileModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setProfileModalVisible(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(4, 35, 6, 0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {
              setProfileModalVisible(false);
              setLanguageDropdownVisible(false);
              setLocationDropdownVisible(false);
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                width: "85%",
                borderRadius: 20,
                padding: 25,
                elevation: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  textAlign: "center",
                  color: "#2E7D32",
                  marginBottom: 20,
                }}
              >
                {t.hello}, {getUserDisplayName()}
              </Text>

              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#eee",
                  paddingTop: 10,
                }}
              >
               {/* Location/Farm Section - IMPROVED */}
<View style={{ marginBottom: 15 }}>
  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
    <Ionicons name="location" size={24} color="#2E7D32" />
    <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: "bold", color: "#333" }}>
      {t.currentFarm || "Current Farm"}:
    </Text>
  </View>
  
  {/* Current Farm Display - ALWAYS VISIBLE */}
  <View style={{
    backgroundColor: "#E8F5E9",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginBottom: 10,
  }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#2E7D32" }}>
          {activeLocation?.name || t.noFarmSelected || "No farm selected"}
        </Text>
        {activeLocation?.address && (
          <Text style={{ color: "#666", fontSize: 13, marginTop: 4 }} numberOfLines={1}>
            {activeLocation.address}
          </Text>
        )}
      </View>
      
      {/* Always show farm count */}
      <View style={{
        backgroundColor: "#4CAF50",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
      }}>
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>
          {savedLocations?.length || 0} {t.farms || "Farms"}
        </Text>
      </View>
    </View>
  </View>

  {/* Quick Switch Dropdown - Only shows if MULTIPLE farms exist (2 or more) */}
  {savedLocations && savedLocations.length > 1 && (
    <View>
      <Text style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
        {t.quickSwitch || "Quick Switch:"}
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ flexDirection: "row" }}
      >
        {savedLocations.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            onPress={() => {
              changeLocation(loc);
              setProfileModalVisible(false); // Close modal after selection
            }}
            style={{
              backgroundColor: activeLocation?.id === loc.id ? "#2E7D32" : "#f0f0f0",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 25,
              marginRight: 10,
              borderWidth: 1,
              borderColor: activeLocation?.id === loc.id ? "#1B5E20" : "#ddd",
            }}
          >
            <Text style={{ 
              color: activeLocation?.id === loc.id ? "#fff" : "#333",
              fontWeight: "600",
              fontSize: 14,
            }}>
              {loc.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )}

  {/* "Manage All Farms" Button - ALWAYS VISIBLE */}
  <TouchableOpacity
    onPress={() => {
      setProfileModalVisible(false);
      navigation.navigate("SavedLocations");
    }}
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#4CAF50",
      padding: 12,
      borderRadius: 10,
      marginTop: 15,
    }}
  >
    <Ionicons name="list" size={20} color="#fff" />
    <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 8, fontSize: 15 }}>
      {t.manageAllFarms || "Manage All Farms"}
    </Text>
  </TouchableOpacity>
</View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <Ionicons name="call" size={24} color="#2E7D32" />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                      {t.phoneNumber}:
                    </Text>
                    <Text style={{ color: "#666" }}>
                      {user?.phone ? convertDigits(user.phone) : t.notProvided}
                    </Text>
                  </View>
                </View>

                {/* Language Selection with Dropdown */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    position: "relative",
                    zIndex: 1000,
                  }}
                >
                  <Ionicons name="language" size={24} color="#2E7D32" />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                      {t.changeLang}:
                    </Text>
                  </View>
                  
                  {/* Language Dropdown Trigger */}
                  <TouchableOpacity
                    onPress={() => {
                      setLanguageDropdownVisible(!languageDropdownVisible);
                      setLocationDropdownVisible(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#f0f0f0",
                      padding: 8,
                      borderRadius: 10,
                      minWidth: 100,
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ marginRight: 5, fontSize: 16 }}>
                      {lang === "en"
                        ? "English"
                        : lang === "hi"
                          ? "हिंदी"
                          : "বাংলা"}
                    </Text>
                    <Ionicons 
                      name={languageDropdownVisible ? "chevron-up" : "chevron-down"} 
                      size={18} 
                      color="#2E7D32"
                    />
                  </TouchableOpacity>
                </View>

                {/* Language Dropdown Menu */}
                {languageDropdownVisible && (
                  <View
                    style={{
                      position: "absolute",
                      right: 25,
                      top: 170,
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      elevation: 8,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      borderWidth: 1,
                      borderColor: "#ddd",
                      zIndex: 1500,
                      width: 120,
                      overflow: "hidden",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => changeLanguage("en")}
                      style={{
                        paddingVertical: 15,
                        paddingHorizontal: 15,
                        borderBottomWidth: 1,
                        borderBottomColor: "#f0f0f0",
                        backgroundColor: lang === "en" ? "#e8f5e9" : "#fff",
                      }}
                    >
                      <Text style={{ 
                        fontSize: 16,
                        color: lang === "en" ? "#2E7D32" : "#333",
                        fontWeight: lang === "en" ? "bold" : "normal",
                        textAlign: "center",
                      }}>
                        English
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => changeLanguage("hi")}
                      style={{
                        paddingVertical: 15,
                        paddingHorizontal: 15,
                        borderBottomWidth: 1,
                        borderBottomColor: "#f0f0f0",
                        backgroundColor: lang === "hi" ? "#e8f5e9" : "#fff",
                      }}
                    >
                      <Text style={{ 
                        fontSize: 16,
                        color: lang === "hi" ? "#2E7D32" : "#333",
                        fontWeight: lang === "hi" ? "bold" : "normal",
                        textAlign: "center",
                      }}>
                        हिंदी
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => changeLanguage("bn")}
                      style={{
                        paddingVertical: 15,
                        paddingHorizontal: 15,
                        backgroundColor: lang === "bn" ? "#e8f5e9" : "#fff",
                      }}
                    >
                      <Text style={{ 
                        fontSize: 16,
                        color: lang === "bn" ? "#2E7D32" : "#333",
                        fontWeight: lang === "bn" ? "bold" : "normal",
                        textAlign: "center",
                      }}>
                        বাংলা
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  onPress={logout}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 15,
                    marginTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: "#eee",
                  }}
                >
                  <Ionicons name="log-out" size={24} color="#D32F2F" />
                  <Text
                    style={{
                      marginLeft: 15,
                      color: "#D32F2F",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    {t.logout}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Floating Chatbot Button */}
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 25,
            right: 30,
            backgroundColor: "#2E7D32",
            width: 65,
            height: 65,
            borderRadius: 32.5,
            justifyContent: "center",
            alignItems: "center",
            elevation: 10,
            zIndex: 999,
            borderWidth:1,
            borderColor:"#ffffff"
          }}
          onPress={() => toggleChat("General")}
        >
          <Ionicons name="chatbubbles" size={35} color="#fff" />
        </TouchableOpacity>

        <FloatingChatbot />
      </ImageBackground>
    </View>
  );
};

export default HomeScreen;