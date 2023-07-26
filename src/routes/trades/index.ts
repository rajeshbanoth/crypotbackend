import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";
import express, { Request, Response } from "express";
import { body, check } from "express-validator";
import { validateRequest } from "../../middlewares/validate-request";
import { BadRequestError } from "../../errors/bad-request-error";
import { Trade } from "../../models/trades/trade";
import { requireAuth } from "../../middlewares/require-auth";
import { getSignature } from "../../services/signature";
import { NotAuthorizedError } from "../../errors/not-authorized-error";
import { Wallet } from "../../models/wallet/wallet";
import { sortArgsHelper } from "../../services/sortArgsHelper";
import { User } from "../../models/auth/user";

dotenv.config();

// const baseApiurl = "https://api.coindcx.com";

// Place your API key and secret below. You can generate it from the website.
// const key = "2ef2ede1273e07e88745fbe935771639f29350d86f690ff7";
// const secret =
//   "3ca1f59d4d07538750fc345551db24985d287a7f5b04c5f5937f6010db41def5";

const router = express.Router();

// const baseurl = "https://public.coindcx.com";

router.post("/torder", requireAuth, async (req: Request, res: Response) => {
  const currentUser = req.currentUser;
  const {
    price,
    amount,
    pair,
    type,
    currency1AccountId,
    currency2AccountId,
    side,
  } = req.body;

  const userSchema = await User.findById(currentUser.id);

  if (!userSchema) {
    throw new BadRequestError("User does not exists");
  }

  const config = {
    headers: {
      "x-api-key": process.env.TATUM_API_KEY!,
      "Content-Type": "application/json",
    },
  };

  const payload = {
    price,
    amount,
    pair,
    type: side,
    currency1AccountId,
    currency2AccountId,
  };

  try {
    const { data } = await axios.post(
      `${process.env.TATUM_API_URL}/v3/trade`,
      payload,
      config
    );

    let orders;

    const activeOrder = await axios.get(
      `${process.env.TATUM_API_URL}/v3/trade/${data.id}`,
      config
    );

    if (activeOrder.data === "") {
      const filledOrder = await axios.post(
        `${process.env.TATUM_API_URL}/v3/trade/history`,
        {
          pageSize: 50,
          customerId: userSchema.walletCustomerId,
        },
        config
      );

      const filterFilledOrder = filledOrder.data.filter((order: any) => {
        return order.id === data.id;
      });

      if (filterFilledOrder.length > 0) {
        orders = filterFilledOrder[0];
      }
    } else {
      orders = activeOrder.data;
    }

    const newTradeOrder = await Trade.build({
      orderId: data.id,
      customerId: userSchema.walletCustomerId,
      userId: userSchema.id,
      orderType: type,
      // price: orders?.price,
      // pair: orders?.pair,
      // fill: orders?.fill,
      // amount: orders?.amount,
      // fee: orders?.fee,
      // side: orders?.type,
    });
    await newTradeOrder.save();

    res.status(200).json({ ...orders, orders: newTradeOrder });
  } catch (error) {
    console.log(error);
    throw new BadRequestError("Failed to place the order");
  }
});

router.post("/tactiveOrders", async (req: Request, res: Response) => {
  const { customerId, pair } = req.body;

  try {
    const config = {
      headers: {
        "x-api-key": process.env.TATUM_API_KEY!,
        "Content-Type": "application/json",
      },
    };

    const pendingOrders: any = [];

    const activeBuys = await axios.post(
      `${process.env.TATUM_API_URL}/v3/trade/buy`,
      {
        pageSize: 50,
        customerId: customerId,
        pair: pair,
      },
      config
    );
    activeBuys.data.forEach((buy: any) => pendingOrders.push(buy));

    const activeSells = await axios.post(
      `${process.env.TATUM_API_URL}/v3/trade/sell`,
      {
        pageSize: 50,
        customerId: customerId,
        pair: pair,
      },
      config
    );
    activeSells.data.forEach((buy: any) => pendingOrders.push(buy));

    res.status(200).json(pendingOrders);
  } catch (error) {
    throw new BadRequestError("Failed to fetch pendingOrders");
  }
});

router.get("/tcancelOrder/:orderId", async (req: Request, res: Response) => {
  const { orderId } = req.params;
  try {
    const config = {
      headers: {
        "x-api-key": process.env.TATUM_API_KEY!,
        "Content-Type": "application/json",
      },
    };

    const { data } = await axios.delete(
      `${process.env.TATUM_API_URL}/v3/trade/${orderId}`,
      config
    );

    console.log("data", data);

    res.status(200).json(data);
  } catch (error) {
    console.log("error", error);
    throw new BadRequestError("Failed to cancel order");
  }
});

