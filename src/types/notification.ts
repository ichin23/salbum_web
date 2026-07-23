import type { UserInfoDTO } from './index'

export interface Page<T> {
  content: T[]
  pageable: any
  last: boolean
  totalPages: number
  totalElements: number
  first: boolean
  size: number
  number: number
  sort: any
  numberOfElements: number
  empty: boolean
}

export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | string

export interface NotificationDTO {
  id?: string
  title: string
  body: string
  sender?: UserInfoDTO
  link?: string
  type?: NotificationType
  user?: UserInfoDTO
  read: boolean
  createdAt?: string
}
