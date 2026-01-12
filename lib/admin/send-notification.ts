/**
 * Admin notification utility function
 * Can be used across different admin pages to send notifications to users
 */

export interface SendNotificationOptions {
  userId?: string; // If provided, send to specific user. If omitted, sends to all users
  title: string;
  message: string;
  gameId?: string; // Optional game reference
  relatedUserId?: string; // Optional related user reference
}

export interface SendNotificationResponse {
  success: boolean;
  message?: string;
  notificationCount?: number;
  error?: string;
}

/**
 * Send a notification to a specific user or all users
 * This function can be used from any admin page
 * 
 * @param options - Notification options
 * @returns Promise with the result of the notification send operation
 * 
 * @example
 * // Send to a specific user
 * await sendAdminNotification({
 *   userId: '507f1f77bcf86cd799439011',
 *   title: 'Account Update',
 *   message: 'Your account has been updated by an administrator.'
 * });
 * 
 * @example
 * // Send to all users (broadcast)
 * await sendAdminNotification({
 *   title: 'Platform Maintenance',
 *   message: 'We will be performing maintenance on Saturday at 2 AM.'
 * });
 * 
 * @example
 * // Send with game reference
 * await sendAdminNotification({
 *   userId: '507f1f77bcf86cd799439011',
 *   title: 'Game Cancelled',
 *   message: 'The game you registered for has been cancelled.',
 *   gameId: '507f1f77bcf86cd799439020'
 * });
 */
export async function sendAdminNotification(
  options: SendNotificationOptions
): Promise<SendNotificationResponse> {
  try {
    // Validate required fields
    if (!options.title || !options.message) {
      return {
        success: false,
        error: 'Title and message are required',
      };
    }

    const response = await fetch('/api/admin/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: options.userId,
        title: options.title,
        message: options.message,
        gameId: options.gameId,
        relatedUserId: options.relatedUserId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to send notification',
      };
    }

    return {
      success: true,
      message: data.message,
      notificationCount: data.notificationCount,
    };
  } catch (error: any) {
    console.error('Error sending admin notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
}