// // Get order book info of a certain market pair
// router.get("/orderBook/:exchangeId", async (req: Request, res: Response) => {
//   const { exchangeId } = req.params;
//   const { data, status } = await axios.get(
//     baseurl + `/market_data/orderbook?pair=B-${exchangeId}_INR`
//   );

//   const response = await axios.get("https://api.coindcx.com/exchange/ticker");

//   const filterData = response.data.filter((coin: any) => {
//     // console.log("coin", coin.market);
//     return coin.market === `${exchangeId}INR`;
//   });

//   data["market"] = Array.isArray(filterData)
//     ? filterData.length > 0
//       ? filterData[0]
//       : {}
//     : {};

//   res.status(200).send(data);
// });

// // Get single Market pair
// router.get("/marketPair/:pair", async (req: Request, res: Response) => {
//   const { pair } = req.params;

//   try {
//     const { data } = await axios.get("https://api.coindcx.com/exchange/ticker");

//     const filterData = data.filter((coin: any) => {
//       // console.log("coin", coin.market);
//       return coin.market === pair;
//     });

//     res
//       .status(200)
//       .json(
//         Array.isArray(filterData)
//           ? filterData.length > 0
//             ? filterData[0]
//             : {}
//           : {}
//       );
//   } catch (error) {
//     throw new BadRequestError("Something went wrong");
//   }
// });

// // Get All Market pair
// router.get("/marketPair", async (req: Request, res: Response) => {
//   try {
//     const { data } = await axios.get("https://api.coindcx.com/exchange/ticker");

//     const filterData = data.filter((pair: any) => pair.market.includes("INR"));

//     res.status(200).json(filterData);
//   } catch (error) {
//     console.log("error", error);
//     throw new BadRequestError("Something went wrong");
//   }
// });

// // Put a buy order for a certain market pair
// router.post(
//   "/buySellOrder",
//   requireAuth,
//   [
//     body("pricePerUnit")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Price cannot be empty"),
//     body("side")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Side cannot be empty"),
//     body("quantity")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Amount cannot be empty"),
//     body("orderType")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Order Type cannot be empty"),
//     body("marketPair")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Order Type cannot be empty"),
//   ],
//   validateRequest,
//   async (req: Request, res: Response) => {
//     const {
//       pricePerUnit,
//       quantity,
//       side,
//       orderType,
//       marketPair,
//       actualOrderType,
//     } = req.body;

//     const currentUser = req.currentUser;
//     const baseApiurl: string = "https://api.coindcx.com";

//     if (!currentUser?.id) {
//       throw new NotAuthorizedError();
//     }

//     const userWallet = await Wallet.findOne({ userId: currentUser?.id });

//     if (!userWallet) {
//       throw new BadRequestError("Wallet not found");
//     }

//     const timeStamp = Math.floor(Date.now());

//     let body = {};

//     body = {
//       side: side, //Toggle between 'buy' or 'sell'.
//       order_type: orderType, //Toggle between a 'market_order', 'limit_order', 'instant_order'.
//       market: marketPair, //Replace 'SNTBTC' with your desired market.
//       price_per_unit: pricePerUnit, //This parameter is only required for a 'limit_order'
//       total_quantity: quantity, //Replace this with the quantity you want
//       timestamp: timeStamp,
//     };

//     const { config } = getSignature(body, baseApiurl);

//     try {
//       const { data } = await axios.post(
//         baseApiurl + "/exchange/v1/orders/create",
//         body,
//         config
//       );

//       const orderData = data.orders[0];

//       // const userTrade = await Trade.build({
//       //   userId: currentUser?.id,
//       //   orderId: orderData?.id,
//       //   orderType:
//       //     actualOrderType === "market_order"
//       //       ? "market_order"
//       //       : orderData?.order_type,
//       //   side: orderData?.side,
//       //   orderStatus: orderData?.status,
//       //   fee: orderData?.fee,
//       //   pricePerUnit: orderData?.price_per_unit,
//       //   marketPair: orderData?.market,
//       //   totalQuantity: orderData?.total_quantity,
//       // });
//       // await userTrade.save();

//       // if (userTrade.side === "buy") {
//       //   const totalAmount = userTrade.totalQuantity * userTrade.pricePerUnit;

//       //   const usableWalletBalance: number = userWallet.useableInrBalance;

