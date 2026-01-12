"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Ban } from "lucide-react"

interface BanSuccessModalProps {
  userName: string
  isOpen: boolean
  onClose: () => void
  wasBanned: boolean // true if user was banned, false if unbanned
}

export function BanSuccessModal({
  userName,
  isOpen,
  onClose,
  wasBanned,
}: BanSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {wasBanned ? 'User Banned Successfully!' : 'User Unbanned Successfully!'}
          </DialogTitle>
          <DialogDescription>
            The action has been completed successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className={`rounded-full p-4 ${wasBanned ? 'bg-red-100' : 'bg-green-100'}`}>
            {wasBanned ? (
              <Ban className="h-12 w-12 text-red-600" />
            ) : (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {wasBanned ? 'Account Banned!' : 'Account Restored!'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {wasBanned 
                ? `${userName} has been permanently banned and can no longer access the platform.`
                : `${userName} has been unbanned and can now access the platform again.`
              }
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={onClose} className="w-full">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}