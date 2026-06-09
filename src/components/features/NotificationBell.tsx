import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { getNotifications, markNotificationsRead } from '@/lib/storage';
import { formatTime } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationBell() {
  const { user } = useAuth();
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const notifs = await getNotifications(user.id);
      setNotifications(notifs);
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  function handleOpen() {
    setOpen(!open);
    if (!open && user) {
      markNotificationsRead(user.id);
      setTimeout(async () => {
        const notifs = await getNotifications(user.id);
        setNotifications(notifs);
      }, 300);
    }
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={t('الإشعارات', 'Notifications')}
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="notification-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full end-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-[#0f2460] text-white">
              <h3 className="font-semibold">{t('الإشعارات', 'Notifications')}</h3>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  {t('لا توجد إشعارات', 'No notifications')}
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {t(n.titleAr, n.titleEn)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {t(n.messageAr, n.messageEn)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
