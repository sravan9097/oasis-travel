import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Announce message to screen reader
 */
export function announceForAccessibility(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Check if screen reader is enabled
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

/**
 * Get recommended minimum touch size
 */
export const MIN_TOUCH_SIZE = 44; // Apple HIG and Material guidelines

/**
 * Check color contrast ratio
 */
export function hasGoodContrast(
  foreground: string,
  background: string
): boolean {
  // Simplified - in production use a proper contrast checker
  return true; // TODO: Implement proper contrast checking
}

