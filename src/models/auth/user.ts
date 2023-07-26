import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { Password } from "../../services/password";

interface UserAttrs {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: number;
  emailotp: string;
  accountVerifyStatus: string;
}

// Interface that describes the properties that
// a User model has
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

// An interface that describes properties
// that a User Document has
interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
  role: string;
  isAccountVerified: boolean;
  isKycVerified: boolean;
  phone: number;
  emailotp: string;
  firstName: string;
  lastName: string;
  currentLoginTime: Date;
  lastLoginTime: Date;
  accountVerifyStatus: string;
  kycVerifyStatus: string;
  walletCustomerId: string;
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: [true, "email is required"] },
    password: { type: String, required: [true, "password is required"] },
    firstName: { type: String, required: [true, "First name is required"] },
    lastName: { type: String, required: [true, "Last name is required"] },
    phone: { type: Number, required: [true, "phone is required"] },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isAccountVerified: { type: Boolean, required: false, default: false },
    isKycVerified: { type: Boolean, required: false, default: false },
    isBlocked: { type: Boolean, required: false, default: false },
    passwordChangedAt: Date,
    emailotp: { type: String },
    accountVerifyStatus: {
      type: String,
      enum: ["NOT_VERIFIED", "PENDING", "VERIFIED"],
      default: "NOT_VERIFIED",
    },
    kycVerifyStatus: {
      type: String,
      enum: ["NOT_VERIFIED", "PENDING", "VERIFIED"],
      default: "NOT_VERIFIED",
    },
    currentLoginTime: { type: Date },
    walletCustomerId: { type: String },
    lastLoginTime: { type: Date },
    date: {
      type: Date,
      default: Date.now,
    },
    // active: { type: Boolean, default: false },
  },
  {
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

userSchema.pre("save", async function(done) {
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);
  }
  done();
});

userSchema.set("versionKey", "version");
userSchema.plugin(updateIfCurrentPlugin);

userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };
