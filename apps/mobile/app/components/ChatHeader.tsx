import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface Props {
  title?: string;
  subtitle?: string;
  isOnline?: boolean;
  onInfoPress?: () => void;
}

export function ChatHeader({ 
  title = 'Oasis Travel Bot',
  subtitle = 'Your personal trip planner',
  isOnline = true,
  onInfoPress,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#FFFFFF"
            style={styles.iconButton}
          />
        </TouchableOpacity>

        {/* Avatar with Online Indicator */}
        <View style={styles.avatarWrapper}>
          <Avatar.Icon
            size={40}
            icon="robot"
            style={styles.avatar}
            color="#FFFFFF"
          />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        {/* Title and Subtitle */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.verifiedBadge}>
              <IconButton
                icon="check-decagram"
                size={16}
                iconColor="#FFFFFF"
                style={styles.verifiedIcon}
              />
            </View>
          </View>
          <Text style={styles.subtitle}>
            {isOnline ? subtitle : 'Connecting...'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onInfoPress} activeOpacity={0.7}>
            <IconButton
              icon="dots-vertical"
              size={24}
              iconColor="#FFFFFF"
              style={styles.iconButton}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0066CC', // App primary color
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButton: {
    marginLeft: -4,
  },
  iconButton: {
    margin: 0,
  },
  avatarWrapper: {
    position: 'relative',
    marginLeft: 4,
  },
  avatar: {
    backgroundColor: '#00BFA5', // App tertiary color
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00BFA5',
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  verifiedIcon: {
    margin: 0,
    marginTop: -2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
