// lib/socket/server.ts
// Socket.io server setup for Next.js
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Server as SocketServer } from 'socket.io'

let io: SocketIOServer | null = null

export function initSocketIO(httpServer: HTTPServer) {
  if (io) {
    return io
  }

  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

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
    socket.on('send-message', async (data: { gameId: string; message: string; userId: string; userName: string; userImage?: string }) => {
      if (!data.gameId || !data.message || !data.userId) return

      // Broadcast to all users in the game room
      const messageData = {
        gameId: data.gameId,
        userId: data.userId,
        userName: data.userName,
        userImage: data.userImage || '',
        message: data.message,
        createdAt: new Date(),
        _id: `temp-${Date.now()}`, // Temporary ID, will be replaced by DB
      }

      io?.to(`game:${data.gameId}`).emit('new-message', messageData)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

export function getIO(): SocketIOServer | null {
  return io
}

