"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  InfoIcon,
  SaveIcon,
  SendIcon,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function SurveyForm({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  // Mock survey data
  const surveyData = {
    id: Number.parseInt(params.id),
    title: "Student Experience Survey",
    description:
      "Help us improve your overall student experience by completing this survey. Your feedback is valuable to us.",
    instructions:
      "Please answer all questions honestly. Your responses will remain anonymous and will be used to improve campus services.",
    pages: [
      {
        title: "Academic Experience",
        description: "This section focuses on your academic experiences at the university.",
        questions: [
          {
            id: "academic-satisfaction",
            question: "How satisfied are you with your academic experience?",
            type: "rating",
            required: true,
            helpText: "Consider factors like course quality, professor engagement, and learning outcomes.",
          },
          {
            id: "course-load",
            question: "How would you rate your current course load?",
            type: "select",
            options: ["Too light", "Slightly light", "Appropriate", "Slightly heavy", "Too heavy"],
            required: true,
            helpText: "Consider the number of courses and workload compared to your expectations.",
          },
          {
            id: "learning-resources",
            question: "Which learning resources do you find most helpful?",
            type: "checkbox",
            options: [
              "Textbooks",
              "Online materials",
              "Lecture recordings",
              "Study groups",
              "Office hours",
              "Tutoring services",
              "Library resources",
            ],
            required: false,
            helpText: "Select all that apply to your learning experience.",
          },
          {
            id: "academic-challenges",
            question: "What are your biggest academic challenges?",
            type: "text",
            required: false,
            helpText: "Describe any difficulties you face in your academic journey.",
          },
        ],
      },
      {
        title: "Campus Facilities",
        description: "This section asks about your experience with various campus facilities.",
        questions: [
          {
            id: "library-usage",
            question: "How often do you use the library facilities?",
            type: "select",
            options: [
              "Never",
              "Rarely (1-2 times per semester)",
              "Sometimes (monthly)",
              "Often (weekly)",
              "Very often (multiple times per week)",
            ],
            required: true,
          },
          {
            id: "facility-ratings",
            question: "Please rate the following campus facilities:",
            type: "matrix",
            rows: ["Library", "Cafeteria", "Gym", "Study spaces", "Computer labs", "Lecture halls", "Recreation areas"],
            columns: ["Poor", "Fair", "Good", "Very Good", "Excellent"],
            required: true,
            helpText: "Rate each facility based on your personal experience.",
          },
          {
            id: "facility-improvement",
            question: "What campus facilities would you like to see improved?",
            type: "text",
            required: false,
          },
        ],
      },
      {
        title: "Student Support Services",
        description: "This section focuses on student support services available on campus.",
        questions: [
          {
            id: "support-awareness",
            question: "Which student support services are you aware of?",
            type: "checkbox",
            options: [
              "Academic advising",
              "Career services",
              "Counseling",
              "Financial aid",
              "Health services",
              "Disability services",
              "International student services",
              "Tutoring center",
            ],
            required: false,
          },
          {
            id: "support-usage",
            question: "Which services have you used in the past year?",
            type: "checkbox",
            options: [
              "Academic advising",
              "Career services",
              "Counseling",
              "Financial aid",
              "Health services",
              "Disability services",
              "International student services",
              "Tutoring center",
            ],
            required: false,
          },
          {
            id: "support-satisfaction",
            question: "How satisfied are you with the support services you've used?",
            type: "rating",
            required: false,
            helpText: "Only rate services you have personally used.",
          },
          {
            id: "support-comments",
            question: "Any additional comments about student support services?",
            type: "text",
            required: false,
          },
        ],
      },
      {
        title: "Campus Life & Activities",
        description: "This section asks about your involvement in campus life and activities.",
        questions: [
          {
            id: "club-participation",
            question: "Are you involved in any student clubs or organizations?",
            type: "radio",
            options: ["Yes", "No"],
            required: true,
          },
          {
            id: "club-satisfaction",
            question: "If yes, how satisfied are you with your club experience?",
            type: "rating",
            required: false,
            conditional: {
              questionId: "club-participation",
              value: "Yes",
            },
          },
          {
            id: "event-participation",
            question: "How often do you attend campus events?",
            type: "select",
            options: ["Never", "Rarely", "Sometimes", "Often", "Very often"],
            required: true,
          },
          {
            id: "activity-interests",
            question: "What types of campus activities interest you most?",
            type: "checkbox",
            options: [
              "Academic lectures",
              "Cultural events",
              "Sports events",
              "Social gatherings",
              "Career fairs",
              "Volunteer opportunities",
              "Arts performances",
            ],
            required: false,
          },
          {
            id: "activity-suggestions",
            question: "What additional activities would you like to see on campus?",
            type: "text",
            required: false,
          },
        ],
      },
      {
        title: "Overall Experience & Feedback",
        description: "This final section asks about your overall experience and any additional feedback.",
        questions: [
          {
            id: "overall-satisfaction",
            question: "Overall, how satisfied are you with your experience at this university?",
            type: "rating",
            required: true,
          },
          {
            id: "recommend-likelihood",
            question: "How likely are you to recommend this university to others?",
            type: "rating",
            required: true,
          },
          {
            id: "strengths",
            question: "What do you consider to be the university's greatest strengths?",
            type: "text",
            required: false,
          },
          {
            id: "improvements",
            question: "What areas do you think need the most improvement?",
            type: "text",
            required: false,
          },
          {
            id: "additional-comments",
            question: "Any additional comments or suggestions?",
            type: "text",
            required: false,
          },
        ],
      },
    ],
  }

  const handleInputChange = (questionId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [questionId]: value,
    }))

    // Clear validation error when field is filled
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const validatePage = (pageIndex: number) => {
    const page = surveyData.pages[pageIndex]
    const errors: Record<string, string> = {}

    page.questions.forEach((question) => {
      // Skip validation for conditional questions that aren't shown
      if (question.conditional) {
        const conditionMet = formData[question.conditional.questionId] === question.conditional.value
        if (!conditionMet) return
      }

      if (question.required && (formData[question.id] === undefined || formData[question.id] === "")) {
        errors[question.id] = "This field is required"
      }

      if (question.type === "matrix" && question.required) {
        const rowIds = question.rows?.map((row) => `${question.id}-${row.toLowerCase().replace(/\s+/g, "-")}`) || []
        for (const rowId of rowIds) {
          if (!formData[rowId]) {
            errors[rowId] = "This rating is required"
          }
        }
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all pages before submission
    let isValid = true
    for (let i = 0; i < surveyData.pages.length; i++) {
      if (!validatePage(i)) {
        isValid = false
        setCurrentPage(i)
        break
      }
    }

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Survey Submitted",
        description: "Thank you for completing the survey!",
      })
      router.push("/")
    }, 1500)
  }

  const nextPage = () => {
    if (validatePage(currentPage) && currentPage < surveyData.pages.length - 1) {
      setCurrentPage(currentPage + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      window.scrollTo(0, 0)
    }
  }

  const currentPageData = surveyData.pages[currentPage]
  const progress = ((currentPage + 1) / surveyData.pages.length) * 100

  const isQuestionVisible = (question: any) => {
    if (!question.conditional) return true
    return formData[question.conditional.questionId] === question.conditional.value
  }

  const renderQuestion = (question: any) => {
    if (!isQuestionVisible(question)) return null

    return (
      <div key={question.id} className="space-y-2 p-4 border rounded-lg bg-white dark:bg-slate-950">
        <div className="flex justify-between items-start gap-2">
          <Label htmlFor={question.id} className="font-medium">
            {question.question}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>

          {question.helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{question.helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {validationErrors[question.id] && (
          <div className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircleIcon className="h-4 w-4" />
            {validationErrors[question.id]}
          </div>
        )}

        {question.type === "rating" && (
          <div className="pt-2">
            <RadioGroup
              id={question.id}
              className="flex flex-wrap gap-2"
              value={formData[question.id] || ""}
              onValueChange={(value) => handleInputChange(question.id, value)}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <div key={value} className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value={value.toString()} id={`${question.id}-${value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`${question.id}-${value}`}
                    className="h-12 w-12 rounded-full flex items-center justify-center border cursor-pointer peer-data-[state=checked]:bg-purple-100 peer-data-[state=checked]:border-purple-500 dark:peer-data-[state=checked]:bg-purple-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {value}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {value === 1 ? "Poor" : value === 5 ? "Excellent" : ""}
                  </span>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {question.type === "radio" && (
          <RadioGroup
            id={question.id}
            className="flex flex-col space-y-2 pt-2"
            value={formData[question.id] || ""}
            onValueChange={(value) => handleInputChange(question.id, value)}
          >
            {question.options?.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option.toLowerCase().replace(/\s+/g, "-")}`} />
                <Label htmlFor={`${question.id}-${option.toLowerCase().replace(/\s+/g, "-")}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === "select" && (
          <Select value={formData[question.id] || ""} onValueChange={(value) => handleInputChange(question.id, value)}>
            <SelectTrigger id={question.id} className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {question.type === "checkbox" && (
          <div className="grid gap-2 pt-2 md:grid-cols-2">
            {question.options?.map((option: string) => {
              const optionId = `${question.id}-${option.toLowerCase().replace(/\s+/g, "-")}`
              const isChecked = Array.isArray(formData[question.id]) && formData[question.id]?.includes(option)

              return (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={optionId}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(formData[question.id]) ? [...formData[question.id]] : []
                      if (checked) {
                        handleInputChange(question.id, [...currentValues, option])
                      } else {
                        handleInputChange(
                          question.id,
                          currentValues.filter((value: string) => value !== option),
                        )
                      }
                    }}
                  />
                  <Label htmlFor={optionId}>{option}</Label>
                </div>
              )
            })}
          </div>
        )}

        {question.type === "text" && (
          <Textarea
            id={question.id}
            placeholder="Enter your response here..."
            className="min-h-[100px]"
            value={formData[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
          />
        )}

        {question.type === "matrix" && (
          <div className="overflow-x-auto mt-2">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 w-1/4"></th>
                  {question.columns
                    ? question.columns.map((column: string, index: number) => (
                        <th key={column} className="text-center p-2 text-sm">
                          {column}
                        </th>
                      ))
                    : [1, 2, 3, 4, 5].map((rating) => (
                        <th key={rating} className="text-center p-2 text-sm">
                          {rating}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody>
                {question.rows?.map((row: string) => {
                  const rowId = `${question.id}-${row.toLowerCase().replace(/\s+/g, "-")}`

                  return (
                    <tr key={row} className="border-t">
                      <td className="p-2 text-sm font-medium">{row}</td>
                      {question.columns
                        ? question.columns.map((column: string, index: number) => {
                            const value = (index + 1).toString()
                            const optionId = `${rowId}-${value}`

                            return (
                              <td key={column} className="text-center p-2">
                                <RadioGroup
                                  className="flex justify-center"
                                  value={formData[rowId] || ""}
                                  onValueChange={(value) => handleInputChange(rowId, value)}
                                >
                                  <RadioGroupItem value={value} id={optionId} className="h-4 w-4" />
                                </RadioGroup>
                              </td>
                            )
                          })
                        : [1, 2, 3, 4, 5].map((rating) => {
                            const optionId = `${rowId}-${rating}`

                            return (
                              <td key={rating} className="text-center p-2">
                                <RadioGroup
                                  className="flex justify-center"
                                  value={formData[rowId] || ""}
                                  onValueChange={(value) => handleInputChange(rowId, value)}
                                >
                                  <RadioGroupItem value={rating.toString()} id={optionId} className="h-4 w-4" />
                                </RadioGroup>
                              </td>
                            )
                          })}
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {validationErrors[question.id] && (
              <div className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertCircleIcon className="h-4 w-4" />
                {validationErrors[question.id]}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderPreview = () => {
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="font-medium flex items-center gap-2">
            <ClipboardIcon className="h-5 w-5 text-purple-600" />
            Survey Response Preview
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please review your responses before submitting. You can go back to make changes if needed.
          </p>
        </div>

        <Accordion type="multiple" className="w-full">
          {surveyData.pages.map((page, pageIndex) => (
            <AccordionItem key={pageIndex} value={`page-${pageIndex}`}>
              <AccordionTrigger className="hover:bg-slate-50 dark:hover:bg-slate-900 px-4">
                {page.title}
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="space-y-4">
                  {page.questions.map((question) => {
                    if (!isQuestionVisible(question)) return null

                    const responseValue = formData[question.id]
                    let displayValue: React.ReactNode = "No response"

                    if (question.type === "rating" && responseValue) {
                      displayValue = (
                        <div className="flex items-center">
                          <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded font-medium">
                            {responseValue} / 5
                          </span>
                        </div>
                      )
                    } else if (
                      question.type === "checkbox" &&
                      Array.isArray(responseValue) &&
                      responseValue.length > 0
                    ) {
                      displayValue = (
                        <div className="flex flex-wrap gap-1">
                          {responseValue.map((item: string) => (
                            <Badge key={item} variant="outline" className="bg-slate-100 dark:bg-slate-800">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )
                    } else if (question.type === "matrix") {
                      const rowResponses: React.ReactNode[] = []

                      question.rows?.forEach((row: string) => {
                        const rowId = `${question.id}-${row.toLowerCase().replace(/\s+/g, "-")}`
                        const rowValue = formData[rowId]

                        if (rowValue) {
                          const columnLabel = question.columns
                            ? question.columns[Number.parseInt(rowValue) - 1]
                            : rowValue

                          rowResponses.push(
                            <div key={rowId} className="flex justify-between items-center py-1 border-b last:border-0">
                              <span className="text-sm font-medium">{row}:</span>
                              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">
                                {columnLabel}
                              </Badge>
                            </div>,
                          )
                        }
                      })

                      displayValue =
                        rowResponses.length > 0 ? <div className="space-y-1">{rowResponses}</div> : "No response"
                    } else if (responseValue) {
                      displayValue = responseValue
                    }

                    return (
                      <div key={question.id} className="border-b pb-3 last:border-0">
                        <div className="font-medium text-sm">{question.question}</div>
                        <div className="mt-1 text-sm">{displayValue}</div>
                      </div>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-10">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <Card className="max-w-3xl mx-auto">
          <CardHeader className="bg-purple-50 dark:bg-purple-950 border-b">
            <div className="flex justify-between items-center">
              <CardTitle>{surveyData.title}</CardTitle>
              <div className="text-sm font-medium">
                {showPreview ? "Preview" : `Page ${currentPage + 1} of ${surveyData.pages.length}`}
              </div>
            </div>
            <CardDescription>{surveyData.description}</CardDescription>

            {!showPreview && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6">
              {showPreview ? (
                renderPreview()
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">{currentPageData.title}</h3>
                    {currentPageData.description && (
                      <p className="text-muted-foreground text-sm mt-1">{currentPageData.description}</p>
                    )}
                  </div>

                  <div className="space-y-4">{currentPageData.questions.map(renderQuestion)}</div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-6 bg-slate-50 dark:bg-slate-900">
              <div>
                {showPreview ? (
                  <Button type="button" variant="outline" onClick={() => setShowPreview(false)}>
                    <ChevronLeftIcon className="mr-2 h-4 w-4" />
                    Back to Edit
                  </Button>
                ) : (
                  currentPage > 0 && (
                    <Button type="button" variant="outline" onClick={prevPage}>
                      <ChevronLeftIcon className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                  )
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline">
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>

                {showPreview ? (
                  <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                    {isSubmitting ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <SendIcon className="mr-2 h-4 w-4" />
                        Submit Survey
                      </>
                    )}
                  </Button>
                ) : currentPage < surveyData.pages.length - 1 ? (
                  <Button type="button" onClick={nextPage} className="bg-purple-600 hover:bg-purple-700">
                    Next
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      if (validatePage(currentPage)) {
                        setShowPreview(true)
                        window.scrollTo(0, 0)
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Review
                    <CheckCircleIcon className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
