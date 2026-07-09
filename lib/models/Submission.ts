import mongoose, { Schema } from "mongoose";

const SubmissionSchema = new Schema(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: [true, "Application reference is required"],
      unique: true,
    },
    textAnswer: {
      type: String,
      required: [true, "Answer text is required"],
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
    fileUrl: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema);
