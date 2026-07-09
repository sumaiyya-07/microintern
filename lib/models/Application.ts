import mongoose, { Schema } from "mongoose";

const ApplicationSchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task reference is required"],
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Candidate reference is required"],
    },
    status: {
      type: String,
      enum: ["Applied", "Reviewed", "Shortlisted", "Interview", "Offered", "Rejected"],
      default: "Applied",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index to prevent duplicate applications
ApplicationSchema.index({ taskId: 1, candidateId: 1 }, { unique: true });

export default mongoose.models.Application || mongoose.model("Application", ApplicationSchema);
