import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MessageCircle,
  LineChart,
  Users,
  Image,
  CreditCard,
  Settings,
  LifeBuoy,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/chat", label: "דברו עם ג׳וני", icon: MessageCircle },
  { href: "/campaigns", label: "הקמפיינים שלך", icon: LineChart },
  { href: "/accounts", label: "חשבונות מודעות", icon: Users },
  { href: "/assets", label: "ספריית המדיה שלך", icon: Image },
  { href: "/billing", label: "מנוי וחיובים", icon: CreditCard },
  { href: "/settings", label: "הגדרות החשבון שלך", icon: Settings },
  { href: "/support", label: "תמיכה", icon: LifeBuoy },
];
