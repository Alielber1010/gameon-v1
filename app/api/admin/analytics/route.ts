import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import Game from '@/lib/db/models/Game';
import Report from '@/lib/db/models/Report';
import Message from '@/lib/db/models/Message';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/admin/analytics - Get dashboard analytics (admin only)
export async function GET(request: NextRequest) {
  try {
    // Authenticate and check admin role
    let authResult;
    try {
      authResult = await requireAuth();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!authResult || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Total Users (excluding admins)
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });

    // New users this week
    const newUsersThisWeek = await User.countDocuments({
      role: { $ne: 'admin' },
      createdAt: { $gte: oneWeekAgo }
    });

    // New users this month
    const newUsersThisMonth = await User.countDocuments({
      role: { $ne: 'admin' },
      createdAt: { $gte: oneMonthAgo }
    });

    // Online users (users with lastSeen in last 15 minutes)
    // Falls back to updatedAt if lastSeen doesn't exist (for existing users)
    const onlineUsers = await User.countDocuments({
      role: { $ne: 'admin' },
      $or: [
        { lastSeen: { $gte: fifteenMinutesAgo } },
        { 
          lastSeen: { $exists: false },
          updatedAt: { $gte: fifteenMinutesAgo }
        }
      ]
    });

    // Banned users
    const bannedUsers = await User.countDocuments({
      role: { $ne: 'admin' },
      isBanned: true
    });

    // Total Games
    const totalGames = await Game.countDocuments();

    // Upcoming games (status: upcoming, date in future)
    const upcomingGames = await Game.countDocuments({
      status: 'upcoming',
      date: { $gte: now }
    });

    // Games this week
    const gamesThisWeek = await Game.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    // Games this month
    const gamesThisMonth = await Game.countDocuments({
      createdAt: { $gte: oneMonthAgo }
    });

    // Completed games
    const completedGames = await Game.countDocuments({
      status: 'completed'
    });

    // Ongoing games
    const ongoingGames = await Game.countDocuments({
      status: 'ongoing'
    });

    // Total Reports
    const totalReports = await Report.countDocuments();

    // Pending Reports
    const pendingReports = await Report.countDocuments({
      status: 'pending'
    });

    // Resolved Reports
    const resolvedReports = await Report.countDocuments({
      status: 'resolved'
    });

    // Reports this week
    const reportsThisWeek = await Report.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    // Total Messages
    const totalMessages = await Message.countDocuments();

    // Messages today
    const messagesToday = await Message.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });

    // User growth over last 7 days
    const userGrowth = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await User.countDocuments({
        role: { $ne: 'admin' },
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      userGrowth.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }

    // Games by sport
    const gamesBySport = await Game.aggregate([
      {
        $group: {
          _id: '$sport',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Games by status
    const gamesByStatus = await Game.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Reports by type
    const reportsByType = await Report.aggregate([
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Resolution rate (last 30 days)
    const reportsLastMonth = await Report.countDocuments({
      createdAt: { $gte: oneMonthAgo }
    });
    const resolvedLastMonth = await Report.countDocuments({
      createdAt: { $gte: oneMonthAgo },
      status: 'resolved'
    });
    const resolutionRate = reportsLastMonth > 0 
      ? Math.round((resolvedLastMonth / reportsLastMonth) * 100) 
      : 0;

    // Average games per user
    const usersWithGames = await User.countDocuments({
      role: { $ne: 'admin' },
      gamesPlayed: { $gt: 0 }
    });
    const avgGamesPerUser = totalUsers > 0 
      ? (completedGames / totalUsers).toFixed(1) 
      : '0.0';

    // Most active users (by games played)
    const mostActiveUsers = await User.find({
      role: { $ne: 'admin' },
      gamesPlayed: { $gt: 0 }
    })
      .select('name email gamesPlayed averageRating')
      .sort({ gamesPlayed: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      analytics: {
        // User Stats
        totalUsers,
        newUsersThisWeek,
        newUsersThisMonth,
        onlineUsers,
        bannedUsers,
        userGrowth,
        
        // Game Stats
        totalGames,
        upcomingGames,
        gamesThisWeek,
        gamesThisMonth,
        completedGames,
        ongoingGames,
        gamesBySport: gamesBySport.map((item: any) => ({
          sport: item._id,
          count: item.count
        })),
        gamesByStatus: gamesByStatus.map((item: any) => ({
          status: item._id,
          count: item.count
        })),
        
        // Report Stats
        totalReports,
        pendingReports,
        resolvedReports,
        reportsThisWeek,
        reportsByType: reportsByType.map((item: any) => ({
          type: item._id,
          count: item.count
        })),
        resolutionRate,
        
        // Message Stats
        totalMessages,
        messagesToday,
        
        // Platform Metrics
        avgGamesPerUser,
        mostActiveUsers: mostActiveUsers.map((user: any) => ({
          name: user.name,
          email: user.email,
          gamesPlayed: user.gamesPlayed || 0,
          averageRating: user.averageRating || 0
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
