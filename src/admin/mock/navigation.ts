import {
  ActivityIcon,
  DashboardIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
  EditIcon,
  EyeIcon,
  AlertTriangleIcon,
  PlusIcon,
} from "@/admin/lib/icons";

export interface AdminNavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermissions?: string[];
}

export const adminNavigation = [
  { label: "Dashboard", href: "/admin", icon: DashboardIcon },
  {
    label: "Users",
    href: "/admin/users",
    icon: UsersIcon,
    requiredPermissions: ["manage-employees", "view-employees"],
  },
  {
    label: "Role Management",
    href: "/admin/role-management",
    icon: ShieldIcon,
    requiredPermissions: ["manage-roles", "manage-permissions"],
  },
  {
    label: "Activity Logs",
    href: "/admin/activity-logs",
    icon: ActivityIcon,
    requiredPermissions: ["manage-activities"],
  },
  {
    label: "Configuration",
    href: "/admin/configuration",
    icon: SettingsIcon,
    requiredPermissions: ["manage-configurations"],
  },
  {
    label: "My Mangas",
    href: "/admin/manga",
    icon: EditIcon,
    requiredPermissions: ["create-manga"],
  },
  {
    label: "Create Manga",
    href: "/admin/manga/create",
    icon: PlusIcon,
    requiredPermissions: ["create-manga"],
  },
  {
    label: "Manga Reviews",
    href: "/admin/manga-reviews",
    icon: EyeIcon,
    requiredPermissions: ["manage-manga"],
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: AlertTriangleIcon,
    requiredPermissions: ["manage-reports"],
  },
] satisfies AdminNavigationItem[];
