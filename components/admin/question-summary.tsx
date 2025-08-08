import { Progress } from "@/components/ui/progress"

interface QuestionSummaryProps {
  question: {
    id: string
    question: string
    type: string
    responses: {
      value: string
      count: number
    }[]
  }
}

export function QuestionSummary({ question }: QuestionSummaryProps) {
  const totalResponses = question.responses.reduce((acc, curr) => acc + curr.count, 0)

  if (question.type === "rating") {
    const averageRating =
      question.responses.reduce((acc, curr) => acc + Number(curr.value) * curr.count, 0) / totalResponses

    return (
      <div>
        <h3 className="font-medium mb-2">{question.question}</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Average Rating</div>
        </div>
        <div className="space-y-2">
          {question.responses.map((response) => (
            <div key={response.value} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{response.value} Stars</span>
                <span>{((response.count / totalResponses) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(response.count / totalResponses) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-medium mb-2">{question.question}</h3>
      <div className="text-sm text-muted-foreground mb-2">{question.responses.length} text responses</div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {question.responses.map((response, index) => (
          <div key={index} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md text-sm">
            {response.value}
          </div>
        ))}
      </div>
    </div>
  )
}
