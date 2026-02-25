import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Modal,
    ImageBackground,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    FlatList,
    height
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { AppContext } from '../context/AppContext';
import ChatMessage from './ChatMessage';

const FloatingChatbot = () => {
    const { 
        lang, 
        t, 
        isChatVisible, 
        setChatVisible, 
        chatType, 
        pinnedMessage, 
        setPinnedMessage,
        chatBackground,
        userLocation,
        weatherData,
        user
    } = useContext(AppContext);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showHistoryMenu, setShowHistoryMenu] = useState(false);
    const [chatSessions, setChatSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    // API Base URL - Replace with your actual backend URL
    const API_BASE_URL = 'https://your-backend-api.com/api';

    // Generate or get session ID
    useEffect(() => {
        const userId = user?.id || `guest_${Date.now()}`;
        setSessionId(userId);
    }, [user]);

    // Load chat history when chat opens
    useEffect(() => {
        const loadChatHistory = async () => {
            if (isChatVisible && sessionId) {
                setIsLoadingHistory(true);
                try {
                    const response = await fetch(`${API_BASE_URL}/chat/history`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            sessionId: sessionId,
                            chatType: chatType,
                            limit: 50
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.messages && data.messages.length > 0) {
                            const formattedMessages = data.messages.map(msg => ({
                                id: msg.id || Date.now() + Math.random(),
                                text: msg.text,
                                isUser: msg.isUser,
                                timestamp: msg.timestamp
                            }));
                            setMessages(formattedMessages);
                        } else {
                            const welcome = {
                                id: Date.now(),
                                text: "👋 Hi! I'm your AI Farming Assistant. How can I help you today?",
                                isUser: false
                            };
                            setMessages([welcome]);
                        }
                    } else {
                        const welcome = {
                            id: Date.now(),
                            text: "👋 Hi! I'm your AI Farming Assistant. How can I help you today?",
                            isUser: false
                        };
                        setMessages([welcome]);
                    }
                } catch (error) {
                    console.error('Error loading chat history:', error);
                    const welcome = {
                        id: Date.now(),
                        text: "👋 Hi! I'm your AI Farming Assistant. How can I help you today?",
                        isUser: false
                    };
                    setMessages([welcome]);
                } finally {
                    setIsLoadingHistory(false);
                }
            }
        };

        loadChatHistory();
    }, [isChatVisible, sessionId, chatType]);

    // Load all chat sessions for history menu
    const loadChatSessions = async () => {
        setLoadingSessions(true);
        try {
            const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id || sessionId,
                    chatType: chatType
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setChatSessions(data.sessions || []);
            }
        } catch (error) {
            console.error('Error loading chat sessions:', error);
            Alert.alert(
                'Unable to Load History',
                'Please check your connection and try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoadingSessions(false);
        }
    };

    // Load specific chat session
    const loadChatSession = async (sessionId) => {
        setShowHistoryMenu(false);
        setIsLoadingHistory(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/chat/history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    chatType: chatType,
                    limit: 50
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    const formattedMessages = data.messages.map(msg => ({
                        id: msg.id || Date.now() + Math.random(),
                        text: msg.text,
                        isUser: msg.isUser,
                        timestamp: msg.timestamp
                    }));
                    setMessages(formattedMessages);
                }
            }
        } catch (error) {
            console.error('Error loading chat session:', error);
            Alert.alert(
                'Unable to Load Chat',
                'Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Save message to backend
    const saveMessageToBackend = async (message, isUser) => {
        if (!sessionId) return;

        try {
            await fetch(`${API_BASE_URL}/chat/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    message: {
                        text: message,
                        isUser: isUser,
                        timestamp: new Date().toISOString(),
                        chatType: chatType
                    },
                    context: pinnedMessage || null
                }),
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    };

    const getAIResponse = async (userMessage) => {
        try {
            const requestData = {
                message: userMessage,
                sessionId: sessionId,
                chatType: chatType,
                context: pinnedMessage || '',
                location: {
                    latitude: userLocation?.latitude || null,
                    longitude: userLocation?.longitude || null,
                },
                weather: weatherData || null,
                language: lang,
                messageHistory: messages.slice(-5)
            };

            const response = await fetch(`${API_BASE_URL}/chatbot/response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();
            return data.response || "I'm sorry, I couldn't process that request. Please try again.";
        } catch (error) {
            console.error('AI Response Error:', error);
            return null;
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { id: Date.now(), text: input, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        
        await saveMessageToBackend(input, true);
        
        setInput('');
        setIsTyping(true);

        try {
            const aiResponse = await getAIResponse(input);
            
            if (aiResponse) {
                const aiMsg = { 
                    id: Date.now() + 1, 
                    text: aiResponse, 
                    isUser: false 
                };
                setMessages(prev => [...prev, aiMsg]);
                await saveMessageToBackend(aiResponse, false);
            } else {
                Alert.alert(
                    'Unable to Connect',
                    'Please check your internet connection and try again.',
                    [{ text: 'OK' }]
                );
                setMessages(prev => prev.filter(msg => msg.id !== userMsg.id));
            }
        } catch (error) {
            Alert.alert(
                'Something Went Wrong',
                'Please try again in a moment.',
                [{ text: 'OK' }]
            );
            setMessages(prev => prev.filter(msg => msg.id !== userMsg.id));
        } finally {
            setIsTyping(false);
        }
    };

    const handleMicPress = () => {
        Speech.speak("What would you like to ask?", { language: lang, rate: 1.05, pitch: 1.3 });
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0,5);
    };

    const HistoryMenuItem = ({ session }) => (
        <TouchableOpacity 
            style={styles.historyItem}
            onPress={() => loadChatSession(session.id)}
        >
            <Ionicons name="chatbubble-outline" size={20} color="#2E7D32" />
            <View style={styles.historyItemContent}>
                <Text style={styles.historyItemTitle} numberOfLines={1}>
                    {session.preview || 'Chat Session'}
                </Text>
                <Text style={styles.historyItemDate}>
                    {formatDate(session.lastMessage)}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
    );

    return (
        <>
            <Modal visible={isChatVisible} animationType="slide" transparent={false}>
                <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
                <ImageBackground
                    source={chatBackground || require('../assets/truck.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                >
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.container}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerLeft}>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setShowHistoryMenu(true);
                                            loadChatSessions();
                                        }}
                                        style={styles.menuButton}
                                    >
                                        <Ionicons name="menu" size={28} color="#fff" />
                                    </TouchableOpacity>
                                    <Ionicons name="leaf" size={28} color="#fff" />
                                    <Text style={styles.headerText}>Ask your question</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => setChatVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close" size={28} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {/* Chat Body */}
                            <ScrollView 
                                style={styles.chatBody} 
                                contentContainerStyle={styles.chatContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {isLoadingHistory ? (
                                    <View style={styles.loadingHistory}>
                                        <ActivityIndicator size="small" color="#2E7D32" />
                                        <Text style={styles.loadingText}>Loading conversation...</Text>
                                    </View>
                                ) : (
                                    <>
                                        {pinnedMessage && (
                                            <View style={styles.pinnedBox}>
                                                <View style={styles.pinnedHeader}>
                                                    <Ionicons name="pin" size={16} color="#2E7D32" />
                                                    <Text style={styles.pinnedTitle}>Crop Details</Text>
                                                    <TouchableOpacity onPress={() => setPinnedMessage(null)}>
                                                        <Ionicons name="close-circle" size={18} color="#666" />
                                                    </TouchableOpacity>
                                                </View>
                                                <Text style={styles.pinnedText}>{pinnedMessage}</Text>
                                            </View>
                                        )}
                                        
                                        {messages.map(m => (
                                            <ChatMessage key={m.id} message={m} />
                                        ))}
                                        
                                        {isTyping && (
                                            <View style={styles.typingIndicator}>
                                                <ActivityIndicator size="small" color="#2E7D32" />
                                                <Text style={styles.typingText}>AI is thinking...</Text>
                                            </View>
                                        )}
                                    </>
                                )}
                            </ScrollView>

                            {/* Input Area */}
                            <View style={styles.inputArea}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Type your question..."
                                    placeholderTextColor="#999"
                                    value={input}
                                    onChangeText={setInput}
                                    multiline
                                    editable={!isLoadingHistory}
                                />
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.sendButton]} 
                                    onPress={handleSend}
                                    disabled={!input.trim() || isLoadingHistory}
                                >
                                    <Ionicons name="send" size={22} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.micButton]} 
                                    onPress={handleMicPress}
                                >
                                    <Ionicons name="mic" size={22} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </ImageBackground>
            </Modal>

            {/* History Menu Modal */}
            <Modal visible={showHistoryMenu} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.historyMenu}>
                        <View style={styles.historyHeader}>
                            <Text style={styles.historyTitle}>Chat History</Text>
                            <TouchableOpacity onPress={() => setShowHistoryMenu(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        {loadingSessions ? (
                            <View style={styles.loadingSessions}>
                                <ActivityIndicator size="large" color="#2E7D32" />
                                <Text style={styles.loadingText}>Loading history...</Text>
                            </View>
                        ) : chatSessions.length > 0 ? (
                            <FlatList
                                data={chatSessions}
                                keyExtractor={(item) => item.id}
                                renderItem={({item}) => <HistoryMenuItem session={item} />}
                                contentContainerStyle={styles.historyList}
                            />
                        ) : (
                            <View style={styles.emptyHistory}>
                                <Ionicons name="chatbubble-outline" size={50} color="#ccc" />
                                <Text style={styles.emptyHistoryText}>No chat history yet</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // CHANGED: Reduced from 0.3 to 0.2
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.5)', // CHANGED: Reduced from 0.88 to 0.75
    },
    header: {
        backgroundColor: '#2E7D32',
        paddingVertical: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButton: {
        marginRight: 10,
    },
    headerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    closeButton: {
        padding: 5,
    },
    chatBody: {
        flex: 1,
    },
    chatContent: {
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    loadingHistory: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    pinnedBox: {
        backgroundColor: '#FFF9E6',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#FF8F00',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    pinnedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    pinnedTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginLeft: 5,
        flex: 1,
    },
    pinnedText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginLeft: 10,
        marginVertical: 10,
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2E7D32',
    },
    typingText: {
        marginLeft: 8,
        color: '#1B5E20',
        fontSize: 14,
        fontStyle: 'italic',
    },
    inputArea: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // CHANGED: Reduced from 0.97 to 0.95
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        paddingHorizontal: 18,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    actionButton: {
        width: 45,
        height: 45,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    sendButton: {
        backgroundColor: '#2E7D32',
    },
    micButton: {
        backgroundColor: '#FF8F00',
    },
    // History Menu Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    historyMenu: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.8,
        paddingTop: 20,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    historyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    loadingSessions: {
        padding: 40,
        alignItems: 'center',
    },
    historyList: {
        padding: 15,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    historyItemContent: {
        flex: 1,
        marginLeft: 12,
    },
    historyItemTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    historyItemDate: {
        fontSize: 12,
        color: '#999',
    },
    emptyHistory: {
        padding: 40,
        alignItems: 'center',
    },
    emptyHistoryText: {
        marginTop: 10,
        fontSize: 16,
        color: '#999',
    },
});

export default FloatingChatbot;