//       //   userWallet.useableInrBalance = usableWalletBalance - totalAmount - 0.02;

//       //   await userWallet.save();
//       // }

//       // if (userTrade.side === "sell") {
//       //   await Wallet.updateOne(
//       //     {
//       //       userId: currentUser?.id,
//       //       "cryptoBalance.marketPair": userTrade.marketPair,
//       //     },
//       //     {
//       //       $inc: {
//       //         "cryptoBalance.$.usableAmount": -userTrade.totalQuantity,
//       //       },
//       //     },
//       //     {}
//       //   );
//       // }

//       res.status(200).send("userTrade");
//     } catch (error) {
//       let errorMessage = "Something went wrong";

//       console.log("error", error);

//       if (error?.response?.data?.message) {
//         errorMessage = error?.response?.data?.message;
//       }

//       throw new BadRequestError(errorMessage);
//     }
//   }
// );

// // Put a buy or sell order via wazirx api
// router.post(
//   "/wbuySellOrder",
//   requireAuth,
//   [
//     body("pricePerUnit")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Price cannot be empty"),
//     body("side")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Side cannot be empty"),
//     body("quantity")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Amount cannot be empty"),
//     body("orderType")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Order Type cannot be empty"),
//     body("marketPair")
//       .not()
//       .isEmpty()
//       .trim()
//       .withMessage("Order Type cannot be empty"),
//   ],
//   validateRequest,
//   async (req: Request, res: Response) => {
//     const {
//       pricePerUnit,
//       quantity,
//       side,
//       orderType,
//       marketPair,
//       actualOrderType,
//       stopPrice,
//     } = req.body;

//     const currentUser = req.currentUser;

//     if (!currentUser?.id) {
//       throw new NotAuthorizedError();
//     }

//     const userWallet = await Wallet.findOne({ userId: currentUser?.id });

//     if (!userWallet) {
//       throw new BadRequestError("Wallet not found");
//     }

//     let body = {};

//     if (orderType === "limit") {
//       body = {
//         side: side, //Toggle between 'buy' or 'sell'.
//         orderType: orderType, //Toggle between a 'market_order', 'limit_order', 'instant_order'.
//         marketPair: marketPair, //Replace 'SNTBTC' with your desired market.
//         pricePerUnit: pricePerUnit, //This parameter is only required for a 'limit_order'
//         quantity: quantity, //Replace this with the quantity you want
//       };
//     } else if (orderType === "stop_limit") {
//       body = {
//         side: side, //Toggle between 'buy' or 'sell'.
//         orderType: orderType, //Toggle between a 'market_order', 'limit_order', 'instant_order'.
//         marketPair: marketPair, //Replace 'SNTBTC' with your desired market.
//         pricePerUnit: pricePerUnit, //This parameter is only required for a 'limit_order'
//         quantity: quantity, //Replace this with the quantity you want
//         stopPrice: stopPrice,
//       };
//     }

//     const config = {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     };

//     try {
//       const { data } =
//         orderType === "limit"
//           ? await axios.post(
//               // `${process.env.TRADE_API}/createOrder`,
//               `${process.env.TRADE_API}/createOrder`,
//               body,
//               config
//             )
//           : await axios.post(
//               `${process.env.TRADE_API}/createOrderLimit`,
//               // "https://pyxkrypto-flask.herokuapp.com/createOrder",
//               body,
//               config
//             );

//       if (data[0] !== 200 && data[0] !== 201) {
//         return res
//           .status(data[0])
//           .json({ errors: [{ message: data[1].message }] });
//       }

//       // const userTrade = await Trade.build({
//       //   userId: currentUser?.id,
//       //   orderId: data[1]?.id,
//       //   orderType: actualOrderType === "market" ? "market" : data[1]?.type,
//       //   side: data[1]?.side,
//       //   orderStatus: data[1]?.status,
//       //   fee: 0.0,
//       //   pricePerUnit: data[1]?.price,
//       //   marketPair: data[1]?.symbol.toUpperCase(),
//       //   totalQuantity: data[1]?.origQty,
//       // });
//       // await userTrade.save();

//       // if (userTrade.side === "buy") {
//       //   const totalAmount = userTrade.totalQuantity * userTrade.pricePerUnit;

//       //   const usableWalletBalance: number = userWallet.useableInrBalance;

//       //   userWallet.useableInrBalance = usableWalletBalance - totalAmount - 0.02;

//       //   await userWallet.save();
//       // }

