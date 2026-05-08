import { AdminPermission } from '@prisma/client';

/** Stable string keys consumed by `afovid-admin` (mirror in frontend constants). */
export function adminPermissionToApiKey(permission: AdminPermission): string {
  const map: Record<AdminPermission, string> = {
    [AdminPermission.DASHBOARD_READ]: 'dashboard.read',
    [AdminPermission.USERS_READ]: 'users.read',
    [AdminPermission.USERS_WRITE]: 'users.write',
    [AdminPermission.USERS_ROLES_WRITE]: 'users.roles.write',
    [AdminPermission.POSTS_READ]: 'posts.read',
    [AdminPermission.POSTS_WRITE]: 'posts.write',
    [AdminPermission.FILES_READ]: 'files.read',
    [AdminPermission.FILES_WRITE]: 'files.write',
    [AdminPermission.COINS_READ]: 'coins.read',
    [AdminPermission.COINS_WRITE]: 'coins.write',
    [AdminPermission.COINS_PACKAGES_READ]: 'coins.packages.read',
    [AdminPermission.COINS_PACKAGES_WRITE]: 'coins.packages.write',
    [AdminPermission.COINS_LEDGER_READ]: 'coins.ledger.read',
    [AdminPermission.COINS_ADJUST]: 'coins.adjust',
    [AdminPermission.FEATURE_FLAGS_READ]: 'featureFlags.read',
    [AdminPermission.FEATURE_FLAGS_WRITE]: 'featureFlags.write',
    [AdminPermission.FEATURE_FLAGS_MANAGE]: 'featureFlags.manage',
  };
  return map[permission];
}

export function adminPermissionsToApiKeys(
  permissions: AdminPermission[],
): string[] {
  return permissions.map(adminPermissionToApiKey);
}
