/**
 * API client for notifications endpoints
 */

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  gameId: string | null;
  gameTitle: string | null;
  gameSport: string | null;
  gameImage: string | null;
  relatedUserId: string | null;
  relatedUserName: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationsResponse {
  success: boolean;
  data?: Notification[];
  pagination?: {
    total: number;
    unread: number;
    limit: number;
    skip: number;
  };
  error?: string;
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(options: {
  read?: boolean; // true for read only, false for unread only, undefined for all
  limit?: number;
  skip?: number;
} = {}): Promise<NotificationsResponse> {
  try {
    const params = new URLSearchParams();
    if (options.read !== undefined) {
      params.append('read', options.read.toString());
    }
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.skip) params.append('skip', options.skip.toString());

    const response = await fetch(`/api/notifications?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch notifications',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch notifications',
    };
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(options: {
  notificationIds?: string[];
  markAllAsRead?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update notifications',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return {
      success: false,
      error: error.message || 'Failed to update notifications',
    };
  }
}






