import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface AadharAttrs {}

// Interface that describes the properties that
// a User model has
interface AadharModel extends mongoose.Model<AadharDoc> {
  build(attrs: AadharAttrs): AadharDoc;
}

// An interface that describes properties
// that a User Document has
interface AadharDoc extends mongoose.Document {
  userId: string;
  adhar_no: string;
  aadhar_image_front: string;
  aadhar_image_back: string;
}

const aadharchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    aadhar_no: { type: String, required: true },
    aadhar_image_front: { type: String, required: true },
    aadhar_image_back: { type: String, required: true },

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

aadharchema.set("versionKey", "version");
aadharchema.plugin(updateIfCurrentPlugin);

aadharchema.statics.build = (attrs: AadharAttrs) => {
  return new Aadhar(attrs);
};

const Aadhar = mongoose.model<AadharDoc, AadharModel>("Aadhar", aadharchema);

export { Aadhar };
