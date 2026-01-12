// app/api/ai-coach/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import AICoachMessage from '@/lib/db/models/AICoachMessage'
import { requireAuth } from '@/lib/auth'
// Dify creates conversation_id - we don't generate it ourselves

// Dify API Keys for different characters
const DIFY_API_KEY_CHAT = process.env.DIFY_API_KEY_CHAT // Coach (normal chat)
const DIFY_API_KEY_NUTRITIONIST = process.env.DIFY_API_KEY_NUTRITIONIST || process.env.DIFY_API_KEY_CHAT_Nutritionist
const DIFY_API_KEY_FIRSTAID = process.env.DIFY_API_KEY_FIRSTAID || process.env.DIFY_API_KEY_CHAT_Firstaid

// Dify Chat API URL
const DIFY_CHAT_API_URL = 'https://api.dify.ai/v1/chat-messages'

// Get API key based on character type
function getApiKeyForCharacter(characterType?: string): string | undefined {
  switch (characterType) {
    case 'coach':
      return DIFY_API_KEY_CHAT
    case 'nutritionist':
      return DIFY_API_KEY_NUTRITIONIST
    case 'firstaid':
      return DIFY_API_KEY_FIRSTAID
    default:
      return DIFY_API_KEY_CHAT // Default to coach
  }
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

interface DifyChatResponse {
  message_id: string
  conversation_id: string
  answer: string
  metadata?: {
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    }
  }
}

