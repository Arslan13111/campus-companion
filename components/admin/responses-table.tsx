import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EyeIcon } from "lucide-react"

interface ResponsesTableProps {
  responses: any[]
  questions: any[]
}

export function ResponsesTable({ responses, questions }: ResponsesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Respondent</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Completion Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responses.map((response) => (
            <TableRow key={response.id}>
              <TableCell className="font-medium">#{response.id}</TableCell>
              <TableCell>{response.respondent}</TableCell>
              <TableCell>{new Date(response.submittedAt).toLocaleString()}</TableCell>
              <TableCell>{response.completionTime}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    response.status === "complete"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                  }
                >
                  {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
