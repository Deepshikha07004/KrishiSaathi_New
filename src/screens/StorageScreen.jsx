import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Dimensions,
    TextInput,
    Modal,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { AppContext } from '../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const StorageScreen = ({ navigation }) => {
    const { t, lang, location, userLocation, sownCrops, setSownCrops, setChatType, setChatVisible, setPinnedMessage, setChatBackground } = useContext(AppContext);

    // Flow state
    const [step, setStep] = useState(1); // 1: crops, 2: quantity, 3: list, 4: details
    const [selectedCrops, setSelectedCrops] = useState([]);
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('kg');
    const [selectedStorage, setSelectedStorage] = useState(null);
    const [showUnitPicker, setShowUnitPicker] = useState(false);

    // Storage list state
    const [storages, setStorages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Speaker state
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // API Base URL - Replace with your actual backend URL
    const API_BASE_URL = 'https://your-backend-api.com/api';

    // Units
    const units = ['kg', 'quintal', 'ton'];

    // Helper function to determine storage status based on backend data or available percentage
    const getStorageStatus = (storage) => {
        // If backend provides complete status object with translations
        if (storage.status) {
            // If status has text/color/icon directly
            if (storage.status.text && storage.status.color && storage.status.icon) {
                return {
                    text: storage.status.text,
                    color: storage.status.color,
                    icon: storage.status.icon,
                    description: storage.status.description || ''
                };
            }

            // If status is a code that needs mapping
            switch (storage.status.code || storage.status) {
                case 'almost_full':
                    return {
                        text: t.almostFull || 'Almost Full',
                        color: '#D32F2F',
                        icon: 'alert-circle',
                        description: t.onlyFewSlots || 'Only few slots left'
                    };
                case 'filling_fast':
                    return {
                        text: t.fillingFast || 'Filling Fast',
                        color: '#FF9800',
                        icon: 'time',
                        description: t.bookSoon || 'Book soon'
                    };
                case 'plenty_space':
                    return {
                        text: t.plentyOfSpace || 'Plenty of Space Available',
                        color: '#2E7D32',
                        icon: 'checkmark-circle',
                        description: t.goodAvailability || 'Good availability'
                    };
                default:
                    // Fall through to percentage-based calculation
                    break;
            }
        }

        // Fallback calculation based on availablePercentage from backend
        const availablePercentage = storage.availablePercentage || 0;
        if (availablePercentage <= 15) {
            return {
                text: t.almostFull || 'Almost Full',
                color: '#D32F2F',
                icon: 'alert-circle',
                description: t.onlyFewSlots || 'Only few slots left'
            };
        } else if (availablePercentage <= 40) {
            return {
                text: t.fillingFast || 'Filling Fast',
                color: '#FF9800',
                icon: 'time',
                description: t.bookSoon || 'Book soon'
            };
        } else {
            return {
                text: t.plentyOfSpace || 'Plenty of Space Available',
                color: '#2E7D32',
                icon: 'checkmark-circle',
                description: t.goodAvailability || 'Good availability'
            };
        }
    };

    // Function to translate digits to local script
    const translateDigits = (text) => {
        if (!text && text !== 0) return '';

        const str = text.toString();
        let translated = '';

        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char >= '0' && char <= '9') {
                switch (char) {
                    case '0': translated += t.digit0 || '0'; break;
                    case '1': translated += t.digit1 || '1'; break;
                    case '2': translated += t.digit2 || '2'; break;
                    case '3': translated += t.digit3 || '3'; break;
                    case '4': translated += t.digit4 || '4'; break;
                    case '5': translated += t.digit5 || '5'; break;
                    case '6': translated += t.digit6 || '6'; break;
                    case '7': translated += t.digit7 || '7'; break;
                    case '8': translated += t.digit8 || '8'; break;
                    case '9': translated += t.digit9 || '9'; break;
                    default: translated += char;
                }
            } else {
                translated += char;
            }
        }
        return translated;
    };

    // Function to extract numeric value from string
    const extractNumber = (str) => {
        if (!str) return '';
        const match = str.match(/[\d.]+/);
        return match ? match[0] : '';
    };

    // Function to extract unit from string
    const extractUnit = (str) => {
        if (!str) return '';
        const match = str.match(/[a-zA-Z/]+/);
        return match ? match[0] : '';
    };

    // Speech language mapping
    const speechLangMap = {
        en: "en-US",
        hi: "hi-IN",
        bn: "bn-IN"
    };

    // Get background image based on step
    const getBackgroundImage = () => {
        switch (step) {
            case 1:
                return require('../assets/storagebg.jpg');
            case 2:
                return require('../assets/storagebg.jpg');
            case 3:
                return require('../assets/storagebg.jpg');
            case 4:
                return require('../assets/storagebg.jpg');
            default:
                return require('../assets/storagebg.jpg');
        }
    };

    // Track screen focus
    useFocusEffect(
        React.useCallback(() => {
            return () => {
                Speech.stop();
                setIsSpeaking(false);
            };
        }, [])
    );

    // Stop speech when component unmounts
    useEffect(() => {
        return () => {
            Speech.stop();
            setIsSpeaking(false);
        };
    }, []);

    // Auto-speak when step changes
    useEffect(() => {
        if (isMuted) return;

        Speech.stop();
        setIsSpeaking(false);

        const timer = setTimeout(() => {
            if (step === 1) {
                const msg = lang === 'hi' ? "आपने कौन सी फसलें काटी हैं? एक या अधिक फसलें चुनें" :
                    lang === 'bn' ? "আপনি কোন ফসল কাটিয়েছেন? এক বা একাধিক ফসল নির্বাচন করুন" :
                        "Which crops have you harvested? Select one or more crops";
                speak(msg);
            } else if (step === 2) {
                const msg = lang === 'hi' ? "आपकी फसल की मात्रा क्या है?" :
                    lang === 'bn' ? "আপনার ফসলের পরিমাণ কত?" :
                        "What is the quantity of your harvest?";
                speak(msg);
            } else if (step === 3 && storages.length > 0) {
                const msg = lang === 'hi' ? `आपके पास ${translateDigits(storages.length)} कोल्ड स्टोरेज मिले` :
                    lang === 'bn' ? `আপনার কাছে ${translateDigits(storages.length)} কোল্ড স্টোরেজ পাওয়া গেছে` :
                        `Found ${translateDigits(storages.length)} cold storages near you`;
                speak(msg);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [step, isMuted, lang, storages.length]);

    const speak = (msg) => {
        if (isMuted || !msg) return;

        console.log('Speaking:', msg);

        Speech.stop();

        Speech.speak(msg, {
            language: speechLangMap[lang] || "en-US",
            pitch: 1,
            rate: 0.9,
            onStart: () => {
                console.log('Speech started');
                setIsSpeaking(true);
            },
            onDone: () => {
                console.log('Speech finished');
                setIsSpeaking(false);
            },
            onError: (error) => {
                console.log('Speech error:', error);
                setIsSpeaking(false);
                if (lang !== 'en') {
                    console.log('Trying fallback to English');
                    Speech.speak(msg, {
                        language: "en-US",
                        pitch: 1,
                        rate: 0.9,
                        onStart: () => setIsSpeaking(true),
                        onDone: () => setIsSpeaking(false),
                        onError: (e) => {
                            console.log('Fallback speech error:', e);
                            setIsSpeaking(false);
                        }
                    });
                }
            }
        });
    };

    const toggleMute = () => {
        if (!isMuted) {
            Speech.stop();
            setIsSpeaking(false);
        }
        setIsMuted(!isMuted);
    };

    const fetchSownCrops = async () => {
        try {
            setLoading(true);
            // API call to fetch sown crops
            const response = await fetch(`${API_BASE_URL}/sown-crops`, {
                headers: {
                    'Authorization': `Bearer ${userLocation?.token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setSownCrops(data.crops || data.data || []);
            } else {
                console.error('Failed to fetch sown crops:', data.message);
                Alert.alert(
                    t.error || 'Error',
                    data.message || 'Failed to load your crops'
                );
            }
        } catch (error) {
            console.error('Error fetching sown crops:', error);
            Alert.alert(
                t.error || 'Error',
                'Failed to load your crops. Please check your connection.'
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchStorages = async (pageNum = 1, refresh = false) => {
        if (refresh) {
            setLoading(true);
            setError(null);
            setPage(1);
        } else if (pageNum > 1) {
            setLoadingMore(true);
        }

        try {
            console.log('Fetching storages with availability for crops:', selectedCrops);

            // Prepare request body
            const requestBody = {
                crops: selectedCrops.map(c => c.id || c._id),
                quantity: quantity,
                unit: unit,
                latitude: userLocation?.latitude,
                longitude: userLocation?.longitude,
                page: pageNum,
                limit: 10
            };

            // API call to fetch storages
            const response = await fetch(`${API_BASE_URL}/storages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userLocation?.token}`,
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (response.ok) {
                const newStorages = data.storages || data.data || [];

                if (refresh) {
                    setStorages(newStorages);
                } else {
                    setStorages(prev => [...prev, ...newStorages]);
                }

                setHasMore(data.hasMore || data.pagination?.hasMore || false);

                // Speak results if there are storages
                if (newStorages.length > 0 && !isMuted) {
                    // Count storages with plenty of space using the status function
                    const availableCount = newStorages.filter(s => {
                        const status = getStorageStatus(s);
                        return status.text === (t.plentyOfSpace || 'Plenty of Space Available');
                    }).length;

                    let msg;
                    if (lang === 'hi') {
                        msg = availableCount > 0
                            ? `${translateDigits(newStorages.length)} स्टोरेज मिले. ${translateDigits(availableCount)} में पर्याप्त जगह उपलब्ध है.`
                            : `${translateDigits(newStorages.length)} कोल्ड स्टोरेज आपके पास मिले`;
                    } else if (lang === 'bn') {
                        msg = availableCount > 0
                            ? `${translateDigits(newStorages.length)} স্টোরেজ পাওয়া গেছে. ${translateDigits(availableCount)} টিতে পর্যাপ্ত স্থান উপলব্ধ.`
                            : `${translateDigits(newStorages.length)} কোল্ড স্টোরেজ আপনার কাছে পাওয়া গেছে`;
                    } else {
                        msg = availableCount > 0
                            ? `Found ${translateDigits(newStorages.length)} storages. ${translateDigits(availableCount)} have plenty of space available.`
                            : `Found ${translateDigits(newStorages.length)} cold storages near you`;
                    }

                    setTimeout(() => speak(msg), 100);
                }
            } else {
                setError(data.message || 'Unable to load storage facilities');
            }

        } catch (error) {
            console.error('Error fetching storages:', error);
            setError(data.message || t.connectionError || 'Unable to load storage facilities. Please check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    const toggleCrop = (crop) => {
        if (!crop || !crop.id) return;

        if (selectedCrops.some(c => c?.id === crop.id)) {
            setSelectedCrops(selectedCrops.filter(c => c?.id !== crop.id));
        } else {
            setSelectedCrops([...selectedCrops, crop]);
        }
    };

    const getCropName = (crop) => {
        if (!crop) return '';
        if (lang === 'hi') return crop.nameHi || crop.name || '';
        if (lang === 'bn') return crop.nameBn || crop.name || '';
        return crop.name || '';
    };

    const handleCropContinue = () => {
        if (selectedCrops.length === 0) {
            Alert.alert(
                t.selectCrops || 'Select Crops',
                t.selectCropsMsg || 'Please select at least one crop'
            );
            return;
        }
        setStep(2);
    };

    const handleQuantityContinue = () => {
        if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
            Alert.alert(
                t.invalidQuantity || 'Invalid Quantity',
                t.validQuantityMsg || 'Please enter a valid quantity (greater than 0)'
            );
            return;
        }
        setStep(3);
        fetchStorages(1, true);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            if (step === 3) {
                setStorages([]);
                setPage(1);
                setHasMore(true);
            }
            if (step === 4) setSelectedStorage(null);
        }
    };

    const handleStorageSelect = (storage) => {
        setSelectedStorage(storage);
        setStep(4);

        if (!isMuted) {
            const status = getStorageStatus(storage);

            let msg;
            if (lang === 'hi') {
                msg = `${storage.name}. दूरी ${translateDigits(storage.distance)} किलोमीटर. ${status.text}. ${translateDigits(extractNumber(storage.availableCapacity))} उपलब्ध है ${translateDigits(extractNumber(storage.totalCapacity))} में से.`;
            } else if (lang === 'bn') {
                msg = `${storage.name}. দূরত্ব ${translateDigits(storage.distance)} কিলোমিটার. ${status.text}. ${translateDigits(extractNumber(storage.availableCapacity))} উপলব্ধ ${translateDigits(extractNumber(storage.totalCapacity))} এর মধ্যে.`;
            } else {
                msg = `${storage.name}. Distance ${translateDigits(storage.distance)} kilometers. ${status.text}. ${translateDigits(extractNumber(storage.availableCapacity))} available out of ${translateDigits(extractNumber(storage.totalCapacity))}.`;
            }

            speak(msg);
        }
    };

    const handleCall = (phone) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert(t.noPhone || 'No Phone', t.noPhoneMsg || 'Phone number not available');
        }
    };

    const handleNavigate = (latitude, longitude) => {
        if (latitude && longitude) {
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
        } else {
            Alert.alert(t.info || 'Info', t.navigationDefault || 'Navigation will open with default location');
            Linking.openURL(`https://www.google.com/maps/search/cold+storage+near+me`);
        }
    };

    const loadMore = () => {
        if (hasMore && !loadingMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchStorages(nextPage);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStorages(1, true);
    };



    // Render step indicators
    const renderStepIndicator = () => (
        <View style={styles.stepIndicatorContainer}>
            <View style={[styles.stepDot, step >= 1 && styles.activeStepDot]} />
            <View style={[styles.stepLine, step >= 2 && styles.activeStepLine]} />
            <View style={[styles.stepDot, step >= 2 && styles.activeStepDot]} />
            <View style={[styles.stepLine, step >= 3 && styles.activeStepLine]} />
            <View style={[styles.stepDot, step >= 3 && styles.activeStepDot]} />
        </View>
    );

    // Step 1: Crop Selection
    const renderCropSelection = () => {
        const cropsToShow = sownCrops || [];

        if (loading && !sownCrops) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                    <Text style={styles.loadingText}>{t.loadingCrops || "Loading your crops..."}</Text>
                </View>
            );
        }

        return (
            <View style={styles.centerContainer}>
                <Ionicons name="leaf-outline" size={90} color="#2E7D32" />
                <Text style={styles.questionText}>
                    {t.cropTitle || "Which crops have you harvested?"}
                </Text>
                <Text style={[styles.subtitleText, { color: '#fff' }]}>
                    {t.cropSubtitle || "Select one or more crops"}
                </Text>

                <ScrollView style={styles.cropsScrollContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.cropsGrid}>
                        {cropsToShow.map((crop) => (
                            <TouchableOpacity
                                key={crop.id}
                                style={[
                                    styles.cropButton,
                                    selectedCrops.some(c => c?.id === crop?.id) && styles.selectedCrop
                                ]}
                                onPress={() => toggleCrop(crop)}
                            >
                                {crop?.icon && <Text style={styles.cropIcon}>{crop.icon}</Text>}
                                <Text style={[
                                    styles.cropText,
                                    selectedCrops.some(c => c?.id === crop?.id) && styles.selectedCropText
                                ]}>
                                    {getCropName(crop)}
                                </Text>
                                {selectedCrops.some(c => c?.id === crop?.id) && (
                                    <View style={styles.checkmark}>
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <TouchableOpacity
                    style={[
                        styles.primaryBtn,
                        selectedCrops.length === 0 && styles.disabledBtn
                    ]}
                    onPress={handleCropContinue}
                    disabled={selectedCrops.length === 0}
                >
                    <Text style={styles.btnText}>
                        {t.continue || 'Continue'} ({translateDigits(selectedCrops.length)})
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    // Step 2: Quantity Input
    const renderQuantityInput = () => (
        <View style={styles.centerContainer}>
            <Ionicons name="speedometer-outline" size={90} color="#2E7D32" />
            <Text style={styles.questionText}>
                {t.quantityTitle || "What is the quantity of your harvest?"}
            </Text>

            {selectedCrops.length > 0 && (
                <View style={styles.selectedChipsContainer}>
                    {selectedCrops.map((crop) => (
                        <View key={crop.id} style={styles.selectedChip}>
                            <Text style={styles.selectedChipText}>{getCropName(crop)}</Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.inputCard}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={t.quantityPlaceholder || "e.g., 500"}
                        placeholderTextColor="#999"
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                    />

                    <TouchableOpacity
                        style={styles.unitButton}
                        onPress={() => setShowUnitPicker(true)}
                    >
                        <Text style={styles.unitButtonText}>
                            {unit === 'kg' ? (t.kg || 'kg') :
                                unit === 'quintal' ? (t.quintal || 'quintal') :
                                    (t.ton || 'ton')}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#666" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.hintText}>
                    {t.quantityExample || "Example: 500 kg, 10 quintal, 2 ton"}
                </Text>
            </View>

            <Modal
                visible={showUnitPicker}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerTitle}>{t.selectUnit || "Select Unit"}</Text>
                        {units.map((unitOption) => (
                            <TouchableOpacity
                                key={unitOption}
                                style={[
                                    styles.unitOption,
                                    unit === unitOption && styles.selectedUnitOption
                                ]}
                                onPress={() => {
                                    setUnit(unitOption);
                                    setShowUnitPicker(false);
                                }}
                            >
                                <Text style={[
                                    styles.unitOptionText,
                                    unit === unitOption && styles.selectedUnitOptionText
                                ]}>
                                    {unitOption === 'kg' ? (t.kg || 'kg') :
                                        unitOption === 'quintal' ? (t.quintal || 'quintal') :
                                            (t.ton || 'ton')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.pickerCancelButton}
                            onPress={() => setShowUnitPicker(false)}
                        >
                            <Text style={styles.pickerCancelText}>{t.cancel || "Cancel"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleBack}>
                    <Text style={styles.secondaryBtnText}>{t.back || "Back"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.primaryBtn,
                        styles.flexBtn,
                        (!quantity || isNaN(quantity) || Number(quantity) <= 0) && styles.disabledBtn
                    ]}
                    onPress={handleQuantityContinue}
                    disabled={!quantity || isNaN(quantity) || Number(quantity) <= 0}
                >
                    <Text style={styles.btnText}>{t.findStorages || "Find Storages"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Step 3: Storage List with Availability
    const renderStorageList = () => (
        <View style={styles.container}>
            <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>
                    {t.storagesNearYou || "Cold Storages Near You"}
                </Text>
                <Text style={[styles.subtitleText, {
                    color: '#666', fontSize: 14, fontStyle: 'italic', textAlign: 'center',
                    flexWrap: 'wrap',
                    width: '100%', marginTop: 4, marginBottom: 8
                }]}>
                    {t.basedOnYourCrops || "Based on your harvested crops"}
                </Text>
                <Text style={[styles.listSubtitle, { color: '#666' }]}>
                    {translateDigits(storages.length)} {t.facilitiesFound || 'facilities found'}
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                    <Text style={styles.loadingText}>{t.findingStorages || "Finding best storage options..."}</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="cloud-offline-outline" size={60} color="#fff" />
                    <Text style={[styles.errorText, { color: '#ffffff' }]}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchStorages(1, true)}>
                        <Text style={styles.retryBtnText}>{t.tryAgain || "Try Again"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                        <Text style={styles.backBtnText}>{t.back || "Back"}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    onMomentumScrollEnd={loadMore}
                >
                    {storages.map((storage) => {
                        const status = getStorageStatus(storage);

                        // Get translated status text
                        const statusText = status.text;

                        return (
                            <TouchableOpacity
                                key={storage.id || storage._id}
                                style={styles.storageCard}
                                onPress={() => handleStorageSelect(storage)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.storageCardContent}>
                                    <View style={styles.storageCardHeader}>
                                        <Text style={styles.storageName}>{storage.name}</Text>
                                        {storage.compatibility && storage.compatibility >= 70 && (
                                            <View style={styles.bestMatchBadge}>
                                                <Text style={styles.bestMatchText}>{t.bestMatch || "Best Match"}</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.storageDistance}>
                                        <Ionicons name="location" size={14} color="#fff" />
                                        <Text style={styles.distanceText}>
                                            {translateDigits(storage.distance)} {t.km || "km"}
                                        </Text>
                                    </View>

                                    <View style={styles.availabilityContainer}>
                                        <View style={styles.availabilityHeader}>
                                            <Ionicons name="cube-outline" size={16} color="#2E7D32" />
                                            <Text style={styles.availabilityTitle}>{t.availableSpace || "Available Space"}</Text>
                                        </View>

                                        <View style={styles.availabilityBar}>
                                            <View
                                                style={[
                                                    styles.availabilityFill,
                                                    {
                                                        width: `${storage.availablePercentage || 0}%`,
                                                        backgroundColor: status.color
                                                    }
                                                ]}
                                            />
                                        </View>

                                        <View style={styles.availabilityDetails}>
                                            <View>
                                                <Text style={styles.availabilityText}>
                                                    <Text style={styles.availabilityLabel}>{t.available || "Available:"} </Text>
                                                    {translateDigits(extractNumber(storage.availableCapacity))} {t.mt || "MT"}
                                                </Text>
                                                <Text style={styles.availabilityText}>
                                                    <Text style={styles.availabilityLabel}>{t.total || "Total:"} </Text>
                                                    {translateDigits(extractNumber(storage.totalCapacity))} {t.mt || "MT"}
                                                </Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                                                <Ionicons name={status.icon} size={14} color={status.color} />
                                                <Text style={[styles.statusText, { color: status.color }]}>
                                                    {statusText}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.storageCrops}>
                                        <Text style={styles.cropsLabel}>{t.stores || "Stores:"} </Text>
                                        <View style={styles.cropsList}>
                                            {storage.crops?.slice(0, 3).map((crop, idx) => (
                                                <View key={idx} style={styles.cropTag}>
                                                    <Text style={styles.cropTagText}>
                                                        {typeof crop === 'string' ? crop : crop.name || crop}
                                                    </Text>
                                                </View>
                                            ))}
                                            {storage.crops?.length > 3 && (
                                                <Text style={styles.moreCrops}>+{translateDigits(storage.crops.length - 3)}</Text>
                                            )}
                                        </View>
                                    </View>

                                    {storage.compatibility && (
                                        <View style={styles.compatibilityContainer}>
                                            <View style={styles.compatibilityBar}>
                                                <View style={[styles.compatibilityFill, { width: `${storage.compatibility}%` }]} />
                                            </View>
                                            <Text style={styles.compatibilityText}>
                                                {translateDigits(storage.compatibility)}% {t.match || "match"}
                                            </Text>
                                        </View>
                                    )}

                                    <Text style={styles.lastUpdated}>
                                        {t.updated || "Updated"}: {translateDigits(storage.lastUpdated || storage.updatedAt)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {loadingMore && (
                        <View style={styles.loadingMoreContainer}>
                            <ActivityIndicator size="small" color="#2E7D32" />
                            <Text style={styles.loadingMoreText}>{t.loadingMore || "Loading more..."}</Text>
                        </View>
                    )}

                    {storages.length === 0 && !loading && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="sad-outline" size={60} color="#fff" />
                            <Text style={[styles.emptyTitle, { color: '#fff' }]}>{t.noStoragesFound || "No Storages Found"}</Text>
                            <Text style={[styles.emptyText, { color: '#fff' }]}>{t.noStoragesMsg || "No facilities near you store your selected crops"}</Text>
                            <TouchableOpacity style={styles.primaryBtn} onPress={handleBack}>
                                <Text style={styles.btnText}>{t.goBack || "Go Back"}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.bottomPadding} />
                </ScrollView>
            )}

            {storages.length > 0 && (
                <TouchableOpacity style={styles.bottomBackButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={20} color="#2E7D32" />
                    <Text style={styles.bottomBackText}>{t.back || "Back"}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // Step 4: Storage Details with Availability
    const renderStorageDetails = () => (
        <View style={styles.container}>
            {selectedStorage ? (
                <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.detailsCard}>
                        <Text style={styles.detailsName}>{selectedStorage.name}</Text>

                        <View style={styles.detailedAvailabilityCard}>
                            <Text style={styles.detailedAvailabilityTitle}>{t.storageAvailability || "Storage Availability"}</Text>

                            {(() => {
                                const status = getStorageStatus(selectedStorage);

                                // Get translated status text
                                const statusText = status.text;

                                // Get translated status description
                                const statusDesc = status.description;

                                return (
                                    <>
                                        <View style={styles.detailedStatusRow}>
                                            <View style={[styles.detailedStatusBadge, { backgroundColor: status.color + '20' }]}>
                                                <Ionicons name={status.icon} size={20} color={status.color} />
                                                <Text style={[styles.detailedStatusText, { color: status.color }]}>
                                                    {statusText}
                                                </Text>
                                            </View>
                                            <Text style={styles.detailedStatusDesc}>{statusDesc}</Text>
                                        </View>

                                        <View style={styles.detailedAvailabilityBar}>
                                            <View
                                                style={[
                                                    styles.detailedAvailabilityFill,
                                                    {
                                                        width: `${selectedStorage.availablePercentage || 0}%`,
                                                        backgroundColor: status.color
                                                    }
                                                ]}
                                            />
                                        </View>

                                        <View style={styles.detailedStatsGrid}>
                                            <View style={styles.detailedStatItem}>
                                                <Text style={styles.detailedStatLabel}>{t.availableSpace || "Available Space"}</Text>
                                                <Text style={styles.detailedStatValue}>
                                                    {translateDigits(extractNumber(selectedStorage.availableCapacity))} {t.mt || "MT"}
                                                </Text>
                                            </View>
                                            <View style={styles.detailedStatItem}>
                                                <Text style={styles.detailedStatLabel}>{t.totalCapacity || "Total Capacity"}</Text>
                                                <Text style={styles.detailedStatValue}>
                                                    {translateDigits(extractNumber(selectedStorage.totalCapacity))} {t.mt || "MT"}
                                                </Text>
                                            </View>
                                            <View style={styles.detailedStatItem}>
                                                <Text style={styles.detailedStatLabel}>{t.currentStock || "Current Stock"}</Text>
                                                <Text style={styles.detailedStatValue}>
                                                    {translateDigits(extractNumber(selectedStorage.currentStock))} {t.mt || "MT"}
                                                </Text>
                                            </View>
                                            <View style={styles.detailedStatItem}>
                                                <Text style={styles.detailedStatLabel}>{t.utilization || "Utilization"}</Text>
                                                <Text style={styles.detailedStatValue}>
                                                    {translateDigits(100 - (selectedStorage.availablePercentage || 0))}% {t.full || "Full"}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.lastUpdatedDetail}>
                                            {t.lastUpdated || "Last Updated"}: {translateDigits(selectedStorage.lastUpdated || selectedStorage.updatedAt)}
                                        </Text>
                                    </>
                                );
                            })()}
                        </View>

                        <View style={styles.detailItem}>
                            <Ionicons name="person-outline" size={20} color="#2E7D32" />
                            <Text style={styles.detailText}>
                                <Text style={styles.detailLabel}>{t.ownerLabel || "Owner:"}</Text> {selectedStorage.ownerName}
                            </Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Ionicons name="call-outline" size={20} color="#2E7D32" />
                            <Text style={styles.detailText}>
                                <Text style={styles.detailLabel}>{t.contactLabel || "Contact:"}</Text> {translateDigits(selectedStorage.phone)}
                            </Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Ionicons name="navigate-outline" size={20} color="#2E7D32" />
                            <Text style={styles.detailText}>
                                <Text style={styles.detailLabel}>{t.distanceLabel || "Distance:"}</Text> {translateDigits(selectedStorage.distance)} {t.km || "km"}
                            </Text>
                        </View>

                        {selectedStorage.address && (
                            <View style={styles.detailItem}>
                                <Ionicons name="location-outline" size={20} color="#2E7D32" />
                                <Text style={styles.detailText}>
                                    <Text style={styles.detailLabel}>{t.addressLabel || "Address:"}</Text> {selectedStorage.address}
                                </Text>
                            </View>
                        )}

                        {selectedStorage.price && (
                            <View style={styles.detailItem}>
                                <Ionicons name="cash-outline" size={20} color="#2E7D32" />
                                <Text style={styles.detailText}>
                                    <Text style={styles.detailLabel}>{t.priceLabel || "Price:"}</Text>
                                    ₹{translateDigits(extractNumber(selectedStorage.price))}
                                    {t.perQuintal || "/quintal"} {t.perMonth || "/month"}
                                </Text>
                            </View>
                        )}

                        <View style={styles.detailItem}>
                            <Ionicons name="leaf-outline" size={20} color="#2E7D32" />
                            <Text style={styles.detailText}>
                                <Text style={styles.detailLabel}>{t.storesLabel || "Stores:"}</Text> {selectedStorage.crops?.join(', ')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.callButton}
                            onPress={() => handleCall(selectedStorage.phone)}
                        >
                            <Ionicons name="call" size={20} color="#fff" />
                            <Text style={styles.callButtonText}>{t.contactOwner || "CONTACT OWNER"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.callButton, { backgroundColor: '#2196F3' }]}
                            onPress={() => handleNavigate()}
                        >
                            <Ionicons name="navigate" size={20} color="#fff" />
                            <Text style={styles.callButtonText}>{t.getDirections || "GET DIRECTIONS"}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                    <Text style={styles.loadingText}>{t.loadingDetails || "Loading storage details..."}</Text>
                </View>
            )}

            <TouchableOpacity style={styles.bottomBackButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={20} color="#2E7D32" />
                <Text style={styles.bottomBackText}>{t.backToList || "Back to List"}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ImageBackground
            source={getBackgroundImage()}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={[
                styles.overlay,
                step >= 3 && styles.lightOverlay
            ]}>
                <View style={styles.container}>
                    {/* Step indicator */}
                    {step <= 2 && renderStepIndicator()}



                    {/* Render current step */}
                    {step === 1 && renderCropSelection()}
                    {step === 2 && renderQuantityInput()}
                    {step === 3 && renderStorageList()}
                    {step === 4 && renderStorageDetails()}

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

                        {isSpeaking && !isMuted && (
                            <View style={styles.waveContainer}>
                                <View style={[styles.wave, styles.wave1]} />
                                <View style={[styles.wave, styles.wave2]} />
                                <View style={[styles.wave, styles.wave3]} />
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </ImageBackground>
    );
};

// Add new styles for availability
const additionalStyles = {
    availabilityContainer: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 10,
        marginVertical: 8,
    },
    availabilityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    availabilityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
        marginLeft: 4,
    },
    availabilityBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    availabilityFill: {
        height: '100%',
        borderRadius: 4,
    },
    availabilityDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    availabilityText: {
        fontSize: 13,
        color: '#333',
        marginBottom: 2,
    },
    availabilityLabel: {
        color: '#666',
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    lastUpdated: {
        fontSize: 11,
        color: '#999',
        marginTop: 6,
        textAlign: 'right',
    },

    // Detailed availability styles
    detailedAvailabilityCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    detailedAvailabilityTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 15,
    },
    detailedStatusRow: {
        alignItems: 'center',
        marginBottom: 15,
    },
    detailedStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 4,
    },
    detailedStatusText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    detailedStatusDesc: {
        fontSize: 14,
        color: '#666',
    },
    detailedAvailabilityBar: {
        height: 12,
        backgroundColor: '#E0E0E0',
        borderRadius: 6,
        marginBottom: 15,
        overflow: 'hidden',
    },
    detailedAvailabilityFill: {
        height: '100%',
        borderRadius: 6,
    },
    detailedStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailedStatItem: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    detailedStatLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    detailedStatValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    lastUpdatedDetail: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 10,
        fontStyle: 'italic',
    },
};

// Merge styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    lightOverlay: {
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 100,
    },

    // Step Indicator
    stepIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        borderColor: '#fff',
    },
    activeStepDot: {
        backgroundColor: '#2E7D32',
        borderColor: '#2E7D32',
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 5,
    },
    activeStepLine: {
        backgroundColor: '#2E7D32',
    },



    // Text styles
    questionText: {
        marginTop: 15,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitleText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        opacity: 0.9,
    },

    // Buttons
    primaryBtn: {
        backgroundColor: '#2E7D32',
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 30,
        marginVertical: 8,
        width: '80%',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

    },
    secondaryBtn: {
        backgroundColor: 'rgba(255, 152, 0,0.9)',

        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#fff',
        flex: 1,
        marginRight: 8,
        left: -10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    disabledBtn: {
        backgroundColor: '#ccc',
        opacity: 0.5,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '80%',
        marginTop: 10,
    },
    flexBtn: {
        flex: 2.5, // Increased from 1.2 to make it larger than back button
        backgroundColor: '#2E7D32',
        paddingVertical: 15, // Increased from 16
        paddingHorizontal: 30, // Increased horizontal padding
        Height: 55,
        width: 95, // Increased from 55
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 35, // More rounded
        elevation: 5, // Slightly more shadow
        shadowColor: '#000',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#fff',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },

    // Crop Selection
    cropsScrollContainer: {
        maxHeight: 400,
        width: '100%',
        marginBottom: 20,
    },
    cropsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: 10,
    },
    cropButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 20,
        margin: 6,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCrop: {
        backgroundColor: '#2E7D32',
        borderColor: '#fff',
    },
    cropIcon: {
        fontSize: 18,
        marginRight: 6,
        color: '#fff',
    },
    cropText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    selectedCropText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    checkmark: {
        marginLeft: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingCropsContainer: {
        padding: 40,
        alignItems: 'center',
        width: '100%',
    },
    loadingCropsText: {
        marginTop: 10,
        fontSize: 14,
        color: '#fff',
    },

    // Selected chips
    selectedChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
        backgroundColor: 'rgb(46, 125, 50)',
        padding: 10,
        borderRadius: 12,
    },
    selectedChip: {

        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        margin: 4,
    },
    selectedChipText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },

    // Quantity Input
    inputCard: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 15,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    unitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderLeftWidth: 1,
        borderLeftColor: '#ddd',
        backgroundColor: '#f5f5f5',
    },
    unitButtonText: {
        fontSize: 16,
        marginRight: 4,
        color: '#333',
    },
    hintText: {
        fontSize: 12,
        color: '#666',
        marginTop: 10,
        fontStyle: 'italic',
    },

    // Unit Picker Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerModal: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '80%',
        maxWidth: 300,
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    unitOption: {
        paddingVertical: 15,
        borderRadius: 10,
        marginBottom: 8,
        backgroundColor: '#f5f5f5',
    },
    selectedUnitOption: {
        backgroundColor: '#2E7D32',
    },
    unitOptionText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },
    selectedUnitOptionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    pickerCancelButton: {
        marginTop: 10,
        paddingVertical: 15,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
    },
    pickerCancelText: {
        textAlign: 'center',
        color: '#666',
    },

    // Storage List
    listHeader: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 15,
        marginHorizontal: 16,
        marginTop: 40,
        marginBottom: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2E7D32',
        textAlign: 'center',
    },
    listSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    storageCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    storageCardContent: {
        flex: 1,
    },
    storageCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    storageName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    bestMatchBadge: {
        backgroundColor: '#FFA000',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    bestMatchText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    storageDistance: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    distanceText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    storageCrops: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    cropsLabel: {
        fontSize: 14,
        color: '#666',
    },
    cropsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        flex: 1,
    },
    cropTag: {
        backgroundColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 4,
        marginBottom: 2,
    },
    cropTagText: {
        fontSize: 12,
        color: '#333',
    },
    moreCrops: {
        fontSize: 12,
        color: '#999',
        marginLeft: 2,
    },
    compatibilityContainer: {
        marginTop: 8,
    },
    compatibilityBar: {
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        marginBottom: 2,
    },
    compatibilityFill: {
        height: '100%',
        backgroundColor: '#2E7D32',
        borderRadius: 2,
    },
    compatibilityText: {
        fontSize: 11,
        color: '#2E7D32',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#2E7D32',
    },
    loadingMoreContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 15,
    },
    loadingMoreText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 10,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    retryBtn: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        marginBottom: 10,
    },
    retryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backBtn: {
        paddingHorizontal: 30,
        paddingVertical: 12,
    },
    backBtnText: {
        color: '#666',
        fontSize: 16,
    },
    bottomBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#2E7D32',
    },
    bottomBackText: {
        color: '#2E7D32',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },

    // Storage Details
    detailsContainer: {
        flex: 1,
        paddingHorizontal: 16,
        marginTop: 40,
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    detailsName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 20,
        textAlign: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    detailText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    detailLabel: {
        fontWeight: '600',
        color: '#666',
    },
    actionButtonsContainer: {
        marginBottom: 30,
    },
    callButton: {
        backgroundColor: '#2E7D32',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    callButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },

    // Speaker button
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
        height: 30,
    },
    wave: {
        width: 4,
        marginHorizontal: 2,
        borderRadius: 2,
        backgroundColor: '#2E7D32',
    },
    wave1: {
        height: 12,
        opacity: 0.7,
    },
    wave2: {
        height: 20,
        opacity: 1,
    },
    wave3: {
        height: 12,
        opacity: 0.7,
    },
    bottomPadding: {
        height: 80,
    },

    // Merge additional styles
    ...additionalStyles
});

export default StorageScreen;