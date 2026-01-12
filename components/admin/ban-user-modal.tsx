"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ban, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface BanUserModalProps {
  userId: string
  userName: string
  isOpen: boolean
  onClose: () => void
  onUserUpdated: () => void
  isBanned: boolean
  onToggleStart?: () => void
  onToggleEnd?: () => void
  onSuccess?: (wasBanned: boolean) => void
}

const BAN_TEMPLATES = [
  {
    id: "policy_violation",
    label: "Policy Violation",
    message: "You have been banned for violating the GameOn policies. Your account has been permanently suspended due to repeated violations of our community guidelines and terms of service."
  },
  {
    id: "harassment",
    label: "Harassment/Bullying",
    message: "You have been banned for violating the GameOn policies. Your account has been permanently suspended for harassment, bullying, or abusive behavior towards other users."
  },
  {
    id: "inappropriate_content",
    label: "Inappropriate Content",
    message: "You have been banned for violating the GameOn policies. Your account has been permanently suspended for posting inappropriate, offensive, or explicit content."
  },
  {
    id: "spam_scam",
    label: "Spam/Scam Activity",
    message: "You have been banned for violating the GameOn policies. Your account has been permanently suspended for spam, fraudulent activity, or attempting to scam other users."
  },
  {
    id: "threats_violence",
    label: "Threats/Violence",
    message: "You have been banned for violating the GameOn policies. Your account has been permanently suspended for making threats, promoting violence, or intimidating other users."
  },
  {
    id: "fake_account",
    label: "Fake Account/Identity",
    message: "You have been banned for violating the GameOn policies. Your account has been permanently suspended for creating fake accounts or misrepresenting your identity."
  },
  {
    id: "custom",
    label: "Custom Reason",
    message: ""
  }
]

export function BanUserModal({
  userId,
  userName,
  isOpen,
  onClose,
  onUserUpdated,
  isBanned,
  onToggleStart,
  onToggleEnd,
  onSuccess,
}: BanUserModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  // Update reason when template is selected
  useEffect(() => {
    const template = BAN_TEMPLATES.find(t => t.id === selectedTemplate)
    if (template) {
      setReason(template.message)
    }
  }, [selectedTemplate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log(`[BanUserModal] Starting ${isBanned ? 'unban' : 'ban'} process for user:`, {
      userId,
      userName,
      isBanned,
      reason: reason.trim(),
      selectedTemplate
    })

    if (!isBanned && !reason.trim()) {
      console.log('[BanUserModal] Validation failed: No reason provided for ban')
      toast.error("Please provide a reason for banning this user")
      return
    }

    setLoading(true)
    if (onToggleStart) onToggleStart()
    
    try {
      const url = `/api/admin/users/${userId}/ban`
      const method = isBanned ? 'DELETE' : 'POST'
      const body = isBanned ? undefined : JSON.stringify({
        reason: reason.trim(),
      })

      console.log(`[BanUserModal] Making API request:`, {
        url,
        method,
        body,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })

      console.log(`[BanUserModal] API response status:`, response.status)
      
      const data = await response.json()
      console.log(`[BanUserModal] API response data:`, data)

      if (data.success) {
        console.log(`[BanUserModal] ${isBanned ? 'Unban' : 'Ban'} successful!`)
        toast.success(isBanned ? `${userName} has been unbanned` : `${userName} has been permanently banned`)
        setSelectedTemplate("")
        setReason("")
        onClose()
        
        // Show success confirmation
        if (onSuccess) {
          onSuccess(!isBanned) // Pass the new banned state
        }
        
        // Call onUserUpdated after closing to refresh the user data
        setTimeout(() => {
          console.log('[BanUserModal] Calling onUserUpdated to refresh user data')
          onUserUpdated()
        }, 100)
      } else {
        console.error(`[BanUserModal] ${isBanned ? 'Unban' : 'Ban'} failed:`, data.error)
        toast.error(data.error || `Failed to ${isBanned ? 'unban' : 'ban'} user`)
      }
    } catch (error: any) {
      console.error(`[BanUserModal] Error ${isBanned ? 'unbanning' : 'banning'} user:`, error)
      toast.error(`An error occurred while ${isBanned ? 'unbanning' : 'banning'} the user`)
    } finally {
      setLoading(false)
      if (onToggleEnd) onToggleEnd()
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSelectedTemplate("")
      setReason("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className={`h-5 w-5 ${isBanned ? 'text-green-600' : 'text-red-600'}`} />
            {isBanned ? 'Unban User' : 'Permanently Ban User'}
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <p>
                You are about to {isBanned ? 'unban' : 'permanently ban'} <strong>{userName}</strong>.
              </p>
              {!isBanned && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">This will immediately log out the user.</p>
                      <p>The user will be unable to sign in until unbanned.</p>
                    </div>
                  </div>
                </div>
              )}
              {isBanned && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium">This will restore the user's access.</p>
                      <p>The user will be able to sign in again.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isBanned && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Ban Reason Template *</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                  disabled={loading}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a ban reason template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BAN_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Select a predefined reason or choose "Custom Reason" to write your own.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Ban Message *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="The ban message will appear here when you select a template..."
                  rows={5}
                  required
                  disabled={loading || !selectedTemplate}
                />
                <p className="text-xs text-gray-500">
                  This message will be stored in the system. You can edit the template message if needed.
                </p>
              </div>
            </div>
          )}
          {isBanned && (
            <div className="text-center py-4">
              <p className="text-gray-600">
                Are you sure you want to unban <strong>{userName}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                They will regain full access to the platform.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className={isBanned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isBanned ? 'Unbanning User...' : 'Banning User...'}
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  {isBanned ? 'Unban User' : 'Permanently Ban User'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}