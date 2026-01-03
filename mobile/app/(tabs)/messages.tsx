/**
 * Messages Screen - Chat list and messaging
 */

import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { endpoints, Message } from '@/lib/endpoints';
import { useAuthStore } from '@/stores/auth';

interface Conversation {
    id: number;
    otherUser: { id: number; username: string };
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

export default function MessagesScreen() {
    const user = useAuthStore((state) => state.user);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sending, setSending] = useState(false);

    // Load conversations
    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const { messages: allMessages } = await endpoints.getMessages(1, 100);

            // Group messages by conversation
            const conversationMap = new Map<number, Conversation>();

            for (const msg of allMessages) {
                const otherId = msg.sender.id === user?.id ? msg.recipient.id : msg.sender.id;
                const otherName = msg.sender.id === user?.id ? msg.recipient.username : msg.sender.username;

                if (!conversationMap.has(otherId)) {
                    conversationMap.set(otherId, {
                        id: otherId,
                        otherUser: { id: otherId, username: otherName },
                        lastMessage: msg.content,
                        lastMessageTime: msg.sentAt,
                        unreadCount: !msg.isRead && msg.recipient.id === user?.id ? 1 : 0,
                    });
                } else {
                    const conv = conversationMap.get(otherId)!;
                    if (!msg.isRead && msg.recipient.id === user?.id) {
                        conv.unreadCount++;
                    }
                }
            }

            setConversations(Array.from(conversationMap.values()));
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadConversations();
        setRefreshing(false);
    };

    const loadMessages = async (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setLoading(true);

        try {
            const { messages: allMessages } = await endpoints.getMessages(1, 100);
            const filtered = allMessages.filter(
                (m) =>
                    (m.sender.id === conversation.otherUser.id && m.recipient.id === user?.id) ||
                    (m.sender.id === user?.id && m.recipient.id === conversation.otherUser.id)
            );
            setMessages(filtered.reverse());
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sending) return;

        setSending(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const message = await endpoints.sendMessage(
                selectedConversation.otherUser.id,
                newMessage.trim()
            );

            if (message) {
                setMessages((prev) => [...prev, message]);
                setNewMessage('');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Dün';
        } else {
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        }
    };

    // Chat view
    if (selectedConversation) {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
            >
                {/* Header */}
                <View style={styles.chatHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setSelectedConversation(null)}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.chatHeaderInfo}>
                        <Text style={styles.chatHeaderName}>
                            {selectedConversation.otherUser.username}
                        </Text>
                    </View>
                </View>

                {/* Messages */}
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View
                            style={[
                                styles.messageBubble,
                                item.sender.id === user?.id
                                    ? styles.messageBubbleSent
                                    : styles.messageBubbleReceived,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.messageText,
                                    item.sender.id === user?.id && styles.messageTextSent,
                                ]}
                            >
                                {item.content}
                            </Text>
                            <Text style={styles.messageTime}>{formatTime(item.sentAt)}</Text>
                        </View>
                    )}
                    contentContainerStyle={styles.messagesList}
                    inverted={false}
                />

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Mesaj yazın..."
                        placeholderTextColor="#94a3b8"
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.sendButtonText}>→</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // Conversation list
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>💬 Mesajlar</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>Henüz mesaj yok</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.conversationCard}
                            onPress={() => loadMessages(item)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {item.otherUser.username.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.conversationInfo}>
                                <Text style={styles.conversationName}>
                                    {item.otherUser.username}
                                </Text>
                                <Text style={styles.conversationPreview} numberOfLines={1}>
                                    {item.lastMessage}
                                </Text>
                            </View>
                            <View style={styles.conversationMeta}>
                                <Text style={styles.conversationTime}>
                                    {formatTime(item.lastMessageTime)}
                                </Text>
                                {item.unreadCount > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.conversationsList}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e293b',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        color: '#64748b',
    },
    conversationsList: {
        paddingVertical: 8,
    },
    conversationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    conversationInfo: {
        flex: 1,
    },
    conversationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    conversationPreview: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    conversationMeta: {
        alignItems: 'flex-end',
    },
    conversationTime: {
        fontSize: 12,
        color: '#94a3b8',
    },
    unreadBadge: {
        backgroundColor: '#2563eb',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    // Chat styles
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 24,
        color: '#2563eb',
    },
    chatHeaderInfo: {
        flex: 1,
        marginLeft: 8,
    },
    chatHeaderName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    messagesList: {
        padding: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    messageBubbleSent: {
        backgroundColor: '#2563eb',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    messageBubbleReceived: {
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    messageText: {
        fontSize: 15,
        color: '#1e293b',
    },
    messageTextSent: {
        color: '#fff',
    },
    messageTime: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    input: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        color: '#1e293b',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    sendButtonText: {
        fontSize: 20,
        color: '#fff',
    },
});
