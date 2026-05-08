import { FeatureFlagScope } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeatureFlagService } from './feature-flag.service';

describe('FeatureFlagService.getPublicFlagMap', () => {
  it('maps prisma rows to key/boolean record', async () => {
    const prisma = {
      featureFlag: {
        findMany: jest.fn(async () => [
          { key: 'social.ads', enabled: true },
          { key: 'social.homeFeed', enabled: false },
        ]),
      },
    } as unknown as PrismaService;

    const svc = new FeatureFlagService(prisma);
    await expect(svc.getPublicFlagMap()).resolves.toEqual({
      'social.ads': true,
      'social.homeFeed': false,
    });

    expect(prisma.featureFlag.findMany).toHaveBeenCalledWith({
      where: { scope: FeatureFlagScope.CLIENT_SAFE },
      select: { key: true, enabled: true },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  });
});
