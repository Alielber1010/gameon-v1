// server.js - Custom Next.js server with Socket.io support
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Socket.io connection handling
  io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id)

    // Join game room
    socket.on('join-game', async (gameId) => {
      if (!gameId) return
      socket.join(`game:${gameId}`)
      console.log(`Socket ${socket.id} joined game:${gameId}`)
    })

    // Leave game room
    socket.on('leave-game', (gameId) => {
      if (!gameId) return
      socket.leave(`game:${gameId}`)
      console.log(`Socket ${socket.id} left game:${gameId}`)
    })

    // Handle new message
    socket.on('send-message', async (data) => {
      if (!data.gameId || !data.message || !data.userId) return

      try {
        // Dynamic import to avoid circular dependencies
        const connectDB = (await import('./lib/db/mongodb.js')).default
        const Message = (await import('./lib/db/models/Message.js')).default
        const mongoose = (await import('mongoose')).default

        await connectDB()
        
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
      } catch (error) {
        console.error('Error saving message:', error)
        socket.emit('message-error', { error: 'Failed to send message' })
      }
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
