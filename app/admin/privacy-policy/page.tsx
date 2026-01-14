"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Save, 
  ArrowUp, 
  ArrowDown,
  FileText,
  MapPin,
  Lock,
  Eye,
  Shield,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ReactMarkdown from "react-markdown"

interface PrivacyPolicySection {
  _id?: string
  id?: string
  title: string
  icon: string
  content: string
  order: number
}

const ICON_OPTIONS = [
  { value: 'FileText', label: 'File Text', icon: FileText },
  { value: 'MapPin', label: 'Map Pin', icon: MapPin },
  { value: 'Lock', label: 'Lock', icon: Lock },
  { value: 'Eye', label: 'Eye', icon: Eye },
  { value: 'Shield', label: 'Shield', icon: Shield },
]

export default function AdminPrivacyPolicyPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [sections, setSections] = useState<PrivacyPolicySection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login")
      return
    }

    if (sessionStatus === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    if (sessionStatus === "authenticated" && session?.user?.role === "admin") {
      fetchPolicy()
    }
  }, [sessionStatus, session, router])

  const fetchPolicy = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/privacy-policy')
      const data = await response.json()

      if (data.success) {
        // Sort sections by order
        const sortedSections = [...data.policy.sections].sort((a: PrivacyPolicySection, b: PrivacyPolicySection) => a.order - b.order)
        setSections(sortedSections)
      } else {
        setError(data.error || 'Failed to load privacy policy')
      }
    } catch (error) {
      console.error('Error fetching policy:', error)
      setError('Failed to load privacy policy')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const response = await fetch('/api/admin/privacy-policy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sections }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Failed to save privacy policy')
      }
    } catch (error) {
      console.error('Error saving policy:', error)
      setError('Failed to save privacy policy')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSection = () => {
    const newSection: PrivacyPolicySection = {
      title: 'New Section',
      icon: 'FileText',
      content: 'Enter section content here...',
      order: sections.length + 1,
    }
    setSections([...sections, newSection])
  }

  const handleDeleteSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index)
    // Reorder sections
    newSections.forEach((section, i) => {
      section.order = i + 1
    })
    setSections(newSections)
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newSections.length) return

    // Swap sections
    const temp = newSections[index]
    newSections[index] = newSections[targetIndex]
    newSections[targetIndex] = temp

    // Update orders
    newSections.forEach((section, i) => {
      section.order = i + 1
    })

    setSections(newSections)
  }

  const handleSectionChange = (index: number, field: keyof PrivacyPolicySection, value: string | number) => {
    const newSections = [...sections]
    newSections[index] = {
      ...newSections[index],
      [field]: value,
    }
    setSections(newSections)
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-4 text-gray-600">Loading privacy policy...</p>
        </div>
      </div>
    )
  }

  if (sessionStatus === "unauthenticated" || session?.user?.role !== "admin") {
    return null
  }

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Privacy Policy Editor</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Edit and manage privacy policy sections</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 min-h-[44px] sm:min-h-0"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Privacy policy saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 sm:space-y-6">
        {sections.map((section, index) => {
          const IconComponent = ICON_OPTIONS.find(opt => opt.value === section.icon)?.icon || FileText
          
          return (
            <Card key={section._id || section.id || index} className="border-2">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-sm sm:text-base font-semibold text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded">
                        Section {index + 1}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveSection(index, 'up')}
                          disabled={index === 0}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveSection(index, 'down')}
                          disabled={index === sections.length - 1}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`title-${index}`}>Section Title</Label>
                        <Input
                          id={`title-${index}`}
                          value={section.title}
                          onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                          placeholder="Section title"
                          className="min-h-[44px] sm:min-h-0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`icon-${index}`}>Icon</Label>
                        <Select
                          value={section.icon}
                          onValueChange={(value) => handleSectionChange(index, 'icon', value)}
                        >
                          <SelectTrigger id={`icon-${index}`} className="min-h-[44px] sm:min-h-0">
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {ICON_OPTIONS.find(opt => opt.value === section.icon)?.label || section.icon}
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((option) => {
                              const Icon = option.icon
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSection(index)}
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`content-${index}`}>Content (Markdown supported)</Label>
                  <Textarea
                    id={`content-${index}`}
                    value={section.content}
                    onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                    placeholder="Enter section content... (Markdown supported)"
                    className="min-h-[200px] sm:min-h-[250px] text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500">
                    You can use Markdown formatting: **bold**, *italic*, lists, etc.
                  </p>
                </div>
                
                {/* Preview */}
                <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                  <Label className="text-xs sm:text-sm text-gray-600 mb-2 block">Preview:</Label>
                  <div className="prose prose-sm max-w-none">
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{section.title}</h3>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="ml-4">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                            }}
                          >
                            {section.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-center pt-4 sm:pt-6">
        <Button
          onClick={handleAddSection}
          variant="outline"
          className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Add New Section
        </Button>
      </div>
    </div>
  )
}
