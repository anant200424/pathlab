import { Types } from "mongoose";
import { User, IUser } from "../users/user.model.js";
import { Session } from "./session.model.js";
import { IRole } from "../roles/role.model.js";
import { Permission, SYSTEM_ROLES } from "../roles/role.constants.js";
import {
  verifyPassword,
  hashPassword,
  generateSecureToken,
  hashToken,
  encryptPayload,
  decryptPayload,
} from "../../common/utilities/crypto.util.js";
import { AppError } from "../../common/errors/app-error.js";
import { AuditService } from "../audit/audit.service.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL_REMEMBER_ME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const REFRESH_TOKEN_TTL_STANDARD_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthTokensResult {
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    permissions: Permission[];
    clinics: string[];
  };
}

export class AuthService {
  static async login(
    email: string,
    plainPassword: string,
    clinicId?: string,
    rememberMe = false,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokensResult> {
    const user = await User.findOne({ email: email.toLowerCase() }).populate<{
      roles: IRole[];
    }>("roles");

    if (!user) {
      await AuditService.log({
        action: "auth:login_failed",
        entityType: "User",
        details: { email, reason: "user_not_found" },
        ipAddress,
        userAgent,
      });
      throw AppError.unauthorized("Invalid email or password.");
    }

    // Check lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw AppError.forbidden(
        `Account temporarily locked. Please try again in ${waitMinutes} minute(s).`,
      );
    }

    // Check active
    if (!user.isActive) {
      await AuditService.log({
        actorId: user._id as Types.ObjectId,
        actorEmail: user.email,
        action: "auth:login_failed",
        entityType: "User",
        entityId: user._id.toString(),
        details: { reason: "account_inactive" },
        ipAddress,
        userAgent,
      });
      throw AppError.unauthorized(
        "Account has been deactivated. Please contact your administrator.",
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      plainPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      }
      await user.save();

      await AuditService.log({
        actorId: user._id as Types.ObjectId,
        actorEmail: user.email,
        action: "auth:login_failed",
        entityType: "User",
        entityId: user._id.toString(),
        details: {
          reason: "invalid_password",
          failedAttempts: user.failedLoginAttempts,
        },
        ipAddress,
        userAgent,
      });

      throw AppError.unauthorized("Invalid email or password.");
    }

    // Reset failed attempts & set last login
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Verify clinic if supplied
    let activeClinicId: Types.ObjectId | undefined;
    if (clinicId) {
      const isSuperAdmin = user.roles.some(
        (r) => r.name === SYSTEM_ROLES.SUPER_ADMIN,
      );
      const userClinicIds = user.clinics.map((c) => c.toString());

      if (!isSuperAdmin && !userClinicIds.includes(clinicId)) {
        throw AppError.forbidden(
          "User is not authorized for the requested clinic.",
        );
      }
      activeClinicId = new Types.ObjectId(clinicId);
    } else if (user.clinics.length > 0) {
      activeClinicId = user.clinics[0];
    }

