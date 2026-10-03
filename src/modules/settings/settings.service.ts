import { Types } from "mongoose";
import { Setting } from "./settings.model.js";
import { AuditService } from "../audit/audit.service.js";

export class SettingsService {
  static async getAllSettings() {
    return Setting.find().sort({ key: 1 });
  }

  static async getSettingByKey(key: string) {
    return Setting.findOne({ key });
  }

  static async setSetting(
    key: string,
    value: any,
    description?: string,
    actorId?: string,
  ) {
    const setting = await Setting.findOneAndUpdate(
      { key },
      {
        value,
        description,
        updatedBy: actorId ? new Types.ObjectId(actorId) : undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await AuditService.log({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      action: "settings:update",
      entityType: "Setting",
      entityId: setting._id.toString(),
      details: { key, value },
    });

    return setting;
  }
}