//       // if (userTrade.side === "sell") {
//       //   await Wallet.updateOne(
//       //     {
//       //       userId: currentUser?.id,
//       //       "cryptoBalance.marketPair": userTrade.marketPair,
//       //     },
//       //     {
//       //       $inc: {
//       //         "cryptoBalance.$.usableAmount": -userTrade.totalQuantity,
//       //       },
//       //     },
//       //     {}
//       //   );
//       // }

//       // if (data[1].status === "done") {
//       //   const userWallet = await Wallet.findOne({ userId: currentUser?.id });

//       //   if (!userWallet) {
//       //     throw new BadRequestError("User wallet does not exist");
//       //   }

//       // const filterCryptoBalance = userWallet?.cryptoBalance.filter(
//       //   (balance: any) => balance.marketPair === data[1].symbol.toUpperCase()
//       // );

//       //   // console.log("filterCryptoBalance", filterCryptoBalance);

//       //   if (filterCryptoBalance && filterCryptoBalance.length === 0) {
//       //     throw new BadRequestError("Not found");
//       //   }

//       //   userTrade.orderStatus = data[1].status;
//       //   await userTrade.save();

//       //   if (data[1].side === "buy") {
//       //     await Wallet.updateOne(
//       //       {
//       //         userId: currentUser?.id,
//       //         "cryptoBalance.marketPair": userTrade.marketPair,
//       //       },
//       //       {
//       //         $inc: {
//       //           "cryptoBalance.$.amount": userTrade.totalQuantity,
//       //           walletInrBalance:
//       //             -userTrade.totalQuantity * userTrade.pricePerUnit - 0.02,

//       //           "cryptoBalance.$.investedAmountInr":
//       //             userTrade.totalQuantity * userTrade.pricePerUnit - 0.02,
//       //           "cryptoBalance.$.usableAmount": userTrade.totalQuantity,
//       //         },
//       //       },
//       //       {}
//       //     );
//       //   } else {
//       //     const investedAmountInr = filterCryptoBalance[0].investedAmountInr; // 120
//       //     const totalQuantity = filterCryptoBalance[0].amount; // 21

//       // const investAmountToBeDeducted =
//       //   (investedAmountInr * userTrade.totalQuantity) / totalQuantity; //( 120 * 20 ) / 21

//       //     // console.log("investAmountToBeDeducted", investAmountToBeDeducted);

//       //     await Wallet.updateOne(
//       //       {
//       //         userId: currentUser?.id,
//       //         "cryptoBalance.marketPair": userTrade.marketPair,
//       //       },
//       //       {
//       //         $inc: {
//       //           "cryptoBalance.$.amount": -userTrade.totalQuantity,
//       //           walletInrBalance:
//       //             userTrade.totalQuantity * userTrade.pricePerUnit - 0.02,
//       //           useableInrBalance:
//       //             userTrade.totalQuantity * userTrade.pricePerUnit - 0.02,
//       //           "cryptoBalance.$.investedAmountInr": -investAmountToBeDeducted,
//       //         },
//       //       },
//       //       {}
//       //     );
//       //   }

//       //   return res.status(200).json(userTrade);
//       // }

//       res.status(200).send("userTrade");
//     } catch (error) {
//       let errorMessage = "Something went wrong";
//       if (error?.response?.data?.message) {
//         errorMessage = error?.response?.data?.message;
//       }

//       throw new BadRequestError(errorMessage);
//     }
//   }
// );

// router.get("/activeOrders/:pair", async (req: Request, res: Response) => {
//   const { pair } = req.params;
//   const baseApiurl: string = "https://api.coindcx.com";

//   const timeStamp = Math.floor(Date.now());
//   const body = {
//     side: "buy", //Toggle between 'buy' or 'sell'.
//     market: "TRXINR", //Replace 'SNTBTC' with your desired market.
//     timestamp: timeStamp,
//   };

//   const { config } = getSignature(body, baseApiurl);

//   try {
//     const { data } = await axios.post(
//       baseApiurl + "/exchange/v1/orders/active_orders",
//       body,
//       config
//     );

//     res.status(200).send(data);
//   } catch (error) {
//     // console.log(error);
//     throw new BadRequestError("Something went wrong");
//   }
// });

// router.get(
//   "/checkOrderStatus",
//   requireAuth,
//   async (req: Request, res: Response) => {
//     const currentUser = req.currentUser;

//     const baseApiurl: string = "https://api.coindcx.com";

//     const filterOpenOrders = await Trade.find({
//       userId: currentUser.id,
//       orderStatus: "open",
//     });

//     const userWallet = await Wallet.findOne({ userId: currentUser?.id });

