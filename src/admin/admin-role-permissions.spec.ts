import { AdminPermission, UserRole } from '@prisma/client';
import {
  ALL_MANAGEABLE_ADMIN_PERMISSIONS,
  ASSIGNABLE_ROLES_FOR_NON_SUPERADMIN,
  ASSIGNABLE_ROLES_SUPERADMIN,
  canSignInToAdminPanel,
  resolveRolePermissions,
  roleHasAllPermissions,
} from './admin-role-permissions';

describe('admin-role-permissions', () => {
  it('superadmin receives all manageable permissions', () => {
    const perms = resolveRolePermissions(UserRole.SUPERADMIN);
    expect(perms).toEqual([...ALL_MANAGEABLE_ADMIN_PERMISSIONS]);
  });

  it('user manager has dashboard and users capabilities', () => {
    const perms = resolveRolePermissions(UserRole.ADMIN_USER_MANAGER);
    expect(perms).toContain(AdminPermission.DASHBOARD_READ);
    expect(perms).toContain(AdminPermission.USERS_READ);
    expect(perms).toContain(AdminPermission.USERS_WRITE);
    expect(perms).toContain(AdminPermission.USERS_ROLES_WRITE);
    expect(perms).not.toContain(AdminPermission.POSTS_WRITE);
  });

  it('moderator can moderate posts and files', () => {
    const perms = resolveRolePermissions(UserRole.ADMIN_MODERATOR);
    expect(perms).toContain(AdminPermission.POSTS_READ);
    expect(perms).toContain(AdminPermission.POSTS_WRITE);
    expect(perms).toContain(AdminPermission.FILES_WRITE);
  });

  it('finance has coin permissions including adjust', () => {
    const perms = resolveRolePermissions(UserRole.ADMIN_FINANCE);
    expect(perms).toContain(AdminPermission.COINS_ADJUST);
    expect(perms).toContain(AdminPermission.COINS_LEDGER_READ);
  });

  it('support is mostly read-only on users/posts/files', () => {
    const perms = resolveRolePermissions(UserRole.ADMIN_SUPPORT);
    expect(perms).toContain(AdminPermission.USERS_READ);
    expect(perms).not.toContain(AdminPermission.USERS_WRITE);
    expect(perms).toContain(AdminPermission.POSTS_READ);
    expect(perms).not.toContain(AdminPermission.POSTS_WRITE);
  });

  it('roleHasAllPermissions checks granted set', () => {
    expect(
      roleHasAllPermissions(UserRole.ADMIN_FINANCE, [
        AdminPermission.COINS_LEDGER_READ,
      ]),
    ).toBe(true);
    expect(
      roleHasAllPermissions(UserRole.ADMIN_FINANCE, [
        AdminPermission.POSTS_READ,
      ]),
    ).toBe(false);
  });

  it('canSignInToAdminPanel allows staff roles only', () => {
    expect(canSignInToAdminPanel(UserRole.USER)).toBe(false);
    expect(canSignInToAdminPanel(UserRole.SUPERADMIN)).toBe(true);
    expect(canSignInToAdminPanel(UserRole.ADMIN_SUPPORT)).toBe(true);
  });

  it('assignable roles exclude superadmin for non-superadmin path', () => {
    expect(ASSIGNABLE_ROLES_FOR_NON_SUPERADMIN).not.toContain(
      UserRole.SUPERADMIN,
    );
    expect(ASSIGNABLE_ROLES_SUPERADMIN).toContain(UserRole.SUPERADMIN);
  });
});
