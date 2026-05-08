import { AdminPermission, UserRole } from '@prisma/client';

/** Full set for SUPERADMIN checks and API serialization order. */
export const ALL_MANAGEABLE_ADMIN_PERMISSIONS: readonly AdminPermission[] = [
  AdminPermission.DASHBOARD_READ,
  AdminPermission.USERS_READ,
  AdminPermission.USERS_WRITE,
  AdminPermission.USERS_ROLES_WRITE,
  AdminPermission.POSTS_READ,
  AdminPermission.POSTS_WRITE,
  AdminPermission.FILES_READ,
  AdminPermission.FILES_WRITE,
  AdminPermission.COINS_PACKAGES_READ,
  AdminPermission.COINS_PACKAGES_WRITE,
  AdminPermission.COINS_LEDGER_READ,
  AdminPermission.COINS_ADJUST,
  AdminPermission.FEATURE_FLAGS_MANAGE,
] as const;

/** Roles that may use the admin panel (password login). */
export function canSignInToAdminPanel(role: UserRole): boolean {
  return (
    role === UserRole.SUPERADMIN ||
    role === UserRole.ADMIN ||
    role === UserRole.ADMIN_USER_MANAGER ||
    role === UserRole.ADMIN_MODERATOR ||
    role === UserRole.ADMIN_FINANCE ||
    role === UserRole.ADMIN_SUPPORT
  );
}

export function resolveRolePermissions(role: UserRole): AdminPermission[] {
  if (role === UserRole.SUPERADMIN) {
    return [...ALL_MANAGEABLE_ADMIN_PERMISSIONS];
  }

  switch (role) {
    case UserRole.ADMIN:
    case UserRole.ADMIN_USER_MANAGER:
      return [
        AdminPermission.DASHBOARD_READ,
        AdminPermission.USERS_READ,
        AdminPermission.USERS_WRITE,
        AdminPermission.USERS_ROLES_WRITE,
      ];
    case UserRole.ADMIN_MODERATOR:
      return [
        AdminPermission.DASHBOARD_READ,
        AdminPermission.POSTS_READ,
        AdminPermission.POSTS_WRITE,
        AdminPermission.FILES_READ,
        AdminPermission.FILES_WRITE,
      ];
    case UserRole.ADMIN_FINANCE:
      return [
        AdminPermission.DASHBOARD_READ,
        AdminPermission.COINS_PACKAGES_READ,
        AdminPermission.COINS_PACKAGES_WRITE,
        AdminPermission.COINS_LEDGER_READ,
        AdminPermission.COINS_ADJUST,
      ];
    case UserRole.ADMIN_SUPPORT:
      return [
        AdminPermission.DASHBOARD_READ,
        AdminPermission.USERS_READ,
        AdminPermission.POSTS_READ,
        AdminPermission.FILES_READ,
        AdminPermission.COINS_LEDGER_READ,
      ];
    default:
      return [];
  }
}

export function roleHasAllPermissions(
  role: UserRole,
  required: AdminPermission[],
): boolean {
  if (!required.length) return true;
  const granted = new Set(resolveRolePermissions(role));
  return required.every((p) => granted.has(p));
}

/** Roles a non-superadmin may assign to another user. */
export const ASSIGNABLE_ROLES_FOR_NON_SUPERADMIN: readonly UserRole[] = [
  UserRole.USER,
  UserRole.ADMIN_USER_MANAGER,
  UserRole.ADMIN_MODERATOR,
  UserRole.ADMIN_FINANCE,
  UserRole.ADMIN_SUPPORT,
] as const;

/** All roles that may appear on a user account (cannot assign legacy ADMIN). */
export const ASSIGNABLE_ROLES_SUPERADMIN: readonly UserRole[] = [
  UserRole.USER,
  UserRole.SUPERADMIN,
  UserRole.ADMIN_USER_MANAGER,
  UserRole.ADMIN_MODERATOR,
  UserRole.ADMIN_FINANCE,
  UserRole.ADMIN_SUPPORT,
] as const;
