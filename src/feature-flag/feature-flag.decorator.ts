import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'featureFlag';

/**
 * Require one or more feature flags (all must be enabled).
 * `@RequiresFeatureFlag('a')` or `@RequiresFeatureFlag('a', 'b')`
 */
export const RequiresFeatureFlag = (...keys: string[]) =>
  SetMetadata(FEATURE_FLAG_KEY, keys);
