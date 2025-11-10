// Jest setup file for React Native testing
import '@testing-library/jest-native/extend-expect';

// Mock expo modules
jest.mock('expo-constants', () => ({
  default: {
    appOwnership: 'expo',
    expoVersion: '1.0.0',
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

