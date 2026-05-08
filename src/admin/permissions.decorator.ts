import { SetMetadata } from '@nestjs/common';
import { AdminPermission } from '@prisma/client';

export const PERMISSIONS_KEY = 'admin_permissions';

export const Permissions = (...perms: AdminPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, perms);
