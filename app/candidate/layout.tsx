import Navbar from "@/components/layout/Navbar";
import { getSession } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "candidate") {
    redirect("/login?error=unauthorized");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={session as any} />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
