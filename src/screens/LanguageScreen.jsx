import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useLanguage } from "../hooks/useLanguage";

const LanguageScreen = ({ navigation }) => {
  const textInputRef = useRef(null);
  const [keyInput, setKeyInput] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const {
    selected: selectedLanguage,
    select: handleLanguageSelect,
    handleTextEntry,
    playFullSequence: replayVoice,
    languages,
    isSpeaking,
    isAnnouncementRunningRef,
  } = useLanguage();

  const handleTextInputChange = (val) => {
    setKeyInput(val);
    handleTextEntry(val);
    setTimeout(() => setKeyInput(""), 500);
  };

  const togglePlayPause = async () => {
    try {
      if (isSpeaking && !isPaused) {
        // Currently speaking - pause it
        await Speech.stop();
        setIsPaused(true);
        if (isAnnouncementRunningRef) {
          isAnnouncementRunningRef.current = false;
        }
      } else if (isPaused) {
        // Was paused - resume from beginning or restart
        setIsPaused(false);
        await replayVoice(); // This will restart the voice
      } else {
        // Not speaking at all - start
        await replayVoice();
      }
    } catch (error) {
      console.log("Error toggling speech:", error);
    }
  };

  useEffect(() => {
    // Reset pause state when speaking stops naturally
    if (!isSpeaking) {
      setIsPaused(false);
    }
  }, [isSpeaking]);

  useEffect(() => {
    if (textInputRef.current) textInputRef.current.focus();
  }, []);

  return (
    <ImageBackground
      source={require("../assets/bg.jpg")}
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
          backgroundColor: "rgba(223,239,192,0.6)",
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <TextInput
          ref={textInputRef}
          style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
          keyboardType="number-pad"
          value={keyInput}
          onChangeText={handleTextInputChange}
          maxLength={1}
          autoFocus
          onBlur={() => textInputRef.current?.focus()}
        />

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            justifyContent: "center",
          }}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: 'transparent' }}
        >
          <View style={{ alignItems: "center", marginBottom: 30 }}>
            <Image
              source={require("../assets/main-icon.png")}
              style={{ width: 250, height: 250 ,marginBottom:-60}}
              resizeMode="contain"
            />
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: "#1b5e20",
                marginTop: 15,
                textAlign: "center",
                letterSpacing: 1,
              }}
            >
              SELECT LANGUAGE
            </Text>
          </View>

          {/* PLAY/PAUSE TOGGLE BUTTON */}
          <View style={{ 
            alignItems: "center",
            marginBottom: 30,
            width: "100%",
          }}>
            <TouchableOpacity
              onPress={togglePlayPause}
              activeOpacity={0.8}
              style={{
                borderRadius: 60,
                overflow: "hidden",
                elevation: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                width: "80%",
              }}
            >
              <LinearGradient
                colors={
                  isPaused ? ["#FF9800", "#F57C00", "#E65100"] :
                  isSpeaking ? ["#66BB6A", "#43A047", "#2E7D32"] : 
                  ["#4CAF50", "#2E7D32", "#1B5E20"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 30,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 30,
                  padding: 5,
                  marginRight: 12,
                }}>
                  <Ionicons 
                    name={
                      isPaused ? "play" :
                      isSpeaking ? "pause" : "play"
                    } 
                    size={24} 
                    color="#fff" 
                  />
                </View>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18, letterSpacing: 0.5 }}>
                  {isPaused ? "RESUME" : isSpeaking ? "PAUSE" : "PLAY VOICE AGAIN"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              textAlign: "center",
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 20,
              color: "#1b5e20",
              backgroundColor: "rgba(255,255,255,0.5)",
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderRadius: 30,
              alignSelf: "center",
              overflow: "hidden",
            }}
          >
            Press 1, 2, or 3:
          </Text>

          {/* LANGUAGE CARDS */}
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              onPress={() => handleLanguageSelect(language.code)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 15,
                borderRadius: 16,
                overflow: "hidden",
                elevation: selectedLanguage === language.code ? 8 : 3,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            >
              <LinearGradient
                colors={
                  selectedLanguage === language.code
                    ? ["#4CAF50", "#2E7D32", "#1B5E20"]
                    : ["#FFFFFF", "#F1F8E9", "#DCEDC8"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  flex: 1,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: selectedLanguage === language.code ? "#FFD700" : "#328c09",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 15,
                    borderWidth: selectedLanguage === language.code ? 2 : 0,
                    borderColor: "#fff",
                    elevation: 3,
                  }}
                >
                  <Text style={{ 
                    color: selectedLanguage === language.code ? "#1B5E20" : "white", 
                    fontWeight: "bold",
                    fontSize: 18 
                  }}>
                    {language.key}
                  </Text>
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ 
                      fontSize: 20, 
                      fontWeight: "700", 
                      color: selectedLanguage === language.code ? "#fff" : "#1b5e20",
                      marginBottom: 4,
                    }}
                  >
                    {language.name}
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: selectedLanguage === language.code ? "rgba(255,255,255,0.9)" : "#666",
                  }}>
                    {language.voiceText}
                  </Text>
                </View>

                {selectedLanguage === language.code && (
                  <View style={{
                    backgroundColor: "#FFD700",
                    borderRadius: 20,
                    padding: 4,
                  }}>
                    <Ionicons name="checkmark" size={24} color="#1B5E20" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}

          {/* SELECTION CARD */}
          {selectedLanguage && (
            <View
              style={{
                marginTop: 30,
                marginBottom: 20,
                borderRadius: 24,
                overflow: "hidden",
                elevation: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <LinearGradient
                colors={["rgba(76, 175, 80, 0.95)", "rgba(46, 125, 50, 0.95)", "rgba(27, 94, 32, 0.95)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 25,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 20,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    padding: 15,
                    borderRadius: 15,
                  }}
                >
                  <View style={{
                    backgroundColor: "#FFD700",
                    borderRadius: 25,
                    padding: 5,
                  }}>
                    <Ionicons name="checkmark-circle" size={30} color="#1B5E20" />
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#fff",
                      marginLeft: 15,
                      flex: 1,
                    }}
                  >
                    {
                      languages.find((l) => l.code === selectedLanguage)
                        ?.selectedMessage
                    }
                  </Text>
                </View>
                
                {/* CONTINUE BUTTON */}
                <TouchableOpacity
                  onPress={async () => {
                    isAnnouncementRunningRef.current = false;
                    await Speech.stop();
                    navigation.replace("Login");
                  }}
                  activeOpacity={0.8}
                  style={{
                    borderRadius: 50,
                    overflow: "hidden",
                    elevation: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                  }}
                >
                  <LinearGradient
                    colors={["#FF9800", "#F57C00", "#E65100"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 18,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        fontWeight: "bold",
                        marginRight: 10,
                        letterSpacing: 0.5,
                      }}
                    >
                      {
                        languages.find((l) => l.code === selectedLanguage)
                          ?.continueButtonText
                      }
                    </Text>
                    <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default LanguageScreen;