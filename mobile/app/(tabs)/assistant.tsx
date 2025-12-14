import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAIChat, ChatMessage } from '@/hooks/useAIChat';

const quickQuestions = [
    'BEP formu nasıl doldurulur?',
    'MEBBIS işlemleri nelerdir?',
    'Öğrenci raporu nasıl hazırlanır?',
];

export default function AIAssistantScreen() {
    const [input, setInput] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const {
        messages,
        response,
        isStreaming,
        error,
        sendMessage,
        clearMessages,
        stopStreaming,
    } = useAIChat();

    useEffect(() => {
        if (flatListRef.current && (messages.length > 0 || response)) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages, response]);

    const handleSend = async () => {
        if (!input.trim() || isStreaming) return;
        const message = input;
        setInput('');
        await sendMessage(message);
    };

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => (
        <View
            className={`mb-3 flex-row ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            {item.role === 'assistant' && (
                <View className="w-8 h-8 bg-indigo-100 rounded-full items-center justify-center mr-2">
                    <FontAwesome name="comment" size={14} color="#4f46e5" />
                </View>
            )}
            <View
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${item.role === 'user'
                    ? 'bg-indigo-600 rounded-br-md'
                    : 'bg-gray-100 rounded-bl-md'
                    }`}
            >
                <Text
                    className={item.role === 'user' ? 'text-white' : 'text-gray-800'}
                >
                    {item.content}
                </Text>
            </View>
            {item.role === 'user' && (
                <View className="w-8 h-8 bg-indigo-600 rounded-full items-center justify-center ml-2">
                    <FontAwesome name="user" size={14} color="white" />
                </View>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
            keyboardVerticalOffset={90}
        >
            {/* Header */}
            <View className="bg-indigo-600 px-4 py-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                        <FontAwesome name="magic" size={18} color="white" />
                    </View>
                    <View>
                        <Text className="text-white font-semibold text-lg">AI Asistan</Text>
                        <Text className="text-white/60 text-xs">
                            {isStreaming ? 'Yazıyor...' : 'Hazır'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={clearMessages}>
                    <FontAwesome name="trash" size={18} color="white" />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderMessage}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    !response ? (
                        <View className="items-center py-8">
                            <FontAwesome name="comments" size={48} color="#d1d5db" />
                            <Text className="text-gray-400 mt-3 text-center">
                                Merhaba! Size nasıl yardımcı olabilirim?
                            </Text>
                            <View className="mt-4">
                                {quickQuestions.map((q) => (
                                    <TouchableOpacity
                                        key={q}
                                        onPress={() => setInput(q)}
                                        className="bg-gray-100 px-4 py-2 rounded-full mt-2"
                                    >
                                        <Text className="text-gray-600 text-sm">{q}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    <>
                        {/* Streaming response */}
                        {isStreaming && response ? (
                            <View className="flex-row mb-3">
                                <View className="w-8 h-8 bg-indigo-100 rounded-full items-center justify-center mr-2">
                                    <FontAwesome name="magic" size={14} color="#4f46e5" />
                                </View>
                                <View className="max-w-[80%] px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-md">
                                    <Text className="text-gray-800">{response}</Text>
                                </View>
                            </View>
                        ) : null}

                        {/* Loading */}
                        {isStreaming && !response ? (
                            <View className="flex-row items-center mb-3">
                                <View className="w-8 h-8 bg-indigo-100 rounded-full items-center justify-center mr-2">
                                    <ActivityIndicator size="small" color="#4f46e5" />
                                </View>
                                <Text className="text-gray-400">Düşünüyor...</Text>
                            </View>
                        ) : null}

                        {/* Error */}
                        {error ? (
                            <Text className="text-red-500 text-center py-2">⚠️ {error}</Text>
                        ) : null}
                    </>
                }
            />

            {/* Input */}
            <View className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <View className="flex-row items-center gap-2">
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 bg-white px-4 py-3 rounded-xl border border-gray-200"
                        editable={!isStreaming}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                    {isStreaming ? (
                        <TouchableOpacity
                            onPress={stopStreaming}
                            className="bg-red-500 w-12 h-12 rounded-xl items-center justify-center"
                        >
                            <FontAwesome name="stop" size={18} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!input.trim()}
                            className={`w-12 h-12 rounded-xl items-center justify-center ${input.trim() ? 'bg-indigo-600' : 'bg-gray-300'
                                }`}
                        >
                            <FontAwesome name="send" size={18} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
