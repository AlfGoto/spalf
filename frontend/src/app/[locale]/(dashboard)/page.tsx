import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/package/ui/card"
import {
  Users,
  DoorOpen,
  Package,
  Sparkles,
  Calendar,
  UserCircle,
} from "lucide-react"

const quickLinks = [
  { href: "/employees", icon: Users, labelKey: "nav.employees", countKey: "dashboard.employees" },
  { href: "/rooms", icon: DoorOpen, labelKey: "nav.rooms", countKey: "dashboard.rooms" },
  { href: "/products", icon: Package, labelKey: "nav.products", countKey: "dashboard.products" },
  { href: "/services", icon: Sparkles, labelKey: "nav.services", countKey: "dashboard.services" },
  { href: "/reservations", icon: Calendar, labelKey: "nav.reservations", countKey: "dashboard.reservations" },
  { href: "/clients", icon: UserCircle, labelKey: "nav.clients", countKey: "dashboard.clients" },
]

export default function DashboardPage() {
  const t = useTranslations()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("nav.dashboard")}</h1>
        <p className="text-neutral-500">{t("dashboard.welcome")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="transition-colors hover:bg-neutral-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t(item.labelKey)}
                </CardTitle>
                <item.icon className="h-5 w-5 text-neutral-500" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-500">
                  {t("dashboard.clickToManage")}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
