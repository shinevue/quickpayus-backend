import { Response } from 'express';
import { User } from './User'; // Replace with your User interface or class

interface SendTokenData {
  // Define the structure of your data object
}

const sendToken = (user: User, statusCode: number, res: Response, data: SendTokenData) => {
  const token = user.getJWTToken();

  //option for cookie
  const options = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRE as number) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res
    .status(statusCode)
    // .cookie("token", token, options)
    .json({
      success: true,
      user,
      token,
      ...data
    });
};

export default sendToken;