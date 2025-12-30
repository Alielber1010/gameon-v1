// db/utils/transformGame.ts
import type { Game } from '../models/types/game';
import type { Types } from 'mongoose';

interface PopulatedGame {
  _id: Types.ObjectId;
  hostId: { _id: Types.ObjectId; name: string; whatsApp?: string };
  registeredPlayers: Array<{
    userId: Types.ObjectId;
    name: string;
    age?: number;
    skillLevel?: string;
    image?: string;
    whatsApp?: string;
  }>;
  teamBlue?: any[];
  teamRed?: any[];
  joinRequests?: any[];
  // ... other fields
  [key: string]: any;
}

export function transformGameForFrontend(
  dbGame: PopulatedGame,
  currentUserId?: string
): Game {
  const totalPlayers = dbGame.registeredPlayers.length;
  const seatsLeft = dbGame.maxPlayers - totalPlayers;

  // Format date/time for frontend
  const dateObj = new Date(dbGame.date);
  const formattedDate = dateObj.toISOString().split('T')[0]; // "2025-01-15"
  const isToday = dateObj.toDateString() === new Date().toDateString();

  return {
    id: dbGame._id.toString(),
    title: dbGame.title,
    sport: dbGame.sport,
    image: dbGame.image || '/placeholder.svg',
    location: dbGame.location.address,
    skillLevel: dbGame.skillLevel,
    seatsLeft,
    date: isToday ? 'Today' : formattedDate,
    time: dbGame.startTime,
    description: dbGame.description,
    hostWhatsApp: dbGame.hostWhatsApp || dbGame.hostId?.whatsApp || '',
    teamMembers: totalPlayers,
    minSkillLevel: dbGame.minSkillLevel || dbGame.skillLevel,

    teamBlue: dbGame.teamBlue?.map(p => ({
      ...p,
      id: p.userId.toString(),
      isCurrentUser: p.userId.toString() === currentUserId,
    })),
    teamRed: dbGame.teamRed?.map(p => ({
      ...p,
      id: p.userId.toString(),
      isCurrentUser: p.userId.toString() === currentUserId,
    })),
    joinRequests: dbGame.joinRequests?.map((r: any) => ({
      id: r._id.toString(),
      userId: r.userId.toString(),
      userName: r.name,
      userAge: r.age || 0,
      userSkillLevel: r.skillLevel || '',
      userImage: r.image || '',
      userWhatsApp: r.whatsApp || '',
      requestDate: r.requestedAt.toISOString(),
    })),
  };
}