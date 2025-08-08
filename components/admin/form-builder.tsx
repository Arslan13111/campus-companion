"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react"

interface FormBuilderProps {
  sections: any[]
  onUpdateSections: (sections: any[]) => void
}

export function FormBuilder({ sections, onUpdateSections }: FormBuilderProps) {
  const handleAddSection = () => {
    const newSectionId = `section-${sections.length + 1}`
    onUpdateSections([
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
    onUpdateSections(sections.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)))
  }

  const handleDeleteSection = (sectionId: string) => {
    if (sections.length > 1) {
      onUpdateSections(sections.filter((section) => section.id !== sectionId))
    }
  }

  const handleAddQuestion = (sectionId: string, questionType: string) => {
    onUpdateSections(
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
    onUpdateSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            questions: section.questions.map((question: any) =>
              question.id === questionId ? { ...question, [field]: value } : question,
            ),
          }
        }
        return section
      }),
    )
  }

  const handleDeleteQuestion = (sectionId: string, questionId: string) => {
    onUpdateSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            questions: section.questions.filter((question: any) => question.id !== questionId),
          }
        }
        return section
      }),
    )
  }

  const handleMoveQuestion = (sectionId: string, questionId: string, direction: "up" | "down") => {
    onUpdateSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const questions = [...section.questions]
          const index = questions.findIndex((q: any) => q.id === questionId)

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

  return (
    <div className="space-y-6">
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
                {section.questions.map((question: any, questionIndex: number) => (
                  <div key={question.id} className="border rounded-md p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
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
                          onChange={(e) => handleUpdateQuestion(section.id, question.id, "question", e.target.value)}
                          placeholder="Enter question text"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`question-type-${question.id}`}>Question Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) => handleUpdateQuestion(section.id, question.id, "type", value)}
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

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`required-${question.id}`}
                          checked={question.required}
                          onChange={(e) => handleUpdateQuestion(section.id, question.id, "required", e.target.checked)}
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
    </div>
  )
}
