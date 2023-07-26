import express, { Request, Response } from "express";
import { body, check } from "express-validator";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { User } from "../../models/auth/user";
import { BadRequestError } from "../../errors/bad-request-error";
import { validateRequest } from "../../middlewares/validate-request";
import { buildTokens } from "../../services/tokens";
import { registerEmail } from "../../services/auth/email";
import { Password } from "../../services/password";
import { currentUser } from "../../middlewares/current-user";
import { OtpVerify } from "../../services/otpVerify";
import { Wallet } from "../../models/wallet/wallet";
import { requireAuth } from "../../middlewares/require-auth";
import axios from "axios";
import { addCryptoInWallet } from "../../utils/wallet/cryptoWallet";

dotenv.config();

const router = express.Router();

// ----------------- User signup ----------------------- //
router.post(
  "/signup",
  [
    body("firstName")
      .not()
      .isEmpty()
      .trim()
      .withMessage("First Name cannot be empty"),
    body("lastName")
      .not()
      .isEmpty()
      .trim()
      .withMessage("Last Name cannot be empty"),
    body("email")
      .not()
      .isEmpty()
      .trim()
      .isEmail()
      .withMessage("Email must be valid"),
    body("mobileNo")
      .not()
      .isEmpty()
      .trim()
      .withMessage("Mobile no is mandatory")
      .isLength({ min: 10, max: 10 })
      .withMessage("Mobile no should have 10 digits"),
    check("password")
      .not()
      .isEmpty()
      .trim()
      .isLength({ min: 6, max: 20 })
      .withMessage("Password must be between 6 and 20 charachers")
      .matches(/\d/)
      .withMessage("Password must contain a number"),
    check("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, mobileNo } = req.body;

    const shortCode = nanoid(6).toUpperCase();

    const signedShortCode = jwt.sign({ shortCode }, process.env.JWT_KEY!, {
      expiresIn: "10m",
    });

    // check is user exists
    const existingUser = await User.findOne({ email });

    if (existingUser && !existingUser?.isAccountVerified) {
      existingUser.set({
        emailotp: signedShortCode,
      });
      await existingUser.save();

      // send email
      await registerEmail(existingUser, shortCode);
      return res
        .status(201)
        .send({ email: existingUser?.email, status: "pending" });
    }

    if (existingUser) {
      throw new BadRequestError("Your email is already used!");
    }

    // Create a user schema
    const user = User.build({
      firstName,
      lastName,
      email,
      password,
      phone: mobileNo,
      emailotp: signedShortCode,
      accountVerifyStatus: "PENDING",
    });

    // Save the schema to the database
    await user.save();

    // const payload = {
    //   accounts: [
    //     {
    //       currency: "BTC",
    //       xpub:
    //         "tpubDF5Dv9pHaYsE5nUvuxTkbCy4CHd19Ma3vFHcXxwQS1q2SyZYaPDQwGmi8PaeDLAnUfJnLFvEuZ764EbKbZV3a2mxAvbKBWdEtjpPzKmx9Cd",
    //       customer: {
    //         accountingCurrency: "INR",
    //         customerCountry: "IN",
    //         externalId: user.id,
    //         providerCountry: "IN",
    //       },
    //       accountingCurrency: "INR",
    //     },
    //     {
    //       currency: "ETH",
    //       xpub:
    //         "xpub6Eg9DE9Zw3jgHEYxMXc5mHnLtzCgW7ZBRwtZ3HpdS2jh9h2q5zsCRrahFWTEFftnTGaFyvYX8amWk53zDGLX7F5FUtQBF2FaUxo166oLz4c",
    //       customer: {
    //         accountingCurrency: "INR",
    //         customerCountry: "IN",
    //         externalId: user.id,
    //         providerCountry: "IN",
    //       },
    //       accountingCurrency: "INR",
    //     },
    //     {
    //       currency: "TRON",
    //       xpub:
    //         "03327e9df27ed20ffa2aea3890269cf6b2691fd8177851ef9d3609489a28c1bf56cbe95cd2106c57858ccc3ad7cd8878bd33352d6b6a792382e6c0ced6cf7f1a13",
    //       customer: {
    //         accountingCurrency: "INR",
    //         customerCountry: "IN",
    //         externalId: user.id,
    //         providerCountry: "IN",
    //       },
    //       accountingCurrency: "INR",
    //     },
    //   ],
    // };

    const config = {
      headers: {
        "x-api-key": "ae0197ec-a519-4cd4-9cf3-34f42d178c14",
      },
    };

    const { data } = await axios.post(
      "https://api-eu1.tatum.io/v3/ledger/account/batch",
      addCryptoInWallet(user.id),
      config
    );

    user.walletCustomerId = data[0].customerId;
    await user.save();
    // // Create a Wallet schema
    // const userWallet = await Wallet.build({
    //   userId: user.id,
    //   cryptoBalance: data,
    // });

    // await userWallet.save();

    // send email
    await registerEmail(user, shortCode);

    res.status(201).send({ email: user.email });
  }
);
// ----------------------------------------------------- //

// ----------------- User signin ----------------------- //
router.post(
  "/signin",
  [
    body("email").not().isEmpty().isEmail().withMessage("Email must be valid"),
    check("password")
      .not()
      .isEmpty()
      .trim()
      .isLength({ min: 6, max: 20 })
      .withMessage("Password must be between 6 and 20 charachers")
      .matches(/\d/)
      .withMessage("Password must contain a number"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Check if user exists in the database
    const existingUser = await User.findOne({ email });

    // If user does exists in the database throw error
    if (!existingUser) {
      throw new BadRequestError("Email does not exists");
    }

    // compare password sent by user with the one in the database
    const passwordsMatch = await Password.compare(
      existingUser.password,
      password
    );

    // If password does not match throw error
    if (!passwordsMatch) {
      throw new BadRequestError("Wrong password");
    }

    const shortCode = nanoid(6).toUpperCase();

    const signedShortCode = jwt.sign({ shortCode }, process.env.JWT_KEY!, {
      expiresIn: "10m",
    });

    existingUser.set({
      emailotp: signedShortCode,
    });

    // Save the schema to the database
    await existingUser.save();

    // Generate access token
    // const { accessToken } = buildTokens(user);

    // send email
    await registerEmail(existingUser, shortCode);
    // req.session = {
    //   jwt: accessToken,
    // };

    res.json({ result: existingUser.email });
  }
);
// ---------------------------------------------------------- //

// ----------------- Verify signup Email otp ----------------------- //
router.post(
  "/signup-verify-email-otp",
  [
    body("verifyOtp")
      .not()
      .isEmpty()
      .withMessage("Otp is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("Invalid otp"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { verifyOtp, email } = req.body;

    // check is user exists
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw new BadRequestError(
        "This user doesn't exists, You need to sign up"
      );
    }

    const otpMatches = await OtpVerify.toVerify(
      verifyOtp,
      existingUser.emailotp
    );

    if (otpMatches) {
      existingUser.set({
        isAccountVerified: true,
        emailotp: "",
        accountVerifyStatus: "VERIFIED",
      });
      await existingUser.save();

      // Generate access token
      const { accessToken } = buildTokens(existingUser);

      // req.session = {
      //   jwt: accessToken,
      // };

      const finalResult = {
        email: existingUser.email,
        token: accessToken,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        id: existingUser.id,
        isKycVerified: existingUser.isKycVerified,
        walletCustomerId: existingUser.walletCustomerId,
      };

      return res.json(finalResult);
    } else {
      throw new BadRequestError("Wrong otp provided");
    }
  }
);
// ------------------------------------------------------ //

// ----------------- Verify Email otp ----------------------- //
router.post(
  "/login-verify-email-otp",
  [
    body("verifyOtp")
      .not()
      .isEmpty()
      .withMessage("Otp is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("Invalid otp"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { verifyOtp, email } = req.body;

    // check is user exists
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw new BadRequestError(
        "This user doesn't exists, You need to sign up"
      );
    }

    const otpMatches = await OtpVerify.toVerify(
      verifyOtp,
      existingUser.emailotp
    );

    if (otpMatches) {
      const today = new Date();

      if (!existingUser.isAccountVerified) {
        existingUser.set({
          isAccountVerified: true,
          emailotp: "",
          accountVerifyStatus: "VERIFIED",
          currentLoginTime: today,
        });
        await existingUser.save();
      } else {
        existingUser.set({
          emailotp: "",
          currentLoginTime: today,
          lastLoginTime: existingUser.currentLoginTime,
        });
        await existingUser.save();
      }

      // Generate access token
      const { accessToken } = buildTokens(existingUser);

      // req.session = {
      //   jwt: accessToken,
      // };

      const finalResult = {
        email: existingUser.email,
        token: accessToken,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        id: existingUser.id,
        lastLoginTime: existingUser.lastLoginTime,
        isKycVerified: existingUser.isKycVerified,
        kycVerifyStatus: existingUser.kycVerifyStatus,
        walletCustomerId: existingUser.walletCustomerId,
      };

      return res.status(200).json(finalResult);
    } else {
      throw new BadRequestError("Wrong otp provided");
    }
  }
);
// ------------------------------------------------------ //

// ---------------- Current User ------------------------ //
router.get(
  "/current-user",
  requireAuth,
  async (req: Request, res: Response) => {
    const result = req.currentUser || null;

    const existingUser = await User.findById(result?.id);

    res.send(existingUser);
  }
);
// -------------------------------------------------------- //

// ----------------------- Sign out ----------------------- //
router.get("/signout", (req: Request, res: Response) => {
  req.session = null;

  res.send({});
});

export { router as authRouter };
