import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';

interface Props {
  message: string;
  isUser?: boolean;
}

export function BotMessage({ message, isUser }: Props) {
  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      {!isUser && <Avatar.Icon size={32} icon="robot" style={styles.avatar} />}
      <View style={[styles.bubble, isUser && styles.userBubble]}>
        <Text style={[styles.text, isUser && styles.userText]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  userContainer: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    marginRight: 8,
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
  },
  userBubble: {
    backgroundColor: '#0066CC',
  },
  text: {
    fontSize: 16,
  },
  userText: {
    color: '#FFF',
  },
});

