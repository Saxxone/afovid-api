import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CoinsModule } from 'src/coins/coins.module';
import { FeatureFlagModule } from 'src/feature-flag/feature-flag.module';
import { PostModule } from 'src/post/post.module';
import { AdminFeatureFlagsController } from './admin-feature-flags.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminCoinsController } from './admin-coins.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminFilesController } from './admin-files.controller';
import { AdminPostsController } from './admin-posts.controller';
import { AdminUsersController } from './admin-users.controller';
import { PermissionsGuard } from './permissions.guard';

@Module({
  imports: [AuthModule, PostModule, CoinsModule, FeatureFlagModule],
  controllers: [
    AdminAuthController,
    AdminDashboardController,
    AdminUsersController,
    AdminPostsController,
    AdminFilesController,
    AdminCoinsController,
    AdminFeatureFlagsController,
  ],
  providers: [PermissionsGuard],
})
export class AdminModule {}
