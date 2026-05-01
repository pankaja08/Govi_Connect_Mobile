import apiClient from './client';

// Fetch all notifications for the logged-in user
export const fetchUserNotifications = async () => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

// Mark a single notification as read
export const markNotificationAsRead = async (notificationId) => {
  const response = await apiClient.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.patch('/notifications/read-all');
  return response.data;
};
