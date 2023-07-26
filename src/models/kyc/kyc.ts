import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface KycAttrs {
  userId: mongoose.Schema.Types.ObjectId;
  aadharNo: string;
  panNo: string;
  aadharImageFront: string | undefined;
  aadharImageBack: string | undefined;
  panCardImage: string | undefined;
  selfieImage: string | undefined;
  verificationStatus: string;
}

// Interface that describes the properties that
// a Kyc model has
interface KycModel extends mongoose.Model<KycDoc> {
  build(attrs: KycAttrs): KycDoc;
}

// An interface that describes properties
// that a User Document has
interface KycDoc extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId;
  aadharNo: string;
  panNo: string;
  aadharImageFront: string;
  aadharImageBack: string;
  panCardImage: string;
  selfieImage: string;
  verificationStatus: string;
}

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    verificationStatus: {
      type: String,
      enum: ["NOT_VERIFIED", "VERIFIED", "PENDING"],
      default: "NOT_VERIFIED",
      required: true,
    },
    aadharNo: { type: String, required: true },
    panNo: { type: String, required: true },
    aadharImageFront: { type: String, required: true },
    aadharImageBack: { type: String, required: true },
    panCardImage: { type: String, required: true },
    selfieImage: { type: String, required: true },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

kycSchema.set("versionKey", "version");
kycSchema.plugin(updateIfCurrentPlugin);

kycSchema.statics.build = (attrs: KycAttrs) => {
  return new Kyc(attrs);
};

const Kyc = mongoose.model<KycDoc, KycModel>("Kyc", kycSchema);

export { Kyc };
