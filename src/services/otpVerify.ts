import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { BadRequestError } from "../errors/bad-request-error";
import { verifyToken } from "./tokens";

interface ShortCodePayload {
  shortCode: string;
}

export class OtpVerify {
  static async toVerify(verifyOtp: string, existingEmaiOtp: string) {
    const verifySignedOtp = verifyToken(existingEmaiOtp) as ShortCodePayload;

    if (!verifySignedOtp) {
      throw new BadRequestError("Otp session expired, try again");
    }

    return verifyOtp === verifySignedOtp.shortCode;
  }
}
