/**
 * Validate Indian phone number
 */
export const isValidIndianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return /^(?:\+91|91)?[6-9]\d{9}$/.test(cleaned);
};

/**
 * Validate international phone number
 */
export const isValidPhone = (phone: string): boolean => {
  return /^\+?[1-9]\d{9,14}$/.test(phone.replace(/\s/g, ''));
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate Indian GSTIN
 */
export const isValidGSTIN = (gstin: string): boolean => {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
};

/**
 * Validate UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

/**
 * Validate URL
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

