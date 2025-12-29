"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Game } from "@/types/game"

interface ReportModalProps {
  game: Game
  isOpen: boolean
  onClose: () => void
}

export function ReportModal({ game, isOpen, onClose }: ReportModalProps) {
  const [reportType, setReportType] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle report submission
    console.log("Report submitted:", { gameId: game.id, reportType, description })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-600">Report This Game</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <RadioGroup value={reportType} onValueChange={setReportType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sexual" id="sexual" />
              <Label htmlFor="sexual">Sexual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spam" id="spam" />
              <Label htmlFor="spam">Spam</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inappropriate" id="inappropriate" />
              <Label htmlFor="inappropriate">Inappropriate</Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell Us Why"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={!reportType}>
            Submit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
