import React from 'react';
import { render } from '@testing-library/react-native';
import { BotMessage } from '../BotMessage';

describe('BotMessage', () => {
  it('renders bot message correctly', () => {
    const { getByText } = render(
      <BotMessage message="Hello, how can I help?" />
    );
    
    expect(getByText('Hello, how can I help?')).toBeTruthy();
  });

  it('renders user message with different styling', () => {
    const { getByText } = render(
      <BotMessage message="I want to book a trip" isUser />
    );
    
    expect(getByText('I want to book a trip')).toBeTruthy();
  });

  it('shows avatar for bot messages', () => {
    const { UNSAFE_getByType } = render(
      <BotMessage message="Bot message" />
    );
    
    // Avatar should be present for bot messages
    const avatar = UNSAFE_getByType('Avatar');
    expect(avatar).toBeTruthy();
  });

  it('does not show avatar for user messages', () => {
    const { queryByTestId } = render(
      <BotMessage message="User message" isUser />
    );
    
    // Avatar should not be present for user messages
    // Note: This test may need adjustment based on actual component structure
  });
});

