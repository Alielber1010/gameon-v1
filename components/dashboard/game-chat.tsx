"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send, X } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  _id: string
  gameId: string
  userId: string
  userName: string
  userImage?: string
  message: string
  createdAt: string | Date
}

interface GameChatProps {
  gameId: string
  isOpen: boolean
  onClose: () => void
  isPlayer?: boolean // Whether current user is a player in this game
}

export function GameChat({ gameId, isOpen, onClose, isPlayer = false }: GameChatProps) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Initialize Socket.io connection
  useEffect(() => {
    if (!isOpen || !gameId || !session?.user) return

    const socketUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    
    const socketInstance = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected')
      socketInstance.emit('join-game', gameId)
      fetchMessages()
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    socketInstance.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message])
      scrollToBottom()
    })

    socketInstance.on('message-error', (error: { error: string }) => {
      console.error('Message error:', error)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.emit('leave-game', gameId)
      socketInstance.disconnect()
    }
  }, [isOpen, gameId, session])

  // Fetch chat history
  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/messages/${gameId}?limit=50`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setMessages(data.data)
        setTimeout(() => scrollToBottom(), 100)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Render message with clickable links (but not images/files)
  const renderMessage = (text: string) => {
    // URL pattern for links
    const urlPattern = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlPattern)
    
    return parts.map((part, index) => {
      if (part.match(urlPattern)) {
        // Check if it's an image/file link - if so, just show as text
        const imageFilePatterns = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|pdf|doc|docx|xls|xlsx|zip|rar|tar|gz|mp4|avi|mov|wmv|flv|webm|mp3|wav|ogg)(\?|$)/i
        if (imageFilePatterns.test(part)) {
          // Show as plain text (no clickable link for files/images)
          return <span key={index}>{part}</span>
        }
        // Regular link - make it clickable
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all"
            onClick={(e) => {
              // Prevent navigation if it's a file/image link
              if (imageFilePatterns.test(part)) {
                e.preventDefault()
              }
            }}
          >
            {part}
          </a>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  // Validate message - only text and links allowed, no files/images
  const validateMessage = (text: string): { valid: boolean; error?: string } => {
    const trimmed = text.trim()
    
    if (trimmed.length === 0) {
      return { valid: false, error: 'Message cannot be empty' }
    }

    // Check for file/image extensions in links (basic check)
    const imageFilePatterns = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|pdf|doc|docx|xls|xlsx|zip|rar|tar|gz|mp4|avi|mov|wmv|flv|webm|mp3|wav|ogg)(\?|$)/i
    if (imageFilePatterns.test(trimmed)) {
      return { valid: false, error: 'File and image uploads are not allowed. Only text and links are permitted.' }
    }

    // Check for data URIs (base64 encoded images/files)
    if (trimmed.includes('data:image/') || trimmed.includes('data:application/')) {
      return { valid: false, error: 'Image and file uploads are not allowed. Only text and links are permitted.' }
    }

    return { valid: true }
  }

  // Handle paste events to prevent file/image pasting
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      // Block images and files
      if (item.type.indexOf('image') !== -1 || item.type.indexOf('file') !== -1) {
        e.preventDefault()
        alert('Image and file uploads are not allowed. Only text and links are permitted.')
        return
      }
    }
  }

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket || !session?.user || isSending) return

    // Validate message
    const validation = validateMessage(newMessage)
    if (!validation.valid) {
      alert(validation.error || 'Invalid message')
      return
    }

    const messageText = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    try {
      // Send via Socket.io for real-time
      socket.emit('send-message', {
        gameId,
        message: messageText,
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        userImage: session.user.image || '',
      })

      // Also save via API as fallback
      const response = await fetch(`/api/messages/${gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Failed to save message:', data)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-green-50">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-600">Game Chat</h3>
          </div>
          <p className="text-xs text-gray-500">Text and links only • No files/images</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.userId === session?.user?.id
              return (
                <div
                  key={message._id}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {message.userImage ? (
                      <Image
                        src={message.userImage}
                        alt={message.userName}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {message.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] ${
                        isCurrentUser
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {!isCurrentUser && (
                        <div className="text-xs font-semibold mb-1 text-gray-600">
                          {message.userName}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {renderMessage(message.message)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      {isPlayer ? (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onPaste={handlePaste}
              placeholder="Type a message (text and links only)..."
              maxLength={1000}
              disabled={isSending || !socket}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending || !socket}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Only joined players can chat • Text and links only (no files/images)
          </p>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              Join the game to participate in chat
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