// GET /api/ai-coach/messages - Get chat history
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult || !authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Get query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const characterType = searchParams.get('characterType')

    // ARCHITECTURE: Each user has exactly ONE conversation per character type
    // Fetch messages for the single conversation of this user + character type
    const query: any = { 
      userId: authResult.id,
    }
    
    if (characterType) {
      query.characterType = characterType
      
      // Find the conversation ID for this user + character type
      const existingConv = await AICoachMessage.findOne({
        userId: authResult.id,
        characterType: characterType,
        conversationId: { $exists: true, $ne: null }
      }).sort({ createdAt: 1 }).lean() as any
      
      if (existingConv?.conversationId) {
        // Only fetch messages from this specific conversation
        query.conversationId = existingConv.conversationId
      } else {
        // No conversation exists yet, return empty array
        return NextResponse.json({
          success: true,
          data: [],
        })
      }
    }

    const messages = await AICoachMessage.find(query)
      .sort({ createdAt: 1 }) // Oldest first for chat display
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      data: messages.map((msg: any) => ({
        _id: msg._id.toString(),
        userId: msg.userId.toString(),
        role: msg.role,
        message: msg.message,
        conversationId: msg.conversationId,
        createdAt: msg.createdAt,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching AI coach messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/ai-coach/messages - Send a message and get AI response
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult || !authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { message, conversationId, characterType } = body

    // Get the appropriate API key based on character type
    const apiKey = getApiKeyForCharacter(characterType)
    
    if (!apiKey) {
      const characterName = characterType === 'nutritionist' ? 'Nutritionist' : 
                           characterType === 'firstaid' ? 'First Aid' : 'Coach'
      return NextResponse.json(
        { 
          success: false, 
          error: `Dify API key not configured for ${characterName}`,
          message: `Please set the appropriate DIFY_API_KEY_${characterType?.toUpperCase()} in your environment variables`
        },
        { status: 500 }
      )
    }

    // Use user's MongoDB ID as the Dify Chat App ID
    // Each user's _id becomes their app_id, so they automatically get their own chat history
    const userDifyChatAppId = authResult.id

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // ARCHITECTURE: Each user has exactly ONE conversation per character type
    // Dify creates the conversation_id - we get it from their response and save it
    const charType = characterType || 'coach'
    
    // Find existing conversation ID for this user + character type (if we have one from Dify)
    const existingMessage = await AICoachMessage.findOne({
      userId: authResult.id,
      characterType: charType,
      conversationId: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 }).lean() as any
    
    // Only use conversation_id if we already have one from Dify
    // Don't create one ourselves - let Dify create it
    const difyConversationId: string | undefined = existingMessage?.conversationId || undefined

    // Save user message (conversationId will be updated after we get it from Dify)
    const userMessage = await AICoachMessage.create({
      userId: authResult.id,
      role: 'user',
      message: message.trim(),
      conversationId: difyConversationId, // May be undefined if first message
      characterType: characterType || 'coach',
    })

    // Get recent conversation history for context
    const historyQuery: any = { 
      userId: authResult.id,
      characterType: characterType || 'coach',
    }
    if (difyConversationId) {
      historyQuery.conversationId = difyConversationId
    }

    const recentMessages = await AICoachMessage.find(historyQuery)
      .sort({ createdAt: -1 })
      .limit(10) // Last 10 messages for context
      .lean()

    // Build conversation history for Dify (last 10 messages, excluding the one we just created)
    const conversationHistory = recentMessages
      .filter((msg: any) => msg._id.toString() !== userMessage._id.toString())
      .reverse()
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.message,
      }))

    // Add current user message
    conversationHistory.push({
      role: 'user',
      content: message.trim(),
    })

    // Call Dify Chat API using user's ID as app_id and character-specific API key
    // Each user's MongoDB _id is used as their Dify Chat App ID
    console.log(`Calling Dify Chat API for user ${authResult.id} with character: ${characterType || 'coach'} (using as app_id)`)
    
    // Try app_id in URL path format: /v1/apps/{app_id}/chat-messages
    // If that doesn't work, try query parameter: /v1/chat-messages?app_id={app_id}
    const apiUrlWithPath = `https://api.dify.ai/v1/apps/${userDifyChatAppId}/chat-messages`
    const apiUrlWithQuery = `${DIFY_CHAT_API_URL}?app_id=${userDifyChatAppId}`
    
    // Try path format first (more common in REST APIs)
    let difyResponse = await fetch(apiUrlWithPath, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          inputs: {},
          query: message.trim(),
          response_mode: 'streaming', // Agent Chat App requires streaming mode
          ...(difyConversationId && { conversation_id: difyConversationId }),
          user: authResult.id, // User ID for Dify's internal tracking
        }),
    })

    // If path format fails with 404, try query parameter format
    if (!difyResponse.ok && difyResponse.status === 404) {
      console.log('Path format failed, trying query parameter format...')
      difyResponse = await fetch(apiUrlWithQuery, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          query: message.trim(),
          response_mode: 'streaming', // Agent Chat App requires streaming mode
          ...(difyConversationId && { conversation_id: difyConversationId }),
          user: authResult.id,
        }),
      })
    }

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text()
      let errorData: any = {}
      
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { message: errorText }
      }

      console.error('Dify API error:', difyResponse.status, errorText)
      console.error('Error details:', JSON.stringify(errorData, null, 2))
      console.error('Request URL:', DIFY_CHAT_API_URL)
      console.error('User ID used as app_id:', authResult.id)
      
      // Delete the user message if AI call failed
      await AICoachMessage.findByIdAndDelete(userMessage._id)

      return NextResponse.json(
        {
          success: false,
          error: `Dify API error: ${difyResponse.status}`,
          message: errorData.message || errorData.error || 'Failed to communicate with Dify AI Coach',
          details: errorData,
        },
        { status: difyResponse.status }
      )
    }

    // Handle streaming response from Dify
    console.log('Processing streaming response from Dify...')
    const reader = difyResponse.body?.getReader()
    const decoder = new TextDecoder()
    
    if (!reader) {
      await AICoachMessage.findByIdAndDelete(userMessage._id)
      return NextResponse.json(
        { success: false, error: 'Failed to read streaming response' },
        { status: 500 }
      )
    }

    let fullAnswer = ''
    let finalConversationId: string | undefined = difyConversationId // Start with existing, or undefined if new
    let finalMessageId = ''
    let buffer = ''
    const thinkingEvents: any[] = [] // Store agent_thought events (disposable)

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6) // Remove 'data: ' prefix
            
            if (dataStr.trim() === '[DONE]') continue
            
            try {
              const chunk = JSON.parse(dataStr)
              
              // Handle different event types
              if (chunk.event === 'message' || chunk.event === 'agent_message') {
                if (chunk.answer) {
                  fullAnswer += chunk.answer
                }
                if (chunk.conversation_id) {
                  finalConversationId = chunk.conversation_id
                }
                if (chunk.message_id) {
                  finalMessageId = chunk.message_id
                }
              } else if (chunk.event === 'agent_thought') {
                // Capture thinking events (disposable - not saved to DB)
                thinkingEvents.push({
                  thought: chunk.thought || '',
                  observation: chunk.observation || '',
                  tool: chunk.tool || '',
                  tool_input: chunk.tool_input || '',
                  position: chunk.position || 0,
                })
                console.log('Agent thinking:', chunk.thought)
              } else if (chunk.event === 'message_end') {
                // Final metadata
                if (chunk.conversation_id) {
                  finalConversationId = chunk.conversation_id
                }
                if (chunk.message_id) {
                  finalMessageId = chunk.message_id
                }
                break // End of stream
              }
            } catch (e) {
              // Skip invalid JSON chunks
              console.warn('Failed to parse chunk:', dataStr)
            }
          }
        }
      }
    } catch (streamError) {
      console.error('Error reading stream:', streamError)
      await AICoachMessage.findByIdAndDelete(userMessage._id)
      return NextResponse.json(
        { success: false, error: 'Failed to process streaming response' },
        { status: 500 }
      )
    }

    if (!fullAnswer) {
      await AICoachMessage.findByIdAndDelete(userMessage._id)
      return NextResponse.json(
        { success: false, error: 'No answer received from Dify' },
        { status: 500 }
      )
    }

    console.log('Dify streaming response completed, answer length:', fullAnswer.length)

    // Remove <think> tags and their content from the answer
    // This applies to all three assistants (coach, nutritionist, firstaid)
    let cleanAnswer = fullAnswer
      // Remove redacted_reasoning tags (case-insensitive, handles any whitespace)
      .replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '')
      // Also remove think tags if they appear separately
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .trim()

    // Dify creates the conversation_id - we get it from their response
    // Save it to both user and AI messages
    if (!finalConversationId) {
      await AICoachMessage.findByIdAndDelete(userMessage._id)
      return NextResponse.json(
        { success: false, error: 'No conversation_id received from Dify' },
        { status: 500 }
      )
    }

    // Update user message with conversation_id from Dify
    await AICoachMessage.findByIdAndUpdate(userMessage._id, {
      conversationId: finalConversationId,
    })
    userMessage.conversationId = finalConversationId

    // Save AI response with conversation_id from Dify (with redacted_reasoning removed)
    const aiMessage = await AICoachMessage.create({
      userId: authResult.id,
      role: 'assistant',
      message: cleanAnswer, // Use cleaned answer without redacted_reasoning
      conversationId: finalConversationId, // Use Dify's conversation_id
      characterType: characterType || 'coach',
    })

    return NextResponse.json({
      success: true,
      data: {
        userMessage: {
          _id: userMessage._id.toString(),
          userId: userMessage.userId.toString(),
          role: userMessage.role,
          message: userMessage.message,
          conversationId: userMessage.conversationId,
          createdAt: userMessage.createdAt,
        },
        aiMessage: {
          _id: aiMessage._id.toString(),
          userId: aiMessage.userId.toString(),
          role: aiMessage.role,
          message: aiMessage.message,
          conversationId: aiMessage.conversationId,
          createdAt: aiMessage.createdAt,
        },
        thinking: thinkingEvents, // Disposable thinking events (not saved to DB)
        conversationId: finalConversationId, // Always use Dify's conversation_id
      },
    })
  } catch (error: any) {
    console.error('Error sending message to AI coach:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send message'
      },
      { status: 500 }
    )
  }
}