    // Generate Refresh Token
    const rawRefreshToken = generateSecureToken(32);
    const tokenHash = hashToken(rawRefreshToken);
    const refreshTTL = rememberMe
      ? REFRESH_TOKEN_TTL_REMEMBER_ME_MS
      : REFRESH_TOKEN_TTL_STANDARD_MS;
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTTL);

    const session = await Session.create({
      tokenHash,
      userId: user._id,
      clinicId: activeClinicId,
      ipAddress,
      userAgent,
      rememberMe,
      expiresAt: refreshTokenExpiresAt,
    });

    // Generate Access Token (Short-lived 15 mins)
    const accessTokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);
    const rawAccessTokenPayload = JSON.stringify({
      userId: user._id.toString(),
      sessionId: session._id.toString(),
      clinicId: activeClinicId?.toString(),
      exp: accessTokenExpiresAt.getTime(),
    });

    // Encrypt both tokens with AES-256-GCM
    const encryptedAccessToken = encryptPayload(rawAccessTokenPayload);
    const encryptedRefreshToken = encryptPayload(rawRefreshToken);

    // Gather permissions
    const permissionsSet = new Set<Permission>();
    for (const role of user.roles) {
      if (Array.isArray(role.permissions)) {
        for (const p of role.permissions) {
          permissionsSet.add(p as Permission);
        }
      }
    }

    await AuditService.log({
      actorId: user._id as Types.ObjectId,
      actorEmail: user.email,
      action: "auth:login_success",
      entityType: "User",
      entityId: user._id.toString(),
      clinicId: activeClinicId,
      details: { rememberMe },
      ipAddress,
      userAgent,
    });

    return {
      encryptedAccessToken,
      encryptedRefreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((r) => r.name),
        permissions: Array.from(permissionsSet),
        clinics: user.clinics.map((c) => c.toString()),
      },
    };
  }

  static async refreshTokens(
    encryptedRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    encryptedAccessToken: string;
    encryptedRefreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
  }> {
    const rawRefreshToken = decryptPayload(encryptedRefreshToken);
    if (!rawRefreshToken) {
      throw AppError.unauthorized("Invalid or tampered refresh token.");
    }

    const tokenHash = hashToken(rawRefreshToken);

    const session = await Session.findOne({
      tokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw AppError.unauthorized(
        "Session has expired or was revoked. Please log in again.",
      );
    }

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized(
        "User account is inactive or no longer exists.",
      );
    }

    // Rotate refresh token for replay prevention
    const newRawRefreshToken = generateSecureToken(32);
    session.tokenHash = hashToken(newRawRefreshToken);

    const refreshTTL = session.rememberMe
      ? REFRESH_TOKEN_TTL_REMEMBER_ME_MS
      : REFRESH_TOKEN_TTL_STANDARD_MS;
    session.expiresAt = new Date(Date.now() + refreshTTL);
    await session.save();

    // Generate new Access Token
    const accessTokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);
    const rawAccessTokenPayload = JSON.stringify({
      userId: user._id.toString(),
      sessionId: session._id.toString(),
      clinicId: session.clinicId?.toString(),
      exp: accessTokenExpiresAt.getTime(),
    });

    const encryptedAccessToken = encryptPayload(rawAccessTokenPayload);
    const newEncryptedRefreshToken = encryptPayload(newRawRefreshToken);

    await AuditService.log({
      actorId: user._id as Types.ObjectId,
      actorEmail: user.email,
      action: "auth:token_refreshed",
      entityType: "Session",
      entityId: session._id.toString(),
      ipAddress,
      userAgent,
    });

    return {
      encryptedAccessToken,
      encryptedRefreshToken: newEncryptedRefreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  static async logout(
    encryptedRefreshToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    if (!encryptedRefreshToken) return;

    const rawRefreshToken = decryptPayload(encryptedRefreshToken);
    if (!rawRefreshToken) return;

    const tokenHash = hashToken(rawRefreshToken);
    const session = await Session.findOne({
      tokenHash,
      revokedAt: { $exists: false },
    });

    if (session) {
      session.revokedAt = new Date();
      session.revokedReason = "logout";
      await session.save();

      await AuditService.log({
        actorId: session.userId,
        action: "auth:logout",
        entityType: "Session",
        entityId: session._id.toString(),
        clinicId: session.clinicId,
        ipAddress,
        userAgent,
      });
    }
  }

  static async changePassword(
    userId: string | Types.ObjectId,
    currentPass: string,
    newPass: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found.");
    }

    const isValid = await verifyPassword(currentPass, user.passwordHash);
    if (!isValid) {
      throw AppError.badRequest("Current password provided is incorrect.");
    }

    user.passwordHash = await hashPassword(newPass);
    await user.save();

    // Invalidate all active sessions for this user for security
    await Session.updateMany(
      { userId: user._id, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date(), revokedReason: "password_changed" } },
    );

    await AuditService.log({
      actorId: user._id as Types.ObjectId,
      actorEmail: user.email,
      action: "auth:password_changed",
      entityType: "User",
      entityId: user._id.toString(),
      ipAddress,
      userAgent,
    });
  }

  static async getCurrentUser(
    user: IUser,
    permissions: Permission[],
  ): Promise<unknown> {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles: user.roles,
      clinics: user.clinics,
      permissions,
    };
  }
}
