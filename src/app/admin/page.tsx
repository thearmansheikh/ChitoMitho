import Link from "next/link";
import { Card } from "@/components/admin/ui";

const TILES = [
  ["/admin/places", "Places", "Cafés, restaurants, shops"],
  ["/admin/items", "Items", "Menus, prices, sold-out"],
  ["/admin/import", "Import a menu", "Paste or upload a whole menu at once"],
  ["/admin/areas", "Areas", "Delivery area list"],
  ["/admin/offers", "Offers", "Deals and promo codes"],
  ["/admin/settings", "Settings", "WhatsApp, hours, pause orders"],
  ["/admin/orders", "Orders", "WhatsApp order counts"],
] as const;

export default function AdminHome() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {TILES.map(([href, title, sub]) => (
        <Link key={href} href={href}>
          <Card className="hover:border-brand-blue">
            <p className="text-lg font-bold text-brand-blue">{title}</p>
            <p className="text-sm text-slate-600">{sub}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
