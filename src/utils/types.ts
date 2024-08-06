import { IUser } from "../models/userModel";

export interface AuthRequest extends Request {
  user: IUser
}