import { api } from './apiClient'
import type { NotificationDTO, Page } from '../types/notification'

export const notificationService = {
  async getNotifications(page = 0, size = 20): Promise<Page<NotificationDTO>> {
    const { data } = await api.get<Page<NotificationDTO>>('/notifications', {
      params: { page, size }
    })
    return data
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all')
  }
}
