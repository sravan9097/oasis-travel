/**
 * Truncate string to max length
 */
export const truncate = (str: string, maxLen: number): string => {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
};

/**
 * Convert string to slug (URL-friendly)
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalize each word
 */
export const titleCase = (str: string): string => {
  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
};

/**
 * Sanitize HTML (basic)
 */
export const sanitize = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Extract initials from name
 */
export const getInitials = (name: string, maxChars: number = 2): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, maxChars);
};

/**
 * Mask phone number (show last 4 digits)
 */
export const maskPhone = (phone: string): string => {
  if (phone.length < 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
};

