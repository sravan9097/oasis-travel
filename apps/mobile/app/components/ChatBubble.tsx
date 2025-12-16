import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';
import { QuickReplyButton } from './QuickReplyButton';

interface QuickReplyOption {
  label: string;
  value: string | number;
}

interface Props {
  message: string;
  isUser?: boolean;
  quickReplies?: QuickReplyOption[];
  onQuickReplySelect?: (value: string | number) => void;
  quickRepliesDisabled?: boolean;
  timestamp?: number;
  status?: 'sent' | 'delivered' | 'read';
  showAvatar?: boolean;
}

export function ChatBubble({ 
  message, 
  isUser, 
  quickReplies,
  onQuickReplySelect,
  quickRepliesDisabled,
  timestamp,
  status = 'read',
  showAvatar = true,
}: Props) {
  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      {!isUser && showAvatar && (
        <View style={styles.avatarContainer}>
          <Avatar.Icon 
            size={36} 
            icon="robot" 
            style={styles.avatar}
            color="#FFFFFF"
          />
          <View style={styles.onlineIndicator} />
        </View>
      )}
      <View style={[styles.messageWrapper, isUser && styles.userMessageWrapper]}>
        <View style={[styles.bubble, isUser && styles.userBubble]}>
          {/* Message tail */}
          <View style={[styles.tail, isUser ? styles.userTail : styles.botTail]} />
          
          <Text style={[styles.text, isUser && styles.userText]}>{message}</Text>
          
          <View style={styles.metaRow}>
            {timestamp && (
              <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
                {formatTime(timestamp)}
              </Text>
            )}
            {isUser && (
              <Text style={[styles.status, status === 'read' && styles.statusRead]}>
                {getStatusIcon()}
              </Text>
            )}
          </View>
        </View>
        
        {!isUser && quickReplies && quickReplies.length > 0 && (
          <QuickReplyButton
            options={quickReplies}
            onSelect={onQuickReplySelect || (() => {})}
            disabled={quickRepliesDisabled}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  userContainer: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    backgroundColor: '#00BFA5', // App tertiary color
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00BFA5',
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  messageWrapper: {
    flex: 1,
    maxWidth: '80%',
    alignItems: 'flex-start',
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  bubble: {
    position: 'relative',
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#E3F2FD', // Light blue for user messages
    borderTopRightRadius: 4,
    borderTopLeftRadius: 18,
  },
  tail: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  botTail: {
    top: 0,
    left: -6,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
  },
  userTail: {
    top: 0,
    right: -6,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: '#E3F2FD',
    borderLeftColor: '#E3F2FD',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1F2937',
  },
  userText: {
    color: '#1F2937',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  userTimestamp: {
    color: '#6B7280',
  },
  status: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusRead: {
    color: '#0066CC', // App primary color
  },
});
