import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Avatar, IconButton } from 'react-native-paper';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ListRow {
  id: string;
  title: string;
  description?: string;
}

interface ListSection {
  title: string;
  rows: ListRow[];
}

interface InteractiveListProps {
  header: string;
  body: string;
  buttonText: string;
  sections: ListSection[];
  onSelect: (rowId: string, rowTitle: string) => void;
  disabled?: boolean;
  timestamp?: number;
}

export function InteractiveList({
  header,
  body,
  buttonText,
  sections,
  onSelect,
  disabled,
  timestamp,
}: InteractiveListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleRowSelect = (row: ListRow) => {
    if (disabled) return;
    setIsExpanded(false);
    onSelect(row.id, row.title);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar.Icon 
          size={36} 
          icon="robot" 
          style={styles.avatar}
          color="#FFFFFF"
        />
      </View>
      
      <View style={styles.messageWrapper}>
        {/* Header Message Bubble */}
        <View style={styles.bubble}>
          <Text style={styles.header}>{header}</Text>
          <Text style={styles.body}>{body}</Text>
          
          <View style={styles.metaRow}>
            {timestamp && (
              <Text style={styles.timestamp}>{formatTime(timestamp)}</Text>
            )}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
          onPress={toggleExpand}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionButtonText, disabled && styles.actionButtonTextDisabled]}>
            {buttonText}
          </Text>
          <IconButton
            icon={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            iconColor={disabled ? '#9CA3AF' : '#0066CC'}
            style={styles.chevron}
          />
        </TouchableOpacity>

        {/* Expandable List */}
        {isExpanded && (
          <View style={styles.listContainer}>
            {sections.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.section}>
                {section.title && (
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                )}
                {section.rows.map((row, rowIndex) => (
                  <TouchableOpacity
                    key={row.id}
                    style={[
                      styles.row,
                      rowIndex === section.rows.length - 1 && styles.lastRow,
                    ]}
                    onPress={() => handleRowSelect(row)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowContent}>
                      <Text style={styles.rowTitle}>{row.title}</Text>
                      {row.description && (
                        <Text style={styles.rowDescription}>{row.description}</Text>
                      )}
                    </View>
                    <IconButton
                      icon="chevron-right"
                      size={20}
                      iconColor="#9CA3AF"
                      style={styles.rowChevron}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  avatar: {
    backgroundColor: '#25D366',
  },
  messageWrapper: {
    flex: 1,
    maxWidth: '85%',
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonDisabled: {
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0066CC',
  },
  actionButtonTextDisabled: {
    color: '#9CA3AF',
  },
  chevron: {
    margin: 0,
    marginLeft: 4,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  rowDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  rowChevron: {
    margin: 0,
  },
});
