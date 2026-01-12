"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Gamepad2, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  Trash2,
  Loader2,
  User,
  Mail,
  Phone
} from "lucide-react"
import Image from "next/image"
import { ReportDetailsModal, type Report } from "./report-details-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface GameMember {
  id: string
  name: string
  email: string
  image: string
  phoneNumber: string
  whatsApp: string
  age?: number
  skillLevel?: string
  joinedAt: string
}

interface GameMessage {
  id: string
  userId: string
  userName: string
  userImage: string
  message: string
  createdAt: string
}

interface GameDetails {
  id: string
  title: string
  sport: string
  description: string
  location: {
    address: string
    city: string
    country: string
  }
  date: string
  startTime: string
  endTime: string
  maxPlayers: number
  skillLevel: string
  status: string
  image: string
  createdAt: string
  host: {
    id: string
    name: string
    email: string
    image: string
    phoneNumber: string
  }
  members: GameMember[]
}

interface GameDetailsModalProps {
  gameId: string | null
  isOpen: boolean
  onClose: () => void
  onGameDeleted?: () => void
}

export function GameDetailsModal({ gameId, isOpen, onClose, onGameDeleted }: GameDetailsModalProps) {
  const [game, setGame] = useState<GameDetails | null>(null)
  const [messages, setMessages] = useState<GameMessage[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingReports, setLoadingReports] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isOpen && gameId) {
      fetchGameDetails()
      fetchMessages()
      fetchReports()
    } else {
      setGame(null)
      setMessages([])
      setReports([])
    }
  }, [isOpen, gameId])

  const fetchGameDetails = async () => {
    if (!gameId) return
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/games/${gameId}`)
      const data = await response.json()
      if (data.success) {
        setGame(data.game)
      }
    } catch (error) {
      console.error('Error fetching game details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!gameId) return
    try {
      setLoadingMessages(true)
      const response = await fetch(`/api/admin/games/${gameId}/messages`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const fetchReports = async () => {
    if (!gameId) return
    try {
      setLoadingReports(true)
      const response = await fetch(`/api/admin/games/${gameId}/reports`)
      const data = await response.json()
      if (data.success) {
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoadingReports(false)
    }
  }

  const handleDelete = async () => {
    if (!gameId || !game) return
    try {
      setDeleting(true)
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setShowDeleteDialog(false)
        onClose()
        if (onGameDeleted) {
          onGameDeleted()
        }
      } else {
        alert('Failed to delete game: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting game:', error)
      alert('Failed to delete game')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'default'
      case 'ongoing':
        return 'secondary'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-red-600" />
              Game Details
            </DialogTitle>
            <DialogDescription>
              View game information, members, chats, and reports
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          ) : !game ? (
            <div className="text-center py-12 text-gray-500">
              Game not found
            </div>
          ) : (
            <div className="space-y-6">
              {/* Game Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{game.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{game.sport}</Badge>
                      <Badge variant={getStatusBadgeVariant(game.status)}>
                        {game.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-700">{game.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {game.location.address.startsWith('http') ? (
                          <a
                            href={game.location.address}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 hover:underline break-all"
                            title={game.location.address}
                          >
                            {game.location.address}
                          </a>
                        ) : (
                          <span className="break-words">{game.location.address}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="whitespace-nowrap">{formatDate(game.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="whitespace-nowrap">{game.startTime} - {game.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span>{game.members.length} / {game.maxPlayers} players</span>
                    </div>
                  </div>
                </div>
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <Separator />

              {/* Host Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Host</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={game.host.image} alt={game.host.name} />
                      <AvatarFallback>{game.host.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{game.host.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {game.host.email}
                        </span>
                        {game.host.phoneNumber && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {game.host.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Members */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members ({game.members.length})
                </h4>
                {game.members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No members yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {game.members.map((member) => (
                      <Card key={member.id} className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.image} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Chat Messages */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat Messages ({loadingMessages ? "..." : messages.length})
                </h4>
                {loadingMessages ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-red-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No messages yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {messages.map((msg) => (
                      <Card key={msg.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.userImage} alt={msg.userName} />
                            <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{msg.userName}</span>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(msg.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{msg.message}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Reports */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Reports ({loadingReports ? "..." : reports.length})
                </h4>
                {loadingReports ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-red-600" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No reports for this game
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {reports.map((report) => (
                      <Card
                        key={report.id}
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setSelectedReport(report)
                          setShowReportModal(true)
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="destructive" className="text-xs">
                                  {report.reportType}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {report.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {report.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>By: {report.reportedBy.name}</span>
                                <span>•</span>
                                <span>{formatDateTime(report.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete Button at Bottom */}
              <Separator />
              <div className="flex justify-end pt-4">
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Game
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Details Modal */}
      <ReportDetailsModal
        report={selectedReport}
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false)
          setSelectedReport(null)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Game
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="font-medium text-gray-900">
                Are you sure you want to delete "{game?.title}"?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2 text-sm">
                <p className="font-semibold text-red-900">This action will:</p>
                <ul className="list-disc list-inside space-y-1 text-red-800">
                  <li>Permanently delete the game and all associated data</li>
                  <li>Delete all chat messages in this game</li>
                  <li>Mark all reports as "resolved"</li>
                  <li>Send thank-you notifications to users who reported this game</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                This action cannot be undone. All game participants will lose access to this game.
              </p>
              {reports.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                  <p className="text-blue-900">
                    <span className="font-semibold">{reports.length}</span> report{reports.length !== 1 ? 's' : ''} will be marked as resolved, 
                    and notification{reports.length !== 1 ? 's' : ''} will be sent to the reporter{reports.length !== 1 ? 's' : ''}.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Game
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
