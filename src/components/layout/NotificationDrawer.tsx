"use client"

import React from 'react'
import { useApp } from '@/context/AppContext'
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileSignature,
  Clock,
  Mail,
  MessageSquare,
  CheckCheck,
} from 'lucide-react'

export function NotificationDrawer() {
  const {
    isNotifOpen,
    setIsNotifOpen,
    notifications,
    markNotificationsRead,
    unreadNotifCount,
  } = useApp()

  if (!isNotifOpen) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-[#1F9D66]" />
      case 'revision':
        return <AlertCircle className="h-4 w-4 text-[#C9821A]" />
      case 'signed':
        return <FileSignature className="h-4 w-4 text-[#163A70]" />
      case 'reminder':
        return <Clock className="h-4 w-4 text-[#C9821A]" />
      case 'email_sent':
        return <Mail className="h-4 w-4 text-[#3E5D91]" />
      case 'whatsapp_sent':
        return <MessageSquare className="h-4 w-4 text-[#1F9D66]" />
      default:
        return <Clock className="h-4 w-4 text-[#163A70]" />
    }
  }

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const mins = Math.round(diffMs / 60000)
    if (mins < 60) return `${Math.max(mins, 1)}m ago`
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.round(hrs / 24)
    return `${days}d ago`
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[#0F2A54]/30 backdrop-blur-xs transition-opacity"
        onClick={() => setIsNotifOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#E3E8F0] px-5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#0F2A54] text-base">Notifications</h3>
            {unreadNotifCount > 0 && (
              <span className="rounded-full bg-[#D0473F] px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadNotifCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadNotifCount > 0 && (
              <button
                onClick={markNotificationsRead}
                title="Mark all as read"
                className="flex items-center gap-1 text-xs text-[#163A70] hover:underline cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark read</span>
              </button>
            )}
            <button
              onClick={() => setIsNotifOpen(false)}
              className="rounded-lg p-1.5 text-[#6B7A99] hover:bg-[#F5F7FA] hover:text-[#16233F] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E3E8F0]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B7A99]">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                className={`flex gap-3.5 p-4 transition-colors ${
                  !notif.isRead ? 'bg-[#EAF2FF]/60' : 'hover:bg-[#F5F7FA]'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E3E8F0] bg-white shadow-xs">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-xs font-bold text-[#16233F] truncate">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-[#6B7A99] shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7A99] mt-0.5 line-clamp-2">
                    {notif.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
