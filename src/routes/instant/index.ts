import express, { Request, Response } from "express";
import { body, check } from "express-validator";
import { validateRequest } from "../../middlewares/validate-request";
import { BadRequestError } from "../../errors/bad-request-error";
import { Wallet } from "../../models/wallet/wallet";
import { requireAuth } from "../../middlewares/require-auth";
import { CryptoWallet } from "../../models/cryptoWallet/cryptoWallet";
import { Trade } from "../../models/trades/trade";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const router = express.Router();

router.post(
  "/order",
  requireAuth,
  [
    body("pricePerUnit").not().isEmpty().withMessage("Price cannot be empty"),
    body("side").not().isEmpty().trim().withMessage("Side cannot be empty"),
    body("quantity").not().isEmpty().withMessage("Amount cannot be empty"),
    body("orderType")
      .not()
      .isEmpty()
      .trim()
      .withMessage("Order Type cannot be empty"),
    body("marketPair")
      .not()
      .isEmpty()
      .trim()
      .withMessage("Order Type cannot be empty"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const currentUser = req.currentUser;

    const { side, marketPair, quantity, pricePerUnit, orderType } = req.body;

    const userWallet = await Wallet.findOne({ userId: currentUser?.id });

    const cryptoWallet = await CryptoWallet.findOne({
      currency: "MCOIN",
    });

    const filterCryptoBalance = userWallet?.cryptoBalance.filter(
      (balance: any) => balance.marketPair === marketPair
    );

    if (!userWallet) {
      throw new BadRequestError("Wallet not found");
    }

    if (!cryptoWallet) {
      throw new BadRequestError("Crypto Wallet not found");
    }

    if (quantity > cryptoWallet.availableBalance) {
      throw new BadRequestError("INsufficient available Balance");
    }

    if (filterCryptoBalance && filterCryptoBalance.length === 0) {
      throw new BadRequestError("Not found");
    }

    if (side === "sell" && filterCryptoBalance[0].usableAmount < quantity) {
      throw new BadRequestError("Insufficient funds");
    }

    try {
      if (side === "buy") {
        const totalInrAmount = quantity * pricePerUnit;

        cryptoWallet.availableBalance =
          cryptoWallet.availableBalance - quantity;

        await cryptoWallet.save();

        await Wallet.updateOne(
          {
            userId: currentUser?.id,
            "cryptoBalance.marketPair": marketPair,
          },
          {
            $inc: {
              "cryptoBalance.$.usableAmount": quantity,
              "cryptoBalance.$.amount": quantity,
              "cryptoBalance.$.investedAmountInr":
                quantity * pricePerUnit - 0.02,
              walletInrBalance: -totalInrAmount - 0.02,
              useableInrBalance: -totalInrAmount - 0.02,
            },
          },
          {}
        );

        // const userTrade = await Trade.build({
        //   userId: currentUser?.id,
        //   orderId: uuidv4(),
        //   orderType: orderType,
        //   side: side,
        //   orderStatus: "filled",
        //   fee: 0.2,
        //   pricePerUnit: pricePerUnit,
        //   marketPair: marketPair,
        //   totalQuantity: quantity,
        // });
        // await userTrade.save();

        return res.status(200).json("userTrade");
      } else {
        const investedAmountInr = filterCryptoBalance[0].investedAmountInr; // 120
        const totalQuantity = filterCryptoBalance[0].amount; // 21

        const investAmountToBeDeducted =
          (investedAmountInr * quantity) / totalQuantity; //( 120 * 20 ) / 21

        const totalInrAmount = quantity * pricePerUnit;

        await Wallet.updateOne(
          {
            userId: currentUser?.id,
            "cryptoBalance.marketPair": marketPair,
          },
          {
            $inc: {
              "cryptoBalance.$.usableAmount": -quantity,
              "cryptoBalance.$.amount": -quantity,
              "cryptoBalance.$.investedAmountInr": -investAmountToBeDeducted,
              walletInrBalance: totalInrAmount - 0.02,
              useableInrBalance: totalInrAmount - 0.02,
            },
          },
          {}
        );

        cryptoWallet.availableBalance =
          cryptoWallet.availableBalance + quantity;
        await cryptoWallet.save();

        // const userTrade = await Trade.build({
        //   userId: currentUser?.id,
        //   orderId: uuidv4(),
        //   orderType: orderType,
        //   side: side,
        //   orderStatus: "filled",
        //   fee: 0.2,
        //   pricePerUnit: pricePerUnit,
        //   marketPair: marketPair,
        //   totalQuantity: quantity,
        // });
        // await userTrade.save();

        return res.status(200).json("userTrade");
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestError("Something went wrong");
    }
  }
);

router.post("/ticker", async (req: Request, res: Response) => {
  const { amount } = req.body;

  try {
    const { data } = await axios.get(
      "https://api.coinpaprika.com/v1/tickers/mcoin-mcoin"
    );

    const USDINR = 74.65;
    const tokenPrice = data.quotes.USD.price * USDINR;

    const totalMCoin = amount / tokenPrice;

    const totalInrAmount = amount * tokenPrice;

    const totalPrice = {
      price: totalInrAmount,
      amount: totalMCoin,
      pricePerUnit: tokenPrice,
      totalInrPrice: amount,
    };

    res.status(200).json(totalPrice);
  } catch (error) {
    console.log("error", error);
    throw new BadRequestError("Something went wrong");
  }
});

router.get("/ticker/mcoin", async (req: Request, res: Response) => {
  const { data } = await axios.get(
    "https://api.coinpaprika.com/v1/tickers/mcoin-mcoin"
  );

  res.status(200).json(data);
});

export { router as instantRouter };
