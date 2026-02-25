import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ImageBackground,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { AppContext } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

const CropAdvisoryScreen = () => {
    const { t, lang, setChatType, setChatVisible, setPinnedMessage, setChatBackground, isChatVisible } = useContext(AppContext);
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({ name: '', date: '', fertilizer: '', pest: '', soil: '' });
    const [chatOpened, setChatOpened] = useState(false);
    const [showManualButton, setShowManualButton] = useState(false);

    const speak = (msg) => {
        Speech.stop();
        Speech.speak(msg, { rate: 1.05, pitch: 1.3, language: lang });
    };

    useEffect(() => {
        if (step === 0) speak(t.advIntro);
        else if (step === 1) speak(t.advQ1);
        else if (step === 2) speak(t.advQ2);
        else if (step === 3) speak(t.advQ3);
        else if (step === 4) speak(t.advQ4);
        else if (step === 5) speak(t.advQ5);
        else if (step === 6) {
            speak(t.advSummary);
            // Automatically open chatbot when reaching step 6
            if (!chatOpened) {
                setTimeout(() => {
                    openChatbotWithDetails();
                    setChatOpened(true);
                }, 500);
            }
        }
    }, [step]);

    // Monitor chat visibility to show/hide manual button
    useEffect(() => {
        if (step === 6) {
            if (!isChatVisible && chatOpened) {
                // User closed the chatbot, show manual button
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
            `🐛 Issues: ${form.pest || 'Not specified'}\n` +
            `🌱 Soil: ${form.soil || 'Not specified'}`;
        
        setPinnedMessage(summary);
        setChatType('Advisory');
        
        // Set chatbot background
        setChatBackground(require('../assets/truck.jpg'));
        
        // Open the chatbot
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
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20,
                    }}>
                        <View style={{
                            marginBottom: 20,
                            backgroundColor: 'rgba(255, 255, 255, 0.4)',
                            borderRadius: 50,
                            padding: 10,
                        }}>
                            <MaterialCommunityIcons name="frequently-asked-questions" size={80} color="#2E7D32" />
                        </View>
                        <Text style={{
                            fontSize: 20,
                            fontWeight: '600',
                            color: '#fff',
                            textAlign: 'center',
                            marginBottom: 20,
                            textShadowColor: 'rgba(0, 0, 0, 0.3)',
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 3,
                        }}>{t.advIntro}</Text>
                        <TouchableOpacity 
                            style={{
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
                            }} 
                            onPress={() => handleContinue(1)}
                            activeOpacity={0.8}
                        >
                            <Text style={{
                                color: '#fff',
                                fontSize: 18,
                                fontWeight: '600',
                                textAlign: 'center',
                            }}>{t.continue}</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 1:
                return (
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        padding: 20,
                    }}>
                        <View style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 15,
                            padding: 20,
                            elevation: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: '600',
                                color: '#333',
                                textAlign: 'center',
                                marginBottom: 20,
                            }}>{t.advQ1}</Text>
                            <TextInput 
                                style={{
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
                                }} 
                                placeholder="e.g. Rice" 
                                placeholderTextColor="#999"
                                value={form.name} 
                                onChangeText={v => setForm({ ...form, name: v })} 
                                autoFocus={true}
                            />
                            <TouchableOpacity 
                                style={{
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
                                }} 
                                onPress={() => handleContinue(2)}
                                activeOpacity={0.8}
                            >
                                <Text style={{
                                    color: '#fff',
                                    fontSize: 18,
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}>{t.continue}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 2:
                return (
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        padding: 20,
                    }}>
                        <View style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 15,
                            padding: 20,
                            elevation: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: '600',
                                color: '#333',
                                textAlign: 'center',
                                marginBottom: 20,
                            }}>{t.advQ2}</Text>
                            <TextInput 
                                style={{
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
                                }} 
                                placeholder="e.g. 1st Aug" 
                                placeholderTextColor="#999"
                                value={form.date} 
                                onChangeText={v => setForm({ ...form, date: v })} 
                                autoFocus={true}
                            />
                            <TouchableOpacity 
                                style={{
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
                                }} 
                                onPress={() => handleContinue(3)}
                                activeOpacity={0.8}
                            >
                                <Text style={{
                                    color: '#fff',
                                    fontSize: 18,
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}>{t.continue}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 3:
                return (
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        padding: 20,
                    }}>
                        <View style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 15,
                            padding: 20,
                            elevation: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: '600',
                                color: '#333',
                                textAlign: 'center',
                                marginBottom: 20,
                            }}>{t.advQ3}</Text>
                            <TextInput 
                                style={{
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
                                }} 
                                placeholder="e.g. Urea" 
                                placeholderTextColor="#999"
                                value={form.fertilizer} 
                                onChangeText={v => setForm({ ...form, fertilizer: v })} 
                                autoFocus={true}
                            />
                            <TouchableOpacity 
                                style={{
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
                                }} 
                                onPress={() => handleContinue(4)}
                                activeOpacity={0.8}
                            >
                                <Text style={{
                                    color: '#fff',
                                    fontSize: 18,
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}>{t.continue}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 4:
                return (
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        padding: 20,
                    }}>
                        <View style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 15,
                            padding: 20,
                            elevation: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: '600',
                                color: '#333',
                                textAlign: 'center',
                                marginBottom: 20,
                            }}>{t.advQ4}</Text>
                            <TextInput 
                                style={{
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
                                    height: 100,
                                    textAlignVertical: 'top',
                                }} 
                                multiline 
                                placeholder="Describe issues..." 
                                placeholderTextColor="#999"
                                value={form.pest} 
                                onChangeText={v => setForm({ ...form, pest: v })} 
                                autoFocus={true}
                            />
                            <TouchableOpacity 
                                style={{
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
                                }} 
                                onPress={() => handleContinue(5)}
                                activeOpacity={0.8}
                            >
                                <Text style={{
                                    color: '#fff',
                                    fontSize: 18,
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}>{t.continue}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 5:
                return (
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        padding: 20,
                    }}>
                        <View style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 15,
                            padding: 20,
                            elevation: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: '600',
                                color: '#333',
                                textAlign: 'center',
                                marginBottom: 20,
                            }}>{t.advQ5}</Text>
                            <TextInput 
                                style={{
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
                                }} 
                                placeholder="e.g. Clay" 
                                placeholderTextColor="#999"
                                value={form.soil} 
                                onChangeText={v => setForm({ ...form, soil: v })} 
                                autoFocus={true}
                            />
                            <TouchableOpacity 
                                style={{
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
                                }} 
                                onPress={() => handleContinue(6)}
                                activeOpacity={0.8}
                            >
                                <Text style={{
                                    color: '#fff',
                                    fontSize: 18,
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}>{t.continue}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 6:
                return (
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        padding: 20,
                    }}>
                        <View style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 15,
                            padding: 20,
                            elevation: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                        }}>
                            <View style={{
                                backgroundColor: '#f0f8f0',
                                borderRadius: 10,
                                padding: 15,
                                marginBottom: 20,
                                borderWidth: 1,
                                borderColor: '#2E7D32',
                            }}>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    color: '#2E7D32',
                                    marginBottom: 15,
                                    textAlign: 'center',
                                }}>✅ Crop Details</Text>
                                
                                <View style={{
                                    flexDirection: 'row',
                                    marginBottom: 8,
                                    paddingVertical: 5,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#e0e0e0',
                                }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: '#555',
                                        width: 80,
                                    }}>🌾 Crop:</Text>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#333',
                                        flex: 1,
                                    }}>{form.name || 'Not specified'}</Text>
                                </View>
                                
                                <View style={{
                                    flexDirection: 'row',
                                    marginBottom: 8,
                                    paddingVertical: 5,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#e0e0e0',
                                }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: '#555',
                                        width: 80,
                                    }}>📅 Sowing:</Text>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#333',
                                        flex: 1,
                                    }}>{form.date || 'Not specified'}</Text>
                                </View>
                                
                                <View style={{
                                    flexDirection: 'row',
                                    marginBottom: 8,
                                    paddingVertical: 5,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#e0e0e0',
                                }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: '#555',
                                        width: 80,
                                    }}>🧪 Fertilizer:</Text>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#333',
                                        flex: 1,
                                    }}>{form.fertilizer || 'Not specified'}</Text>
                                </View>
                                
                                <View style={{
                                    flexDirection: 'row',
                                    marginBottom: 8,
                                    paddingVertical: 5,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#e0e0e0',
                                }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: '#555',
                                        width: 80,
                                    }}>🐛 Issues:</Text>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#333',
                                        flex: 1,
                                    }}>{form.pest || 'Not specified'}</Text>
                                </View>
                                
                                <View style={{
                                    flexDirection: 'row',
                                    marginBottom: 8,
                                    paddingVertical: 5,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#e0e0e0',
                                }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: '#555',
                                        width: 80,
                                    }}>🌱 Soil:</Text>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#333',
                                        flex: 1,
                                    }}>{form.soil || 'Not specified'}</Text>
                                </View>
                            </View>
                            
                            {!chatOpened ? (
                                <>
                                    <Text style={{
                                        fontSize: 16,
                                        color: '#666',
                                        textAlign: 'center',
                                        marginVertical: 15,
                                    }}>
                                        Opening chatbot with your crop details...
                                    </Text>
                                    <ActivityIndicator size="large" color="#2E7D32" style={{
                                        marginVertical: 10,
                                    }} />
                                </>
                            ) : showManualButton ? (
                                <TouchableOpacity 
                                    style={{
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
                                    }} 
                                    onPress={openChatbotWithDetails}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="chatbubbles" size={24} color="#fff" />
                                    <Text style={{
                                        color: '#fff',
                                        fontSize: 18,
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        marginLeft: 10,
                                    }}>Open Chatbot</Text>
                                </TouchableOpacity>
                            ) : null}
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
            style={{
                flex: 1,
                width: '100%',
                height: '100%',
            }}
            resizeMode="cover"
        >
            <View style={{
                flex: 1,
                backgroundColor: step > 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.6)',
            }}>
                <View style={{
                    flex: 1,
                }}>
                    {renderStep()}
                    {step > 0 && step < 6 && (
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
                            }} 
                            onPress={handleBack}
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

export default CropAdvisoryScreen;