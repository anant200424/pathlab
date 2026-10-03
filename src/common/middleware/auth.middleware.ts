import { Request, Response, NextFunction } from "express";
import { env } from "../../config/env.js";
import { hashToken, decryptPayload } from "../utilities/crypto.util.js";
import { Session } from "../../modules/auth/session.model.js";
import { User } from "../../modules/users/user.model.js";
import { IRole } from "../../modules/roles/role.model.js";
import {
  Permission,
  SYSTEM_ROLES,
} from "../../modules/roles/role.constants.js";
import { AppError } from "../errors/app-error.js";
import { IUserPopulated } from "../../types/express.js";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Try AES-encrypted access token cookie
    if (req.cookies && req.cookies["labcare_access_token"]) {
      token = req.cookies["labcare_access_token"];
    }

    // 2. Try backwards-compatible session cookie
    if (!token && req.cookies && req.cookies[env.COOKIE_NAME]) {
      token = req.cookies[env.COOKIE_NAME];
    }

    // 3. Try Authorization Header
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return next(
        AppError.unauthorized(
          "Authentication required. No session token provided.",
        ),
      );
    }

    // Check if token is an AES-encrypted access payload
    let userId: string | undefined;
    let sessionId: string | undefined;

    const decrypted = decryptPayload(token);
    if (decrypted) {
      try {
        const payload = JSON.parse(decrypted);
        if (payload.userId && payload.sessionId) {
          if (payload.exp && Date.now() > payload.exp) {
            return next(
              AppError.unauthorized(
                "Access token has expired. Please refresh your session.",
              ),
            );
          }
          userId = payload.userId;
          sessionId = payload.sessionId;
        }
      } catch {
        // Not a JSON payload, treated as raw token
      }
    }

    let session: typeof Session.prototype | null = null;

    if (sessionId) {
      session = await Session.findOne({
        _id: sessionId,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      });
    } else {
      // Lookup by hashed raw token (or decrypted raw token)
      const rawToken = decrypted || token;
      const tokenHash = hashToken(rawToken);
      session = await Session.findOne({
        tokenHash,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      });
    }

    if (!session) {
      return next(
        AppError.unauthorized(
          "Session has expired or was revoked. Please log in again.",
        ),
      );
    }

    // Find active user with roles populated
    const targetUserId = userId || session.userId;
    const userDoc = await User.findById(targetUserId).populate<{
      roles: IRole[];
    }>("roles");

    if (!userDoc || !userDoc.isActive) {
      return next(
        AppError.unauthorized("User account is inactive or no longer exists."),
      );
    }

    // Aggregate permissions
    const permissionsSet = new Set<Permission>();
    let isSuperAdmin = false;

    for (const role of userDoc.roles) {
      if (role.name === SYSTEM_ROLES.SUPER_ADMIN) {
        isSuperAdmin = true;
      }
      if (Array.isArray(role.permissions)) {
        for (const p of role.permissions) {
          permissionsSet.add(p as Permission);
        }
      }
    }

    // Cast userDoc to IUserPopulated
    req.user = userDoc as unknown as IUserPopulated;
    req.session = session;
    req.permissions = Array.from(permissionsSet);
    if (session.clinicId) {
      req.clinicId = session.clinicId.toString();
    }
    req.isSuperAdmin = isSuperAdmin;

    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermissions(...requiredPermissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !req.permissions) {
      return next(AppError.unauthorized("Authentication required"));
    }

    if (req.isSuperAdmin) {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) =>
      req.permissions!.includes(perm),
    );

    if (!hasAll) {
      return next(
        AppError.forbidden(
          `Access denied. Missing required permission: ${requiredPermissions.join(", ")}`,
        ),
      );
    }

    next();
  };
}

export function requireAnyPermission(...requiredPermissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !req.permissions) {
      return next(AppError.unauthorized("Authentication required"));
    }

    if (req.isSuperAdmin) {
      return next();
    }

    const hasAny = requiredPermissions.some((perm) =>
      req.permissions!.includes(perm),
    );

    if (!hasAny) {
      return next(
        AppError.forbidden(
          `Access denied. Required at least one of: ${requiredPermissions.join(", ")}`,
        ),
      );
    }

    next();
  };
}
