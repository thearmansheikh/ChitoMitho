"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useBasket } from "@/context/BasketContext";
import { buildWhatsAppUrl, greetingMessage, placeOrderMessage, type Lang } from "@/lib/whatsapp";
import { logWhatsAppUrl } from "@/lib/openWhatsApp";

/** Lets the basket page open the details form when a WhatsApp button elsewhere is tapped. */
export const ORDER_REQUEST_EVENT = "cm:order-request";

/**
 * A "WhatsApp us" button that is never a blank chat.
 * - basketAware (header, bottom bar): with something in the basket it takes the customer to the order details,
 *   so the order goes out in one message. With an empty basket it opens a chat that starts with a short hello.
 * - otherwise (help, about, footer...): always the chat with the short hello.
 */
export default function WhatsAppLink({ number, basketAware = false, placeName, message, className, ariaLabel, children }: {
  number: string;
  basketAware?: boolean;
  /** Opens the chat with "Hi, I'd like to order from {placeName}." instead of the general hello. */
  placeName?: string;
  /** Opens the chat with exactly this text (for example a search that found nothing). */
  message?: string;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const locale = useLocale() as Lang;
  const router = useRouter();
  const pathname = usePathname();
  const { count, extras, hydrated } = useBasket();
  const href = buildWhatsAppUrl(number, message ?? (placeName ? placeOrderMessage(locale, placeName) : greetingMessage(locale)));
  const hasOrder = hydrated && (count > 0 || extras.shoppingList.trim().length > 0);

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (basketAware && hasOrder) {
      e.preventDefault();
      if (pathname === "/basket") window.dispatchEvent(new Event(ORDER_REQUEST_EVENT));
      else router.push("/basket?order=1");
      return;
    }
    logWhatsAppUrl(href);
  }

  return (
    <a href={href} onClick={onClick} aria-label={ariaLabel} className={className}>
      {children}
    </a>
  );
}
