import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { BadRequestError } from "../../errors/bad-request-error";
import { User } from "../../models/auth/user";

dotenv.config();

const router = express.Router();

// ----------------- User signup ----------------------- //
router.post("/update/me", async (req: Request, res: Response) => {
  const { email, firstName, lastName, phone, id } = req.body;

  const newUserData = {
    email: email,
    firstName: firstName,
    lastName: lastName,
    phone: phone,
  };

  const user = await User.findByIdAndUpdate(id, newUserData, {
    new: true,
    runValidators: true,
    userFindAndModify: false,
  });

  console.log(user);

  await res.status(200).json({
    success: true,
    data: user,
  });
});
// ----------------------------------------------------- //

export { router as userRouter };
