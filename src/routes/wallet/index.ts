import express, { Request, Response } from "express";
// import { body, check } from "express-validator";
import dotenv from "dotenv";
// import { validateRequest } from "../../middlewares/validate-request";
import { requireAuth } from "../../middlewares/require-auth";
import { currentUser } from "../../middlewares/current-user";
import { body, check } from "express-validator";
import { Wallet } from "../../models/wallet/wallet";
import { User } from "../../models/auth/user";
import { CryptoWallet } from "../../models/cryptoWallet/cryptoWallet";
import { BadRequestError } from "../../errors/bad-request-error";
import { validateRequest } from "../../middlewares/validate-request";
import axios from "axios";

import {
  generateWallet,
  Currency,
  sendEthOffchainTransaction,
  getDepositAddressesForAccount,
} from "@tatumio/tatum";

dotenv.config();

const router = express.Router();

// ------------------- User wallet details ------------------------ //
router.get("/tdetails", requireAuth, async (req: Request, res: Response) => {
  const currentUser = req.currentUser;

  const user = await User.findById(currentUser.id);

  if (!user) {
    throw new BadRequestError("User does not exists");
  }

  const config = {
    headers: {
      "x-api-key": process.env.TATUM_API_KEY!,
      "Content-Type": "application/json",
    },
  };

  try {
    const { data } = await axios.get(
      `${process.env.TATUM_API_URL}/v3/ledger/account/customer/${user.walletCustomerId}?pageSize=50`,
      config
    );

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    throw new BadRequestError("Failed to fetch wallet information");
  }
});
// ------------------------------------------------------------------------ //

// ------------------------- Generate Deposit Address --------------------- //
router.get(
  "/tgenerateDeposit/:accId",
  requireAuth,
  async (req: Request, res: Response) => {
    const { accId } = req.params;
    try {
      const config = {
        headers: {
          "x-api-key": process.env.TATUM_API_KEY!,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post(
        `${process.env.TATUM_API_URL}/v3/offchain/account/${accId}/address`,
        {},
        config
      );

      res.status(200).json(data);
    } catch (error) {
      console.log("error", error);
      throw new BadRequestError("Failed to generate deposit address");
    }
  }
);

// ------------------------------------------------------------------------ //

// -------------------------- Eth withdrawal ------------------------------ //

// router.post("/withdrawal", async (req: Request, res: Response) => {
//   const { senderAccId } = req.body;

//   try {
//     const result = await getDepositAddressesForAccount(senderAccId);

//     console.log("result", result);

//     res.status(200).json({ success: "ok" });
//   } catch (error) {
//     console.log("error", error);
//     throw new BadRequestError("Failed");
//   }
// });

// ----------------- User wallet details ----------------------- //
// router.get("/details", requireAuth, async (req: Request, res: Response) => {
//   const currentUser = req.currentUser;

//   const userWalletDetails = await Wallet.find({ userId: currentUser?.id });

//   if (!userWalletDetails) {
//     throw new BadRequestError("Wallet for this user doesn't exists");
//   }

//   res.status(200).json(userWalletDetails);
// });

// Create a crypto wallet
// router.post(
//   "/cryptoWallet",
//   [
//     body("totalBalance")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Total Balance cannot be empty"),
//     body("availableBalance")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Available Balance cannot be empty"),
//     body("currency")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Currency cannot be empty"),
//     body("active").not().isEmpty().withMessage("Active cannot be empty"),
//     body("frozen").not().isEmpty().withMessage("Frozen cannot be empty"),
//   ],
//   validateRequest,
//   async (req: Request, res: Response) => {
//     const createWallet = await CryptoWallet.build(req.body);
//     await createWallet.save();

//     res.status(200).json(createWallet);
//   }
// );

export { router as walletRouter };
