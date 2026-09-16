"use client";

import { useState } from "react";

export const AccountNotificationsCenter = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Notifications & System Alerts
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Real-time delivery milestones, price drops, and escrow security alerts
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-[#404d85] hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-[6px] bg-slate-50 space-y-2">
          <span className="text-3xl">🔔</span>
          <h4 className="font-bold text-slate-800 text-sm">No notifications at this time</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Order dispatches, delivery confirmations, and escrow milestones will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`py-3.5 px-3 rounded flex items-start gap-3 text-xs transition ${
                n.read ? "bg-white" : "bg-slate-50/80 font-medium"
              }`}
            >
              <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className={`text-xs ${n.read ? "font-bold text-slate-700" : "font-black text-slate-900"}`}>
                    {n.title}
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{n.time}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-[#404d85] shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
