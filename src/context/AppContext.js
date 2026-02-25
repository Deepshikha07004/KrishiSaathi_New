import React, { createContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import translations from '../translations/translations';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [lang, setLang] = useState('en');
    const [user, setUser] = useState(null);
    const [location, setLocation] = useState(null);
    const [isChatVisible, setChatVisible] = useState(false);
    const [chatType, setChatType] = useState('General');
    const [pinnedMessage, setPinnedMessage] = useState(null);
    const [isManualLocation, setIsManualLocation] = useState(false);
    const [chatBackground, setChatBackground] = useState(null);
    const [weatherData, setWeatherData] = useState(null); // Added for weather

    const digitsMap = {
        hi: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
        bn: ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"],
    };

    const convertDigits = (val) => {
        if (!val && val !== 0) return "";
        const str = val.toString();
        if (lang === "en" || !digitsMap[lang]) return str;
        return str.split("").map(c =>
            (c >= "0" && c <= "9" ? digitsMap[lang][parseInt(c)] : c)
        ).join("");
    };

    // Defensive translation lookup
    const t = translations[lang] || translations['en'] || {};

    useEffect(() => {
        let watcher;
        const startTracking = async () => {
            try {
                // Don't track if manual location is set or on web
                if (isManualLocation || Platform.OS === 'web') {
                    return;
                }

                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.log("Location permission denied");
                    return;
                }

                // Get initial location
                const initialLocation = await Location.getCurrentPositionAsync({});
                updateAddress(initialLocation.coords.latitude, initialLocation.coords.longitude);

                // Watch for location changes
                watcher = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 10000,
                        distanceInterval: 15,
                    },
                    (loc) => {
                        updateAddress(loc.coords.latitude, loc.coords.longitude);
                    }
                );
            } catch (err) {
                console.log("Tracking error:", err);
                // Don't set fallback data, just log the error
                setLocation(null);
            }
        };

        const updateAddress = async (lat, lon) => {
            try {
                // Only attempt reverse geocoding on native platforms
                if (Platform.OS !== 'web') {
                    const geo = await Location.reverseGeocodeAsync({ 
                        latitude: lat, 
                        longitude: lon 
                    });
                    
                    if (geo && geo.length > 0) {
                        const addressInfo = {
                            placeName: geo[0].name || geo[0].city || geo[0].district || null,
                            fullAddress: [
                                geo[0].street,
                                geo[0].subregion,
                                geo[0].city
                            ].filter(Boolean).join(', ') || null,
                            district: geo[0].district || geo[0].city || null,
                            state: geo[0].region || null,
                            pinCode: geo[0].postalCode || null
                        };

                        setLocation({
                            latitude: lat,
                            longitude: lon,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                            ...addressInfo
                        });
                    }
                } else {
                    // On web, just set coordinates without address
                    setLocation({
                        latitude: lat,
                        longitude: lon,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01
                    });
                }
            } catch (e) {
                console.log("Geocoding failed:", e);
                // Still set coordinates even if geocoding fails
                setLocation({
                    latitude: lat,
                    longitude: lon,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                });
            }
        };

        startTracking();
        return () => {
            if (watcher && watcher.remove) watcher.remove();
        };
    }, [isManualLocation]); // Removed lang dependency as it's not needed

    return (
        <AppContext.Provider value={{
            lang, 
            setLang, 
            t, 
            user, 
            setUser, 
            location, 
            setLocation,
            isChatVisible, 
            setChatVisible, 
            chatType, 
            setChatType,
            pinnedMessage, 
            setPinnedMessage,
            isManualLocation, 
            setIsManualLocation, 
            convertDigits,
            chatBackground, 
            setChatBackground,
            weatherData,
            setWeatherData
        }}>
            {children}
        </AppContext.Provider>
    );
};