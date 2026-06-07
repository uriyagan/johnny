import type { ComponentType } from "react";
import {
  DashboardIcon,
  ChatIcon,
  CampaignsIcon,
  AccountsIcon,
  MediaIcon,
  BillingIcon,
  SettingsIcon,
  SupportIcon,
} from "@/components/icons/nav-icons";

export type NavIcon = ComponentType<{ className?: string }>;

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "לוח בקרה", icon: DashboardIcon },
  { href: "/chat", label: "דברו עם ג׳וני", icon: ChatIcon },
  { href: "/campaigns", label: "הקמפיינים שלך", icon: CampaignsIcon },
  { href: "/accounts", label: "חשבונות מודעות", icon: AccountsIcon },
  { href: "/assets", label: "ספריית המדיה שלך", icon: MediaIcon },
  { href: "/billing", label: "מנוי וחיובים", icon: BillingIcon },
  { href: "/settings", label: "הגדרות החשבון שלך", icon: SettingsIcon },
  { href: "/support", label: "תמיכה", icon: SupportIcon },
];
