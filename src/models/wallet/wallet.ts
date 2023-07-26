import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface WalletAttrs {
  userId: string;
  cryptoBalance: any;
}

// Interface that describes the properties that
// a User model has
interface WalletModel extends mongoose.Model<WalletDoc> {
  build(attrs: WalletAttrs): WalletDoc;
}

// An interface that describes properties
// that a User Document has
interface WalletDoc extends mongoose.Document {
  isBankVerified: boolean;
  walletInrBalance: number;
  isWalletBlocked: boolean;
  cryptoBalance: any;
  useableInrBalance: number;
}

const walletSchema = new mongoose.Schema(
  {
    isBankVerified: { type: Boolean, default: false },
    walletInrBalance: { type: Number, default: 0 },
    useableInrBalance: { type: Number, default: 0 },
    isWalletBlocked: { type: Boolean, default: false },
    userId: { type: String, required: true },
    cryptoBalance: {
      type: Array,
      required: true,
    },
    // cryptoBalance: {
    //   type: Array,
    //   default: [
    //     {
    //       ticker: "BTC",
    //       marketPair: "BTCINR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //     {
    //       ticker: "ETH",
    //       marketPair: "ETHINR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //     {
    //       ticker: "MATIC",
    //       marketPair: "MATICINR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //     {
    //       ticker: "SOL",
    //       marketPair: "SOLINR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //     {
    //       ticker: "DOGE",
    //       marketPair: "DOGEINR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //     {
    //       ticker: "TRX",
    //       marketPair: "TRXINR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //     {
    //       ticker: "XRP",
    //       marketPair: "XRPINR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //     {
    //       ticker: "XLM",
    //       marketPair: "XLMINR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //     {
    //       ticker: "LUNA",
    //       marketPair: "LUNAINR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //     {
    //       ticker: "USDT",
    //       marketPair: "USDTINR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //     {
    //       ticker: "MCOIN",
    //       marketPair: "MCOININR",
    //       amount: 0,
    //       investedAmountInr: 0,
    //       usableAmount: 0,
    //     },
    //   ],
    // },
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

walletSchema.set("versionKey", "version");
walletSchema.plugin(updateIfCurrentPlugin);

walletSchema.statics.build = (attrs: WalletAttrs) => {
  return new Wallet(attrs);
};

const Wallet = mongoose.model<WalletDoc, WalletModel>("Wallet", walletSchema);

export { Wallet };