//     if (!userWallet) {
//       throw new BadRequestError("Wallet not found");
//     }

//     if (filterOpenOrders.length === 0) {
//       throw new BadRequestError("No open orders");
//     }

//     const orderIds = [];

//     for (let i = 0; i < filterOpenOrders.length; i++) {
//       orderIds.push(filterOpenOrders[i].orderId);
//     }

//     const timeStamp = Math.floor(Date.now());
//     const body = {
//       ids: orderIds,
//       timestamp: timeStamp,
//     };

//     const { config } = getSignature(body, baseApiurl);

//     try {
//       const { data } = await axios.post(
//         baseApiurl + "/exchange/v1/orders/status_multiple",
//         body,
//         config
//       );

//       const finalData = [];

//       for (let i = 0; i < data.length; i++) {
//         const temp = {
//           orderId: data[i].id,
//           side: data[i].side,
//           orderType: data[i].order_type,
//           orderStatus: data[i].status,
//           pricePerUnit: data[i].price_per_unit,
//           marketPair: data[i].market,
//           totalQuantity: data[i].total_quantity,
//         };

//         const findOpenOrder = await Trade.findOne({ orderId: data[i].id });

//         if (!findOpenOrder) {
//           // throw new BadRequestError("Could not find open order");
//           console.log("Could not find open order");
//         } else {
//           if (temp.orderStatus === "filled") {
//             findOpenOrder.orderStatus = data.status;

//             const updatedOrder = await findOpenOrder.save();

//             if (updatedOrder.side === "buy") {
//               const totalAmount =
//                 updatedOrder.totalQuantity * updatedOrder.pricePerUnit;

//               const walletBalance: number = userWallet.walletInrBalance;

//               userWallet.walletInrBalance = walletBalance - totalAmount - 0.5;
//               await userWallet.save();

//               await Wallet.updateOne(
//                 {
//                   userId: currentUser?.id,
//                   "cryptoBalance.marketPair": updatedOrder.marketPair,
//                 },
//                 {
//                   $inc: {
//                     "cryptoBalance.$.amount": updatedOrder.totalQuantity,
//                     "cryptoBalance.$.usableAmount": updatedOrder.totalQuantity,
//                   },
//                 },
//                 {}
//               );
//             } else {
//               const totalAmount =
//                 updatedOrder.totalQuantity * updatedOrder.pricePerUnit;

//               const walletBalance: number = userWallet.walletInrBalance;

//               userWallet.walletInrBalance = walletBalance + totalAmount - 0.5;
//               userWallet.useableInrBalance = walletBalance + totalAmount - 0.5;
//               await userWallet.save();

//               await Wallet.updateOne(
//                 {
//                   userId: currentUser?.id,
//                   "cryptoBalance.marketPair": updatedOrder.marketPair,
//                 },
//                 {
//                   $inc: {
//                     "cryptoBalance.$.amount": -updatedOrder.totalQuantity,
//                     "cryptoBalance.$.usableAmount": -updatedOrder.totalQuantity,
//                   },
//                 },
//                 {}
//               );
//             }

//             finalData.push(updatedOrder);
//           } else {
//             finalData.push(temp);
//           }
//         }
//       }

//       res.status(200).json(finalData);
//     } catch (error) {}

//     // console.log(filterOpenOrders);
//   }
// );

// router.get("/orderStatus/:orderId", async (req: Request, res: Response) => {
//   const { orderId } = req.params;

//   const baseApiurl: string = "https://api.coindcx.com";

//   const timeStamp = Math.floor(Date.now());
//   const body = {
//     id: orderId,
//     timestamp: timeStamp,
//   };

//   const { config } = getSignature(body, baseApiurl);

//   try {
//     const { data } = await axios.post(
//       baseApiurl + "/exchange/v1/orders/status",
//       body,
//       config
//     );
//     res.status(200).json(data);
//   } catch (error) {
//     res.status(400).json({});
//   }
// });

// // Check order status
// router.post(
//   "/orderStatus",
//   requireAuth,
//   async (req: Request, res: Response) => {
//     const currentUser = req.currentUser;
//     const { orderId } = req.body;

//     const baseApiurl: string = "https://api.coindcx.com";

//     const tradeSchema = await Trade.findOne({
//       orderId: orderId,
//       orderStatus: "wait",
//     });

//     if (!tradeSchema) {
//       throw new BadRequestError("Trade order does not exists");
//     }

//     const timeStamp = Math.floor(Date.now());
//     const body = {
//       id: orderId,
//       timestamp: timeStamp,
//     };

