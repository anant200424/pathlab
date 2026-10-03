import { Role } from "../modules/roles/role.model.js";
import { User } from "../modules/users/user.model.js";
import {
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
} from "../modules/roles/role.constants.js";
import { hashPassword } from "../common/utilities/crypto.util.js";
import { logger } from "../common/logging/logger.js";

export async function seedInitialData(): Promise<void> {
  try {
    // 1. Seed Roles
    const roleDocs: Record<string, typeof Role.prototype> = {};

    for (const [roleName, permissions] of Object.entries(
      DEFAULT_ROLE_PERMISSIONS,
    )) {
      const existingRole = await Role.findOne({ name: roleName });
      if (!existingRole) {
        const created = await Role.create({
          name: roleName,
          description: `System defined ${roleName} role with default operational permissions`,
          permissions,
          isSystem: true,
        });
        roleDocs[roleName] = created;
        logger.info(`Seeded role: ${roleName}`);
      } else {
        // Keep permissions updated
        existingRole.permissions = permissions;
        await existingRole.save();
        roleDocs[roleName] = existingRole;
      }
    }

    // 2. Seed Default Super Admin user if no user exists
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const superAdminRole = await Role.findOne({
        name: SYSTEM_ROLES.SUPER_ADMIN,
      });
      if (superAdminRole) {
        const passwordHash = await hashPassword("Admin@LabCarePro2026!");
        await User.create({
          email: "admin@labcarepro.internal",
          passwordHash,
          firstName: "System",
          lastName: "Administrator",
          phone: "+919876543210",
          roles: [superAdminRole._id],
          clinics: [],
          isActive: true,
          isEmailVerified: true,
        });
        logger.info(
          "Seeded default initial Super Admin account: admin@labcarepro.internal",
        );
      }
    }
  } catch (err) {
    logger.error({ err }, "Error during initial database seeding");
  }
}
