import React, { useState, useEffect } from 'react';
import { Bell, Heart, MessageSquare, UserPlus, Phone, CheckCheck } from 'lucide-react';
import { Notification } from '../../shared/types';
import { api } from '../services/api';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get<Notification[]>('/notifications');
      if (res.success) setNotifications(res.data);
    } catch (e) {
      console.warn('Notifications error', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/all/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.warn(e);
    }
  };

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.isRead : true));
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
      case 'reaction':
        return <Heart className="w-3.5 h-3.5 text-red-400" />;
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-3.5 h-3.5 text-falcon-blue" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-400" />;
      case 'call':
        return <Phone className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-falcon-blue" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-8">
      <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-falcon-blue/20 text-falcon-blue text-[11px] font-mono">
                {unreadCount} new
              </span>
            )}
          </h2>
          <p className="text-[11px] text-slate-400">Activity and interactions across Dark Falcon</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#070a10] p-0.5 rounded-xl border border-[#1b2438]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === 'all' ? 'bg-falcon-blue text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === 'unread' ? 'bg-falcon-blue text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread
            </button>
          </div>

          <Button size="sm" variant="ghost" icon={<CheckCheck className="w-4 h-4" />} onClick={handleMarkAllRead}>
            Mark All Read
          </Button>
        </div>
      </div>

      <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl divide-y divide-[#1b2438]/50 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No notifications at this moment. You're all caught up!
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkSingleRead(n.id)}
              className={`p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${
                !n.isRead ? 'bg-falcon-blue/5 hover:bg-falcon-blue/10' : 'hover:bg-[#090d15]'
              }`}
            >
              <div className="relative">
                <Avatar src={n.actorAvatar} alt={n.actorUsername} size="md" />
                <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#0c101a]">
                  {getIcon(n.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0 text-xs">
                <p className="text-slate-200">
                  <span className="font-bold text-white">@{n.actorUsername}</span> {n.body}
                </p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {new Date(n.createdAt).toLocaleDateString()} at{' '}
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-falcon-blue shrink-0 shadow-neon-blue" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
