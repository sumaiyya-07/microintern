import dbConnect from "@/lib/db/connect";
import User from "@/lib/models/User";
import { getSession } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";
import EditProfileForm from "@/components/profile/EditProfileForm";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "candidate") {
    redirect("/login?error=unauthorized");
  }

  await dbConnect();
  const user = await User.findById(session.id).lean();
  if (!user) {
    redirect("/login?error=invalid");
  }

  const plainUser = {
    _id: user._id.toString(),
    name: user.name ? String(user.name) : "",
    email: user.email ? String(user.email) : "",
    role: user.role ? String(user.role) : "candidate",
    bio: user.bio ? String(user.bio) : "",
    skills: user.skills ? user.skills.map((s: any) => String(s)) : [],
  };

  return (
    <div className="container-custom py-10 space-y-6">
      <EditProfileForm initialUser={plainUser as any} />
    </div>
  );
}
