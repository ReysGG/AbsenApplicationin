"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
          router.refresh();
        },
      },
    });

    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={cn("admin-nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60", className)}
    >
      <span className="admin-nav-icon">
        <LogOut size={18} />
      </span>
      <span className="admin-nav-label">{pending ? "Keluar..." : "Keluar"}</span>
    </button>
  );
}
