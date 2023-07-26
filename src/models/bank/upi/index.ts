import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface UpiAttrs {}

// Interface that describes the properties that
// a User model has
interface UpiModel extends mongoose.Model<UpiDoc> {
  build(attrs: UpiAttrs): UpiDoc;
}

// An interface that describes properties
// that a User Document has
interface UpiDoc extends mongoose.Document {
  userId: string;
  upi_id: string;
  
}

const upiSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    upi_id:{ type: String, required: true },
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

upiSchema.set("versionKey", "version");
upiSchema.plugin(updateIfCurrentPlugin);

upiSchema.statics.build = (attrs: UpiAttrs) => {
  return new Upi(attrs);
};

const Upi = mongoose.model<UpiDoc, UpiModel>("Upi", upiSchema);

export { Upi };
