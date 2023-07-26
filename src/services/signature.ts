import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export const getSignature = (body: any, baseApiurl: string) => {
  const payload = Buffer.from(JSON.stringify(body)).toString();
  const signature = crypto
    .createHmac("sha256", process.env.COINDCX_SECRET!)
    .update(payload)
    .digest("hex");

  const config = {
    headers: {
      "X-AUTH-APIKEY": process.env.COINDCX_KEY!,
      "X-AUTH-SIGNATURE": signature,
      // Host: "api.coindcx.com",
    },
  };

  return { config: config };
};
