import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NotificationDTO } from '../types/notification'
import { notificationService } from '../services/notificationService'

export const useNotificationsStore = defineStore('notifications', () => {
    const notifications = ref<NotificationDTO[]>([])
    const latestNotification = ref<NotificationDTO | null>(null)
    const isLoading = ref(false)
    const currentPage = ref(0)
    const hasMore = ref(true)

    const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
    const hasUnread = computed(() => unreadCount.value > 0)

    async function fetchNotifications(page = 0) {
        if (isLoading.value) return
        try {
            isLoading.value = true
            const response = await notificationService.getNotifications(page)
            if (page === 0) {
                notifications.value = response.content
            } else {
                notifications.value.push(...response.content)
            }
            currentPage.value = page
            hasMore.value = !response.last
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            isLoading.value = false
        }
    }

    function addNotification(notification: NotificationDTO) {
        // Only unshift if we are on the first page, otherwise it might be out of order 
        // with the paginated list, but usually it's fine.
        notifications.value.unshift(notification)
        latestNotification.value = notification
        
        setTimeout(() => {
            if (latestNotification.value === notification) {
                latestNotification.value = null
            }
        }, 5000)
    }

    async function markAsRead(index: number) {
        const notification = notifications.value[index]
        if (notification && !notification.read) {
            // Optimistic update
            notification.read = true
            if (notification.id) {
                try {
                    await notificationService.markAsRead(notification.id)
                } catch (error) {
                    notification.read = false // revert on failure
                    console.error('Error marking notification as read:', error)
                }
            }
        }
    }

    async function markAllAsRead() {
        const unreadIndices = notifications.value
            .map((n, i) => !n.read ? i : -1)
            .filter(i => i !== -1)
            
        if (unreadIndices.length === 0) return

        // Optimistic update
        unreadIndices.forEach(i => {
            const n = notifications.value[i]
            if (n) n.read = true
        })

        try {
            await notificationService.markAllAsRead()
        } catch (error) {
            // revert on failure
            unreadIndices.forEach(i => {
                const n = notifications.value[i]
                if (n) n.read = false
            })
            console.error('Error marking all notifications as read:', error)
        }
    }
    
    function clearLatestNotification() {
        latestNotification.value = null
    }

    return {
        notifications,
        latestNotification,
        isLoading,
        currentPage,
        hasMore,
        unreadCount,
        hasUnread,
        fetchNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearLatestNotification
    }
})
