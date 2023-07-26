import express, { Request, Response } from "express";

import dotenv from "dotenv";
import { requireAuth } from "../../middlewares/require-auth";
import { validateRequest } from "../../middlewares/validate-request";
import { body, check } from "express-validator";
import { BadRequestError } from "../../errors/bad-request-error";
import multer from "multer";
import path from "path";
import { Kyc } from "../../models/kyc/kyc";
import { User } from "../../models/auth/user";
import { cloudinary } from "../../utils/cloudinary";

dotenv.config();

const router = express.Router();

// router.delete("/pan/:id", async (req: Request, res: Response) => {
//   try {
//     const id: any = req.params.id;
//     Pan.deleteOne({ userId: id }, (err: any) => {
//       if (err) {
//         res.status(400).json({
//           success: false,
//           error: err,
//         });
//       } else {
//         res.status(200).json({
//           success: true,
//           data: "Successfully Deleted",
//         });
//       }
//     });
//   } catch (error) {
//     console.log(error);
//   }
// });

// router.delete("/aadhar/:id", async (req: Request, res: Response) => {
//   try {
//     const id: any = req.params.id;
//     Aadhar.deleteOne({ userId: id }, (err: any) => {
//       if (err) {
//         res.status(400).json({
//           success: false,
//           error: err,
//         });
//       } else {
//         res.status(200).json({
//           success: true,
//           data: "Successfully Deleted",
//         });
//       }
//     });
//   } catch (error) {
//     console.log(error);
//   }
// });

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    cb(null, "src/uploads");
  },
  filename: (req: Request, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req: Request, file: any, cb: any) => {
  if (
    file.mimetype == "image/jpeg" ||
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg"
  ) {
    // Let the file be stored
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

const multipleUpload = upload.fields([
  { name: "aadharFrontImage" },
  { name: "aadharBackImage" },
  { name: "panCardImage" },
  { name: "selfieImage" },
]);

interface KycImages extends Request {
  files: {
    aadharFrontImage: any;
    aadharBackImage: any;
    panCardImage: any;
    selfieImage: any;
  };
}

// Add kyc details
router.post(
  "/kycDetails",
  requireAuth,
  multipleUpload,
  async (req: Request, res: Response) => {
    const { aadharNo, panNo } = req.body;
    const currentUser = req.currentUser;

    // if (!req.files) throw new BadRequestError("No files were found");

    const existingKycSchema = await Kyc.findOne({ userId: currentUser?.id });

    const existingUser = await User.findById(currentUser?.id);

    if (existingKycSchema) {
      throw new BadRequestError("Kyc already added");
    }
    if (!existingUser) {
      throw new BadRequestError("User doesn't exists ");
    }

    try {
      const localPathAadharFront = `src/uploads/${
        (req as KycImages).files.aadharFrontImage[0].filename
      }`;
      const dataFront = await cloudinary.v2.uploader.upload(
        localPathAadharFront,
        {
          resource_type: "auto",
        }
      );
      const localPathAadharBack = `src/uploads/${
        (req as KycImages).files.aadharBackImage[0].filename
      }`;
      const dataBack = await cloudinary.v2.uploader.upload(
        localPathAadharBack,
        {
          resource_type: "auto",
        }
      );
      const localPathPanCardImage = `src/uploads/${
        (req as KycImages).files.panCardImage[0].filename
      }`;
      const dataPanCardImage = await cloudinary.v2.uploader.upload(
        localPathPanCardImage,
        {
          resource_type: "auto",
        }
      );
      const selfieImage = `src/uploads/${
        (req as KycImages).files.selfieImage[0].filename
      }`;
      const dataSelfieImage = await cloudinary.v2.uploader.upload(selfieImage, {
        resource_type: "auto",
      });

      const kycSchema = await Kyc.build({
        userId: currentUser?.id,
        aadharNo: aadharNo,
        panNo: panNo,
        aadharImageFront: dataFront?.secure_url,
        aadharImageBack: dataBack?.secure_url,
        panCardImage: dataPanCardImage?.secure_url,
        selfieImage: dataSelfieImage?.secure_url,
        verificationStatus: "PENDING",
      });
      await kycSchema.save();

      existingUser.kycVerifyStatus = "PENDING";
      await existingUser.save();

      const result = {
        userId: kycSchema.userId,
        aadharNo: kycSchema.aadharNo,
        panNo: kycSchema.panNo,
        aadharImageFront: kycSchema.aadharImageFront,
        aadharImageBack: kycSchema.aadharImageBack,
        panCardImage: kycSchema.panCardImage,
        selfieImage: kycSchema.selfieImage,
        verificationStatus: kycSchema.verificationStatus,
        message: "Your KYC is under review and it will be done within 24 hours",
      };

      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      throw new BadRequestError("somethingwne went wrong");
    }
  }
);

// Fetch kyc details
router.get("/kycDetails", requireAuth, async (req: Request, res: Response) => {
  const currentUser = req.currentUser;

  const existingKycSchema = await Kyc.findOne({ userId: currentUser?.id });

  if (!existingKycSchema) {
    throw new BadRequestError("Kyc details doesn't exists");
  }

  res.status(200).json(existingKycSchema);
});

export { router as kycRouter };
