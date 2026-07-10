import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["candidate", "company", "admin"]),
  bio: z.string().trim().optional(),
  skills: z.string().optional(), // We'll input as a comma-separated list and convert
  companyName: z.string().trim().optional(),
  companyDescription: z.string().trim().optional(),
});

export const LoginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const TaskCreateSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(120, "Title cannot exceed 120 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(3000, "Description cannot exceed 3000 characters"),
  category: z.string().trim().min(2, "Category is required"),
  deadline: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, {
    message: "Deadline must be a valid future date and time",
  }),
  rewardText: z.string().trim().optional(),
});

export const ApplicationCreateSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
});

export const SubmissionCreateSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  textAnswer: z.string().trim().min(20, "Please explain your work in at least 20 characters"),
  link: z.string().trim().url("Please provide a valid URL link").or(z.literal("")),
  fileUrl: z.string().trim().optional(),
});

export const ReviewCreateSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  comment: z.string().trim().min(5, "Comment must be at least 5 characters"),
  rating: z.number().min(1).max(5),
});
