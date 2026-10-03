import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { env } from "../../config/env.js";

const ACCESS_COOKIE_NAME = "labcare_access_token";
const REFRESH_COOKIE_NAME = "labcare_refresh_token";

export class AuthController {
  static async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password, clinicId, rememberMe } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const result = await AuthService.login(
        email,
        password,
        clinicId,
        rememberMe,
        ipAddress,
        userAgent,
      );

      // Set AES-encrypted Access Token Cookie (HTTP-only)
      res.cookie(ACCESS_COOKIE_NAME, result.encryptedAccessToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        domain: env.COOKIE_DOMAIN || undefined,
        expires: result.accessTokenExpiresAt,
      });

      // Set AES-encrypted Refresh Token Cookie (HTTP-only, 30 days if rememberMe)
      res.cookie(REFRESH_COOKIE_NAME, result.encryptedRefreshToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        domain: env.COOKIE_DOMAIN || undefined,
        expires: result.refreshTokenExpiresAt,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.encryptedAccessToken,
          refreshToken: result.encryptedRefreshToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt,
          refreshTokenExpiresAt: result.refreshTokenExpiresAt,
          user: result.user,
        },
        message: "Login successful.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const encryptedRefreshToken =
        req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      if (!encryptedRefreshToken) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Refresh token is required in cookie or body.",
            details: [],
          },
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const result = await AuthService.refreshTokens(
        encryptedRefreshToken,
        ipAddress,
        userAgent,
      );

      res.cookie(ACCESS_COOKIE_NAME, result.encryptedAccessToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        domain: env.COOKIE_DOMAIN || undefined,
        expires: result.accessTokenExpiresAt,
      });

      res.cookie(REFRESH_COOKIE_NAME, result.encryptedRefreshToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        domain: env.COOKIE_DOMAIN || undefined,
        expires: result.refreshTokenExpiresAt,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.encryptedAccessToken,
          refreshToken: result.encryptedRefreshToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt,
          refreshTokenExpiresAt: result.refreshTokenExpiresAt,
        },
        message: "Tokens refreshed successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const encryptedRefreshToken =
        req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      if (encryptedRefreshToken) {
        await AuthService.logout(encryptedRefreshToken, ipAddress, userAgent);
      }

      const cookieOpts = {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        domain: env.COOKIE_DOMAIN || undefined,
      };

      res.clearCookie(ACCESS_COOKIE_NAME, cookieOpts);
      res.clearCookie(REFRESH_COOKIE_NAME, cookieOpts);
      res.clearCookie(env.COOKIE_NAME, cookieOpts); // backwards-compat

      res.status(200).json({
        success: true,
        message: "Successfully logged out.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!._id;
      const { currentPassword, newPassword } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      await AuthService.changePassword(
        userId,
        currentPassword,
        newPassword,
        ipAddress,
        userAgent,
      );

      const cookieOpts = {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        domain: env.COOKIE_DOMAIN || undefined,
      };

      res.clearCookie(ACCESS_COOKIE_NAME, cookieOpts);
      res.clearCookie(REFRESH_COOKIE_NAME, cookieOpts);

      res.status(200).json({
        success: true,
        message:
          "Password changed successfully. Please log in again with your new credentials.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await AuthService.getCurrentUser(
        req.user! as any,
        req.permissions || [],
      );
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }
}
