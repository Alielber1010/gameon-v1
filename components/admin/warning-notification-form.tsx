"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import { sendAdminNotification } from "@/lib/admin/send-notification"
import { getWarningTemplate, getAllWarningTemplates, type ReportType } from "@/lib/admin/warning-templates"
import { toast } from "sonner"

interface WarningNotificationFormProps {
  userId: string
  userName: string
  isOpen: boolean
  onClose: () => void
}

export function WarningNotificationForm({
  userId,
  userName,
  isOpen,
  onClose,
}: WarningNotificationFormProps) {
  const [selectedType, setSelectedType] = useState<ReportType | "">("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const templates = getAllWarningTemplates()

  // Update title and message when template is selected
  useEffect(() => {
    if (selectedType) {
      const template = getWarningTemplate(selectedType as ReportType)
      setTitle(template.title)
      setMessage(template.message)
    } else {
      setTitle("")
      setMessage("")
    }
  }, [selectedType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType) {
      toast.error("Please select a report type")
      return
    }

    if (!title.trim() || !message.trim()) {
      toast.error("Please ensure both title and message are filled")
      return
    }

    setLoading(true)
    try {
      const result = await sendAdminNotification({
        userId,
        title: title.trim(),
        message: message.trim(),
      })

      if (result.success) {
        setSuccess(true)
        toast.success(`✅ Warning notification sent successfully to ${userName}`, {
          duration: 4000,
          description: "The user will receive this notification in their notifications page.",
        })
        
        // Wait a moment to show success state, then close
        setTimeout(() => {
          // Reset form
          setSelectedType("")
          setTitle("")
          setMessage("")
          setSuccess(false)
          onClose()
        }, 1500)
      } else {
        toast.error(result.error || "Failed to send notification")
      }
    } catch (error: any) {
      console.error("Error sending warning notification:", error)
      toast.error("An error occurred while sending the notification")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading && !success) {
      setSelectedType("")
      setTitle("")
      setMessage("")
      setSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Notification Sent Successfully!
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Send Warning Notification
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {success ? (
              <span className="text-green-600 font-medium">
                The warning notification has been sent to {userName}. They will receive it in their notifications.
              </span>
            ) : (
              `Send a warning notification to ${userName}. This will appear in their notifications.`
            )}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Report Sent!</p>
              <p className="text-sm text-gray-600 mt-1">
                The warning notification has been successfully delivered to {userName}.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type *</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as ReportType)}
              disabled={loading}
            >
              <SelectTrigger id="reportType">
                <SelectValue placeholder="Select a report type..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.type} value={template.type}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Select the type of violation to use the appropriate warning template.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Warning title will appear here..."
              required
              disabled={loading || !selectedType}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Warning message will appear here..."
              rows={8}
              required
              disabled={loading || !selectedType}
            />
            <p className="text-xs text-gray-500">
              You can edit the template message if needed. The message will be sent to the user.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Send Warning
                </>
              )}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
