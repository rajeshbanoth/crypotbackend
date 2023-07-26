import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface CryptoWalletAttrs {
  totalBalance: number;
  availableBalance: number;
  currency: string;
  active?: boolean;
  frozen?: boolean;
}

// Interface that describes the properties that
// a User model has
interface CryptoWalletModal extends mongoose.Model<CryptoWalletDoc> {
  build(attrs: CryptoWalletAttrs): CryptoWalletDoc;
}

// An interface that describes properties
// that a User Document has
interface CryptoWalletDoc extends mongoose.Document {
  totalBalance: number;
  availableBalance: number;
}

const cryptoWalletSchema = new mongoose.Schema(
  {
    totalBalance: { type: Number, required: true },
    availableBalance: { type: Number, required: true },
    currency: { type: String, required: true },
    active: { type: Boolean, default: false },
    frozen: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      },
    },
  }
);

cryptoWalletSchema.set("versionKey", "version");
cryptoWalletSchema.plugin(updateIfCurrentPlugin);

cryptoWalletSchema.statics.build = (attrs: CryptoWalletAttrs) => {
  return new CryptoWallet(attrs);
};

const CryptoWallet = mongoose.model<CryptoWalletDoc, CryptoWalletModal>(
  "CryptoWallet",
  cryptoWalletSchema
);

export { CryptoWallet };
