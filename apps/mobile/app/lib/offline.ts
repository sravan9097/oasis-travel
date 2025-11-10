import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';

/**
 * Hook to check online status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  return isOnline;
}

/**
 * Cache trip data for offline viewing
 */
export async function cacheTripData(tripId: string, data: any) {
  const directory = `${FileSystem.documentDirectory}trips/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  
  const filePath = `${directory}${tripId}.json`;
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));
}

/**
 * Retrieve cached trip data
 */
export async function getCachedTripData(tripId: string) {
  const filePath = `${FileSystem.documentDirectory}trips/${tripId}.json`;
  
  try {
    const contents = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(contents);
  } catch {
    return null;
  }
}

/**
 * Clear old cache files
 */
export async function clearOldCache(daysOld: number = 30) {
  const directory = `${FileSystem.documentDirectory}trips/`;
  
  try {
    const files = await FileSystem.readDirectoryAsync(directory);
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(`${directory}${file}`);
      if (info.exists && info.modificationTime! * 1000 < cutoffTime) {
        await FileSystem.deleteAsync(`${directory}${file}`);
      }
    }
  } catch {
    // Directory doesn't exist yet
  }
}

