import { Badge } from "@/components/ui/badge"
import { ArchiveIcon, ClipboardIcon, ClipboardListIcon, EditIcon, FileTextIcon, SendIcon, UserIcon } from "lucide-react"

interface Activity {
  id: number
  type: string
  title: string
  description: string
  timestamp: string
  user?: string
  count?: number
}

interface RecentActivityProps {
  activities: Activity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "form_created":
        return <ClipboardIcon className="h-4 w-4" />
      case "form_published":
        return <SendIcon className="h-4 w-4" />
      case "form_responses":
        return <ClipboardListIcon className="h-4 w-4" />
      case "form_edited":
        return <EditIcon className="h-4 w-4" />
      case "form_archived":
        return <ArchiveIcon className="h-4 w-4" />
      default:
        return <FileTextIcon className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "form_created":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "form_published":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "form_responses":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "form_edited":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      case "form_archived":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
    }
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>{getActivityIcon(activity.type)}</div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-medium">{activity.title}</p>
              <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
            </div>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
            {activity.count && (
              <Badge variant="outline" className="mt-1">
                {activity.count} responses
              </Badge>
            )}
            {activity.user && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <UserIcon className="h-3 w-3" />
                <span>{activity.user}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
