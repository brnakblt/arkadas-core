import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useChat, Conversation, Message } from '@/hooks/useChat';

export default function MessagesScreen() {
    const [input, setInput] = useState('');
    const [showConversations, setShowConversations] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    const {
        conversations,
        currentConversation,
        messages,
        isLoading,
        error,
        loadConversations,
        selectConversation,
        sendMessage,
    } = useChat();

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const handleSelectConversation = (token: string) => {
        selectConversation(token);
        setShowConversations(false);
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const msg = input;
        setInput('');
        await sendMessage(msg);
    };

    const formatTime = (ts: number) => {
        return new Date(ts * 1000).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderConversation = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
            onPress={() => handleSelectConversation(item.token)}
        >
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3">
                <FontAwesome name="user" size={20} color="#16a34a" />
            </View>
            <View className="flex-1">
                <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-gray-800">{item.displayName}</Text>
                    {item.unreadMessages > 0 && (
                        <View className="bg-green-500 px-2 py-0.5 rounded-full">
                            <Text className="text-white text-xs">{item.unreadMessages}</Text>
                        </View>
                    )}
                </View>
                {item.lastMessage && (
                    <Text className="text-sm text-gray-500" numberOfLines={1}>
                        {item.lastMessage.message}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderMessage = ({ item }: { item: Message }) => (
        <View className="mx-4 mb-2">
            {item.systemMessage ? (
                <View className="items-center">
                    <Text className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {item.message}
                    </Text>
                </View>
            ) : (
                <View>
                    <Text className="text-xs text-gray-500 mb-1">{item.actorDisplayName}</Text>
                    <View className="bg-white px-4 py-2 rounded-2xl rounded-bl-md self-start shadow-sm max-w-[80%]">
                        <Text className="text-gray-800">{item.message}</Text>
                        <Text className="text-[10px] text-gray-400 text-right mt-1">
                            {formatTime(item.timestamp)}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    // Conversation List View
    if (showConversations || !currentConversation) {
        return (
            <View className="flex-1 bg-gray-50">
                <View className="bg-green-600 px-4 py-4">
                    <Text className="text-white text-xl font-bold">Mesajlar</Text>
                </View>

                {isLoading && conversations.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#16a34a" />
                    </View>
                ) : (
                    <FlatList
                        data={conversations}
                        keyExtractor={(item) => item.token}
                        renderItem={renderConversation}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-12">
                                <FontAwesome name="comments" size={48} color="#d1d5db" />
                                <Text className="text-gray-400 mt-3">Henüz sohbet yok</Text>
                            </View>
                        }
                    />
                )}
            </View>
        );
    }

    // Chat View
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-gray-100"
            keyboardVerticalOffset={90}
        >
            {/* Header */}
            <View className="bg-green-600 px-4 py-3 flex-row items-center">
                <TouchableOpacity onPress={() => setShowConversations(true)} className="mr-3">
                    <FontAwesome name="arrow-left" size={20} color="white" />
                </TouchableOpacity>
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                    <FontAwesome name="user" size={16} color="white" />
                </View>
                <Text className="text-white font-semibold text-lg flex-1">
                    {currentConversation.displayName}
                </Text>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessage}
                contentContainerStyle={{ paddingVertical: 12 }}
            />

            {/* Input */}
            <View className="px-4 py-3 bg-white border-t border-gray-100">
                <View className="flex-row items-center gap-2">
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Mesaj yazın..."
                        className="flex-1 bg-gray-100 px-4 py-3 rounded-xl"
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!input.trim()}
                        className={`w-12 h-12 rounded-xl items-center justify-center ${input.trim() ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                    >
                        <FontAwesome name="send" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {error && (
                <View className="absolute bottom-20 left-4 right-4 bg-red-500 px-4 py-2 rounded-lg">
                    <Text className="text-white text-center">{error}</Text>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}
