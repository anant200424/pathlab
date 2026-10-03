import { Types } from "mongoose";
import { TestDefinition, ITestDefinition } from "./test-definition.model.js";
import { TestPackage, ITestPackage } from "./test-package.model.js";
import { AppError } from "../../common/errors/app-error.js";
import { AuditService } from "../audit/audit.service.js";

export class TestService {
  static async createTest(
    data: Partial<ITestDefinition>,
    actorId?: string,
  ): Promise<ITestDefinition> {
    const existing = await TestDefinition.findOne({
      testCode: data.testCode?.toUpperCase(),
    });
    if (existing) {
      throw AppError.conflict(
        `Test with code '${data.testCode}' already exists.`,
      );
    }

    const test = await TestDefinition.create({
      ...data,
      testCode: data.testCode?.toUpperCase(),
      isActive: true,
      version: 1,
    });

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "tests:create",
      entityType: "TestDefinition",
      entityId: test._id.toString(),
      details: { testCode: test.testCode, name: test.name },
    });

    return test;
  }

  static async listTests(query: {
    department?: string;
    category?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.department) filter.department = query.department;
    if (query.category) filter.category = query.category;
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { testCode: { $regex: query.search, $options: "i" } },
        { department: { $regex: query.search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      TestDefinition.find(filter)
        .sort({ department: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      TestDefinition.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getTestById(id: string): Promise<ITestDefinition> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid test ID.");
    }
    const test = await TestDefinition.findById(id);
    if (!test) {
      throw AppError.notFound("Test definition not found.");
    }
    return test;
  }

  static async updateTest(
    id: string,
    updates: Partial<ITestDefinition>,
    actorId?: string,
  ): Promise<ITestDefinition> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid test ID.");
    }

    const test = await TestDefinition.findById(id);
    if (!test) {
      throw AppError.notFound("Test definition not found.");
    }

    // Increment version if parameters changed
    if (updates.parameters) {
      test.version = (test.version || 1) + 1;
    }

    Object.assign(test, updates);
    await test.save();

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "tests:update",
      entityType: "TestDefinition",
      entityId: test._id.toString(),
      details: { updates },
    });

    return test;
  }

  // --- Packages ---

  static async createPackage(
    data: {
      packageCode: string;
      name: string;
      description?: string;
      tests: string[];
      price: number;
    },
    actorId?: string,
  ): Promise<ITestPackage> {
    const existing = await TestPackage.findOne({
      packageCode: data.packageCode.toUpperCase(),
    });
    if (existing) {
      throw AppError.conflict(
        `Package with code '${data.packageCode}' already exists.`,
      );
    }

    const testObjectIds = data.tests.map((t) => new Types.ObjectId(t));
    const testDocs = await TestDefinition.find({ _id: { $in: testObjectIds } });

    if (testDocs.length !== data.tests.length) {
      throw AppError.badRequest(
        "One or more test IDs in package definition are invalid.",
      );
    }

    const originalPrice = testDocs.reduce((sum, t) => sum + (t.price || 0), 0);

    const pkg = await TestPackage.create({
      packageCode: data.packageCode.toUpperCase(),
      name: data.name,
      description: data.description,
      tests: testObjectIds,
      price: data.price,
      originalPrice,
      isActive: true,
    });

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "packages:create",
      entityType: "TestPackage",
      entityId: pkg._id.toString(),
      details: { packageCode: pkg.packageCode, name: pkg.name },
    });

    return pkg;
  }

  static async listPackages(query: { search?: string; isActive?: boolean }) {
    const filter: Record<string, unknown> = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { packageCode: { $regex: query.search, $options: "i" } },
      ];
    }

    return TestPackage.find(filter).populate("tests").sort({ name: 1 });
  }

  static async getPackageById(id: string): Promise<ITestPackage> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid package ID.");
    }
    const pkg = await TestPackage.findById(id).populate("tests");
    if (!pkg) {
      throw AppError.notFound("Test package not found.");
    }
    return pkg;
  }
}
