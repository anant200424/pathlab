import { Types } from "mongoose";
import {
  TestResult,
  ITestResult,
  IParameterResult,
  ResultFlag,
} from "./result.model.js";
import { TestOrder } from "../orders/order.model.js";
import {
  TestDefinition,
  IReferenceRange,
} from "../tests/test-definition.model.js";
import { Patient } from "../patients/patient.model.js";
import { DoctorProfile } from "../doctors/doctor.model.js";
import { AppError } from "../../common/errors/app-error.js";
import { AuditService } from "../audit/audit.service.js";

export class ResultService {
  static async getResultsByOrderId(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw AppError.badRequest("Invalid order ID.");
    }

    return TestResult.find({ orderId: new Types.ObjectId(orderId) })
      .populate("testId", "testCode name department specimenType")
      .populate("enteredBy", "firstName lastName email")
      .populate("verifiedBy", "doctorId fullName qualification specialization");
  }

  static async getResultById(id: string): Promise<ITestResult> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid result ID.");
    }
    const result = await TestResult.findById(id)
      .populate("testId")
      .populate("orderId")
      .populate("patientId")
      .populate("enteredBy", "firstName lastName")
      .populate("verifiedBy", "doctorId fullName qualification specialization");

    if (!result) {
      throw AppError.notFound("Test result not found.");
    }
    return result;
  }

  static async enterResults(
    resultId: string,
    parameterValues: Array<{ parameterCode: string; value: string }>,
    remarks?: string,
    actorId?: string,
  ): Promise<ITestResult> {
    const result = await this.getResultById(resultId);
    const testDef = await TestDefinition.findById(result.testId);
    const patient = await Patient.findById(result.patientId);

    if (!testDef || !patient) {
      throw AppError.notFound(
        "Associated test definition or patient record missing.",
      );
    }

    const calculatedParams: IParameterResult[] = [];
    const patientGender = patient.gender || "both";
    const patientAge = patient.ageYears ?? 30;

    for (const pVal of parameterValues) {
      const paramDef = testDef.parameters.find(
        (p) => p.parameterCode === pVal.parameterCode,
      );
      if (!paramDef) {
        continue;
      }

      // Find matching reference range based on gender & age
      let matchedRange: IReferenceRange | undefined =
        paramDef.referenceRanges.find(
          (r) =>
            (r.gender === "both" || r.gender === patientGender) &&
            (r.minAgeYears === undefined || patientAge >= r.minAgeYears) &&
            (r.maxAgeYears === undefined || patientAge <= r.maxAgeYears),
        );

      if (!matchedRange && paramDef.referenceRanges.length > 0) {
        matchedRange = paramDef.referenceRanges[0];
      }

      let flag: ResultFlag = "normal";
      let numericValue: number | undefined;

      if (paramDef.dataType === "numeric") {
        const parsed = parseFloat(pVal.value);
        if (!isNaN(parsed)) {
          numericValue = parsed;
          if (matchedRange) {
            if (
              matchedRange.criticalLow !== undefined &&
              numericValue <= matchedRange.criticalLow
            ) {
              flag = "critical_low";
            } else if (
              matchedRange.criticalHigh !== undefined &&
              numericValue >= matchedRange.criticalHigh
            ) {
              flag = "critical_high";
            } else if (
              matchedRange.normalMin !== undefined &&
              numericValue < matchedRange.normalMin
            ) {
              flag = "abnormal_low";
            } else if (
              matchedRange.normalMax !== undefined &&
              numericValue > matchedRange.normalMax
            ) {
              flag = "abnormal_high";
            }
          }
        }
      }

      calculatedParams.push({
        parameterCode: paramDef.parameterCode,
        name: paramDef.name,
        value: pVal.value,
        numericValue,
        unit: paramDef.unit,
        referenceRangeText:
          matchedRange?.textRange ||
          (matchedRange?.normalMin !== undefined &&
          matchedRange?.normalMax !== undefined
            ? `${matchedRange.normalMin} - ${matchedRange.normalMax}`
            : ""),
        flag,
        method: paramDef.method,
      });
    }

    result.parameterResults = calculatedParams;
    result.remarks = remarks;
    result.enteredBy = actorId ? new Types.ObjectId(actorId) : undefined;
    result.enteredAt = new Date();
    result.status = "pending_verification";
    await result.save();

    // Check if order status should advance to awaiting_verification
    const allOrderResults = await TestResult.find({ orderId: result.orderId });
    const allPendingOrVerified = allOrderResults.every(
      (r) => r.status === "pending_verification" || r.status === "verified",
    );

    if (allPendingOrVerified) {
      const order = await TestOrder.findById(result.orderId);
      if (
        order &&
        (order.status === "processing" || order.status === "sample_collected")
      ) {
        order.status = "awaiting_verification";
        order.statusHistory.push({
          status: "awaiting_verification",
          changedBy: actorId ? new Types.ObjectId(actorId) : undefined,
          changedAt: new Date(),
          note: "All entered test results ready for pathologist review.",
        });
        await order.save();
      }
    }

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "results:enter",
      entityType: "TestResult",
      entityId: result._id.toString(),
      clinicId: result.clinicId,
      details: { orderId: result.orderId, testId: result.testId },
    });

    return result;
  }

  static async verifyResult(
    resultId: string,
    verifyingDoctorId: string,
    actorId?: string,
  ): Promise<ITestResult> {
    const result = await this.getResultById(resultId);

    // Validate verifying doctor
    if (!Types.ObjectId.isValid(verifyingDoctorId)) {
      throw AppError.badRequest("Invalid verifying doctor ID.");
    }

    const doctor = await DoctorProfile.findById(verifyingDoctorId);
    if (!doctor || !doctor.isActive || !doctor.isVerifyingDoctor) {
      throw AppError.forbidden(
        "Selected doctor is not authorized as a verifying pathologist / approving professional.",
      );
    }

    result.status = "verified";
    result.verifiedBy = doctor._id as Types.ObjectId;
    result.verifiedAt = new Date();
    await result.save();

    // Check if all results for this order are now verified
    const allOrderResults = await TestResult.find({ orderId: result.orderId });
    const allVerified = allOrderResults.every((r) => r.status === "verified");

    if (allVerified) {
      const order = await TestOrder.findById(result.orderId);
      if (
        order &&
        order.status !== "verified" &&
        order.status !== "published"
      ) {
        order.status = "verified";
        order.verifyingDoctorId = doctor._id as Types.ObjectId;
        order.statusHistory.push({
          status: "verified",
          changedBy: actorId ? new Types.ObjectId(actorId) : undefined,
          changedAt: new Date(),
          note: `All results verified by Dr. ${doctor.fullName}.`,
        });
        await order.save();
      }
    }

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "results:verify",
      entityType: "TestResult",
      entityId: result._id.toString(),
      clinicId: result.clinicId,
      details: { verifyingDoctorId: doctor._id, doctorName: doctor.fullName },
    });

    return result;
  }

  static async rejectResult(
    resultId: string,
    rejectionReason: string,
    actorId?: string,
  ): Promise<ITestResult> {
    const result = await this.getResultById(resultId);

    result.status = "rejected";
    result.rejectionReason = rejectionReason;
    await result.save();

    // Revert order status back to processing
    const order = await TestOrder.findById(result.orderId);
    if (order && order.status === "awaiting_verification") {
      order.status = "processing";
      order.statusHistory.push({
        status: "processing",
        changedBy: actorId ? new Types.ObjectId(actorId) : undefined,
        changedAt: new Date(),
        note: `Results rejected for review: ${rejectionReason}`,
      });
      await order.save();
    }

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "results:reject",
      entityType: "TestResult",
      entityId: result._id.toString(),
      clinicId: result.clinicId,
      details: { rejectionReason },
    });

    return result;
  }

  static async amendResult(
    resultId: string,
    parameterValues: Array<{ parameterCode: string; value: string }>,
    reason: string,
    remarks?: string,
    actorId?: string,
  ): Promise<ITestResult> {
    const result = await this.getResultById(resultId);

    // Save current version into revisions
    const currentVersion = (result.revisions.length || 0) + 1;
    result.revisions.push({
      version: currentVersion,
      parameterResults: [...result.parameterResults],
      remarks: result.remarks,
      amendedBy: new Types.ObjectId(actorId),
      amendedAt: new Date(),
      reason,
    });

    // Re-enter with new values
    const updated = await this.enterResults(
      resultId,
      parameterValues,
      remarks,
      actorId,
    );
    updated.status = "amended";
    await updated.save();

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "results:amend",
      entityType: "TestResult",
      entityId: result._id.toString(),
      clinicId: result.clinicId,
      details: { amendmentVersion: currentVersion, reason },
    });

    return updated;
  }
}
