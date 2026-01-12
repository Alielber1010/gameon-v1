"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send } from 'lucide-react'
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

interface InlineGameChatProps {
  gameId: string
  isPlayer: boolean // Whether current user is a player/host in this game
  hasPendingRequest?: boolean // Whether user has a pending join request (chat should be hidden)
}

export function InlineGameChat({ gameId, isPlayer, hasPendingRequest = false }: InlineGameChatProps) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debug logging
  useEffect(() => {
    console.log('InlineGameChat Debug:', {
      gameId,
      isPlayer,
      hasPendingRequest,
      userId: session?.user?.id,
      userName: session?.user?.name,
      shouldShow: !hasPendingRequest
    })
  }, [gameId, isPlayer, hasPendingRequest, session?.user?.id])

  // Hide chat if user has pending join request
  if (hasPendingRequest) {
    console.log('Chat hidden: User has pending join request')
    return null
  }

  // Initialize Socket.io connection
  useEffect(() => {
    if (!gameId) return

    // Always fetch messages, even without session (for viewing)
    fetchMessages()

    // Only connect socket if user is logged in
    if (!session?.user) return

    const socketUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    
    // Create socket instance with autoConnect to prevent duplicates
    const socketInstance = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    })

    // Remove any existing listeners to prevent duplicates
    socketInstance.removeAllListeners()

    socketInstance.on('connect', () => {
      console.log('Socket connected')
      socketInstance.emit('join-game', gameId)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    socketInstance.on('new-message', (message: Message) => {
      // Prevent duplicate messages by checking if message already exists
      setMessages((prev) => {
        // Check if message with same _id already exists, or same content + userId + timestamp
        const exists = prev.some(m => 
          m._id === message._id || 
          (m.message === message.message && 
           m.userId === message.userId && 
           Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 1000)
        )
        if (exists) {
          console.log('Duplicate message prevented:', message._id)
          return prev
        }
        return [...prev, message]
      })
      scrollToBottom()
    })

    socketInstance.on('message-error', (error: { error: string }) => {
      console.error('Message error:', error)
      alert(error.error || 'Failed to send message')
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      // Don't block the UI, just log the error
    })

    setSocket(socketInstance)

    return () => {
      // Cleanup: remove all listeners and disconnect
      socketInstance.removeAllListeners()
      if (socketInstance.connected) {
        socketInstance.emit('leave-game', gameId)
      }
      socketInstance.disconnect()
    }
  }, [gameId, session?.user?.id]) // Only depend on user ID, not entire session object

  // Fetch chat history
  const fetchMessages = async () => {
    if (!gameId) {
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/messages/${gameId}?limit=50`)
      
      if (!response.ok) {
        // If unauthorized or invalid gameId, still show chat but without messages
        if (response.status === 401 || response.status === 400) {
          console.log('Chat available but no messages (not authenticated or invalid gameId)')
          setIsLoading(false)
          return
        }
        // For other errors, still show empty state
        console.warn('Failed to fetch messages:', response.status)
        setIsLoading(false)
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        setMessages(data.data)
        setTimeout(() => scrollToBottom(), 100)
      } else {
        // No messages yet, that's fine
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      // Don't hide chat on error, just show empty state
      setMessages([])
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
      // Send via Socket.io only - server handles saving and broadcasting
      socket.emit('send-message', {
        gameId,
        message: messageText,
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        userImage: session.user.image || '',
      })
      // Message will be saved and broadcast by the server
      // No need for separate API call - that was causing duplicates
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="border-t border-gray-200 mt-4 pt-4" data-testid="inline-game-chat">
      {/* Chat Header */}
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4 text-green-600" />
        <h4 className="font-semibold text-sm text-gray-700">Game Chat</h4>
        <span className="text-xs text-gray-500">• Text and links only</span>
      </div>

      {/* Messages Area */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 mb-3">
        <ScrollArea className="h-64 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isCurrentUser = message.userId === session?.user?.id
                return (
                  <div
                    key={message._id}
                    className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.userImage ? (
                        <Image
                          src={message.userImage}
                          alt={message.userName}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {message.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`rounded-lg px-2 py-1.5 max-w-[85%] ${
                          isCurrentUser
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        {!isCurrentUser && (
                          <div className="text-xs font-semibold mb-0.5 text-gray-600">
                            {message.userName}
                          </div>
                        )}
                        <p className="text-xs whitespace-pre-wrap break-words">
                          {renderMessage(message.message)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 mt-0.5">
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
      </div>

      {/* Input Area */}
      {isPlayer ? (
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onPaste={handlePaste}
            placeholder="Type a message (text and links only)..."
            maxLength={1000}
            disabled={isSending || !socket}
            className="flex-1 text-sm"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending || !socket}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-gray-500">
            Join the game to participate in chat
          </p>
        </div>
      )}
    </div>
  )
}

