import { IUser } from "../modules/users/user.model.js";
import { ISession } from "../modules/auth/session.model.js";
import { IRole } from "../modules/roles/role.model.js";
import { Permission } from "../modules/roles/role.constants.js";

export interface IUserPopulated extends Omit<IUser, "roles"> {
  roles: IRole[];
}

declare global {
  namespace Express {
    interface Request {
      user?: IUserPopulated;
      session?: ISession;
      permissions?: Permission[];
      clinicId?: string;
      id?: string;
      isSuperAdmin?: boolean;
    }
  }
}

export {};
