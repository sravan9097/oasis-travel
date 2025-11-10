import { Button, ButtonProps } from 'react-native-paper';
import { MIN_TOUCH_SIZE } from '../lib/accessibility';

interface Props extends ButtonProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export function AccessibleButton({
  accessibilityLabel,
  accessibilityHint,
  ...props
}: Props) {
  return (
    <Button
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      style={[
        { minHeight: MIN_TOUCH_SIZE },
        props.style,
      ]}
    />
  );
}

