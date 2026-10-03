import { Request, Response, NextFunction } from "express";
import { TestService } from "./test.service.js";

export class TestController {
  static async createTest(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const test = await TestService.createTest(
        req.body,
        req.user?._id?.toString(),
      );
      res.status(201).json({
        success: true,
        data: test,
        message: "Test definition created successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async listTests(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { department, category, search, isActive, page, limit } = req.query;
      const result = await TestService.listTests({
        department: department as string,
        category: category as string,
        search: search as string,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTestById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const test = await TestService.getTestById(req.params["id"] as string);
      res.status(200).json({
        success: true,
        data: test,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTest(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const test = await TestService.updateTest(
        req.params["id"] as string,
        req.body,
        req.user?._id?.toString(),
      );
      res.status(200).json({
        success: true,
        data: test,
        message: "Test definition updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Packages ---

  static async createPackage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pkg = await TestService.createPackage(
        req.body,
        req.user?._id?.toString(),
      );
      res.status(201).json({
        success: true,
        data: pkg,
        message: "Test package created successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async listPackages(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { search, isActive } = req.query;
      const pkgs = await TestService.listPackages({
        search: search as string,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
      });
      res.status(200).json({
        success: true,
        data: pkgs,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPackageById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const pkg = await TestService.getPackageById(req.params["id"] as string);
      res.status(200).json({
        success: true,
        data: pkg,
      });
    } catch (error) {
      next(error);
    }
  }
}
