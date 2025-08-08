import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: "increase" | "decrease" | "neutral"
  icon?: React.ReactNode
}

export function StatCard({ title, value, change, changeType = "neutral", icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <span className="text-sm font-medium">{title}</span>
          </div>
          {change && (
            <div
              className={`flex items-center text-xs font-medium ${
                changeType === "increase"
                  ? "text-green-600 dark:text-green-400"
                  : changeType === "decrease"
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {changeType === "increase" ? (
                <ArrowUpIcon className="mr-1 h-3 w-3" />
              ) : changeType === "decrease" ? (
                <ArrowDownIcon className="mr-1 h-3 w-3" />
              ) : (
                <MinusIcon className="mr-1 h-3 w-3" />
              )}
              {change}
            </div>
          )}
        </div>
        <div className="mt-2 text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
