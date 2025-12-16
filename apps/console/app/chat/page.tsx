'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatHeader } from '../components/chat/ChatHeader';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { InteractiveList } from '../components/chat/InteractiveList';
import { PackageCards } from '../components/chat/PackageCards';
import { chatWithBot, type ChatMessage as APIChatMessage, type ExtractedTripData } from '@oasis/api';

interface QuickReplyOption {
  label: string;
  value: string | number;
}

interface InteractiveListData {
  header: string;
  body: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

interface PackageCardData {
  id: string;
  title: string;
  destination: string;
  nights: number;
  price: number;
  image?: string;
  inclusions: string[];
  hotelClass?: string;
}

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  quickReplies?: QuickReplyOption[];
  interactiveList?: InteractiveListData;
  packageCards?: PackageCardData[];
  messageType?: 'text' | 'list' | 'cards';
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read';
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedTripData>({});
  const [conversationHistory, setConversationHistory] = useState<APIChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const scrollViewRef = useRef<HTMLDivElement>(null);

  // Initialize chat with welcome message
  useEffect(() => {
    const sendInitialBotMessage = async () => {
      if (loading) return;

      setLoading(true);

      try {
        // Call AI bot with empty conversation to get initial question
        const response = await chatWithBot([], "Hello, I'd like to plan a trip.", extractedData);

        setIsOnline(true);

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
          messageType: 'text',
          timestamp: Date.now(),
          status: 'read',
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

        setIsOnline(false);

        // Provide fallback quick options instead of just an error
        const fallbackMessage: ChatMessage = {
          id: `fallback-${Date.now()}`,
          message: "I'm ready to help you plan your trip! Where would you like to go?",
          isUser: false,
          quickReplies: [
            { label: '🏖️ Goa', value: 'Goa' },
            { label: '🏰 Udaipur', value: 'Udaipur' },
            { label: '🏔️ Manali', value: 'Manali' },
            { label: '🌴 Kerala', value: 'Kerala' },
          ],
          messageType: 'text',
          timestamp: Date.now(),
          status: 'read',
        };
        setMessages((prev) => [...prev, fallbackMessage]);
        scrollToBottom();
      } finally {
        setLoading(false);
      }
    };

    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      message: "Hi! 👋 I'm your personal trip planner from Oasis Travel. Let's create your perfect getaway!",
      isUser: false,
      messageType: 'text',
      timestamp: Date.now(),
      status: 'read',
    };

    setMessages([welcomeMessage]);

    // Get initial AI response after a short delay
    const timeoutId = setTimeout(() => {
      sendInitialBotMessage();
    }, 800);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const sendMessageToBot = async (userMessageText: string) => {
    if (loading) return;

    setLoading(true);

    // Add user message to UI
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      message: userMessageText,
      isUser: true,
      messageType: 'text',
      timestamp: Date.now(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    // Update message status to delivered after a short delay
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'delivered' as const } : msg
        )
      );
    }, 300);

    // Update conversation history for API
    const updatedHistory: APIChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userMessageText },
    ];

    try {
      // Call AI bot
      const response = await chatWithBot(updatedHistory, userMessageText, extractedData);

      setIsOnline(true);

      // Update user message status to read
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'read' as const } : msg
        )
      );

      // Update extracted data
      if (response.extractedData) {
        setExtractedData((prev) => ({ ...prev, ...response.extractedData }));
      }

      // Determine message type
      let messageType: 'text' | 'list' | 'cards' = 'text';
      if (response.packageCards && response.packageCards.length > 0) {
        messageType = 'cards';
      } else if (response.interactiveList) {
        messageType = 'list';
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
        interactiveList: response.interactiveList,
        packageCards: response.packageCards,
        messageType,
        timestamp: Date.now(),
        status: 'read',
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

      setIsOnline(false);

      // Provide helpful fallback based on current data state
      let fallbackMsg = "I'm having trouble processing that. Let me help you with some options:";
      let quickReplies: QuickReplyOption[] = [];

      if (!extractedData.destinations || extractedData.destinations.length === 0) {
        fallbackMsg = "Let's try again! Which destination would you like to visit?";
        quickReplies = [
          { label: '🏖️ Goa', value: 'Goa' },
          { label: '🏰 Udaipur', value: 'Udaipur' },
          { label: '🏔️ Manali', value: 'Manali' },
          { label: '🌴 Kerala', value: 'Kerala' },
        ];
      } else if (!extractedData.nights) {
        fallbackMsg = "How many nights would you like to stay?";
        quickReplies = [
          { label: '3 nights', value: '3' },
          { label: '4 nights', value: '4' },
          { label: '5 nights', value: '5' },
          { label: '7 nights', value: '7' },
        ];
      } else if (!extractedData.pax_adults) {
        fallbackMsg = "How many adults will be traveling?";
        quickReplies = [
          { label: '1 adult', value: '1' },
          { label: '2 adults', value: '2' },
          { label: '3 adults', value: '3' },
          { label: '4+ adults', value: '4' },
        ];
      }

      const fallbackMessage: ChatMessage = {
        id: `fallback-${Date.now()}`,
        message: fallbackMsg,
        isUser: false,
        quickReplies,
        messageType: 'text',
        timestamp: Date.now(),
        status: 'read',
      };
      setMessages((prev) => [...prev, fallbackMessage]);
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

  const handleInteractiveListSelect = (rowId: string, rowTitle: string) => {
    sendMessageToBot(rowTitle);
  };

  const handlePackageSelect = (packageId: string, packageTitle: string) => {
    sendMessageToBot(`I'd like to select: ${packageTitle}`);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        top: scrollViewRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  };

  const handleUserMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || loading) return;

    const messageText = userInput.trim();
    setUserInput('');
    sendMessageToBot(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserMessage();
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    // Render interactive list
    if (msg.messageType === 'list' && msg.interactiveList) {
      return (
        <InteractiveList
          key={msg.id}
          header={msg.interactiveList.header}
          body={msg.interactiveList.body}
          buttonText={msg.interactiveList.buttonText}
          sections={msg.interactiveList.sections}
          onSelect={handleInteractiveListSelect}
          disabled={loading}
          timestamp={msg.timestamp}
        />
      );
    }

    // Render package cards
    if (msg.messageType === 'cards' && msg.packageCards && msg.packageCards.length > 0) {
      return (
        <PackageCards
          key={msg.id}
          packages={msg.packageCards}
          onSelect={handlePackageSelect}
          disabled={loading}
          timestamp={msg.timestamp}
          headerMessage={msg.message}
        />
      );
    }

    // Default: Render chat bubble
    return (
      <ChatBubble
        key={msg.id}
        message={msg.message}
        isUser={msg.isUser}
        quickReplies={msg.quickReplies}
        onQuickReplySelect={handleQuickReplySelect}
        quickRepliesDisabled={loading}
        timestamp={msg.timestamp}
        status={msg.status}
        showAvatar={!msg.isUser}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <ChatHeader
        title="Oasis Travel Bot"
        subtitle={isOnline ? "Online • Your personal trip planner" : "Connecting..."}
        isOnline={isOnline}
      />

      {/* Chat Messages Area */}
      <div
        ref={scrollViewRef}
        className="flex-1 overflow-y-auto py-3 space-y-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map(renderMessage)}

        {/* Typing Indicator */}
        <TypingIndicator visible={loading} />

        {/* Extracted Data Summary (for admin reference) */}
        {Object.keys(extractedData).length > 0 && (
          <div className="px-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <h4 className="font-semibold text-blue-900 mb-2">Extracted Trip Data:</h4>
              <pre className="text-blue-800 whitespace-pre-wrap">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Field */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleUserMessage} className="flex items-center gap-2">
          <button
            type="button"
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </button>

          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            disabled={loading}
            rows={1}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 max-h-24"
            style={{ minHeight: '42px' }}
          />

          <button
            type="submit"
            disabled={!userInput.trim() || loading}
            className="bg-blue-100 text-blue-600 p-2.5 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