//     const { config } = getSignature(body, baseApiurl);

//     try {
//       const { data } = await axios.post(
//         baseApiurl + "/exchange/v1/orders/status",
//         body,
//         config
//       );

//       if (data.status === "filled") {
//         const userWallet = await Wallet.findOne({ userId: currentUser?.id });

//         if (!userWallet) {
//           throw new BadRequestError("User wallet does not exist");
//         }

//         const filterCryptoBalance = userWallet?.cryptoBalance.filter(
//           (balance: any) => balance.marketPair === data.market
//         );

//         // console.log("filterCryptoBalance", filterCryptoBalance);

//         if (filterCryptoBalance && filterCryptoBalance.length === 0) {
//           throw new BadRequestError("Not found");
//         }

//         tradeSchema.orderStatus = data.status;
//         await tradeSchema.save();

//         if (data.side === "buy") {
//           await Wallet.updateOne(
//             {
//               userId: currentUser?.id,
//               "cryptoBalance.marketPair": tradeSchema.marketPair,
//             },
//             {
//               $inc: {
//                 "cryptoBalance.$.amount": tradeSchema.totalQuantity,
//                 walletInrBalance:
//                   -tradeSchema.totalQuantity * tradeSchema.pricePerUnit - 0.02,

//                 "cryptoBalance.$.investedAmountInr":
//                   tradeSchema.totalQuantity * tradeSchema.pricePerUnit - 0.02,
//                 "cryptoBalance.$.usableAmount": tradeSchema.totalQuantity,
//               },
//             },
//             {}
//           );
//         } else {
//           const investedAmountInr = filterCryptoBalance[0].investedAmountInr; // 120
//           const totalQuantity = filterCryptoBalance[0].amount; // 21
//           // console.log(
//           //   "investedAmountInr",
//           //   investedAmountInr,
//           //   typeof investedAmountInr
//           // );

//           // console.log("totalQuantity", totalQuantity, typeof totalQuantity);
//           // console.log(
//           //   "data.total_quantity",
//           //   data.total_quantity,
//           //   typeof data.total_quantity
//           // );

//           const investAmountToBeDeducted =
//             (investedAmountInr * tradeSchema.totalQuantity) / totalQuantity; //( 120 * 20 ) / 21

//           // console.log("investAmountToBeDeducted", investAmountToBeDeducted);

//           await Wallet.updateOne(
//             {
//               userId: currentUser?.id,
//               "cryptoBalance.marketPair": tradeSchema.marketPair,
//             },
//             {
//               $inc: {
//                 "cryptoBalance.$.amount": -tradeSchema.totalQuantity,
//                 walletInrBalance:
//                   tradeSchema.totalQuantity * tradeSchema.pricePerUnit - 0.02,
//                 useableInrBalance:
//                   tradeSchema.totalQuantity * tradeSchema.pricePerUnit - 0.02,
//                 "cryptoBalance.$.investedAmountInr": -investAmountToBeDeducted,
//               },
//             },
//             {}
//           );
//         }

//         return res.status(200).json(tradeSchema);
//       }

//       res.status(200).json(tradeSchema);
//     } catch (error) {
//       console.log(error);
//       throw new BadRequestError("Something went wrong");
//     }
//   }
// );
// // Wazir Check order status
// router.post(
//   "/worderStatus",
//   requireAuth,
//   async (req: Request, res: Response) => {
//     const currentUser = req.currentUser;
//     const { orderId } = req.body;

//     // const baseApiurl: string = "https://api.coindcx.com";

//     const tradeSchema = await Trade.findOne({
//       orderId: orderId,
//       $or: [{ orderStatus: "wait" }, { orderStatus: "idle" }],
//     });

//     if (!tradeSchema) {
//       throw new BadRequestError("Trade order does not exists");
//     }

//     // if (tradeSchema.orderStatus === "done") {
//     //   res.status(200).json(tradeSchema);
//     // }

//     const config = {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     };

//     try {
//       const { data } = await axios.get(
//         `${process.env.TRADE_API}/orderStatus/${orderId}`,
//         config
//       );

//       if (data[0] !== 200 && data[0] !== 201) {
//         return res.status(data[0]).json({ error: data[1]?.message });
//       }

//       if (data[1].status === "done") {
//         const userWallet = await Wallet.findOne({ userId: currentUser?.id });

//         if (!userWallet) {
//           throw new BadRequestError("User wallet does not exist");
//         }

