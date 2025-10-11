"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl">Welcome, {session.user.name}!</h1>
      <p className="text-slate-400">Role: {session.user.role}</p>

      {session.user.role === "ADMIN" && (
        <div className="mt-6">
          <a href="/admin/users" className="text-emerald-400 hover:underline">
            Manage Users
          </a>
        </div>
      )}
    </div>
  );
}
