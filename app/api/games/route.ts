import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import { SPORTS } from '@/lib/constants/sports';

// GET /api/games - Get all games with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const hostId = searchParams.get('hostId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (sport) query.sport = sport;
    if (status) query.status = status;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (hostId) {
      // Validate hostId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(hostId)) {
        query.hostId = new mongoose.Types.ObjectId(hostId);
      }
    }

    // Only show upcoming and ongoing games by default (unless status is specified)
    // But if hostId is specified, show all games for that host
    if (!status && !hostId) {
      query.status = { $in: ['upcoming', 'ongoing'] };
    }

    // Execute query with pagination
    const games = await Game.find(query)
      .populate('hostId', 'name email image')
      .populate('registeredPlayers.userId', 'name email image')
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Game.countDocuments(query);

    // Transform games to include computed fields
    const transformedGames = games.map((game: any) => ({
      id: game._id.toString(),
      hostId: game.hostId._id?.toString() || game.hostId.toString(),
      hostName: game.hostId.name || game.hostId,
      hostImage: game.hostId.image || null,
      title: game.title,
      sport: game.sport,
      description: game.description,
      location: game.location,
      date: game.date,
      startTime: game.startTime,
      endTime: game.endTime,
      maxPlayers: game.maxPlayers,
      skillLevel: game.skillLevel,
      minSkillLevel: game.minSkillLevel,
      image: game.image,
      status: game.status,
      hostWhatsApp: game.hostWhatsApp,
      registeredPlayers: game.registeredPlayers?.map((player: any) => ({
        id: player._id?.toString(),
        userId: player.userId._id?.toString() || player.userId.toString(),
        name: player.name,
        age: player.age,
        skillLevel: player.skillLevel,
        image: player.image,
        whatsApp: player.whatsApp,
        joinedAt: player.joinedAt,
      })) || [],
      teamBlue: game.teamBlue || [],
      teamRed: game.teamRed || [],
      seatsLeft: game.maxPlayers - (game.registeredPlayers?.length || 0),
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedGames,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

// POST /api/games - Create a new game
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    let authResult;
    try {
      authResult = await requireAuth();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!authResult || !authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    console.log('Received game creation request:', { body, userId: authResult.id });
    
    const {
      title,
      sport,
      description,
      location,
      date,
      startTime,
      endTime,
      maxPlayers,
      skillLevel,
      minSkillLevel,
      image,
      hostWhatsApp,
    } = body;

    // Validation
    if (!title || !sport || !description || !location?.address || !date || !startTime || !endTime || !maxPlayers) {
      console.error('Validation failed - missing fields:', {
        title: !!title,
        sport: !!sport,
        description: !!description,
        locationAddress: !!location?.address,
        date: !!date,
        startTime: !!startTime,
        endTime: !!endTime,
        maxPlayers: !!maxPlayers
      });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (maxPlayers < 2) {
      return NextResponse.json(
        { success: false, error: 'maxPlayers must be at least 2' },
        { status: 400 }
      );
    }

    if (!SPORTS.includes(sport as any)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sport' },
        { status: 400 }
      );
    }

    // Validate hostId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(authResult.id)) {
      console.error('Invalid hostId:', authResult.id);
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prepare location data - address is now the Google Maps link
    const locationData: any = {
      address: location.address, // This is the Google Maps link
      city: location.city || undefined,
      country: location.country || undefined,
    };

    // If coordinates exist, add them (stored for potential future use, but not indexed)
    // We're not using geospatial queries right now, so we don't need geoJSON
    if (location.coordinates && (location.coordinates.lat !== undefined && location.coordinates.lng !== undefined)) {
      // Handle both number and string inputs (JSON might convert numbers to strings)
      const lat = typeof location.coordinates.lat === 'number' 
        ? location.coordinates.lat 
        : parseFloat(String(location.coordinates.lat));
      const lng = typeof location.coordinates.lng === 'number' 
        ? location.coordinates.lng 
        : parseFloat(String(location.coordinates.lng));
      
      // Validate coordinates are valid numbers and within valid ranges
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        locationData.coordinates = {
          lat: lat,
          lng: lng,
        };
        // NOTE: Not creating geoJSON since we removed the 2dsphere index
        // If you need geospatial queries in the future, uncomment this:
        // locationData.geoJSON = {
        //   type: 'Point',
        //   coordinates: [lng, lat], // [longitude, latitude] format
        // };
      } else {
        console.warn('Invalid coordinates provided:', { lat, lng, original: location.coordinates });
        // Still store coordinates even if invalid
        locationData.coordinates = {
          lat: lat,
          lng: lng,
        };
      }
    }

    // Create game
    console.log('Creating game with data:', {
      hostId: authResult.id,
      title,
      sport,
      description,
      location: locationData,
      date,
      startTime,
      endTime,
      maxPlayers
    });

    const game = new Game({
      hostId: authResult.id,
      title,
      sport,
      description,
      location: locationData,
      date: new Date(date),
      startTime,
      endTime,
      maxPlayers,
      skillLevel: skillLevel || 'all',
      minSkillLevel,
      image: image || '/default-game.jpg',
      hostWhatsApp,
      status: 'upcoming',
      registeredPlayers: [],
      joinRequests: [],
    });

    await game.save();
    console.log('Game saved successfully:', game._id);

    // Populate host info
    await game.populate('hostId', 'name email image');

    const transformedGame = {
      id: game._id.toString(),
      hostId: game.hostId._id?.toString() || game.hostId.toString(),
      hostName: game.hostId.name || game.hostId,
      hostImage: game.hostId.image || null,
      title: game.title,
      sport: game.sport,
      description: game.description,
      location: game.location,
      date: game.date,
      startTime: game.startTime,
      endTime: game.endTime,
      maxPlayers: game.maxPlayers,
      skillLevel: game.skillLevel,
      minSkillLevel: game.minSkillLevel,
      image: game.image,
      status: game.status,
      hostWhatsApp: game.hostWhatsApp,
      registeredPlayers: [],
      teamBlue: [],
      teamRed: [],
      seatsLeft: game.maxPlayers,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    return NextResponse.json(
      { success: true, data: transformedGame },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating game:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create game',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

