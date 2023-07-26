import express, { Request, Response } from "express";
import mongoose from "mongoose";

import dotenv from "dotenv";
import { Bank } from "../../models/bank/bank";
import { currentUser } from "../../middlewares/current-user";
import { User } from "../../models/auth/user";
import { NotFoundError } from "../../errors/not-found-error";
import axios from "axios";
import { Upi } from "../../models/bank/upi";

dotenv.config();

const router = express.Router();

// ----------------- create order ----------------------- //
router.post("/add", async (req: Request, res: Response) => {
  try {
    let result: any;

    const razorpayXConfig: any = {
      auth: {
        username: process.env.RAZORPAYX_KEY,
        password: process.env.RAZORPAYX_SCERET,
      },
    };
    Bank.find({ userId: req.body.userId }, async (err: any, bank) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err,
        });
      } else {
        if (bank.length != 0) {
          const updateBankData = {
            account_name: req.body.account_name,
            account_no: req.body.account_no,
            ifsc_code: req.body.ifsc_code,
            bank_name: req.body.bank_name,
          };
          result = await Bank.updateOne(
            { userId: req.body.userId },
            { $set: { ...updateBankData } }
          );
        } else {
          const razorpayxSendData = {
            name: "Sachin Augustine",
            email: "sachinaugustine11@gmail.com",
            contact: 9892015550,
            type: "customer",
            reference_id: "Acme Contact ID 12345",
            notes: {
              random_key_1: "Make it so. happen",
              random_key_2: "Tea. Earl Grey Grey. Hot.",
            },
          };

          const { data } = await axios.post(
            "https://api.razorpay.com/v1/contacts",
            razorpayxSendData,
            razorpayXConfig
          );
          const fundAccount = {
            contact_id: data.id,
            account_type: "bank_account",
            bank_account: {
              name: "Sachin Augustine",
              ifsc: "FDRL0001775",
              account_number: "837387837837",
            },
          };

          const Razorpayx = await axios.post(
            "https://api.razorpay.com/v1/fund_accounts",
            fundAccount,
            razorpayXConfig
          );
          const addBankData = {
            ifsc_code: req.body.ifsc_code,
            account_no: req.body.account_no,
            account_name: req.body.account_name,
            account_type: req.body.account_type,
            bank_name: req.body.bank_name,
            userId: req.body.userId,
            razorpayx: Razorpayx.data,
          };

          result = await Bank.create(addBankData);
        }
      }
    });
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (e) {
    console.log(e);
  }
});

// ----------------- create order ----------------------- //
router.post("/upi/add", async (req: Request, res: Response) => {
  try {
    let result: any;
    const id = req.body.userId;
    Upi.find({ userId: id }, async (err: any, upi) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: err,
        });
      } else {
        if (upi.length != 0) {
          const updateUpiData = {
            upi_id: req.body.upi_id,
          };
          result = await Upi.updateOne(
            { userId: id },
            { $set: { ...updateUpiData } }
          );
        } else {
          result = await Upi.create(req.body);
          // console.log(bank);
        }
      }
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (e) {
    console.log(e);
  }
});

router.get("/ifsc/:code", async (req: Request, res: Response) => {
  try {
    const bankDetails = await axios.get(
      `https://bank-apis.justinclicks.com/API/V1/IFSC/${req.params.code}/`
    );

    const bankInfo = {
      Bank: bankDetails.data.BANK,
      BankCode: bankDetails.data.BANKCODE,
      BankBranch: bankDetails.data.BRANCH,
      BankCity: bankDetails.data.CITY,
      BankState: bankDetails.data.STATE,
    };
    res.status(200).json({
      success: true,
      data: bankInfo,
    });
  } catch (e) {
    console.log(e);
  }
});

// ----------------- create order ----------------------- //
router.get("/details/:id", async (req: Request, res: Response) => {
  try {
    const id: any = req.params.id;
    Bank.find({ userId: id }, (err: any, bank) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: err,
        });
      } else {
        res.status(200).json(bank);
      }
    });
  } catch (e) {
    console.log(e);
  }
});

// ----------------- create order ----------------------- //
router.get("/upi/:id", async (req: Request, res: Response) => {
  try {
    const id: any = req.params.id;
    Upi.find({ userId: id }, (err: any, upi) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: err,
        });
      } else {
        res.status(200).json(upi);
      }
    });
  } catch (e) {
    console.log(e);
  }
});

// ----------------- create order ----------------------- //
router.put("/upi/update/:id", async (req: Request, res: Response) => {
  try {
    const id: any = req.params.id;
    Upi.findByIdAndUpdate({ userId: id }, req.body, (err: any, upi: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: err,
        });
      } else {
        res.status(200).json({
          success: true,
          data: upi,
        });
      }
    });
  } catch (e) {
    console.log(e);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id: any = req.params.id;
    Bank.deleteOne({ userId: id }, (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: err,
        });
      } else {
        res.status(200).json({
          success: true,
          data: "Successfully Deleted",
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

router.delete("/upi/:id", async (req: Request, res: Response) => {
  try {
    const id: any = req.params.id;
    Upi.deleteOne({ userId: id }, (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: err,
        });
      } else {
        res.status(200).json({
          success: true,
          data: "Successfully Deleted",
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});
export { router as bankRouter };
