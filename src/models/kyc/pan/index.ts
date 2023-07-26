import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface PanAttrs {}

// Interface that describes the properties that
// a User model has
interface PanModel extends mongoose.Model<PanDoc> {
  build(attrs: PanAttrs): PanDoc;
}

// An interface that describes properties
// that a User Document has
interface PanDoc extends mongoose.Document {
  userId: string;
  pan_no: string;
  pan_image: string;
}

const panchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pan_no: { type: String, required: true },
    pan_image: { type: String, required: false },
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

panchema.set("versionKey", "version");
panchema.plugin(updateIfCurrentPlugin);

panchema.statics.build = (attrs: PanAttrs) => {
  return new Pan(attrs);
};

const Pan = mongoose.model<PanDoc, PanModel>("Pan", panchema);

export { Pan };
