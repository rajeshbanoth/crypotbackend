import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { BadRequestError } from "../../errors/bad-request-error";
import { Wallet } from "../../models/wallet/wallet";
import Razorpay from "razorpay";
import { v4 as uuidv4 } from "uuid";
import { body, check } from "express-validator";
import { requireAuth } from "../../middlewares/require-auth";
import { validateRequest } from "../../middlewares/validate-request";
import axios from "axios";
import { Bank } from "../../models/bank/bank";

dotenv.config();

const router = express.Router();

// ----------------- User signup ----------------------- //
router.post(
  "/createOrder",
  requireAuth,
  [body("amount").not().isEmpty().withMessage("amount is required")],
  validateRequest,
  async (req: Request, res: Response) => {
    const { amount } = req.body;

    const razorpay = new Razorpay({
      key_id: "rzp_test_N7DmxNEFQcl5b6",
      key_secret: "bfHz8XgmOOs5HXnB0P9CQbM4",
    });

    const payment_capture = 1;
    const currency = "INR";

    const options = {
      amount: amount * 100,
      currency,
      receipt: uuidv4(),
      payment_capture,
    };

    try {
      const response = await razorpay.orders.create(options);

      res.status(201).json(response);
    } catch (error) {
      throw new BadRequestError("Razorpay Payment issue");
    }
  }
);
// ----------------------------------------------------- //

// ----------------- User signup ----------------------- //
router.post("/updateWallet", async (req: Request, res: Response) => {
  const { amount, userId } = req.body;
  try {
    const razorpayXConfig: any = {
      auth: {
        username: process.env.RAZORPAYX_KEY,
        password: process.env.RAZORPAYX_SCERET,
      },
    };

    const existingUser = await Wallet.findOne({ userId: userId });
    if (!existingUser) {
      throw new BadRequestError("Wallet does not exists");
    }

    Bank.find({ userId: userId }, async (err: any, bank: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: err,
        });
      } else {
        const razorpayxSendData = {
          account_number: "2323230064730563",
          fund_account_id: bank?.razorpayx?.id,
          amount: amount,
          currency: "INR",
          mode: "IMPS",
          purpose: "refund",
          queue_if_low_balance: true,
          reference_id: "Acme Transaction ID 12345",
          narration: "Acme Corp Fund Transfer",
          notes: {
            notes_key_1: "Tea, Earl Grey, Hot",
            notes_key_2: "Tea, Earl Grey… decaf.",
          },
        };

        const { data } = await axios.post(
          "https://api.razorpay.com/v1/payouts",
          razorpayxSendData,
          razorpayXConfig
        );
      }
    });

    existingUser.walletInrBalance = amount;
    existingUser.useableInrBalance = amount;

    await existingUser.save();

    await res.status(200).json({
      success: true,
    });
  } catch (error) {
    // throw new BadRequestError("Razorpay Payment issue");
    console.log(error);
  }
});
// ----------------------------------------------------- //

export { router as paymentRouter };
