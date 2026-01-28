"use client"

import { useTranslations } from "next-intl"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/package/ui/table"
import { Button } from "@/package/ui/button"
import { Trash2 } from "lucide-react"
import type { Closure } from "../types"

interface ClosureListProps {
  closures: Closure[]
  onDelete: (closure: Closure) => void
}

export function ClosureList({ closures, onDelete }: ClosureListProps) {
  const t = useTranslations()

  if (closures.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        {t("closures.noClosures")}
      </div>
    )
  }

  // Sort closures by date (ascending)
  const sortedClosures = [...closures].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("closures.date")}</TableHead>
          <TableHead>{t("closures.reason")}</TableHead>
          <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedClosures.map((closure) => (
          <TableRow key={closure.id}>
            <TableCell className="font-medium">
              {formatDate(closure.date)}
            </TableCell>
            <TableCell>{closure.reason || "-"}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(closure)}
                aria-label={t("common.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00")
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
