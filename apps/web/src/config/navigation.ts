/**
 * Sidebar navigation, derived entirely from the single registry in
 * `nav-registry.ts`. This module only adds presentation concerns: icon
 * components and group ordering. Do NOT add menu items here — add a
 * registry entry instead, so menu visibility and route access stay one
 * and the same thing.
 */

import {
  Activity,
  AlertTriangle,
  Award,
  Baby,
  BarChart3,
  Bell,
  BookCheck,
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  ClipboardPenLine,
  Clock,
  CreditCard,
  Drama,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Heart,
  HeartHandshake,
  Home,
  IdCard,
  Languages,
  LayoutDashboard,
  Leaf,
  Library,
  Mail,
  Megaphone,
  MessageSquare,
  MessageSquareWarning,
  Package,
  School,
  ScrollText,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Trophy,
  UserCog,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";
import {
  NAV_GROUP_ORDER,
  menuEntriesForRole,
  type NavEntry,
} from "./nav-registry";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Icon key (registry) → lucide component. */
const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  activityAlt: Drama,
  alert: AlertTriangle,
  attendance: ClipboardCheck,
  award: Award,
  baby: Baby,
  bell: Bell,
  bookCheck: BookCheck,
  bookMarked: BookMarked,
  bookOpen: BookOpen,
  building: Building2,
  calendar: Calendar,
  calendarDays: CalendarDays,
  chart: BarChart3,
  child: Baby,
  classes: BookOpen,
  clipboardCheck: ClipboardCheck,
  clipboardList: ClipboardList,
  clipboardPen: ClipboardPenLine,
  clock: Clock,
  creditCard: CreditCard,
  dashboard: LayoutDashboard,
  folder: FolderOpen,
  globe: Globe,
  graduation: GraduationCap,
  health: Heart,
  heartHand: HeartHandshake,
  home: Home,
  idCard: IdCard,
  languages: Languages,
  leaf: Leaf,
  library: Library,
  mail: Mail,
  megaphone: Megaphone,
  message: MessageSquare,
  messageWarning: MessageSquareWarning,
  package: Package,
  permit: FileText,
  receipt: Wallet,
  report: FileSpreadsheet,
  school: School,
  scroll: ScrollText,
  settings: Settings,
  shield: Shield,
  shoppingBag: ShoppingBag,
  shoppingCart: ShoppingCart,
  sparkles: Sparkles,
  store: Store,
  students: GraduationCap,
  trophy: Trophy,
  userCog: UserCog,
  userPlus: UserPlus,
  users: Users,
  utensils: UtensilsCrossed,
  wallet: Wallet,
  washing: WashingMachine,
};

function toNavItem(entry: NavEntry): NavItem {
  return {
    title: entry.label,
    href: entry.path,
    icon: ICONS[entry.icon] ?? LayoutDashboard,
  };
}

/**
 * Build the grouped sidebar menu for a RoleCode straight from the registry.
 */
export function getNavigationForRoleCode(roleCode: string): NavGroup[] {
  if (!roleCode) return [];

  const entries = menuEntriesForRole(roleCode);
  return NAV_GROUP_ORDER.map((group) => ({
    title: group,
    items: entries.filter((e) => e.group === group).map(toNavItem),
  })).filter((g) => g.items.length > 0);
}

