import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

// 1. Manually parse .env.local to load environment variables
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  console.log("Loading environment parameters from .env.local...");
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIdx = trimmed.indexOf("=");
    if (separatorIdx > 0) {
      const key = trimmed.substring(0, separatorIdx).trim();
      const value = trimmed
        .substring(separatorIdx + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("CRITICAL ERROR: MONGODB_URI is not set inside .env.local");
  process.exit(1);
}

// 2. Define Mongoose schemas locally to avoid import alias config compilation limits in scripts
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["company", "candidate", "admin"], required: true },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    companyName: { type: String, default: "" },
    companyDescription: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TaskSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    deadline: { type: Date, required: true },
    rewardText: { type: String, default: "" },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ApplicationSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["Applied", "Reviewed", "Shortlisted", "Interview", "Offered", "Rejected"],
      default: "Applied",
    },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const SubmissionSchema = new mongoose.Schema(
  {
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, unique: true },
    textAnswer: { type: String, required: true },
    link: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ReviewSchema = new mongoose.Schema(
  {
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", required: true },
    comment: { type: String, required: true },
    rating: { type: Number, required: true },
    isAiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);
const Application = mongoose.models.Application || mongoose.model("Application", ApplicationSchema);
const Submission = mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema);
const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

async function seed() {
  console.log("Connecting to MongoDB database...");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected successfully!");

  // Clear existing records
  console.log("Purging old records from the database...");
  await User.deleteMany({});
  await Task.deleteMany({});
  await Application.deleteMany({});
  await Submission.deleteMany({});
  await Review.deleteMany({});
  console.log("Database purged.");

  // Password hashes
  const defaultPassword = "password123";
  const hashedUserPassword = await bcryptjs.hash(defaultPassword, 10);
  
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@microintern.com";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "adminpassword123";
  const hashedAdminPassword = await bcryptjs.hash(adminPassword, 10);

  // 1. Create Admin
  console.log(`Seeding Admin Account: ${adminEmail}...`);
  await User.create({
    name: "System Administrator",
    email: adminEmail,
    password: hashedAdminPassword,
    role: "admin",
    isActive: true,
  });

  // 2. Create Companies
  console.log("Seeding Companies: PixelForge Studio and QuickCart Technologies...");
  const company1 = await User.create({
    name: "Marcus Vance",
    email: "company1@pixel.com",
    password: hashedUserPassword,
    role: "company",
    companyName: "PixelForge Studio",
    companyDescription: "A modern design studio developing beautiful web user interfaces and layouts.",
    isActive: true,
  });

  const company2 = await User.create({
    name: "Sarah Chen",
    email: "company2@quick.com",
    password: hashedUserPassword,
    role: "company",
    companyName: "QuickCart Technologies",
    companyDescription: "An e-commerce software provider focused on super-fast cart conversions and APIs.",
    isActive: true,
  });

  // 3. Create Candidates
  console.log("Seeding Candidates: Priya Sharma and Arjun Mehta...");
  const candidate1 = await User.create({
    name: "Priya Sharma",
    email: "candidate1@priya.com",
    password: hashedUserPassword,
    role: "candidate",
    bio: "Passionate front-end developer and UI designer specializing in React, Next.js, and Figma animations.",
    skills: ["React", "UI Design", "Figma", "Tailwind CSS"],
    isActive: true,
  });

  const candidate2 = await User.create({
    name: "Arjun Mehta",
    email: "candidate2@arjun.com",
    password: hashedUserPassword,
    role: "candidate",
    bio: "Backend developer and data analysis engineer. I write automated scripts and clean data schemas using Python.",
    skills: ["Python", "Data Analysis", "CSV Parsing", "Pandas"],
    isActive: true,
  });

  // 4. Create Tasks
  console.log("Seeding Tasks...");
  const task1 = await Task.create({
    companyId: company1._id,
    title: "Design a Landing Page for a Fitness App",
    description: "Create a beautiful Figma mockup for a modern mobile fitness tracking landing page. Make sure to use clean grids, customized icons, and provide a clickable prototype link. Explain your design thinking, color selection logic, and typography choices in your answer description.",
    category: "UI/UX Design",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 Days
    rewardText: "$250 design stipend",
    status: "open",
    isActive: true,
  });

  const task2 = await Task.create({
    companyId: company2._id,
    title: "Clean and Analyze a Sales CSV",
    description: "Download our sales sample dump, automate standardizations (correct dates, trim text fields, handle missing null floats), and output total sales grouped by category and city. Write a clean Python script. Submit your script repository URL and describe your findings in the text box.",
    category: "Data & Analytics",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 Days
    rewardText: "$300 analytics stipend",
    status: "open",
    isActive: true,
  });

  // 5. Create Application + Submission showing "Shortlisted" pipeline status
  console.log("Seeding Priya's Application & Submission flow to Task 1...");
  const app = await Application.create({
    taskId: task1._id,
    candidateId: candidate1._id,
    status: "Shortlisted",
    appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // applied 1 day ago
  });

  const sub = await Submission.create({
    applicationId: app._id,
    textAnswer: "I have designed a sleek mobile fitness tracker landing page mockup using Figma. The design features a warm cream mode matching your brand specifications. All components are aligned to a 4px layout grid with clear typography tags. I have outlined the full prototyping details in the shared link.",
    link: "https://figma.com/file/sample-fitness-app-prototype-design-id",
    fileUrl: "/public/uploads/fitness_mockup_v1.png",
    submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // submitted 12 hours ago
  });

  // Review comment from PixelForge
  await Review.create({
    submissionId: sub._id,
    comment: "This is a stellar layout! The grid consistency and visual hierarchy are exceptional. Let's schedule an interview loop next.",
    rating: 5,
    isAiGenerated: false,
  });

  console.log("-----------------------------------------");
  console.log("SEEDING COMPLETED SUCCESSFULLY!");
  console.log(`Admin email:    ${adminEmail}`);
  console.log(`Admin password: ${adminPassword}`);
  console.log(`Common user password: ${defaultPassword}`);
  console.log("-----------------------------------------");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("SEED SCRIPT ERROR:", err);
  process.exit(1);
});
