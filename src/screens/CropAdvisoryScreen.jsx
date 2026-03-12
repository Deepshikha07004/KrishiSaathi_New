import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ImageBackground,
    ActivityIndicator,
    Dimensions,
    StyleSheet
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { AppContext } from '../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const CropAdvisoryScreen = () => {
    const { t, lang, setChatType, setChatVisible, setPinnedMessage, setChatBackground, isChatVisible } = useContext(AppContext);
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({ name: '', date: '', fertilizer: '', pest: '' });
    const [chatOpened, setChatOpened] = useState(false);
    const [showManualButton, setShowManualButton] = useState(false);
    
    // Speaker state
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Track screen focus using useFocusEffect
    useFocusEffect(
        React.useCallback(() => {
            // Screen came into focus
            console.log('Screen focused');
            
            return () => {
                // Screen lost focus - immediately stop all speech
                console.log('Screen unfocused - stopping speech');
                Speech.stop();
                setIsSpeaking(false);
            };
        }, [])
    );

    const speak = (msg) => {
        // Don't speak if muted
        if (isMuted) return;
        
        Speech.stop();
        setIsSpeaking(true);
        
        Speech.speak(msg, { 
            rate: 1.0, 
            pitch: 1.0, 
            language: lang,
            onDone: () => {
                setIsSpeaking(false);
            },
            onError: () => {
                setIsSpeaking(false);
            }
        });
    };

    const toggleMute = () => {
        if (!isMuted) {
            // If unmuting and about to mute, stop any ongoing speech
            Speech.stop();
            setIsSpeaking(false);
        }
        setIsMuted(!isMuted);
    };

    // Stop speech when component unmounts
    useEffect(() => {
        return () => {
            Speech.stop();
            setIsSpeaking(false);
        };
    }, []);

    // Stop speech when step changes
    useEffect(() => {
        // Stop any ongoing speech before new step
        Speech.stop();
        setIsSpeaking(false);
        
        if (isMuted) return;
        
        // Auto-speak when step changes
        if (step === 0) speak(t.advIntro);
        else if (step === 1) speak(t.advQ1);
        else if (step === 2) speak(t.advQ2);
        else if (step === 3) speak(t.advQ3);
        else if (step === 4) speak(t.advQ4);
        else if (step === 5) {
            speak(t.advSummary);
            // Automatically open chatbot when reaching step 5
            if (!chatOpened) {
                setTimeout(() => {
                    openChatbotWithDetails();
                    setChatOpened(true);
                }, 500);
            }
        }
    }, [step, isMuted]);

    // Stop speech when chat becomes visible
    useEffect(() => {
        if (isChatVisible) {
            Speech.stop();
            setIsSpeaking(false);
        }
    }, [isChatVisible]);

    // Monitor chat visibility to show/hide manual button
    useEffect(() => {
        if (step === 5) {
            if (!isChatVisible && chatOpened) {
                setShowManualButton(true);
            } else {
                setShowManualButton(false);
            }
        }
    }, [isChatVisible, step, chatOpened]);

    const openChatbotWithDetails = () => {
        const summary = `Crop Details for Advice :-\n\n` +
            ` 🌾 Crop: ${form.name || 'Not specified'}\n` +
            `📅 Sowing: ${form.date || 'Not specified'}\n` +
            `🧪 Fertilizer: ${form.fertilizer || 'Not specified'}\n` +
            `🐛 Issues: ${form.pest || 'Not specified'}`;
        
        setPinnedMessage(summary);
        setChatType('Advisory');
        setChatBackground(require('../assets/truck.jpg'));
        setChatVisible(true);
        setChatOpened(true);
        setShowManualButton(false);
    };

    const handleContinue = (nextStep) => {
        setStep(nextStep);
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(prev => prev - 1);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="frequently-asked-questions" size={80} color="#2E7D32" />
                        </View>
                        <Text style={styles.stepText}>{t.advIntro}</Text>
                        <TouchableOpacity 
                            style={styles.continueButton}
                            onPress={() => handleContinue(1)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueButtonText}>{t.continue}</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.formContainer}>
                            <Text style={styles.questionText}>{t.advQ1}</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="e.g. Rice" 
                                placeholderTextColor="#999"
                                value={form.name} 
                                onChangeText={v => setForm({ ...form, name: v })} 
                                autoFocus={true}
                            />
                            <TouchableOpacity 
                                style={styles.continueButton}
                                onPress={() => handleContinue(2)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.continueButtonText}>{t.continue}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.formContainer}>
                            <Text style={styles.questionText}>{t.advQ2}</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="e.g. 2 weeks ago or any specific date" 
                                placeholderTextColor="#999"
                                value={form.date} 
                                onChangeText={v => setForm({ ...form, date: v })} 
                                autoFocus={true}
                            />
                            <TouchableOpacity 
                                style={styles.continueButton}
                                onPress={() => handleContinue(3)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.continueButtonText}>{t.continue}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.formContainer}>
                            <Text style={styles.questionText}>{t.advQ3}</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="e.g. Urea" 
                                placeholderTextColor="#999"
                                value={form.fertilizer} 
                                onChangeText={v => setForm({ ...form, fertilizer: v })} 
                                autoFocus={true}
                            />
                            <TouchableOpacity 
                                style={styles.continueButton}
                                onPress={() => handleContinue(4)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.continueButtonText}>{t.continue}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 4:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.formContainer}>
                            <Text style={styles.questionText}>{t.advQ4}</Text>
                            <TextInput 
                                style={[styles.input, styles.multilineInput]}
                                multiline 
                                placeholder="Describe issues..." 
                                placeholderTextColor="#999"
                                value={form.pest} 
                                onChangeText={v => setForm({ ...form, pest: v })} 
                                autoFocus={true}
                            />
                            <TouchableOpacity 
                                style={styles.continueButton}
                                onPress={() => handleContinue(5)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.continueButtonText}>{t.continue}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            
            case 5:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.formContainer}>
                            <View style={styles.detailsContainer}>
                                <Text style={styles.detailsTitle}>✅ Crop Details</Text>
                                
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>🌾 Crop:</Text>
                                    <Text style={styles.detailValue}>{form.name || 'Not specified'}</Text>
                                </View>
                                
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>📅 Sowing:</Text>
                                    <Text style={styles.detailValue}>{form.date || 'Not specified'}</Text>
                                </View>
                                
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>🧪 Fertilizer:</Text>
                                    <Text style={styles.detailValue}>{form.fertilizer || 'Not specified'}</Text>
                                </View>
                                
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>🐛 Issues:</Text>
                                    <Text style={styles.detailValue}>{form.pest || 'Not specified'}</Text>
                                </View>
                            </View>
                            
                            <Text style={styles.loadingText}>Opening chatbot with your crop details...</Text>
                            <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
                            
                            {showManualButton && (
                                <TouchableOpacity 
                                    style={styles.openChatButton}
                                    onPress={openChatbotWithDetails}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="chatbubbles" size={24} color="#fff" />
                                    <Text style={styles.openChatButtonText}>Open Chatbot</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <ImageBackground
            source={require('../assets/truck.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={[
                styles.overlay,
                { backgroundColor: step > 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.6)' }
            ]}>
                {renderStep()}
                
                {/* Speaker Button - Fixed at Bottom Left */}
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
                    
                    {/* Wave animation on the right side when speaking */}
                    {isSpeaking && !isMuted && (
                        <View style={styles.waveContainer}>
                            <View style={styles.wave1} />
                            <View style={styles.wave2} />
                            <View style={styles.wave3} />
                        </View>
                    )}
                </View>
                
                {/* Back button */}
                {step > 0 && step < 5 && (
                    <TouchableOpacity 
                        style={{
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
                            zIndex: 999,
                        }} 
                        onPress={handleBack}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back-circle" size={50} color="#2E7D32" />
                    </TouchableOpacity>
                )}
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    stepContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        paddingBottom: 100,
    },
    iconContainer: {
        marginBottom: 20,
        borderRadius: 50,
        padding: 10,
        alignSelf: 'center',
    },
    stepText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 15,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    questionText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    continueButton: {
        backgroundColor: '#2E7D32',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    detailsContainer: {
        backgroundColor: '#f0f8f0',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2E7D32',
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 15,
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        width: 80,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 15,
    },
    loader: {
        marginVertical: 10,
    },
    openChatButton: {
        backgroundColor: '#FF8F00',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginTop: 10,
    },
    openChatButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginLeft: 10,
    },
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

export default CropAdvisoryScreen;