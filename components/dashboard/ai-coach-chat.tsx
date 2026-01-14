"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, User, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import ReactMarkdown from 'react-markdown'

interface Message {
  _id: string
  userId: string
  role: 'user' | 'assistant' | 'thinking'
  message: string
  conversationId?: string
  createdAt: string | Date
}

interface ThinkingEvent {
  thought?: string
  observation?: string
  tool?: string
  tool_input?: string
  position?: number
}

type CharacterType = 'coach' | 'nutritionist' | 'firstaid' | null

const CHARACTERS = {
  coach: {
    name: 'AI Coach',
    description: 'Training tips, techniques & workout plans',
    image: '/images/gameonCharacter.png',
    color: 'green',
  },
  nutritionist: {
    name: 'Nutritionist',
    description: 'Nutrition advice & meal planning',
    image: '/images/nutretionest.png',
    color: 'blue',
  },
  firstaid: {
    name: 'First Aid',
    description: 'Recovery & injury prevention',
    image: '/images/firstaid.png',
    color: 'red',
  },
}

export function AICoachChat() {
  const { data: session } = useSession()
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Fetch conversation when character is selected
  useEffect(() => {
    if (selectedCharacter) {
      fetchConversation(selectedCharacter)
    } else {
      setMessages([])
      setConversationId(null)
    }
  }, [selectedCharacter])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const fetchConversation = async (characterType: CharacterType) => {
    if (!characterType) return
    
    try {
      setIsLoading(true)
      // ARCHITECTURE: Each user has exactly ONE conversation per character type
      // Fetch the single conversation for this character
      const response = await fetch(`/api/ai-coach/messages?limit=1000&characterType=${characterType}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const messages = data.data as Message[]
        
        if (messages.length > 0) {
          // All messages belong to the same conversation (one per character)
          const convId = messages[0].conversationId
          setConversationId(convId || null)
          
          // Messages are already sorted chronologically by the API
          setMessages(messages)
        } else {
          // No conversation yet for this character
          setMessages([])
          setConversationId(null)
        }
      } else {
        setMessages([])
        setConversationId(null)
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
      setMessages([])
      setConversationId(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCharacterSelect = (characterType: CharacterType) => {
    setSelectedCharacter(characterType)
    setNewMessage('')
  }

  const handleBackToSelection = () => {
    setSelectedCharacter(null)
    setMessages([])
    setConversationId(null)
    setNewMessage('')
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending || !session?.user || !selectedCharacter) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    // Use existing conversationId if available (it's a UUID now)
    // If no conversation, the API will generate a new UUID
    const convId = conversationId || undefined

    // Optimistically add user message
    const tempUserMessage: Message = {
      _id: `temp-${Date.now()}`,
      userId: session.user.id,
      role: 'user',
      message: messageText,
      conversationId: convId,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await fetch('/api/ai-coach/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversationId: convId,
          characterType: selectedCharacter, // Pass character type to use correct API key
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg._id !== tempUserMessage._id)
          
          // Add thinking messages (disposable)
          const thinkingMessages: Message[] = (data.data.thinking || []).map((thought: ThinkingEvent, index: number) => ({
            _id: `thinking-${Date.now()}-${index}`,
            userId: session.user.id,
            role: 'thinking' as const,
            message: thought.thought || thought.observation || 'Processing...',
            conversationId: data.data.conversationId,
            createdAt: new Date(),
          }))
          
          return [...filtered, data.data.userMessage, ...thinkingMessages, data.data.aiMessage]
        })

        // Update conversation ID
        if (data.data.conversationId) {
          setConversationId(data.data.conversationId)
        }

        // Remove thinking messages after delay
        setTimeout(() => {
          setMessages((prev) => prev.filter((msg) => msg.role !== 'thinking'))
        }, 2000)
      } else {
        setMessages((prev) => prev.filter((msg) => msg._id !== tempUserMessage._id))
        alert(data.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => prev.filter((msg) => msg._id !== tempUserMessage._id))
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  // Character Selection Screen
  if (!selectedCharacter) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg sm:border sm:border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Choose Your AI Assistant</h2>
          <p className="text-sm sm:text-base text-gray-600">Select a specialist to help you with your sports journey</p>
        </div>
        
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {Object.entries(CHARACTERS).map(([key, character]) => (
              <button
                key={key}
                onClick={() => handleCharacterSelect(key as CharacterType)}
                className="group relative bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-green-500 hover:shadow-lg active:scale-[0.98] transition-all duration-200 text-left touch-manipulation min-h-[200px] sm:min-h-0"
              >
                <div className="aspect-square mb-3 sm:mb-4 relative overflow-hidden rounded-lg sm:rounded-xl bg-gray-50">
                  <Image
                    src={character.image}
                    alt={character.name}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-200"
                    unoptimized
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{character.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{character.description}</p>
                <div className={`mt-3 sm:mt-4 w-full h-1 bg-${character.color}-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const character = CHARACTERS[selectedCharacter]

  // Chat Interface with Fixed Character
  return (
    <div className="flex h-full bg-white rounded-lg sm:border sm:border-gray-200 overflow-hidden flex-col sm:flex-row">
      {/* Fixed Character - Left Side (Hidden on mobile) */}
      <div className="hidden sm:flex w-80 flex-shrink-0 border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 flex items-end justify-center p-4">
          <div className="relative w-full h-[90%] max-h-[600px]">
            <Image
              src={character.image}
              alt={character.name}
              fill
              className="object-contain object-bottom"
              unoptimized
              priority
            />
          </div>
        </div>
        {/* Character Name Overlay */}
        <div className="absolute top-4 left-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToSelection}
            className="mb-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <h3 className="font-bold text-lg text-gray-900">{character.name}</h3>
            <p className="text-xs text-gray-600">{character.description}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Chat Area - Full Width on Mobile */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Chat Header - Mobile Optimized */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white flex-shrink-0 flex items-center justify-between sm:block">
          <div className="flex items-center gap-3 sm:block">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSelection}
              className="sm:hidden text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px] p-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-semibold text-base sm:text-lg text-gray-900">{character.name}</h2>
              <p className="text-xs text-gray-500 hidden sm:block">Your personal {character.name.toLowerCase()} assistant</p>
            </div>
          </div>
        </div>

        {/* Scrollable Messages Area - Full Screen on Mobile */}
        <ScrollArea className="flex-1" ref={messagesContainerRef}>
          <div className="px-3 sm:px-6 py-4 sm:py-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-green-600 mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-gray-500">Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-16 text-center max-w-2xl mx-auto px-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Ask {character.name} anything about {character.description.toLowerCase()}!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedCharacter === 'coach' && ['Training tips', 'Workout plans', 'Technique advice'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setNewMessage(suggestion)}
                      className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                    >
                      {suggestion}
                    </button>
                  ))}
                  {selectedCharacter === 'nutritionist' && ['Meal planning', 'Nutrition advice', 'Diet tips'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setNewMessage(suggestion)}
                      className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                    >
                      {suggestion}
                    </button>
                  ))}
                  {selectedCharacter === 'firstaid' && ['Injury prevention', 'Recovery tips', 'First aid advice'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setNewMessage(suggestion)}
                      className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
                {messages.map((message) => {
                  const isUser = message.role === 'user'
                  const isThinking = message.role === 'thinking'
                  
                  return (
                    <div
                      key={message._id}
                      className={`flex gap-2 sm:gap-4 ${isUser ? 'flex-row-reverse' : ''} ${
                        isThinking ? 'animate-pulse' : ''
                      }`}
                    >
                      {/* Avatar - Smaller on mobile */}
                      <div className="flex-shrink-0">
                        {isUser ? (
                          session?.user?.image ? (
                            <Image
                              src={session.user.image}
                              alt={session.user.name || 'You'}
                              width={32}
                              height={32}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-green-100"
                              unoptimized={session.user.image?.includes('blob.vercel-storage.com') || session.user.image?.startsWith('http')}
                              onError={(e) => {
                                // Fallback to placeholder on error
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-user.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center ring-2 ring-green-100">
                              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                          )
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs sm:text-sm">
                              {character.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Message Content - Full width on mobile */}
                      <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col max-w-[calc(100%-3rem)] sm:max-w-[85%]`}>
                        <div
                          className={`rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                            isUser
                              ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-sm'
                              : isThinking
                              ? 'bg-blue-50 border border-blue-200 text-blue-900'
                              : 'bg-gray-50 text-gray-900 border border-gray-100 shadow-sm'
                          } transition-all duration-200 w-full`}
                        >
                          {isThinking ? (
                            <div className="flex items-center gap-2 sm:gap-2.5">
                              <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin text-blue-600 flex-shrink-0" />
                              <p className="text-xs italic text-blue-700 whitespace-pre-wrap break-words leading-relaxed">
                                {message.message}
                              </p>
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                                  ul: ({ children }) => <ul className="my-2 ml-4 list-disc">{children}</ul>,
                                  ol: ({ children }) => <ol className="my-2 ml-4 list-decimal">{children}</ol>,
                                  li: ({ children }) => <li className="my-1">{children}</li>,
                                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                  em: ({ children }) => <em className="italic">{children}</em>,
                                  code: ({ children }) => (
                                    <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">
                                      {children}
                                    </code>
                                  ),
                                  a: ({ href, children }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 underline break-all"
                                    >
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {message.message}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        {!isThinking && (
                          <span className={`text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {/* Typing Indicator */}
                {isSending && (
                  <div className="flex gap-2 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs sm:text-sm">
                          {character.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-start">
                      <div className="bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-500 ml-1">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area - Sticky on Mobile */}
        <div className="border-t border-gray-200 bg-gray-50/50 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0 sticky bottom-0 z-10">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-3 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Ask ${character.name} anything...`}
                maxLength={2000}
                disabled={isSending || !session?.user}
                className="w-full pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-white border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all min-h-[44px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              {newMessage.length > 0 && (
                <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-gray-400">
                  {newMessage.length}/2000
                </span>
              )}
            </div>
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending || !session?.user}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 h-auto min-h-[44px] min-w-[44px] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </form>
          {!session?.user && (
            <p className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 text-center">
              Please sign in to chat with {character.name}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
