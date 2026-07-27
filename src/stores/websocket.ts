import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from './auth'
import { useNotificationsStore } from './notifications'
import { Client } from '@stomp/stompjs'
import type { NotificationDTO } from '../types/notification'

export const useWebsocketStore = defineStore('websocket', () => {
    const authStore = useAuthStore()
    const notificationsStore = useNotificationsStore()
    const client = ref<Client | null>(null)

    function connect() {
        if (client.value && client.value.active) return

        const wsUrl = 'ws://localhost:8080/ws-notifications'
        
        client.value = new Client({
            brokerURL: wsUrl,
            connectHeaders: {
                // Aqui podemos passar o token no header do handshake STOMP
                Authorization: authStore.accessToken ? `Bearer ${authStore.accessToken}` : ''
            },
            onConnect: () => {
                console.log('[STOMP] Connected to', wsUrl)
                
                // Inscrição no canal de notificações do usuário:
                client.value?.subscribe('/user/queue/notifications', (message) => {
                    console.log('[STOMP] Notification received:', message.body)
                    try {
                        const notification: NotificationDTO = JSON.parse(message.body)
                        notificationsStore.addNotification(notification)
                    } catch (e) {
                        console.error('[STOMP] Error parsing notification:', e)
                    }
                })
            },
            onStompError: (frame) => {
                console.error('[STOMP] Broker reported error: ' + frame.headers['message'])
                console.error('[STOMP] Additional details: ' + frame.body)
            },
            onWebSocketClose: () => {
                console.log('[STOMP] Disconnected')
            }
        })

        client.value.activate()
    }

    function disconnect() {
        if (client.value) {
            client.value.deactivate()
            client.value = null
        }
    }

    // Observa o estado de autenticação para conectar, buscar notificações ou desconectar
    watch(() => authStore.isAuthenticated, (isAuth) => {
        if (isAuth) {
            connect()
            notificationsStore.fetchNotifications()
        } else {
            disconnect()
        }
    }, { immediate: true })

    // Observa o token de acesso para reconectar caso haja um refresh
    watch(() => authStore.accessToken, (newToken, oldToken) => {
        if (authStore.isAuthenticated && newToken && newToken !== oldToken) {
            // Se já tínhamos um client conectado e o token mudou, reconectamos
            if (client.value) {
                console.log('[STOMP] Token updated, reconnecting...')
                disconnect()
                connect()
            }
        }
    })

    return {
        connect,
        disconnect,
        client
    }
})
