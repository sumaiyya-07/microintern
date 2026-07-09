import mongoose, { Schema } from "mongoose";

const TaskSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Company reference is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    rewardText: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
