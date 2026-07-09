import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      required: [true, "Submission reference is required"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
