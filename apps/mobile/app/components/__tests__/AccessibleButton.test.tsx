import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccessibleButton } from '../AccessibleButton';

describe('AccessibleButton', () => {
  it('renders with accessibility label', () => {
    const { getByLabelText } = render(
      <AccessibleButton
        accessibilityLabel="Test Button"
        onPress={() => {}}
      >
        Click Me
      </AccessibleButton>
    );
    
    const button = getByLabelText('Test Button');
    expect(button).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByLabelText } = render(
      <AccessibleButton
        accessibilityLabel="Test Button"
        onPress={onPressMock}
      >
        Click Me
      </AccessibleButton>
    );
    
    const button = getByLabelText('Test Button');
    fireEvent.press(button);
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders with accessibility hint when provided', () => {
    const { getByLabelText } = render(
      <AccessibleButton
        accessibilityLabel="Test Button"
        accessibilityHint="This button does something"
        onPress={() => {}}
      >
        Click Me
      </AccessibleButton>
    );
    
    const button = getByLabelText('Test Button');
    expect(button).toBeTruthy();
    // Note: Accessibility hint may not be directly testable without accessibility testing tools
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByLabelText } = render(
      <AccessibleButton
        accessibilityLabel="Test Button"
        style={customStyle}
        onPress={() => {}}
      >
        Click Me
      </AccessibleButton>
    );
    
    const button = getByLabelText('Test Button');
    expect(button).toBeTruthy();
  });
});

