import { Types } from "mongoose";
import { User, IUser } from "./user.model.js";
import { Role } from "../roles/role.model.js";
import { hashPassword } from "../../common/utilities/crypto.util.js";
import { AppError } from "../../common/errors/app-error.js";
import { AuditService } from "../audit/audit.service.js";

export class UserService {
  static async createUser(
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      roles: string[];
      clinics?: string[];
    },
    actorId?: string,
  ): Promise<IUser> {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw AppError.conflict("A user with this email already exists.");
    }

    // Validate roles exist
    const roleIds: Types.ObjectId[] = [];
    for (const roleIdentifier of data.roles) {
      const role = Types.ObjectId.isValid(roleIdentifier)
        ? await Role.findById(roleIdentifier)
        : await Role.findOne({ name: roleIdentifier });

      if (!role) {
        throw AppError.badRequest(`Role '${roleIdentifier}' was not found.`);
      }
      roleIds.push(role._id as Types.ObjectId);
    }

    const clinicObjectIds = (data.clinics || []).map(
      (c) => new Types.ObjectId(c),
    );
    const passwordHash = await hashPassword(data.password);

    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      roles: roleIds,
      clinics: clinicObjectIds,
      isActive: true,
      isEmailVerified: true,
    });

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "users:create",
      entityType: "User",
      entityId: user._id.toString(),
      details: { email: user.email, roles: data.roles },
    });

    return user;
  }

  static async listUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    clinicId?: string;
    isActive?: boolean;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: "i" } },
        { lastName: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ];
    }

    if (query.clinicId) {
      filter.clinics = new Types.ObjectId(query.clinicId);
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate("roles", "name description permissions")
        .populate("clinics", "name branchCode")
        .select("-passwordHash -passwordResetTokenHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      items: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid user ID.");
    }
    const user = await User.findById(id)
      .populate("roles", "name description permissions")
      .populate("clinics", "name branchCode")
      .select("-passwordHash -passwordResetTokenHash");

    if (!user) {
      throw AppError.notFound("User not found.");
    }
    return user;
  }

  static async updateUser(
    id: string,
    updates: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      roles?: string[];
      clinics?: string[];
      isActive?: boolean;
    },
    actorId?: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid user ID.");
    }

    const user = await User.findById(id);
    if (!user) {
      throw AppError.notFound("User not found.");
    }

    if (updates.firstName !== undefined) user.firstName = updates.firstName;
    if (updates.lastName !== undefined) user.lastName = updates.lastName;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;

    if (updates.roles) {
      const roleIds: Types.ObjectId[] = [];
      for (const roleIdentifier of updates.roles) {
        const role = Types.ObjectId.isValid(roleIdentifier)
          ? await Role.findById(roleIdentifier)
          : await Role.findOne({ name: roleIdentifier });

        if (!role) {
          throw AppError.badRequest(`Role '${roleIdentifier}' was not found.`);
        }
        roleIds.push(role._id as Types.ObjectId);
      }
      user.roles = roleIds;
    }

    if (updates.clinics) {
      user.clinics = updates.clinics.map((c) => new Types.ObjectId(c));
    }

    await user.save();

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "users:update",
      entityType: "User",
      entityId: user._id.toString(),
      details: { updates },
    });

    return User.findById(id)
      .populate("roles", "name description permissions")
      .populate("clinics", "name branchCode")
      .select("-passwordHash -passwordResetTokenHash");
  }
}
