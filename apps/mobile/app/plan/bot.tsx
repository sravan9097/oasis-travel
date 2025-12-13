import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, ActivityIndicator, TextInput, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotMessage } from '../components/BotMessage';
import { rpcCreateLeadFromGuest, chatWithBot, type ChatMessage as APIChatMessage, type ExtractedTripData } from '@oasis/api';
import { useSessionStore } from '../store/session';
import { router } from 'expo-router';

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  quickReplies?: Array<{ label: string; value: string | number }>;
  timestamp: number;
}

export default function BotIntakeScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedTripData>({});
  const [conversationHistory, setConversationHistory] = useState<APIChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  
  const guestSessionId = useSessionStore((s) => s.guestSessionId);
  const session = useSessionStore((s) => s.session);

  const sendInitialBotMessage = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      // Call AI bot with empty conversation to get initial question
      const response = await chatWithBot([], "Hello, I'd like to plan a trip.", extractedData);

      // Update extracted data
      if (response.extractedData) {
        setExtractedData((prev) => ({ ...prev, ...response.extractedData }));
      }

      // Add bot response to UI
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        message: response.message || 'Where would you like to go?',
        isUser: false,
        quickReplies: response.quickReplies?.map((qr) => ({
          label: qr.label,
          value: qr.value,
        })),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Update conversation history
      setConversationHistory([
        { role: 'user', content: "Hello, I'd like to plan a trip." },
        { role: 'assistant', content: response.message },
      ]);

      scrollToBottom();
    } catch (error: any) {
      console.error('Error getting initial bot message:', error);
      console.error('Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });
      
      // Show user-friendly error message
      let errorMsg = 'Sorry, I encountered an issue connecting to the chat service. Please try again.';
      
      if (error?.message?.includes('Function not found') || error?.message?.includes('404')) {
        errorMsg = 'The chat service is not available. Please check your connection and try again later.';
      } else if (error?.message?.includes('GOOGLE_AI_API_KEY')) {
        errorMsg = 'The chat service is not configured. Please contact support.';
      } else if (error?.message?.includes('SAFETY')) {
        errorMsg = 'Your message was blocked by content filters. Please try rephrasing.';
      }
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        message: errorMsg,
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  }, [loading, extractedData]);

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      message: "Hi! I'm here to help you plan your trip. Let's get started!",
      isUser: false,
      timestamp: Date.now(),
    };
    
    setMessages([welcomeMessage]);
    
    // Get initial AI response after a short delay
    const timeoutId = setTimeout(() => {
      sendInitialBotMessage();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [sendInitialBotMessage]);

  const sendMessageToBot = async (userMessageText: string) => {
    if (loading) return;

    setLoading(true);

    // Add user message to UI
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      message: userMessageText,
      isUser: true,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    // Update conversation history for API
    const updatedHistory: APIChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userMessageText },
    ];

    try {
      // Call AI bot
      const response = await chatWithBot(updatedHistory, userMessageText, extractedData);

      // Update extracted data
      if (response.extractedData) {
        setExtractedData((prev) => ({ ...prev, ...response.extractedData }));
      }

      // Add bot response to UI
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        message: response.message || 'I understand. Let me help you with that.',
        isUser: false,
        quickReplies: response.quickReplies?.map((qr) => ({
          label: qr.label,
          value: qr.value,
        })),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Update conversation history
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: response.message },
      ]);

      scrollToBottom();
    } catch (error: any) {
      console.error('Error chatting with bot:', error);
      console.error('Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });
      
      // Show user-friendly error message
      let errorMsg = 'Sorry, I encountered an issue. Please try again or use the quick reply buttons.';
      
      if (error?.message?.includes('Function not found') || error?.message?.includes('404')) {
        errorMsg = 'The chat service is not available. Please check your connection and try again later.';
      } else if (error?.message?.includes('GOOGLE_AI_API_KEY')) {
        errorMsg = 'The chat service is not configured. Please contact support.';
      } else if (error?.message?.includes('SAFETY')) {
        errorMsg = 'Your message was blocked by content filters. Please try rephrasing.';
      }
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        message: errorMsg,
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReplySelect = (value: string | number) => {
    // Convert value to string for the bot
    const replyText = typeof value === 'number' ? value.toString() : value;
    sendMessageToBot(replyText);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const submitLead = async () => {
    if (!guestSessionId && !session) {
      return;
    }

    // Validate minimum required fields
    if (!extractedData.destinations || extractedData.destinations.length === 0) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        message: 'Please provide at least one destination.',
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      scrollToBottom();
      return;
    }

    if (!extractedData.nights || extractedData.nights <= 0) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        message: 'Please provide the number of nights.',
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      scrollToBottom();
      return;
    }

    if (!extractedData.pax_adults || extractedData.pax_adults <= 0) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        message: 'Please provide the number of adults.',
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      scrollToBottom();
      return;
    }

    setLoading(true);
    
    // Add loading message
    const loadingMessage: ChatMessage = {
      id: 'loading',
      message: 'Creating your trip plan...',
      isUser: false,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, loadingMessage]);
    scrollToBottom();

    try {
      const sessionId = guestSessionId || `user-${session?.user.id}`;
      
      // Prepare data for RPC call (only required fields for minimal request)
      const leadId = await rpcCreateLeadFromGuest(sessionId, {
        destinations: extractedData.destinations,
        nights: extractedData.nights,
        pax_adults: extractedData.pax_adults,
      });
      
      // Remove loading message and add success message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== 'loading');
        return [
          ...filtered,
          {
            id: 'success',
            message: 'Perfect! Your trip plan has been created. I\'ll send you a quote shortly! 🎉',
            isUser: false,
            timestamp: Date.now(),
          },
        ];
      });
      scrollToBottom();

      // Navigate after a short delay
      setTimeout(() => {
        router.push('/(tabs)/quotes');
      }, 2000);
    } catch (error) {
      console.error('Error creating lead:', error);
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== 'loading');
        return [
          ...filtered,
          {
            id: 'error',
            message: 'Sorry, something went wrong. Please try again.',
            isUser: false,
            timestamp: Date.now(),
          },
        ];
      });
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  };

  const handleUserMessage = () => {
    if (!userInput.trim() || loading) return;
    
    const messageText = userInput.trim();
    setUserInput('');
    sendMessageToBot(messageText);
  };

  // Check if we have minimum required data
  const canSubmit = 
    extractedData.destinations && 
    extractedData.destinations.length > 0 &&
    extractedData.nights && 
    extractedData.nights > 0 &&
    extractedData.pax_adults && 
    extractedData.pax_adults > 0;

  const showSubmitButton = canSubmit && !loading;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollToBottom()}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <BotMessage
            key={msg.id}
            message={msg.message}
            isUser={msg.isUser}
            quickReplies={msg.quickReplies}
            onQuickReplySelect={(value) => handleQuickReplySelect(value)}
            quickRepliesDisabled={loading}
          />
        ))}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" />
          </View>
        )}

        {showSubmitButton && (
          <View style={styles.submitContainer}>
            <Button
              mode="contained"
              onPress={submitLead}
              style={styles.submitButton}
              disabled={loading}
            >
              Get Quote
            </Button>
          </View>
        )}
      </ScrollView>
      
      {/* Chat Input Field */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          mode="outlined"
          value={userInput}
          onChangeText={setUserInput}
          placeholder="Type your message..."
          style={styles.textInput}
          multiline
          maxLength={500}
          disabled={loading}
          onSubmitEditing={handleUserMessage}
          blurOnSubmit={false}
        />
        <IconButton
          icon="send"
          iconColor="#0066CC"
          size={24}
          onPress={handleUserMessage}
          disabled={!userInput.trim() || loading}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 80, // Extra padding for input field
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  submitButton: {
    borderRadius: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  sendButton: {
    margin: 0,
  },
});
