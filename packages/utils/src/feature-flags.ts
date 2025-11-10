export interface FeatureFlags {
  soft_onboarding: boolean;
  masked_calling: boolean;
  quick_actions: boolean;
  offline_mode: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  soft_onboarding: true,
  masked_calling: false,
  quick_actions: true,
  offline_mode: true,
};

/**
 * Parse feature flags from admin_settings JSON
 */
export const parseFlags = (json: any): FeatureFlags => {
  if (!json || typeof json !== 'object') {
    return DEFAULT_FLAGS;
  }

  return {
    soft_onboarding: json.soft_onboarding ?? DEFAULT_FLAGS.soft_onboarding,
    masked_calling: json.masked_calling ?? DEFAULT_FLAGS.masked_calling,
    quick_actions: json.quick_actions ?? DEFAULT_FLAGS.quick_actions,
    offline_mode: json.offline_mode ?? DEFAULT_FLAGS.offline_mode,
  };
};

/**
 * Check if feature is enabled
 */
export const isFeatureEnabled = (
  flags: FeatureFlags,
  feature: keyof FeatureFlags
): boolean => {
  return flags[feature] === true;
};

