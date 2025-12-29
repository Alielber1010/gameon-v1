import type { Game, UserProfile } from "@/models/types/game"
import { mockGames, joinedGames } from "@/models/data/mockGames"
import { mockUserProfiles } from "@/models/data/mockUsers"

export class GameController {
  static getAllGames(): Game[] {
    return mockGames
  }

  static getJoinedGames(): Game[] {
    return joinedGames
  }

  static getHostedGames(): Game[] {
    const games = JSON.parse(localStorage.getItem("hostedGames") || "[]")
    return games.map((game: Game) => ({
      ...game,
      joinRequests: [
        {
          id: "req1",
          userId: "user1",
          userName: "NOUR",
          userAge: 22,
          userSkillLevel: "Intermediate",
          userImage: "/placeholder.svg?height=40&width=40",
          userWhatsApp: "https://wa.me/1234567890",
          requestDate: "2024-01-15",
        },
        {
          id: "req2",
          userId: "user2",
          userName: "AHMED",
          userAge: 25,
          userSkillLevel: "Professional",
          userImage: "/placeholder.svg?height=40&width=40",
          userWhatsApp: "https://wa.me/1234567891",
          requestDate: "2024-01-15",
        },
      ],
      teamBlue: [
        {
          id: "player1",
          name: "KHALED",
          isCurrentUser: false,
          age: 28,
          skillLevel: "Intermediate",
          image: "/placeholder.svg?height=40&width=40",
          whatsApp: "https://wa.me/1234567892",
        },
        {
          id: "player2",
          name: "MOHAMED",
          isCurrentUser: false,
          age: 24,
          skillLevel: "Beginner",
          image: "/placeholder.svg?height=40&width=40",
          whatsApp: "https://wa.me/1234567893",
        },
        {
          id: "player3",
          name: "YOUSSEF",
          isCurrentUser: false,
          age: 30,
          skillLevel: "Advanced",
          image: "/placeholder.svg?height=40&width=40",
          whatsApp: "https://wa.me/1234567894",
        },
      ],
      teamRed: [
        {
          id: "player4",
          name: "NOUR",
          isCurrentUser: false,
          age: 26,
          skillLevel: "Intermediate",
          image: "/placeholder.svg?height=40&width=40",
          whatsApp: "https://wa.me/1234567895",
        },
        {
          id: "player5",
          name: "AHMED",
          isCurrentUser: false,
          age: 23,
          skillLevel: "Professional",
          image: "/placeholder.svg?height=40&width=40",
          whatsApp: "https://wa.me/1234567896",
        },
      ],
    }))
  }

  static createGame(gameData: Omit<Game, "id">): Game {
    const existingGames = JSON.parse(localStorage.getItem("hostedGames") || "[]")
    const gameWithId = { ...gameData, id: Date.now().toString() }
    existingGames.push(gameWithId)
    localStorage.setItem("hostedGames", JSON.stringify(existingGames))
    return gameWithId
  }

  static deleteGame(gameId: string): void {
    const existingGames = JSON.parse(localStorage.getItem("hostedGames") || "[]")
    const updatedGames = existingGames.filter((game: Game) => game.id !== gameId)
    localStorage.setItem("hostedGames", JSON.stringify(updatedGames))
  }

  static filterGames(games: Game[], searchQuery: string, selectedSports: string[]): Game[] {
    return games.filter((game) => {
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.sport.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSport = selectedSports.length === 0 || selectedSports.includes(game.sport)
      return matchesSearch && matchesSport
    })
  }

  static getUserProfile(playerName: string): UserProfile {
    return (
      mockUserProfiles[playerName] || {
        id: "unknown",
        name: playerName.replace(" (YOU)", ""),
        age: 25,
        skillLevel: "Intermediate",
        image: "/placeholder.svg?height=96&width=96",
        whatsApp: "https://wa.me/1234567890",
        bio: "Sports enthusiast who loves playing games and staying active.",
        gamesPlayed: 15,
        rating: 4.0,
      }
    )
  }
}
