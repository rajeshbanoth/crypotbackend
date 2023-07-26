import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface TradeAttrs {
  userId: mongoose.Schema.Types.ObjectId;
  orderId: string;
  customerId: string;
  orderType: string;
  // orderType: string;
  // orderStatus: string;
  // price: number;
  // fee: number;
  // pair: string;
  // fill: string;
  // amount: string;
  // side: string;
  // totalQuantity: Number;
  // execQuantity: Number;
  // cummulativeQuoteQty: Number;
  // symbol: string;
}

// Interface that describes the properties that
// a User model has
interface TradeModel extends mongoose.Model<TradeDoc> {
  build(attrs: TradeAttrs): TradeDoc;
}

// An interface that describes properties
// that a User Document has
interface TradeDoc extends mongoose.Document {
  orderId: string;
  orderStatus: string;
  totalQuantity: number;
  pricePerUnit: number;
  side: string;
  marketPair: string;
  symbol: string;
}

const tradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: { type: String, required: true },
    customerId: { type: String, required: true },
    orderType: { type: String, required: true },
    // amount: { type: String, required: true },
    // side: { type: String, required: true },
    // side: { type: String, required: true },
    // fill: { type: String, required: true },
    // fee: { type: Number },
    // price: { type: Number, required: true },
    // pair: { type: String, required: true },
    // symbol: { type: String, required: true },
    // totalQuantity: { type: Number, required: true },
    // execQuantity: { type: Number, required: true },
    // cummulativeQuoteQty: { type: Number, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// tradeSchema.set("versionKey", "version");
// tradeSchema.plugin(updateIfCurrentPlugin);

tradeSchema.statics.build = (attrs: TradeAttrs) => {
  return new Trade(attrs);
};

const Trade = mongoose.model<TradeDoc, TradeModel>("Trade", tradeSchema);

export { Trade };
