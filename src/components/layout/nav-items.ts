export type NavItem = {
  href: string;
  label: string;
  /** Inline SVG path data (24x24 viewBox). */
  icon: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "בית", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { href: "/chat", label: "צ'אט", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/campaigns", label: "קמפיינים", icon: "M3 3v18h18M7 14l4-4 4 4 5-5" },
  { href: "/accounts", label: "חשבונות מודעות", icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 21v-2a6 6 0 0 1 12 0v2" },
  { href: "/assets", label: "מדיה", icon: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" },
  { href: "/billing", label: "מנוי וחיובים", icon: "M3 10h18M3 6h18v12H3zM7 15h4" },
  { href: "/settings", label: "הגדרות", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.6-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 2h-5l-.3 2.9a7 7 0 0 0-1.7 1l-2.4-1-2 3.5L3 11a7 7 0 0 0 0 2l-2 1.6 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.9h5l.3-2.9a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.6c.07-.33.1-.66.1-1z" },
];
