export interface Game {
  id: string
  hostId?: string // ID of the user who hosts the game
  hostName?: string // Name of the host
  hostImage?: string // Image of the host
  title: string
  sport: string
  image: string
  location: string | { address?: string; city?: string; country?: string; coordinates?: { lat: number; lng: number } }
  skillLevel: string
  seatsLeft: number
  date: string
  time: string
  endTime?: string
  description: string
  hostWhatsApp: string
  teamMembers: number
  minSkillLevel: string
  maxPlayers?: number // Maximum number of players (including host)
  teamBlue?: Player[]
  teamRed?: Player[]
  joinRequests?: JoinRequest[]
  registeredPlayers?: Player[] // Players registered in the game (excluding host)
  attendance?: Array<{
    userId: string
    attended: boolean
    markedAt?: string
    markedBy?: string
  }>
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  startTime?: string
  originalDate?: string | Date // Original date from API for time comparison
  completedAt?: Date
  completedBy?: string
  userAttended?: boolean
  isHost?: boolean
  playersRated?: string[] // List of player IDs the current user has already rated in this game
}

export interface Player {
  id: string
  name: string
  isCurrentUser: boolean
  age?: number
  skillLevel?: string
  image?: string
  whatsApp?: string
}

export interface JoinRequest {
  id: string
  userId: string
  userName: string
  userAge: number
  userSkillLevel: string
  userImage: string
  userWhatsApp: string
  requestDate: string
}

export interface UserProfile {
  id: string
  name: string
  age: number
  skillLevel: string
  image: string
  whatsApp: string
  bio?: string
  gamesPlayed: number
  rating: number
}
