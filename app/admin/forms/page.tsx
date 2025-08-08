"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArchiveIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BarChart3Icon,
  CheckCircleIcon,
  ClipboardIcon,
  ClipboardListIcon,
  CopyIcon,
  EditIcon,
  EyeIcon,
  FileTextIcon,
  FilterIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"

const forms = [
  // ... (your mock data remains unchanged)
]

export default function FormsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortField, setSortField] = useState("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const categories = ["all", ...new Set(forms.map((form) => form.category))]

  const filteredForms = forms
    .filter((form) => {
      const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || form.status === statusFilter
      const matchesType = typeFilter === "all" || form.type === typeFilter
      const matchesCategory = categoryFilter === "all" || form.category === categoryFilter
      return matchesSearch && matchesStatus && matchesType && matchesCategory
    })
    .sort((a, b) => {
      if (sortField === "title") {
        return sortDirection === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      } else if (sortField === "responses") {
        return sortDirection === "asc" ? a.responses - b.responses : b.responses - a.responses
      } else if (sortField === "completionRate") {
        return sortDirection === "asc" ? a.completionRate - b.completionRate : b.completionRate - a.completionRate
      } else {
        return sortDirection === "asc"
          ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? (
      <ArrowUpIcon className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDownIcon className="ml-1 h-4 w-4" />
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forms Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage your forms</p>
        </div>
        <Button onClick={() => router.push("/admin/forms/create")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Form
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search forms..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[140px]">
              <FilterIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[140px]">
              <FilterIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="survey">Survey</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
              <FilterIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                <div className="flex items-center">Form Title{renderSortIcon("title")}</div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("updatedAt")}>
                <div className="flex items-center">Last Updated{renderSortIcon("updatedAt")}</div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort("responses")}>
                <div className="flex items-center justify-end">Responses{renderSortIcon("responses")}</div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort("completionRate")}>
                <div className="flex items-center justify-end">Completion Rate{renderSortIcon("completionRate")}</div>
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredForms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No forms found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        form.type === "feedback"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                      }
                    >
                      {form.type === "feedback" ? (
                        <FileTextIcon className="mr-1 h-3 w-3" />
                      ) : (
                        <ClipboardListIcon className="mr-1 h-3 w-3" />
                      )}
                      {form.type.charAt(0).toUpperCase() + form.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{form.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        form.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800"
                          : form.status === "draft"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }
                    >
                      {form.status === "active" ? (
                        <CheckCircleIcon className="mr-1 h-3 w-3" />
                      ) : form.status === "draft" ? (
                        <ClipboardIcon className="mr-1 h-3 w-3" />
                      ) : (
                        <ArchiveIcon className="mr-1 h-3 w-3" />
                      )}
                      {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(form.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{form.responses}</TableCell>
                  <TableCell className="text-right">
                    {form.status === "draft" ? "-" : `${form.completionRate}%`}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            router.push(`/admin/forms/${form.id}`)
                          }}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            router.push(`/admin/forms/${form.id}/edit`)
                          }}
                        >
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit Form
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            router.push(`/admin/forms/${form.id}/preview`)
                          }}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            router.push(`/admin/forms/${form.id}/responses`)
                          }}
                        >
                          <BarChart3Icon className="mr-2 h-4 w-4" />
                          View Responses
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <CopyIcon className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {form.status !== "archived" ? (
                          <DropdownMenuItem>
                            <ArchiveIcon className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>
                            <CheckCircleIcon className="mr-2 h-4 w-4" />
                            Restore
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 dark:text-red-400">
                          <Trash2Icon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  )
}
