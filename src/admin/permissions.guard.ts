import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminPermission } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  canSignInToAdminPanel,
  resolveRolePermissions,
} from './admin-role-permissions';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId as string | undefined;
    if (!userId) {
      throw new ForbiddenException();
    }

    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!row) {
      throw new ForbiddenException();
    }

    if (!canSignInToAdminPanel(row.role)) {
      throw new ForbiddenException('Admin access required');
    }

    const required = this.reflector.getAllAndOverride<AdminPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const granted = new Set(resolveRolePermissions(row.role));
    const missing = required.filter((p) => !granted.has(p));
    if (missing.length > 0) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