//         const filterCryptoBalance = userWallet?.cryptoBalance.filter(
//           (balance: any) => balance.marketPair === data[1].symbol.toUpperCase()
//         );

//         // console.log("filterCryptoBalance", filterCryptoBalance);

//         if (filterCryptoBalance && filterCryptoBalance.length === 0) {
//           throw new BadRequestError("Not found");
//         }

//         tradeSchema.orderStatus = data[1].status;
//         await tradeSchema.save();

//         if (data[1].side === "buy") {
//           await Wallet.updateOne(
//             {
//               userId: currentUser?.id,
//               "cryptoBalance.marketPair": tradeSchema.marketPair,
//             },
//             {
//               $inc: {
//                 "cryptoBalance.$.amount": tradeSchema.totalQuantity,
//                 walletInrBalance:
//                   -tradeSchema.totalQuantity * tradeSchema.pricePerUnit - 0.02,

//                 "cryptoBalance.$.investedAmountInr":
//                   tradeSchema.totalQuantity * tradeSchema.pricePerUnit - 0.02,
//                 "cryptoBalance.$.usableAmount": tradeSchema.totalQuantity,
//               },
//             },
//             {}
//           );
//         } else {
//           const investedAmountInr = filterCryptoBalance[0].investedAmountInr; // 120
//           const totalQuantity = filterCryptoBalance[0].amount; // 21

//           const investAmountToBeDeducted =
//             (investedAmountInr * tradeSchema.totalQuantity) / totalQuantity; //( 120 * 20 ) / 21

//           // console.log("investAmountToBeDeducted", investAmountToBeDeducted);

//           await Wallet.updateOne(
//             {
//               userId: currentUser?.id,
//               "cryptoBalance.marketPair": tradeSchema.marketPair,
//             },
//             {
//               $inc: {
//                 "cryptoBalance.$.amount": -tradeSchema.totalQuantity,
//                 walletInrBalance:
//                   tradeSchema.totalQuantity * tradeSchema.pricePerUnit - 0.02,
//                 useableInrBalance:
//                   tradeSchema.totalQuantity * tradeSchema.pricePerUnit - 0.02,
//                 "cryptoBalance.$.investedAmountInr": -investAmountToBeDeducted,
//               },
//             },
//             {}
//           );
//         }

//         return res.status(200).json(tradeSchema);
//       }

//       res.status(200).json(tradeSchema);
//     } catch (error) {
//       console.log(error);
//       throw new BadRequestError("Something went wrong");
//     }
//   }
// );

// router.get(
//   "/getInvestedAmount",
//   requireAuth,
//   async (req: Request, res: Response) => {
//     const currentUser = req.currentUser;
//     const userWallet = await Wallet.findOne({ userId: currentUser?.id });

//     if (!userWallet) {
//       throw new BadRequestError("User wallet does not exist");
//     }

//     const filterCryptoBalance = userWallet?.cryptoBalance.filter(
//       (balance: any) => balance.marketPair === "TRXINR"
//     );

//     if (filterCryptoBalance && filterCryptoBalance.length === 0) {
//       throw new BadRequestError("Not found");
//     }

//     const investedAmountInr = filterCryptoBalance[0].investedAmountInr;

//     res.status(200).json(investedAmountInr);
//   }
// );

router.get(
  "/pendingOrders/:pair",
  requireAuth,
  async (req: Request, res: Response) => {
    const { pair } = req.params;
    const currentUser = req.currentUser;

    const pendingOrders = await Trade.find({
      userId: currentUser.id,

      marketPair: pair,

      $or: [{ orderStatus: "NEW" }],
    });

    if (!pendingOrders) {
      throw new BadRequestError("Something went wrong");
    }

    res.status(200).json(pendingOrders);
  }
);

// Get all trades
router.post(
  "/getAllTrades",
  requireAuth,
  async (req: Request, res: Response) => {
    const currentUser = req.currentUser;

    let sortArgs = sortArgsHelper({
      sortBy: "_id",
      order: "desc",
      limit: 20,
      skip: 0,
    });

    const allTrades = await Trade.find({ userId: currentUser?.id })
      .sort([[sortArgs.sortBy, sortArgs.order]])
      .skip(sortArgs.skip)
      .limit(sortArgs.limit);

    res.status(200).json(allTrades);
  }
);

// Test routes
router.get("/test", requireAuth, async (req: Request, res: Response) => {
  const currentUser = req.currentUser;
  await Wallet.updateOne(
    {
      userId: currentUser?.id,
      "cryptoBalance.marketPair": "MATICINR",
    },
    {
      $set: {
        "cryptoBalance.$.usableAmount": 0,
      },
    },
    {}
  );

  res.status(200).json({ status: "ok" });
});

