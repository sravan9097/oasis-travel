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
}

export function BotMessage({ 
  message, 
  isUser, 
  quickReplies,
  onQuickReplySelect,
  quickRepliesDisabled 
}: Props) {
  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      {!isUser && <Avatar.Icon size={32} icon="robot" style={styles.avatar} />}
      <View style={styles.messageWrapper}>
      <View style={[styles.bubble, isUser && styles.userBubble]}>
        <Text style={[styles.text, isUser && styles.userText]}>{message}</Text>
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
    marginVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  userContainer: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    marginRight: 8,
    marginTop: 4,
  },
  messageWrapper: {
    flex: 1,
    maxWidth: '80%',
  },
  bubble: {
    maxWidth: '100%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#0066CC',
    borderTopRightRadius: 4,
    borderTopLeftRadius: 16,
    alignSelf: 'flex-end',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#FFF',
  },
});

