import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface BankAttrs {}

// Interface that describes the properties that
// a User model has
interface BankModel extends mongoose.Model<BankDoc> {
  build(attrs: BankAttrs): BankDoc;
}

// An interface that describes properties
// that a User Document has
interface BankDoc extends mongoose.Document {
  userId: string;
  ifsc_code: string;
  account_no: string;
  account_name: string;
  account_type: string;
}

const bankSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    ifsc_code: { type: String, required: true },
    account_no: { type: String, required: true },
    account_name: { type: String, required: true },
    bank_name: { type: String, required: true },
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

bankSchema.set("versionKey", "version");
bankSchema.plugin(updateIfCurrentPlugin);

bankSchema.statics.build = (attrs: BankAttrs) => {
  return new Bank(attrs);
};

const Bank = mongoose.model<BankDoc, BankModel>("Bank", bankSchema);

export { Bank };
