import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { RequestValidationError } from "../errors/request-validation-error";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  console.log("issue in validate request", errors);
  //conosl

  console.log("!errors.isEmpty()", !errors.isEmpty());

  // if (!errors.isEmpty()) {
  //   throw new RequestValidationError(errors.array());
  // }

  next();
};
