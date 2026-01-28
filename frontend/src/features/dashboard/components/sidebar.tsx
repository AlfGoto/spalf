"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/shared/utils"
import {
  Users,
  DoorOpen,
  Package,
  Sparkles,
  Calendar,
  UserCircle,
  LayoutDashboard,
  LogOut,
  CalendarOff,
} from "lucide-react"
import { Button } from "@/package/ui/button"
import { signOut } from "@/package/auth/actions"

const navItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/employees", icon: Users, labelKey: "nav.employees" },
  { href: "/rooms", icon: DoorOpen, labelKey: "nav.rooms" },
  { href: "/products", icon: Package, labelKey: "nav.products" },
  { href: "/services", icon: Sparkles, labelKey: "nav.services" },
  { href: "/reservations", icon: Calendar, labelKey: "nav.reservations" },
  { href: "/clients", icon: UserCircle, labelKey: "nav.clients" },
  { href: "/closures", icon: CalendarOff, labelKey: "nav.closures" },
]

export function Sidebar() {
  const t = useTranslations()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-16 items-center border-b border-neutral-200 px-6">
        <Link href="/" className="text-xl font-semibold">
          {t("app.name")}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-neutral-100 text-black"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-neutral-200 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-neutral-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {t("auth.logout")}
        </Button>
      </div>
    </aside>
  )
}
