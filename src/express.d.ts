import * as express from 'express';
import { IUser } from './models/userModel';

export interface IUserWithId extends IUser {
  _id: ObjectId;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUserWithId;
    }
  }
}
