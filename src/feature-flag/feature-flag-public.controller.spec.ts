jest.mock('src/auth/auth.guard', () => ({
  Public: () => () => {},
}));

import { FeatureFlagPublicController } from './feature-flag-public.controller';
import { FeatureFlagService } from './feature-flag.service';

describe('FeatureFlagPublicController', () => {
  it('returns client-safe flag map', async () => {
    const svc = {
      getPublicFlagMap: jest.fn(async () => ({ 'social.ads': false })),
    } as unknown as FeatureFlagService;
    const c = new FeatureFlagPublicController(svc);
    await expect(c.listPublic()).resolves.toEqual({
      flags: { 'social.ads': false },
    });
    expect(svc.getPublicFlagMap).toHaveBeenCalled();
  });
});
