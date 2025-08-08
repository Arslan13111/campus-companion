"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface ResponsesChartProps {
  questions: any[]
}

export function ResponsesChart({ questions }: ResponsesChartProps) {
  const [selectedQuestion, setSelectedQuestion] = useState(questions[0]?.id || "")

  const ratingQuestions = questions.filter((q) => q.type === "rating")
  const currentQuestion = questions.find((q) => q.id === selectedQuestion) || ratingQuestions[0]

  const chartData = currentQuestion?.responses.map((response: any) => ({
    name: `${response.value} ${response.value === "1" ? "Star" : "Stars"}`,
    value: response.count,
  }))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question-select">Select Question</Label>
        <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
          <SelectTrigger id="question-select">
            <SelectValue placeholder="Select a question" />
          </SelectTrigger>
          <SelectContent>
            {ratingQuestions.map((question) => (
              <SelectItem key={question.id} value={question.id}>
                {question.question}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
