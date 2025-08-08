"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeftIcon, BarChart3Icon, DownloadIcon, FileTextIcon, PieChartIcon, UserIcon } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ResponsesTable } from "@/components/admin/responses-table"
import { ResponsesChart } from "@/components/admin/responses-chart"
import { QuestionSummary } from "@/components/admin/question-summary"

export default function FormResponsesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("summary")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDate, setFilterDate] = useState("all-time")

  // Mock form data
  const formData = {
    id: Number.parseInt(params.id),
    title: "Course Feedback: Introduction to Computer Science",
    type: "feedback",
    status: "active",
    category: "Academic",
    createdAt: "2025-05-01",
    updatedAt: "2025-05-10",
    responses: 45,
    completionRate: 78,
    questions: [
      {
        id: "q1",
        question: "How relevant was the course content to your educational goals?",
        type: "rating",
        responses: [
          { value: "1", count: 2 },
          { value: "2", count: 3 },
          { value: "3", count: 8 },
          { value: "4", count: 15 },
          { value: "5", count: 17 },
        ],
      },
      {
        id: "q2",
        question: "How well was the course content organized?",
        type: "rating",
        responses: [
          { value: "1", count: 1 },
          { value: "2", count: 4 },
          { value: "3", count: 10 },
          { value: "4", count: 18 },
          { value: "5", count: 12 },
        ],
      },
      {
        id: "q3",
        question: "How knowledgeable was the instructor about the subject matter?",
        type: "rating",
        responses: [
          { value: "1", count: 0 },
          { value: "2", count: 2 },
          { value: "3", count: 5 },
          { value: "4", count: 13 },
          { value: "5", count: 25 },
        ],
      },
      {
        id: "q4",
        question: "Additional comments about the course content:",
        type: "text",
        responses: [
          { value: "The course was well-structured and informative.", count: 1 },
          { value: "I would have liked more practical examples.", count: 1 },
          { value: "The textbook was outdated.", count: 1 },
          { value: "Great introduction to the subject!", count: 1 },
          { value: "The pace was too fast for beginners.", count: 1 },
        ],
      },
    ],
  }

  // Mock individual responses data
  const individualResponses = [
    {
      id: 1,
      respondent: "Anonymous",
      submittedAt: "2025-05-10T14:30:00Z",
      completionTime: "8 minutes",
      status: "complete",
      responses: {
        q1: "5",
        q2: "4",
        q3: "5",
        q4: "The course was well-structured and informative.",
      },
    },
    {
      id: 2,
      respondent: "Anonymous",
      submittedAt: "2025-05-09T10:15:00Z",
      completionTime: "12 minutes",
      status: "complete",
      responses: {
        q1: "4",
        q2: "3",
        q3: "4",
        q4: "I would have liked more practical examples.",
      },
    },
    {
      id: 3,
      respondent: "Anonymous",
      submittedAt: "2025-05-08T16:45:00Z",
      completionTime: "5 minutes",
      status: "complete",
      responses: {
        q1: "3",
        q2: "2",
        q3: "4",
        q4: "The textbook was outdated.",
      },
    },
    {
      id: 4,
      respondent: "Anonymous",
      submittedAt: "2025-05-07T09:20:00Z",
      completionTime: "10 minutes",
      status: "complete",
      responses: {
        q1: "5",
        q2: "5",
        q3: "5",
        q4: "Great introduction to the subject!",
      },
    },
    {
      id: 5,
      respondent: "Anonymous",
      submittedAt: "2025-05-06T13:10:00Z",
      completionTime: "15 minutes",
      status: "complete",
      responses: {
        q1: "2",
        q2: "3",
        q3: "3",
        q4: "The pace was too fast for beginners.",
      },
    },
  ]

  return (
    <AdminLayout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.push("/admin/forms")}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{formData.title}</h1>
          <p className="text-muted-foreground">View and analyze form responses</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-4xl font-bold">{formData.responses}</div>
              <p className="text-sm text-muted-foreground">Total Responses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-4xl font-bold">{formData.completionRate}%</div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-4xl font-bold">8.4</div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Responses</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-time">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline">
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="responses">
            <UserIcon className="h-4 w-4 mr-2" />
            Individual Responses
          </TabsTrigger>
          <TabsTrigger value="questions">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Question Analysis
          </TabsTrigger>
          <TabsTrigger value="charts">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            Charts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Summary</CardTitle>
              <CardDescription>Overview of all responses to this form</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {formData.questions.map((question) => (
                  <QuestionSummary key={question.id} question={question} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Individual Responses</CardTitle>
              <CardDescription>View detailed responses from each respondent</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsesTable responses={individualResponses} questions={formData.questions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Question Analysis</CardTitle>
              <CardDescription>Detailed analysis of responses for each question</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {formData.questions.map((question) => (
                  <div key={question.id} className="border-b pb-6 last:border-0 last:pb-0">
                    <h3 className="text-lg font-medium mb-4">{question.question}</h3>

                    {question.type === "rating" ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-24 text-right font-medium">Average:</div>
                          <div className="text-2xl font-bold">
                            {(
                              question.responses.reduce((acc, curr) => acc + Number(curr.value) * curr.count, 0) /
                              question.responses.reduce((acc, curr) => acc + curr.count, 0)
                            ).toFixed(1)}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {question.responses.map((response) => (
                            <div key={response.value} className="flex items-center gap-4">
                              <div className="w-24 text-right">{response.value} Stars:</div>
                              <div className="w-full max-w-md">
                                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 dark:bg-blue-600 flex items-center justify-end px-2"
                                    style={{
                                      width: `${(response.count / formData.responses) * 100}%`,
                                      minWidth: response.count > 0 ? "2rem" : "0",
                                    }}
                                  >
                                    <span className="text-white text-xs font-medium">{response.count}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {((response.count / formData.responses) * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground mb-2">
                          {question.responses.length} text responses
                        </div>
                        <div className="space-y-2">
                          {question.responses.map((response, index) => (
                            <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                              {response.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <Card>
            <CardHeader>
              <CardTitle>Visual Analytics</CardTitle>
              <CardDescription>Graphical representation of response data</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsesChart questions={formData.questions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}
