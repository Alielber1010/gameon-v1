"use client"

import { useState, useEffect, useCallback } from 'react';
import { getGames, getGameById, type GameFilters, type GameResponse } from '@/lib/api/games';

export interface UseGamesOptions extends GameFilters {
  enabled?: boolean; // Allow disabling the query
}

export function useGames(options: UseGamesOptions = {}) {
  const { enabled = true, ...filters } = options;
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const fetchGames = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getGames(filters);
      
      if (response.success && response.data) {
        setGames(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.error || 'Failed to fetch games');
        setGames([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch games');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, JSON.stringify(filters)]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return {
    games,
    loading,
    error,
    pagination,
    refetch: fetchGames,
  };
}

export function useGame(gameId: string | null) {
  const [game, setGame] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const fetchGame = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getGameById(gameId);
        
        if (response.success && response.data) {
          setGame(response.data);
        } else {
          setError(response.error || 'Failed to fetch game');
          setGame(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch game');
        setGame(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  return {
    game,
    loading,
    error,
  };
}

