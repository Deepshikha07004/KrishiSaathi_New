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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { AppContext } from "../context/AppContext";

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
    convertDigits,
  } = useContext(AppContext);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const toggleChat = (type = "General") => {
    setChatType(type);
    setChatVisible(true);
  };

  const logout = () => {
    setProfileModalVisible(false);
    setUser(null);
    navigation.replace("Login");
  };

  return (
    <ImageBackground
      source={require("../assets/homebg.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {/* Dark Green Overlay like the shared image */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(121, 152, 68, 0.5)", // Dark green overlay
        }}
      />

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Profile Bar - Transparent Background */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginBottom: 30,
          }}
        >
          <TouchableOpacity
            onPress={() => setProfileModalVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(196, 246, 153, 0.25)", // Premium semi-transparent box
              paddingHorizontal: 18,
              paddingVertical: 10,
              marginTop: 10,
              borderRadius: 30,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.3)",
              elevation: 4,
            }}
          >
            <Text
              style={{
                marginLeft: 10,
                marginRight: 10,
                fontSize: 20,
                fontWeight: "600",
                color: "#0d3706",
              }}
            >
              {t.hello}, {user?.name || ""}
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
          {/* Crop Recommendation Card with Arrow in same line */}
          <TouchableOpacity
            onPress={() => navigation.navigate("CropRec")}
            style={{
              width: "48%",
              height: 180,
              borderRadius: 25,
              overflow: "hidden",
              elevation: 8,
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

          {/* Crop Advisory Card with Arrow in same line */}
          <TouchableOpacity
            onPress={() => navigation.navigate("CropAdv")}
            style={{
              width: "48%",
              height: 180,
              borderRadius: 25,
              overflow: "hidden",
              elevation: 8,
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
          }}
        >
          <ImageBackground
            source={require("../assets/storage.jpg")}
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
          onPress={() => setProfileModalVisible(false)}
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
              {t.hello}, {user?.name || ""}
            </Text>

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#eee",
                paddingTop: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="location" size={24} color="#2E7D32" />
                <View style={{ marginLeft: 15, flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {t.area}:
                  </Text>
                  <Text style={{ color: "#666" }}>
                    {location?.district || t.locationError}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Location")}
                >
                  <Ionicons name="sync" size={20} color="#2E7D32" />
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

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="language" size={24} color="#2E7D32" />
                <View style={{ marginLeft: 15, flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {t.changeLang}:
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setProfileModalVisible(false);
                    navigation.navigate("Language");
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#f0f0f0",
                    padding: 8,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ marginRight: 5 }}>
                    {lang === "en"
                      ? "English"
                      : lang === "hi"
                        ? "हिंदी"
                        : "বাংলা"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} />
                </TouchableOpacity>
              </View>

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

      {/* Floating Chatbot - MOVED SLIGHTLY DOWN */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 15,
          right: 30,
          backgroundColor: "#2E7D32",
          width: 65,
          height: 65,
          borderRadius: 32.5,
          justifyContent: "center",
          alignItems: "center",
          elevation: 10,
        }}
        onPress={() => toggleChat("General")}
      >
        <Ionicons name="chatbubbles" size={35} color="#fff" />
      </TouchableOpacity>

      <FloatingChatbot />
    </ImageBackground>
  );
};

export default HomeScreen;