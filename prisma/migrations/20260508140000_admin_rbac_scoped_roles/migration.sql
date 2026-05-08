-- Scoped admin roles and granular permissions; drop per-user permission array.

-- New UserRole values
ALTER TYPE "UserRole" ADD VALUE 'ADMIN_USER_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'ADMIN_MODERATOR';
ALTER TYPE "UserRole" ADD VALUE 'ADMIN_FINANCE';
ALTER TYPE "UserRole" ADD VALUE 'ADMIN_SUPPORT';

-- New AdminPermission values
ALTER TYPE "AdminPermission" ADD VALUE 'USERS_ROLES_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'COINS_PACKAGES_READ';
ALTER TYPE "AdminPermission" ADD VALUE 'COINS_PACKAGES_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'COINS_LEDGER_READ';
ALTER TYPE "AdminPermission" ADD VALUE 'COINS_ADJUST';
ALTER TYPE "AdminPermission" ADD VALUE 'FEATURE_FLAGS_MANAGE';

-- Normalize legacy ADMIN role to scoped default
UPDATE "User" SET role = 'ADMIN_USER_MANAGER' WHERE role = 'ADMIN';

-- Remove per-user overrides (source of truth is role → permissions in app code)
ALTER TABLE "User" DROP COLUMN IF EXISTS "adminPermissions";
