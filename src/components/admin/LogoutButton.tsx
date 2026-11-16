"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-brand-red hover:bg-red-50"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
