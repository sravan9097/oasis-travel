import React from 'react';
import { render } from '@testing-library/react-native';
import { OfflineBanner } from '../OfflineBanner';
import * as offlineModule from '../../lib/offline';

// Mock the offline module
jest.mock('../../lib/offline', () => ({
  useOnlineStatus: jest.fn(),
}));

describe('OfflineBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows banner when offline', () => {
    (offlineModule.useOnlineStatus as jest.Mock).mockReturnValue(false);
    
    const { getByText } = render(<OfflineBanner />);
    
    expect(getByText("You're offline. Some features may be limited.")).toBeTruthy();
  });

  it('hides banner when online', () => {
    (offlineModule.useOnlineStatus as jest.Mock).mockReturnValue(true);
    
    const { queryByText } = render(<OfflineBanner />);
    
    // Banner should not be visible when online
    expect(queryByText("You're offline. Some features may be limited.")).toBeNull();
  });

  it('has dismiss button', () => {
    (offlineModule.useOnlineStatus as jest.Mock).mockReturnValue(false);
    
    const { getByText } = render(<OfflineBanner />);
    
    expect(getByText('Dismiss')).toBeTruthy();
  });

  it('updates visibility when online status changes', () => {
    const { useOnlineStatus } = offlineModule;
    const mockUseOnlineStatus = useOnlineStatus as jest.Mock;
    
    // Start offline
    mockUseOnlineStatus.mockReturnValue(false);
    const { rerender, queryByText } = render(<OfflineBanner />);
    
    expect(queryByText("You're offline. Some features may be limited.")).toBeTruthy();
    
    // Change to online
    mockUseOnlineStatus.mockReturnValue(true);
    rerender(<OfflineBanner />);
    
    expect(queryByText("You're offline. Some features may be limited.")).toBeNull();
  });
});

