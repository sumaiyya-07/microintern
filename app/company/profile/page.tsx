import dbConnect from "@/lib/db/connect";
import User from "@/lib/models/User";
import { getSession } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";
import EditProfileForm from "@/components/profile/EditProfileForm";

export const dynamic = "force-dynamic";

export default async function CompanyProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "company") {
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
    role: user.role ? String(user.role) : "company",
    companyName: user.companyName ? String(user.companyName) : "",
    companyDescription: user.companyDescription ? String(user.companyDescription) : "",
  };

  return (
    <div className="container-custom py-10 space-y-6">
      <EditProfileForm initialUser={plainUser as any} />
    </div>
  );
}
