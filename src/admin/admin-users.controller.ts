import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AdminPermission, UserRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { JwtPayload } from 'src/auth/auth.guard';
import { RequiresFeatureFlag } from 'src/feature-flag/feature-flag.decorator';
import { FeatureFlagGuard } from 'src/feature-flag/feature-flag.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ASSIGNABLE_ROLES_FOR_NON_SUPERADMIN,
  ASSIGNABLE_ROLES_SUPERADMIN,
} from './admin-role-permissions';
import { Permissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

class AdminPatchUserDto {
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsString()
  name?: string;
}

class AdminPatchUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

@Controller('admin/users')
@UseGuards(PermissionsGuard, FeatureFlagGuard)
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Permissions(AdminPermission.USERS_READ)
  @RequiresFeatureFlag('admin.users')
  @Get()
  async list(
    @Query('q') q?: string,
    @Query('skip') skipRaw?: string,
    @Query('take') takeRaw?: string,
  ) {
    const skip = Math.min(parseInt(skipRaw ?? '0', 10) || 0, 100_000);
    const take = Math.min(
      Math.max(parseInt(takeRaw ?? '30', 10) || 30, 1),
      100,
    );
    const where = q?.trim()
      ? {
          OR: [
            { email: { contains: q.trim(), mode: 'insensitive' as const } },
            { username: { contains: q.trim(), mode: 'insensitive' as const } },
            { name: { contains: q.trim(), mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          verified: true,
          role: true,
          createdAt: true,
          deletedAt: true,
        },
      }),
      this.prisma.user.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { items, total, skip, take };
  }

  @Permissions(AdminPermission.USERS_ROLES_WRITE)
  @RequiresFeatureFlag('admin.users')
  @Patch(':id/role')
  async patchRole(
    @Param('id') id: string,
    @Body() body: AdminPatchUserRoleDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (body.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'The legacy ADMIN role cannot be assigned; use a scoped admin role.',
      );
    }

    const caller = await this.prisma.user.findUniqueOrThrow({
      where: { id: req.user.userId },
      select: { role: true },
    });

    const allowed: readonly UserRole[] =
      caller.role === UserRole.SUPERADMIN
        ? ASSIGNABLE_ROLES_SUPERADMIN
        : ASSIGNABLE_ROLES_FOR_NON_SUPERADMIN;

    if (!allowed.includes(body.role)) {
      throw new ForbiddenException('Cannot assign this role');
    }

    if (
      body.role === UserRole.SUPERADMIN &&
      caller.role !== UserRole.SUPERADMIN
    ) {
      throw new ForbiddenException('Only a superadmin may grant superadmin');
    }

    const target = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, role: true },
    });

    if (
      target.role === UserRole.SUPERADMIN &&
      body.role !== UserRole.SUPERADMIN
    ) {
      const superCount = await this.prisma.user.count({
        where: { role: UserRole.SUPERADMIN, deletedAt: null },
      });
      if (superCount <= 1) {
        throw new BadRequestException('Cannot remove the last superadmin');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        verified: true,
        role: true,
        createdAt: true,
      },
    });
  }

  @Permissions(AdminPermission.USERS_WRITE)
  @RequiresFeatureFlag('admin.users')
  @Patch(':id')
  async patch(@Param('id') id: string, @Body() body: AdminPatchUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(body.verified !== undefined && { verified: body.verified }),
        ...(body.name !== undefined && { name: body.name }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        verified: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
