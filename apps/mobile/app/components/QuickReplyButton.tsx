import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface QuickReplyOption {
  label: string;
  value: string | number;
}

interface Props {
  options: QuickReplyOption[];
  onSelect: (value: string | number) => void;
  disabled?: boolean;
}

export function QuickReplyButton({ options, onSelect, disabled }: Props) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={() => !disabled && onSelect(option.value)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0066CC',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.4,
    borderColor: '#CCCCCC',
  },
  buttonText: {
    color: '#0066CC',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

