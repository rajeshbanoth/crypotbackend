import { NextFunction, Request, Response } from "express";
import { NotAuthorizedError } from "../errors/not-authorized-error";
import { AccessTokenPayload, verifyToken } from "../services/tokens";

declare global {
  namespace Express {
    interface Request {
      currentUser?: any;
    }
  }
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // if (!req.session?.jwt) {
  //   return next();
  // }

  // try {
  //   const payload = verifyToken(req.session.jwt) as AccessTokenPayload;
  //   req.currentUser = payload;
  // } catch (error) {}

  // next();

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = verifyToken(token) as AccessTokenPayload;

      if (!decoded) {
        throw new NotAuthorizedError();
      }

      req.currentUser = decoded;

      next();
    } catch (error) {
      throw new NotAuthorizedError();
    }
  }

  if (!token) {
    throw new NotAuthorizedError();
  }
};
