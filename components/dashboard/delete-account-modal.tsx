"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  userEmail,
}: DeleteAccountModalProps) {
  const [confirmEmail, setConfirmEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()

    if (confirmEmail !== userEmail) {
      toast.error("Email confirmation does not match")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/users/profile/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Account deleted successfully")
        // Sign out and redirect to home
        await signOut({ redirect: false })
        router.push('/')
        // Force a full page reload to clear all session data
        window.location.href = '/'
      } else {
        toast.error(data.error || "Failed to delete account")
      }
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast.error("An error occurred while deleting your account")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setConfirmEmail("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please read the information below carefully.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDelete} className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold text-red-800">What happens when you delete your account:</h3>
                <ul className="list-disc list-inside space-y-1 text-red-700">
                  <li>Your account and all personal information will be permanently deleted</li>
                  <li>All your hosted games will be cancelled</li>
                  <li>You will be removed from all games you've joined</li>
                  <li>All your messages and notifications will be deleted</li>
                  <li>Your game history and ratings will be removed</li>
                  <li>You will be immediately logged out</li>
                  <li>This action cannot be reversed</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              If you have any questions or concerns, please contact our support team at{" "}
              <a 
                href="mailto:gamon9966@gmail.com" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                gamon9966@gmail.com
              </a>
              {" "}before proceeding.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmEmail">
              To confirm, please type your email: <strong>{userEmail}</strong>
            </Label>
            <Input
              id="confirmEmail"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Enter your email to confirm"
              required
              disabled={loading}
            />
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
            <Button 
              type="submit" 
              disabled={loading || confirmEmail !== userEmail} 
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete My Account
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
