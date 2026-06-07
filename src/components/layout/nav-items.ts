import type { ComponentType } from "react";
import {
  IconLayoutDashboard,
  IconMessageCircle,
  IconChartLine,
  IconUsers,
  IconPhoto,
  IconCreditCard,
  IconSettings,
  IconLifebuoy,
} from "@tabler/icons-react";

export type NavIcon = ComponentType<{ className?: string }>;

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "לוח בקרה", icon: IconLayoutDashboard },
  { href: "/chat", label: "דברו עם ג׳וני", icon: IconMessageCircle },
  { href: "/campaigns", label: "הקמפיינים שלך", icon: IconChartLine },
  { href: "/accounts", label: "חשבונות מודעות", icon: IconUsers },
  { href: "/assets", label: "ספריית המדיה שלך", icon: IconPhoto },
  { href: "/billing", label: "מנוי וחיובים", icon: IconCreditCard },
  { href: "/settings", label: "הגדרות החשבון שלך", icon: IconSettings },
  { href: "/support", label: "תמיכה", icon: IconLifebuoy },
];
