import { NextFunction, Request, Response } from "express";
import { User } from "../models/auth/user";
import { AccessTokenPayload, verifyToken } from "../services/tokens";

declare global {
  namespace Express {
    interface Request {
      currentUser?: any;
    }
  }
}

export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session?.jwt) {
    return next();
  }

  try {
    const payload = verifyToken(req.session.jwt) as AccessTokenPayload;

    const userData = await User.findOne({ email: payload.email });
    req.currentUser = userData;
  } catch (error) {}

  next();
};
