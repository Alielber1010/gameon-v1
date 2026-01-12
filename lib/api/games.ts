/**
 * API client for games endpoints
 */

export interface GameFilters {
  sport?: string;
  status?: string;
  city?: string;
  hostId?: string; // Filter by host user ID
  page?: number;
  limit?: number;
}

export interface GameResponse {
  success: boolean;
  data?: any;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateGameData {
  title: string;
  sport: string;
  description: string;
  location: {
    address: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  maxPlayers: number;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  minSkillLevel?: string;
  image?: string;
  hostWhatsApp?: string;
}

export interface UpdateGameData extends Partial<CreateGameData> {
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

/**
 * Get all games with optional filters
 */
export async function getGames(filters: GameFilters = {}): Promise<GameResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters.sport) params.append('sport', filters.sport);
    if (filters.status) params.append('status', filters.status);
    if (filters.city) params.append('city', filters.city);
    if (filters.hostId) params.append('hostId', filters.hostId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`/api/games?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch games',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching games:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch games',
    };
  }
}

/**
 * Get a single game by ID
 */
export async function getGameById(id: string): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch game',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching game:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch game',
    };
  }
}

/**
 * Create a new game
 */
export async function createGame(gameData: CreateGameData): Promise<GameResponse> {
  try {
    const response = await fetch('/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to create game',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error creating game:', error);
    return {
      success: false,
      error: error.message || 'Failed to create game',
    };
  }
}

/**
 * Update a game
 */
export async function updateGame(id: string, gameData: UpdateGameData): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update game',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error updating game:', error);
    return {
      success: false,
      error: error.message || 'Failed to update game',
    };
  }
}

/**
 * Delete a game
 */
export async function deleteGame(id: string): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to delete game',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error deleting game:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete game',
    };
  }
}

/**
 * Join a game (creates a join request)
 */
export async function joinGame(id: string, playerData: {
  name: string;
  age?: number;
  skillLevel?: string;
  image?: string;
  whatsApp?: string;
}): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/${id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playerData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to join game',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error joining game:', error);
    return {
      success: false,
      error: error.message || 'Failed to join game',
    };
  }
}

/**
 * Leave a game
 */
export async function leaveGame(id: string): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/${id}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to leave game',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error leaving game:', error);
    return {
      success: false,
      error: error.message || 'Failed to leave game',
    };
  }
}

/**
 * Accept a join request
 */
export async function acceptJoinRequest(gameId: string, requestId: string): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/${gameId}/join-requests/${requestId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to accept join request',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error accepting join request:', error);
    return {
      success: false,
      error: error.message || 'Failed to accept join request',
    };
  }
}

/**
 * Reject a join request
 */
export async function rejectJoinRequest(gameId: string, requestId: string): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/${gameId}/join-requests/${requestId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to reject join request',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error rejecting join request:', error);
    return {
      success: false,
      error: error.message || 'Failed to reject join request',
    };
  }
}

/**
 * Transfer host ownership to another player
 */
export async function getGamesWithPendingRequests(): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/pending-requests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch games with pending requests',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching games with pending requests:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch games with pending requests',
    };
  }
}

export async function markAttendance(
  gameId: string,
  playerIds?: string[],
  markAll?: boolean
): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/${gameId}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerIds,
        markAll,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to mark attendance',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark attendance',
    };
  }
}

export async function getCompletedGames(): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/completed`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch completed games',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching completed games:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch completed games',
    };
  }
}

export async function ratePlayer(
  gameId: string,
  playerId: string,
  rating: number,
  comment?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch(`/api/games/${gameId}/rate-player`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerId,
        rating,
        comment,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to submit rating',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error rating player:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit rating',
    };
  }
}

export async function removePlayerFromGame(
  gameId: string,
  playerId: string
): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/${gameId}/remove-player`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to remove player',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error removing player:', error);
    return {
      success: false,
      error: error.message || 'Failed to remove player',
    };
  }
}

export async function transferHost(gameId: string, newHostId: string): Promise<GameResponse> {
  try {
    const response = await fetch(`/api/games/${gameId}/transfer-host`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newHostId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to transfer host ownership',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error transferring host:', error);
    return {
      success: false,
      error: error.message || 'Failed to transfer host ownership',
    };
  }
}
