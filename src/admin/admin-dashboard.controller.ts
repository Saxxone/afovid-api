import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminPermission } from '@prisma/client';
import { RequiresFeatureFlag } from 'src/feature-flag/feature-flag.decorator';
import { FeatureFlagGuard } from 'src/feature-flag/feature-flag.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { Permissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

@Controller('admin/dashboard')
@UseGuards(PermissionsGuard, FeatureFlagGuard)
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Permissions(AdminPermission.DASHBOARD_READ)
  @RequiresFeatureFlag('admin.dashboard')
  @Get('summary')
  async summary() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [usersTotal, postsTotal, postsMonetized, filesByStatus, ledger24h] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.post.count({ where: { deletedAt: null } }),
        this.prisma.post.count({
          where: { deletedAt: null, monetizationEnabled: true },
        }),
        this.prisma.file.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        this.prisma.coinLedgerEntry.aggregate({
          where: { createdAt: { gte: since24h } },
          _sum: { amountMinor: true },
          _count: { id: true },
        }),
      ]);

    return {
      usersTotal,
      postsTotal,
      postsMonetized,
      filesByStatus: Object.fromEntries(
        filesByStatus.map((r) => [r.status, r._count.id]),
      ),
      ledgerLast24h: {
        entryCount: ledger24h._count.id,
        netAmountMinorSum: ledger24h._sum.amountMinor ?? 0,
      },
    };
  }
}
