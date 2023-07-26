import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { BadRequestError } from "../../errors/bad-request-error";

dotenv.config();

let transporter = nodemailer.createTransport({
  service: "Gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const registerEmail = async (user: any, shortCode: string) => {
  try {
    let mailGenerator = new Mailgen({
      theme: "default",
      product: { name: "Pyxkrypto", link: `${process.env.EMAIL_MAIN_URL}` },
    });

    const email = {
      body: {
        name: user.email,
        intro: "Welcome to Pyxkrypto. We're very excited to have you on board.",
        action: {
          instructions: "To validate your account, please enter this otp.",
          button: {
            color: "#1a73e8",
            text: shortCode,
            link: ``,
          },
        },
        outro: [
          `Need help, or have any questions? Just reply to this email, we\'d love to help.`,
        ],
      },
    };

    let emailBody = mailGenerator.generate(email);
    let message = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Welcome to Pyxkrypto",
      html: emailBody,
    };

    await transporter.sendMail(message);
    return true;
  } catch (error) {
    if (error)
      throw new BadRequestError("Something went wrong, please try again");
  }
};
