export interface Game {
  id: string
  title: string
  sport: string
  image: string
  location: string
  skillLevel: string
  seatsLeft: number
  date: string
  time: string
  description: string
  hostWhatsApp: string
  teamMembers: number
  minSkillLevel: string
  teamBlue?: Player[]
  teamRed?: Player[]
  joinRequests?: JoinRequest[]
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
