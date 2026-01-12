// app/api/messages/[gameId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Message from '@/lib/db/models/Message'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

// GET /api/messages/[gameId] - Get chat history for a game
export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const authResult = await requireAuth()
    if (!authResult || !authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { gameId } = params
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      )
    }

    // Get query params for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // timestamp for pagination

    const query: any = { gameId: new mongoose.Types.ObjectId(gameId) }
    if (before) {
      query.createdAt = { $lt: new Date(before) }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    // Reverse to show oldest first
    messages.reverse()

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/messages/[gameId] - Send a message (also used by Socket.io)
export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const authResult = await requireAuth()
    if (!authResult || !authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { gameId } = params
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Validate: Only text and links allowed, no files/images
    // Check for file/image extensions in links
    const imageFilePatterns = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|pdf|doc|docx|xls|xlsx|zip|rar|tar|gz|mp4|avi|mov|wmv|flv|webm|mp3|wav|ogg)(\?|$)/i
    if (imageFilePatterns.test(message)) {
      return NextResponse.json(
        { success: false, error: 'File and image uploads are not allowed. Only text and links are permitted.' },
        { status: 400 }
      )
    }

    // Check for data URIs (base64 encoded images/files)
    if (message.includes('data:image/') || message.includes('data:application/')) {
      return NextResponse.json(
        { success: false, error: 'Image and file uploads are not allowed. Only text and links are permitted.' },
        { status: 400 }
      )
    }

    // Get user info
    const User = (await import('@/lib/db/models/User')).default
    const user = await User.findById(authResult.id).select('name image').lean()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Create message
    const newMessage = await Message.create({
      gameId: new mongoose.Types.ObjectId(gameId),
      userId: new mongoose.Types.ObjectId(authResult.id),
      userName: user.name || 'Unknown',
      userImage: user.image || '',
      message: message.trim(),
    })

    // Populate and return
    const populatedMessage = await Message.findById(newMessage._id).lean()

    return NextResponse.json({
      success: true,
      data: populatedMessage,
    })
  } catch (error: any) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

