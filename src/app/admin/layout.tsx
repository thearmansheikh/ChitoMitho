import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const NAV = [
  ["/admin", "Dashboard"],
  ["/admin/places", "Places"],
  ["/admin/items", "Items"],
  ["/admin/import", "Import"],
  ["/admin/areas", "Areas"],
  ["/admin/offers", "Offers"],
  ["/admin/settings", "Settings"],
  ["/admin/orders", "Orders"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const user = configured ? (await createClient().auth.getUser()).data.user : null;

  return (
    <div className="space-y-4">
      {!configured && (
        <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-900">
          Supabase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill in the keys.
        </p>
      )}
      {user && (
        <nav aria-label="Admin" className="-mx-4 flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-4 pb-2">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-brand-blue hover:bg-slate-100">
              {label}
            </Link>
          ))}
          <span className="ml-auto" />
          <LogoutButton />
        </nav>
      )}
      {children}
    </div>
  );
}
