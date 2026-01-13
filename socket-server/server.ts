// socket-server/server.ts
// Standalone Socket.io server for Render deployment
import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI!
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required')
  process.exit(1)
}

const httpServer = createServer()

const io = new Server(httpServer, {
  path: '/api/socket',
  cors: {
    origin: CORS_ORIGIN.split(',').map(origin => origin.trim()), // Support multiple origins
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  })

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log('✅ Client connected:', socket.id)

  // Join game room
  socket.on('join-game', async (gameId: string) => {
    if (!gameId) return
    socket.join(`game:${gameId}`)
    console.log(`Socket ${socket.id} joined game:${gameId}`)
  })

  // Leave game room
  socket.on('leave-game', (gameId: string) => {
    if (!gameId) return
    socket.leave(`game:${gameId}`)
    console.log(`Socket ${socket.id} left game:${gameId}`)
  })

  // Handle new message
  socket.on('send-message', async (data: {
    gameId: string
    message: string
    userId: string
    userName: string
    userImage?: string
  }) => {
    if (!data.gameId || !data.message || !data.userId) return

    // Validate: Only text and links allowed, no files/images
    const imageFilePatterns = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|pdf|doc|docx|xls|xlsx|zip|rar|tar|gz|mp4|avi|mov|wmv|flv|webm|mp3|wav|ogg)(\?|$)/i
    if (imageFilePatterns.test(data.message)) {
      socket.emit('message-error', { error: 'File and image uploads are not allowed. Only text and links are permitted.' })
      return
    }

    // Check for data URIs (base64 encoded images/files)
    if (data.message.includes('data:image/') || data.message.includes('data:application/')) {
      socket.emit('message-error', { error: 'Image and file uploads are not allowed. Only text and links are permitted.' })
      return
    }

    try {
      // Import Message model
      const Message = (await import('./models/Message')).default

      // Save message to database
      const message = await Message.create({
        gameId: new mongoose.Types.ObjectId(data.gameId),
        userId: new mongoose.Types.ObjectId(data.userId),
        userName: data.userName,
        userImage: data.userImage || '',
        message: data.message.trim(),
      })

      // Populate message data
      const messageData = {
        _id: message._id.toString(),
        gameId: message.gameId.toString(),
        userId: message.userId.toString(),
        userName: message.userName,
        userImage: message.userImage,
        message: message.message,
        createdAt: message.createdAt,
      }

      // Broadcast to all users in the game room
      io.to(`game:${data.gameId}`).emit('new-message', messageData)
      console.log(`Message sent in game:${data.gameId} by user:${data.userId}`)
    } catch (error) {
      console.error('❌ Error saving message:', error)
      socket.emit('message-error', { error: 'Failed to send message' })
    }
  })

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`)
  console.log(`📡 CORS origin: ${CORS_ORIGIN}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  httpServer.close(() => {
    mongoose.connection.close().then(() => {
      console.log('MongoDB connection closed')
      process.exit(0)
    }).catch((err) => {
      console.error('Error closing MongoDB connection:', err)
      process.exit(1)
    })
  })
})
