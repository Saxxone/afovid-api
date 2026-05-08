import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AdminPermission, UserRole } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { Public } from 'src/auth/auth.guard';
import { SignInDto } from 'src/auth/dto/sign-in.dto';
import { RequiresFeatureFlag } from 'src/feature-flag/feature-flag.decorator';
import { FeatureFlagGuard } from 'src/feature-flag/feature-flag.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { adminPermissionsToApiKeys } from './admin-permission-api-keys';
import { resolveRolePermissions } from './admin-role-permissions';
import { Permissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @UseGuards(FeatureFlagGuard)
  @RequiresFeatureFlag('auth.emailPasswordLogin')
  @Post('login')
  async login(@Body() body: SignInDto) {
    const session = await this.authService.signInAdmin(
      body.usernameOrEmail,
      body.password,
    );
    const role = session.role as UserRole;
    const permissions = adminPermissionsToApiKeys(resolveRolePermissions(role));
    return { ...session, permissions };
  }

  @UseGuards(PermissionsGuard)
  @Permissions(AdminPermission.DASHBOARD_READ)
  @Get('me')
  async me(@Request() req: { user: { userId: string } }) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        bio: true,
        verified: true,
        banner: true,
        img: true,
        stripeConnectAccountId: true,
        stripeConnectChargesEnabled: true,
        stripeConnectPayoutsEnabled: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
    const permissions = adminPermissionsToApiKeys(
      resolveRolePermissions(user.role),
    );
    return { user, role: user.role, permissions };
  }
}
