export interface PublicUserProfile {
  id: string
  name: string
  email: string
  image: string
  bio: string
  location: string
  gamesPlayed: number
  averageRating: number
  totalRatings: number
  memberSince: string
  recentActivity: Array<{
    sport: string
    date: string
    attended: boolean
  }>
}

export async function getUserProfile(userId: string): Promise<{ success: boolean; data?: PublicUserProfile; error?: string }> {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to fetch user profile',
      }
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch user profile',
    }
  }
}





