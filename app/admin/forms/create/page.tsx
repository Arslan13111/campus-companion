"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardListIcon,
  EyeIcon,
  FileTextIcon,
  GripVerticalIcon,
  PlusIcon,
  SaveIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useToast } from "@/hooks/use-toast"

export default function CreateFormPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("details")
  const [formType, setFormType] = useState<"feedback" | "survey">("feedback")
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formStatus, setFormStatus] = useState<"draft" | "active">("draft")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Form sections and questions
  const [sections, setSections] = useState([
    {
      id: "section-1",
      title: "Section 1",
      description: "First section description",
      questions: [
        {
          id: "question-1",
          type: "rating",
          question: "How would you rate this?",
          required: true,
          options: [],
        },
      ],
    },
  ])

  const handleAddSection = () => {
    const newSectionId = `section-${sections.length + 1}`
    setSections([
      ...sections,
      {
        id: newSectionId,
        title: `Section ${sections.length + 1}`,
        description: "",
        questions: [],
      },
    ])
  }

  const handleUpdateSection = (sectionId: string, field: string, value: string) => {
    setSections(sections.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)))
  }

  const handleDeleteSection = (sectionId: string) => {
    if (sections.length > 1) {
      setSections(sections.filter((section) => section.id !== sectionId))
    } else {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one section in your form.",
        variant: "destructive",
      })
    }
  }

  const handleAddQuestion = (sectionId: string, questionType: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const newQuestionId = `question-${Date.now()}`
          return {
            ...section,
            questions: [
              ...section.questions,
              {
                id: newQuestionId,
                type: questionType,
                question: "New Question",
                required: false,
                options:
                  questionType === "checkbox" || questionType === "radio" || questionType === "select"
                    ? ["Option 1", "Option 2"]
                    : [],
              },
            ],
          }
        }
        return section
      }),
    )
  }

  const handleUpdateQuestion = (sectionId: string, questionId: string, field: string, value: any) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            questions: section.questions.map((question) =>
              question.id === questionId ? { ...question, [field]: value } : question,
            ),
          }
        }
        return section
      }),
    )
  }

  const handleDeleteQuestion = (sectionId: string, questionId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            questions: section.questions.filter((question) => question.id !== questionId),
          }
        }
        return section
      }),
    )
  }

  const handleMoveQuestion = (sectionId: string, questionId: string, direction: "up" | "down") => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const questions = [...section.questions]
          const index = questions.findIndex((q) => q.id === questionId)

          if (direction === "up" && index > 0) {
            ;[questions[index], questions[index - 1]] = [questions[index - 1], questions[index]]
          } else if (direction === "down" && index < questions.length - 1) {
            ;[questions[index], questions[index + 1]] = [questions[index + 1], questions[index]]
          }

          return { ...section, questions }
        }
        return section
      }),
    )
  }

  const handleAddOption = (sectionId: string, questionId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            questions: section.questions.map((question) => {
              if (question.id === questionId) {
                const options = [...(question.options || [])]
                options.push(`Option ${options.length + 1}`)
                return { ...question, options }
              }
              return question
            }),
          }
        }
        return section
      }),
    )
  }

  const handleUpdateOption = (sectionId: string, questionId: string, optionIndex: number, value: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            questions: section.questions.map((question) => {
              if (question.id === questionId && question.options) {
                const options = [...question.options]
                options[optionIndex] = value
                return { ...question, options }
              }
              return question
            }),
          }
        }
        return section
      }),
    )
  }

  const handleDeleteOption = (sectionId: string, questionId: string, optionIndex: number) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            questions: section.questions.map((question) => {
              if (question.id === questionId && question.options) {
                const options = [...question.options]
                if (options.length > 2) {
                  options.splice(optionIndex, 1)
                  return { ...question, options }
                }
                return question
              }
              return question
            }),
          }
        }
        return section
      }),
    )
  }

  const handleSubmit = () => {
    // Validate form
    if (!formTitle.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for your form.",
        variant: "destructive",
      })
      setActiveTab("details")
      return
    }

    if (!formCategory) {
      toast({
        title: "Missing Category",
        description: "Please select a category for your form.",
        variant: "destructive",
      })
      setActiveTab("details")
      return
    }

    // Validate sections and questions
    let isValid = true
    let emptySectionIndex = -1
    let emptyQuestionIndex = -1
    let emptySectionId = ""

    sections.forEach((section, sectionIndex) => {
      if (!section.title.trim()) {
        isValid = false
        emptySectionIndex = sectionIndex
        return
      }

      if (section.questions.length === 0) {
        isValid = false
        emptySectionIndex = sectionIndex
        emptySectionId = section.id
        return
      }

      section.questions.forEach((question, questionIndex) => {
        if (!question.question.trim()) {
          isValid = false
          emptySectionIndex = sectionIndex
          emptyQuestionIndex = questionIndex
          return
        }
      })
    })

    if (!isValid) {
      if (emptyQuestionIndex !== -1) {
        toast({
          title: "Invalid Question",
          description: `Please provide a question text for all questions in section ${emptySectionIndex + 1}.`,
          variant: "destructive",
        })
      } else if (emptySectionId) {
        toast({
          title: "Empty Section",
          description: `Section ${emptySectionIndex + 1} has no questions. Please add at least one question.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Invalid Section",
          description: `Please provide a title for section ${emptySectionIndex + 1}.`,
          variant: "destructive",
        })
      }
      setActiveTab("builder")
      return
    }

    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Form Created",
        description: `Your ${formType} form has been ${formStatus === "active" ? "published" : "saved as draft"}.`,
      })
      router.push("/admin/forms")
    }, 1500)
  }

  return (
    <AdminLayout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Form</h1>
          <p className="text-muted-foreground">Design a new feedback form or survey</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Form Details</TabsTrigger>
          <TabsTrigger value="builder">Form Builder</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set the basic details for your new form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-type">Form Type</Label>
                <RadioGroup
                  id="form-type"
                  value={formType}
                  onValueChange={(value) => setFormType(value as "feedback" | "survey")}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feedback" id="form-type-feedback" />
                    <Label htmlFor="form-type-feedback" className="flex items-center cursor-pointer">
                      <FileTextIcon className="mr-2 h-4 w-4 text-blue-600" />
                      Feedback Form
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="survey" id="form-type-survey" />
                    <Label htmlFor="form-type-survey" className="flex items-center cursor-pointer">
                      <ClipboardListIcon className="mr-2 h-4 w-4 text-purple-600" />
                      Survey
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-title">Form Title</Label>
                <Input
                  id="form-title"
                  placeholder="Enter form title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-description">Description</Label>
                <Textarea
                  id="form-description"
                  placeholder="Enter form description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-category">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger id="form-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Campus Life">Campus Life</SelectItem>
                    <SelectItem value="Facilities">Facilities</SelectItem>
                    <SelectItem value="Housing">Housing</SelectItem>
                    <SelectItem value="Career">Career</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={() => router.push("/admin/forms")}>
                Cancel
              </Button>
              <Button onClick={() => setActiveTab("builder")}>Continue to Form Builder</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Builder</CardTitle>
              <CardDescription>Design your form by adding sections and questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.map((section, sectionIndex) => (
                <div key={section.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor={`section-title-${section.id}`}>Section Title</Label>
                      <Input
                        id={`section-title-${section.id}`}
                        value={section.title}
                        onChange={(e) => handleUpdateSection(section.id, "title", e.target.value)}
                        placeholder="Enter section title"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSection(section.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`section-description-${section.id}`}>Section Description (Optional)</Label>
                    <Textarea
                      id={`section-description-${section.id}`}
                      value={section.description}
                      onChange={(e) => handleUpdateSection(section.id, "description", e.target.value)}
                      placeholder="Enter section description"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Questions</Label>
                    {section.questions.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md">
                        <p className="text-muted-foreground">No questions added yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleAddQuestion(section.id, "rating")}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {section.questions.map((question, questionIndex) => (
                          <div
                            key={question.id}
                            className="border rounded-md p-4 space-y-4 bg-slate-50 dark:bg-slate-900"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <GripVerticalIcon className="h-5 w-5 text-muted-foreground cursor-move" />
                                <span className="text-sm font-medium">Question {questionIndex + 1}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMoveQuestion(section.id, question.id, "up")}
                                  disabled={questionIndex === 0}
                                  className="h-8 w-8"
                                >
                                  <ChevronUpIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMoveQuestion(section.id, question.id, "down")}
                                  disabled={questionIndex === section.questions.length - 1}
                                  className="h-8 w-8"
                                >
                                  <ChevronDownIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteQuestion(section.id, question.id)}
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">
                              <div className="md:col-span-3 space-y-2">
                                <Label htmlFor={`question-text-${question.id}`}>Question Text</Label>
                                <Input
                                  id={`question-text-${question.id}`}
                                  value={question.question}
                                  onChange={(e) =>
                                    handleUpdateQuestion(section.id, question.id, "question", e.target.value)
                                  }
                                  placeholder="Enter question text"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`question-type-${question.id}`}>Question Type</Label>
                                <Select
                                  value={question.type}
                                  onValueChange={(value) =>
                                    handleUpdateQuestion(section.id, question.id, "type", value)
                                  }
                                >
                                  <SelectTrigger id={`question-type-${question.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="rating">Rating Scale</SelectItem>
                                    <SelectItem value="text">Text Input</SelectItem>
                                    <SelectItem value="radio">Multiple Choice (Single)</SelectItem>
                                    <SelectItem value="checkbox">Multiple Choice (Multiple)</SelectItem>
                                    <SelectItem value="select">Dropdown</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {(question.type === "radio" ||
                              question.type === "checkbox" ||
                              question.type === "select") && (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label>Options</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddOption(section.id, question.id)}
                                  >
                                    <PlusIcon className="h-3 w-3 mr-1" />
                                    Add Option
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {question.options?.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2">
                                      <Input
                                        value={option}
                                        onChange={(e) =>
                                          handleUpdateOption(section.id, question.id, optionIndex, e.target.value)
                                        }
                                        placeholder={`Option ${optionIndex + 1}`}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteOption(section.id, question.id, optionIndex)}
                                        disabled={question.options?.length <= 2}
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                                      >
                                        <Trash2Icon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`required-${question.id}`}
                                  checked={question.required}
                                  onChange={(e) =>
                                    handleUpdateQuestion(section.id, question.id, "required", e.target.checked)
                                  }
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor={`required-${question.id}`} className="text-sm">
                                  Required
                                </Label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleAddQuestion(section.id, "rating")}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Rating Question
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAddQuestion(section.id, "text")}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Text Question
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAddQuestion(section.id, "radio")}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Multiple Choice
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAddQuestion(section.id, "checkbox")}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Checkbox Question
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAddQuestion(section.id, "select")}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Dropdown Question
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={handleAddSection} className="w-full py-6 border-dashed">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add New Section
              </Button>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={() => setActiveTab("details")}>
                Back to Details
              </Button>
              <Button onClick={() => setActiveTab("settings")}>Continue to Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure additional settings for your form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-status">Form Status</Label>
                <RadioGroup
                  id="form-status"
                  value={formStatus}
                  onValueChange={(value) => setFormStatus(value as "draft" | "active")}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="draft" id="form-status-draft" />
                    <Label htmlFor="form-status-draft" className="cursor-pointer">
                      Save as Draft
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="form-status-active" />
                    <Label htmlFor="form-status-active" className="cursor-pointer">
                      Publish Immediately
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input id="start-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date (Optional)</Label>
                    <Input id="end-date" type="date" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="specific-courses">Specific Courses</SelectItem>
                    <SelectItem value="specific-departments">Specific Departments</SelectItem>
                    <SelectItem value="specific-years">Specific Year Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notifications</Label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notify-submission"
                      defaultChecked
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="notify-submission" className="text-sm">
                      Notify me when someone submits this form
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="send-confirmation"
                      defaultChecked
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="send-confirmation" className="text-sm">
                      Send confirmation email to respondents
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="send-reminder"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="send-reminder" className="text-sm">
                      Send reminder emails to non-respondents
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab("builder")}>
                  Back to Builder
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {showPreview ? "Hide Preview" : "Preview Form"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setFormStatus("draft")}>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      <SendIcon className="h-4 w-4 mr-2" />
                      {formStatus === "active" ? "Publish Form" : "Save Form"}
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>

          {showPreview && (
            <Card>
              <CardHeader
                className={formType === "feedback" ? "bg-blue-50 dark:bg-blue-950" : "bg-purple-50 dark:bg-purple-950"}
              >
                <CardTitle>{formTitle || "Untitled Form"}</CardTitle>
                <CardDescription>{formDescription || "No description provided"}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {sections.map((section, sectionIndex) => (
                  <div key={section.id} className="mb-8 last:mb-0">
                    <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                    {section.description && <p className="text-muted-foreground text-sm mb-4">{section.description}</p>}

                    <div className="space-y-4">
                      {section.questions.map((question, questionIndex) => (
                        <div key={question.id} className="p-4 border rounded-lg bg-white dark:bg-slate-950">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <Label className="font-medium">
                              {question.question}
                              {question.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                          </div>

                          {question.type === "rating" && (
                            <div className="pt-2">
                              <RadioGroup className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <div key={value} className="flex flex-col items-center space-y-1">
                                    <RadioGroupItem
                                      value={value.toString()}
                                      id={`preview-${question.id}-${value}`}
                                      className="peer sr-only"
                                    />
                                    <Label
                                      htmlFor={`preview-${question.id}-${value}`}
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
                            <Textarea placeholder="Enter your response here..." className="min-h-[100px]" disabled />
                          )}

                          {question.type === "radio" && (
                            <RadioGroup className="flex flex-col space-y-2 pt-2">
                              {question.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`preview-${question.id}-${optionIndex}`} />
                                  <Label htmlFor={`preview-${question.id}-${optionIndex}`}>{option}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}

                          {question.type === "checkbox" && (
                            <div className="grid gap-2 pt-2 md:grid-cols-2">
                              {question.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`preview-${question.id}-${optionIndex}`}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                    disabled
                                  />
                                  <Label htmlFor={`preview-${question.id}-${optionIndex}`}>{option}</Label>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === "select" && (
                            <Select>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                              <SelectContent>
                                {question.options?.map((option, optionIndex) => (
                                  <SelectItem key={optionIndex} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" disabled>
                  Previous
                </Button>
                <Button disabled>Submit</Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}
