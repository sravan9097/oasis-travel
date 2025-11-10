import { useState, useEffect } from 'react';
import { Banner } from 'react-native-paper';
import { useOnlineStatus } from '../lib/offline';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [visible, setVisible] = useState(!isOnline);

  useEffect(() => {
    setVisible(!isOnline);
  }, [isOnline]);

  return (
    <Banner
      visible={visible}
      actions={[
        {
          label: 'Dismiss',
          onPress: () => setVisible(false),
        },
      ]}
      icon="wifi-off"
      accessibilityLabel="Offline mode"
      accessibilityHint="You are currently offline. Some features may be limited."
    >
      You're offline. Some features may be limited.
    </Banner>
  );
}