router.get(
  "/cancelOrder/:orderId",
  requireAuth,
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const currentUser = req.currentUser;

    const tradeSchema = await Trade.findOne({
      orderId: orderId,
      userId: currentUser?.id,
      orderStatus: "open",
    });

    if (!tradeSchema) {
      throw new BadRequestError("This trade order doesn not exist");
    }

    const userWallet = await Wallet.findOne({ userId: currentUser?.id });

    if (!userWallet) {
      throw new BadRequestError("Wallet not found");
    }

    const baseApiurl: string = "https://api.coindcx.com";

    const timeStamp = Math.floor(Date.now());
    const body = {
      id: orderId,
      timestamp: timeStamp,
    };

    const { config } = getSignature(body, baseApiurl);

    try {
      const { data, status } = await axios.post(
        baseApiurl + "/exchange/v1/orders/cancel",
        body,
        config
      );

      // if (status === 200) {
      tradeSchema.orderStatus = "cancelled";
      tradeSchema.save();

      if (tradeSchema.side === "buy") {
        const totalAmount =
          tradeSchema.totalQuantity * tradeSchema.pricePerUnit;

        const usableWalletBalance: number = userWallet.useableInrBalance;

        userWallet.useableInrBalance = usableWalletBalance + totalAmount + 0.02;

        await userWallet.save();
      }

      if (tradeSchema.side === "sell") {
        await Wallet.updateOne(
          {
            userId: currentUser?.id,
            "cryptoBalance.marketPair": tradeSchema.marketPair,
          },
          {
            $inc: {
              "cryptoBalance.$.usableAmount": tradeSchema.totalQuantity,
            },
          },
          {}
        );
      }

      // }

      res.status(200).json(tradeSchema);
    } catch (error) {
      console.log("error", error);
      throw new BadRequestError("Something went wrong");
    }
  }
);
router.get(
  "/wcancelOrder/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = req.currentUser;

    const tradeSchema = await Trade.findOne({
      id: id,
      userId: currentUser?.id,
      $or: [{ orderStatus: "wait" }, { orderStatus: "idle" }],
    });

    if (!tradeSchema) {
      throw new BadRequestError("This trade order doesn not exist");
    }

    const userWallet = await Wallet.findOne({ userId: currentUser?.id });

    if (!userWallet) {
      throw new BadRequestError("Wallet not found");
    }

    const timeStamp = Math.floor(Date.now());
    const body = {
      orderId: tradeSchema.orderId,
      marketPair: tradeSchema.marketPair.toLowerCase(),
      timestamp: timeStamp,
    };

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const { data } = await axios.post(
        `${process.env.TRADE_API}/cancelOrder`,
        body,
        config
      );

      if (data[0] !== 200 && data[0] !== 201) {
        return res
          .status(data[0])
          .json({ errors: [{ message: data[1].message }] });
      }

      // if (status === 200) {
      tradeSchema.orderStatus = "cancel";
      tradeSchema.save();

      if (tradeSchema.side === "buy") {
        const totalAmount =
          tradeSchema.totalQuantity * tradeSchema.pricePerUnit;

        const usableWalletBalance: number = userWallet.useableInrBalance;

        userWallet.useableInrBalance = usableWalletBalance + totalAmount + 0.02;

        await userWallet.save();
      }

      if (tradeSchema.side === "sell") {
        await Wallet.updateOne(
          {
            userId: currentUser?.id,
            "cryptoBalance.marketPair": tradeSchema.marketPair,
          },
          {
            $inc: {
              "cryptoBalance.$.usableAmount": tradeSchema.totalQuantity,
            },
          },
          {}
        );
      }

      // }

      res.status(200).json(tradeSchema);
    } catch (error) {
      console.log("error", error);
      throw new BadRequestError("Something went wrong");
    }
  }
);

// router.get("/buySellMcoin", async (req: Request, res: Response) => {
//   const walletUpdate = await Wallet.updateOne(
//     {
//       userId: "61e494b3f2df0458b1175142",
//     },
//     {
//       $push: {
//         cryptoBalance: {
//           ticker: "MCOIN",
//           marketPair: "MCOININR",
//           amount: 0,
//           investedAmountInr: 0,
//           usableAmount: 0,
//         },
//       },
//     },
//     {}
//   );

//   console.log("walletUpdate", walletUpdate);

//   res.status(200).json({ status: "ok" });
// });

export { router as tradeRouter };
