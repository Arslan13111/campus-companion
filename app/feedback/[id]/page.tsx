"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function FeedbackForm({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  // Mock feedback form data
  const feedbackData = {
    id: Number.parseInt(params.id),
    title: "Course Feedback: Introduction to Computer Science",
    description: "Please provide your honest feedback about the course content, instruction, and overall experience.",
    instructions: "Your feedback helps us improve our courses. All responses are confidential.",
    sections: [
      {
        title: "Course Content",
        description: "Please rate and provide feedback on the course content.",
        questions: [
          {
            id: "content-relevance",
            question: "How relevant was the course content to your educational goals?",
            type: "rating",
            required: true,
            helpText: "Consider how well the content aligned with what you expected to learn.",
          },
          {
            id: "content-organization",
            question: "How well was the course content organized?",
            type: "rating",
            required: true,
            helpText: "Consider the logical flow and structure of the course materials.",
          },
          {
            id: "content-difficulty",
            question: "How would you rate the difficulty level of the course content?",
            type: "rating",
            required: true,
            helpText: "1 = Too easy, 3 = Appropriate, 5 = Too difficult",
          },
          {
            id: "content-materials",
            question: "How helpful were the course materials (textbooks, readings, etc.)?",
            type: "rating",
            required: true,
          },
          {
            id: "content-comments",
            question: "Additional comments about the course content:",
            type: "text",
            required: false,
            helpText: "Please share any specific feedback about the course content.",
          },
        ],
      },
      {
        title: "Instruction",
        description: "Please rate and provide feedback on the instruction and teaching methods.",
        questions: [
          {
            id: "instructor-knowledge",
            question: "How knowledgeable was the instructor about the subject matter?",
            type: "rating",
            required: true,
          },
          {
            id: "instructor-clarity",
            question: "How clear were the instructor's explanations?",
            type: "rating",
            required: true,
          },
          {
            id: "instructor-engagement",
            question: "How engaging was the instructor's teaching style?",
            type: "rating",
            required: true,
          },
          {
            id: "instructor-feedback",
            question: "How helpful was the feedback provided on assignments and exams?",
            type: "rating",
            required: true,
          },
          {
            id: "instructor-availability",
            question: "How would you rate the instructor's availability and responsiveness?",
            type: "rating",
            required: true,
          },
          {
            id: "instructor-comments",
            question: "Additional comments about the instruction:",
            type: "text",
            required: false,
          },
        ],
      },
      {
        title: "Assessments & Assignments",
        description: "Please provide feedback on course assessments and assignments.",
        questions: [
          {
            id: "assessments-fairness",
            question: "How fair were the assessments in measuring your understanding?",
            type: "rating",
            required: true,
          },
          {
            id: "assessments-difficulty",
            question: "How appropriate was the difficulty level of assignments and exams?",
            type: "rating",
            required: true,
            helpText: "1 = Too easy, 3 = Appropriate, 5 = Too difficult",
          },
          {
            id: "assessments-workload",
            question: "How reasonable was the workload for this course?",
            type: "rating",
            required: true,
          },
          {
            id: "assessments-relevance",
            question: "How relevant were the assignments to the course objectives?",
            type: "rating",
            required: true,
          },
          {
            id: "assessments-comments",
            question: "Additional comments about assessments and assignments:",
            type: "text",
            required: false,
          },
        ],
      },
      {
        title: "Overall Experience",
        description: "Please provide feedback on your overall experience in this course.",
        questions: [
          {
            id: "overall-satisfaction",
            question: "How satisfied are you with the overall course experience?",
            type: "rating",
            required: true,
          },
          {
            id: "overall-learning",
            question: "How much do you feel you learned in this course?",
            type: "rating",
            required: true,
          },
          {
            id: "overall-expectations",
            question: "How well did the course meet your expectations?",
            type: "rating",
            required: true,
          },
          {
            id: "overall-recommend",
            question: "How likely are you to recommend this course to other students?",
            type: "rating",
            required: true,
          },
          {
            id: "overall-strengths",
            question: "What did you like most about this course?",
            type: "text",
            required: false,
          },
          {
            id: "improvement-comments",
            question: "What suggestions do you have for improving this course?",
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

  const validateSection = (sectionIndex: number) => {
    const section = feedbackData.sections[sectionIndex]
    const errors: Record<string, string> = {}

    section.questions.forEach((question) => {
      if (question.required && (formData[question.id] === undefined || formData[question.id] === "")) {
        errors[question.id] = "This field is required"
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all sections before submission
    let isValid = true
    for (let i = 0; i < feedbackData.sections.length; i++) {
      if (!validateSection(i)) {
        isValid = false
        setCurrentSection(i)
        setShowPreview(false)
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
        title: "Feedback Submitted",
        description: "Thank you for your valuable feedback!",
      })
      router.push("/")
    }, 1500)
  }

  const nextSection = () => {
    if (validateSection(currentSection) && currentSection < feedbackData.sections.length - 1) {
      setCurrentSection(currentSection + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
      window.scrollTo(0, 0)
    }
  }

  const currentSectionData = feedbackData.sections[currentSection]
  const progress = ((currentSection + 1) / feedbackData.sections.length) * 100

  const renderQuestion = (question: any) => {
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
                    className="h-12 w-12 rounded-full flex items-center justify-center border cursor-pointer peer-data-[state=checked]:bg-blue-100 peer-data-[state=checked]:border-blue-500 dark:peer-data-[state=checked]:bg-blue-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

        {question.type === "text" && (
          <Textarea
            id={question.id}
            placeholder="Enter your response here..."
            className="min-h-[100px]"
            value={formData[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
          />
        )}
      </div>
    )
  }

  const renderPreview = () => {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-medium flex items-center gap-2">
            <ClipboardIcon className="h-5 w-5 text-blue-600" />
            Feedback Response Preview
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please review your responses before submitting. You can go back to make changes if needed.
          </p>
        </div>

        <Accordion type="multiple" className="w-full">
          {feedbackData.sections.map((section, sectionIndex) => (
            <AccordionItem key={sectionIndex} value={`section-${sectionIndex}`}>
              <AccordionTrigger className="hover:bg-slate-50 dark:hover:bg-slate-900 px-4">
                {section.title}
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="space-y-4">
                  {section.questions.map((question) => {
                    const responseValue = formData[question.id]
                    let displayValue: React.ReactNode = "No response"

                    if (question.type === "rating" && responseValue) {
                      displayValue = (
                        <div className="flex items-center">
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-medium">
                            {responseValue} / 5
                          </span>
                        </div>
                      )
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
          <CardHeader className="bg-blue-50 dark:bg-blue-950 border-b">
            <div className="flex justify-between items-center">
              <CardTitle>{feedbackData.title}</CardTitle>
              <div className="text-sm font-medium">
                {showPreview ? "Preview" : `Section ${currentSection + 1} of ${feedbackData.sections.length}`}
              </div>
            </div>
            <CardDescription>{feedbackData.description}</CardDescription>

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
            {!showPreview && (
              <div className="border-b">
                <Tabs
                  value={currentSection.toString()}
                  onValueChange={(value) => setCurrentSection(Number.parseInt(value))}
                  className="w-full overflow-x-auto flex-nowrap"
                >
                  <TabsList className="w-full justify-start px-4 h-12">
                    {feedbackData.sections.map((section, index) => (
                      <TabsTrigger
                        key={index}
                        value={index.toString()}
                        className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900 whitespace-nowrap"
                      >
                        {section.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            )}

            <CardContent className="pt-6">
              {showPreview ? (
                renderPreview()
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">{currentSectionData.title}</h3>
                    {currentSectionData.description && (
                      <p className="text-muted-foreground text-sm mt-1">{currentSectionData.description}</p>
                    )}
                  </div>

                  <div className="space-y-4">{currentSectionData.questions.map(renderQuestion)}</div>
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
                  currentSection > 0 && (
                    <Button type="button" variant="outline" onClick={prevSection}>
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
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                    {isSubmitting ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <SendIcon className="mr-2 h-4 w-4" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                ) : currentSection < feedbackData.sections.length - 1 ? (
                  <Button type="button" onClick={nextSection} className="bg-blue-600 hover:bg-blue-700">
                    Next
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      if (validateSection(currentSection)) {
                        setShowPreview(true)
                        window.scrollTo(0, 0)
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
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
