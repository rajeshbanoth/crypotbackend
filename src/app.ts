import express, { Request, Response } from "express";
import "express-async-errors";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { errorHandler } from "./middlewares/error-handler";
import { NotFoundError } from "./errors/not-found-error";
import { walletRouter } from "./routes/wallet";
import { paymentRouter } from "./routes/payment";
import { userRouter } from "./routes/user";
import { bankRouter } from "./routes/bank";
import { tradeRouter } from "./routes/trades";
import { kycRouter } from "./routes/kyc";
import { instantRouter } from "./routes/instant";
// import { tradeOrderRouter } from "./routes/binance/tradeOrder";
// import bodyParser from "body-parser";
// import fileUpload from "express-fileupload";

dotenv.config();

const app = express();
// app.set("trust proxy", true);

// Parse the body of the request
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cookieSession({
    signed: false,
    secure: false,
  })
);

app.use(
  cors({
    origin: [
      "https://pyxkrypto-frontend.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(fileUpload({ useTempFiles: false }));
app.use("/v1/api", express.static(__dirname + "/uploads"));

app.get("/test", (req: Request, res: Response) => {
  res.status(200).json({ message: "ok" });
});

// User & Admin auth route
app.use("/v1/api/user", authRouter);
app.use("/v1/api/wallet", walletRouter);
app.use("/v1/api/payment", paymentRouter);
app.use("/v1/api/instant", instantRouter);
app.use("/v1/api", userRouter);
app.use("/v1/api/bank", bankRouter);
app.use("/v1/api/trade", tradeRouter);
app.use("/v1/api/kyc", kycRouter);
// app.use("/v1/api/binance", tradeOrderRouter);

// Not found route
app.all("*", async (req: Request, res: Response) => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
