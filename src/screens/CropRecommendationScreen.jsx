import React, { useState, useContext } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

const CropRecommendationScreen = ({ navigation }) => {
    const { t, setChatType, setChatVisible, setPinnedMessage, weatherData, userLocation, setChatBackground } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);

    // API Base URL - Replace with your actual backend URL
    const API_BASE_URL = 'https://your-backend-api.com/api';

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const season = getCurrentSeason();
            
            const requestData = {
                latitude: userLocation?.latitude || null,
                longitude: userLocation?.longitude || null,
                season: season,
                weather: weatherData || null,
            };

            // Make API call to backend
            const response = await fetch(`${API_BASE_URL}/crop-recommendations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch');
            }

            const data = await response.json();
            
            if (data && Array.isArray(data.recommendations)) {
                setRecommendations(data.recommendations);
            } else {
                throw new Error('Invalid data');
            }
            
        } catch (error) {
            console.error('Error:', error);
            setError('Unable to load recommendations');
            Alert.alert(
                'Oops!',
                'Something went wrong. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const getCurrentSeason = () => {
        if (weatherData?.season) {
            return weatherData.season;
        }
        
        const month = new Date().getMonth();
        if (month >= 2 && month <= 5) return 'Summer';
        if (month >= 6 && month <= 9) return 'Monsoon';
        return 'Winter';
    };

    const handleSownAlready = (val) => {
        setSelectedOption(val);
        
        if (val === 'yes') {
            // Set background for existing crops
            setChatBackground(require('../assets/truck.jpg'));
            setChatType('CropAdv');
            // Don't open chat here - it will open in CropAdv screen
            navigation.navigate('CropAdv');
        } else {
            // Set background for new recommendations
            setChatBackground(require('../assets/truck.jpg'));
            fetchRecommendations();
        }
    };

    const handleCropSelect = (crop) => {
        const summary = `**Crop Recommendation**\n` +
            `- **Crop**: ${crop.name}\n` +
            `- **Season**: ${getCurrentSeason()}\n` +
            `- **Confidence**: ${crop.confidence || 'N/A'}\n` +
            `- **Duration**: ${crop.duration || 'N/A'}\n` +
            `- **Water Need**: ${crop.waterRequirement || crop.water || 'N/A'}\n` +
            `- **Expected Profit**: ${crop.profit || 'N/A'}`;
        
        setPinnedMessage(summary);
        setChatType('Recommendation');
        
        // Set chat background
        setChatBackground(require('../assets/truck.jpg'));
        
        // Open chat when crop is selected
        setChatVisible(true);
    };

    const renderCropCard = (crop) => {
        const imageSource = crop.imageUrl 
            ? { uri: crop.imageUrl } 
            : require('../assets/crop.jpg');

        return (
            <TouchableOpacity
                key={crop.id || crop._id}
                style={styles.cropCard}
                onPress={() => handleCropSelect(crop)}
                activeOpacity={0.7}
            >
                <ImageBackground
                    source={imageSource}
                    style={styles.cropImage}
                    imageStyle={{ borderRadius: 10 }}
                >
                    <View style={styles.cropOverlay}>
                        <Text style={styles.cropName}>{crop.name}</Text>
                        <View style={styles.cropDetails}>
                            {crop.confidence && (
                                <Text style={styles.cropInfo}>✓ {crop.confidence}</Text>
                            )}
                            {crop.duration && (
                                <Text style={styles.cropInfo}>⏱ {crop.duration}</Text>
                            )}
                            {crop.waterRequirement && (
                                <Text style={styles.cropInfo}>💧 {crop.waterRequirement}</Text>
                            )}
                            {crop.profit && (
                                <Text style={styles.cropInfo}>💰 {crop.profit}</Text>
                            )}
                        </View>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
        );
    };

    const handleRetry = () => {
        fetchRecommendations();
    };

    const handleGoBack = () => {
        setStep(1);
        setRecommendations([]);
        setError(null);
        setSelectedOption(null);
    };

    const getBackgroundImage = () => {
        if (step === 1) {
            return require('../assets/homebg.jpg');
        } else {
            return require('../assets/crop.jpg');
        }
    };

    return (
        <ImageBackground
            source={getBackgroundImage()}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={[
                styles.overlay,
                step > 1 && { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
            ]}>
                <View style={styles.container}>
                    {step === 1 ? (
                        <View style={styles.centerContainer}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="help-circle-outline" size={80} color="#fff" />
                            </View>
                            <Text style={styles.questionText}>{t.sownAlready}</Text>
                            <TouchableOpacity 
                                style={styles.primaryBtn} 
                                onPress={() => handleSownAlready('yes')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.btnText}>{t.yes}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.primaryBtn, styles.secondaryBtn]} 
                                onPress={() => handleSownAlready('no')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.btnText}>{t.no}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.container}>
                            <ScrollView 
                                style={styles.scrollContainer}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.headerContainer}>
                                    <Text style={styles.sectionTitle}>
                                        Recommended Crops for {getCurrentSeason()} Season
                                    </Text>
                                    <Text style={styles.subtitle}>
                                        {selectedOption === 'yes' 
                                            ? 'Managing your existing crops'
                                            : 'Based on your location and weather'
                                        }
                                    </Text>
                                </View>
                                
                                {loading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#2E7D32" />
                                        <Text style={styles.loadingText}>
                                            {selectedOption === 'yes'
                                                ? 'Analyzing your crops...'
                                                : 'Finding best crops for you...'
                                            }
                                        </Text>
                                    </View>
                                ) : error ? (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="cloud-offline-outline" size={60} color="#666" />
                                        <Text style={styles.errorText}>Unable to load recommendations</Text>
                                        <Text style={styles.errorSubText}>Please check your connection</Text>
                                        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                                            <Text style={styles.retryBtnText}>Try Again</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
                                            <Text style={styles.backBtnText}>Go Back</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : recommendations.length > 0 ? (
                                    <View style={styles.recommendationsContainer}>
                                        {recommendations.map((crop) => renderCropCard(crop))}
                                    </View>
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="leaf-outline" size={60} color="#666" />
                                        <Text style={styles.emptyText}>No crops found</Text>
                                        <Text style={styles.emptySubText}>
                                            {selectedOption === 'yes'
                                                ? 'No existing crops detected'
                                                : 'Try again with different location'
                                            }
                                        </Text>
                                        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                                            <Text style={styles.retryBtnText}>Refresh</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
                                            <Text style={styles.backBtnText}>Go Back</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <View style={styles.bottomPadding} />
                            </ScrollView>
                        </View>
                    )}
                    {step > 1 && !loading && !error && recommendations.length > 0 && (
                        <TouchableOpacity 
                            style={styles.backButton} 
                            onPress={handleGoBack}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back-circle" size={50} color="#2E7D32" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    headerContainer: {
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 15,
        borderRadius: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    iconContainer: {
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 50,
        padding: 10,
    },
    questionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 30,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
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
        backgroundColor: '#FF8F00',
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2E7D32',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#2E7D32',
        textAlign: 'center',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
    },
    errorText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        marginTop: 15,
        fontWeight: '600',
    },
    errorSubText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        marginTop: 5,
    },
    retryBtn: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginBottom: 10,
        width: 200,
    },
    retryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    backBtn: {
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
        width: 200,
    },
    backBtnText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
    },
    emptyText: {
        fontSize: 18,
        color: '#333',
        marginTop: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 25,
        marginTop: 5,
        textAlign: 'center',
    },
    recommendationsContainer: {
        paddingBottom: 20,
    },
    cropCard: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cropImage: {
        width: '100%',
        height: 200,
    },
    cropOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 16,
        justifyContent: 'flex-end',
    },
    cropName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    cropDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    cropInfo: {
        fontSize: 12,
        color: '#fff',
        backgroundColor: 'rgba(46, 125, 50, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 8,
        overflow: 'hidden',
        fontWeight: '500',
    },
    backButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        padding: 2,
    },
    bottomPadding: {
        height: 60,
    },
});

export default CropRecommendationScreen;