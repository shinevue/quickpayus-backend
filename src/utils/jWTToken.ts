import { Response } from 'express';

const sendToken = (user: any, statusCode: number, res: Response, data: any) => {
  const token = user.getJWTToken();

  res
    .status(statusCode)
    .json({
      success: true,
      user,
      token,
      ...data
    });
};

export default sendToken;