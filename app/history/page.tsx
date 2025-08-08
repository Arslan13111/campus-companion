import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftIcon, CalendarIcon, CheckCircle2Icon, ClockIcon, FileTextIcon, ClipboardListIcon } from "lucide-react"

export default function SubmissionHistory() {
  // Mock data for submission history
  const submittedForms = [
    {
      id: 2,
      title: "Student Experience Survey",
      type: "survey",
      submittedDate: "May 15, 2025",
      status: "completed",
    },
    {
      id: 5,
      title: "Academic Advising Feedback",
      type: "feedback",
      submittedDate: "May 10, 2025",
      status: "completed",
    },
    {
      id: 7,
      title: "Dining Services Survey",
      type: "survey",
      submittedDate: "April 28, 2025",
      status: "completed",
    },
    {
      id: 9,
      title: "Mathematics Course Feedback",
      type: "feedback",
      submittedDate: "April 15, 2025",
      status: "completed",
    },
  ]

  const pendingForms = [
    {
      id: 1,
      title: "Course Feedback: Introduction to Computer Science",
      type: "feedback",
      dueDate: "May 30, 2025",
      status: "pending",
    },
    {
      id: 3,
      title: "Library Services Feedback",
      type: "feedback",
      dueDate: "June 5, 2025",
      status: "pending",
    },
    {
      id: 4,
      title: "Campus Facilities Survey",
      type: "survey",
      dueDate: "June 10, 2025",
      status: "pending",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Submission History</h1>
            <p className="text-muted-foreground mt-1">Track all your feedback and survey submissions</p>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900"
              >
                <ClockIcon className="mr-2 h-4 w-4" />
                Pending ({pendingForms.length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900"
              >
                <CheckCircle2Icon className="mr-2 h-4 w-4" />
                Completed ({submittedForms.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-0">
              <Card>
                <CardHeader className="bg-amber-50 dark:bg-amber-950 border-b">
                  <CardTitle className="flex items-center">
                    <ClockIcon className="mr-2 h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Pending Forms
                  </CardTitle>
                  <CardDescription>Forms that still need to be completed</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {pendingForms.length > 0 ? (
                    <div className="divide-y">
                      {pendingForms.map((form) => (
                        <div
                          key={form.id}
                          className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          <div className="flex items-start gap-3">
                            {form.type === "feedback" ? (
                              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                                <FileTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            ) : (
                              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                                <ClipboardListIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium">{form.title}</h3>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <CalendarIcon className="mr-1 h-4 w-4" />
                                <span>Due: {form.dueDate}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            asChild
                            variant="default"
                            className={
                              form.type === "feedback"
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-purple-600 hover:bg-purple-700"
                            }
                            size="sm"
                          >
                            <Link href={`/${form.type}/${form.id}`}>Complete Now</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <CheckCircle2Icon className="h-12 w-12 text-emerald-500 mb-4" />
                      <h3 className="text-xl font-medium mb-1">All caught up!</h3>
                      <p className="text-muted-foreground">You have no pending forms to complete.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <Card>
                <CardHeader className="bg-emerald-50 dark:bg-emerald-950 border-b">
                  <CardTitle className="flex items-center">
                    <CheckCircle2Icon className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Completed Forms
                  </CardTitle>
                  <CardDescription>Forms you have already submitted</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {submittedForms.length > 0 ? (
                    <div className="divide-y">
                      {submittedForms.map((form) => (
                        <div
                          key={form.id}
                          className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          <div className="flex items-start gap-3">
                            {form.type === "feedback" ? (
                              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                                <FileTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            ) : (
                              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                                <ClipboardListIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium">{form.title}</h3>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <CalendarIcon className="mr-1 h-4 w-4" />
                                <span>Submitted: {form.submittedDate}</span>
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          >
                            Completed
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <ClipboardListIcon className="h-12 w-12 text-slate-400 mb-4" />
                      <h3 className="text-xl font-medium mb-1">No submissions yet</h3>
                      <p className="text-muted-foreground">You haven't completed any forms.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
