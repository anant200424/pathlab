import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service.js";

export class UserController {
  static async createUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await UserService.createUser(
        req.body,
        req.user?._id?.toString(),
      );
      res.status(201).json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
        },
        message: "User created successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, limit, search, clinicId, isActive } = req.query;
      const result = await UserService.listUsers({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        clinicId: clinicId as string,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await UserService.getUserById(req.params["id"] as string);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const updated = await UserService.updateUser(
        req.params["id"] as string,
        req.body,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: updated,
        message: "User updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}
