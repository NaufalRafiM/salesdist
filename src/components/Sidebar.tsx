import React, { useState } from 'react';
import {
  Building2,
  Bell,
  LogOut,
  Users,
  ShieldCheck,
  RotateCcw,
  Menu,
  X,
  FileText,
  BarChart3,
  Boxes,
  Database,
  PlusCircle,
  History,
  CheckCircle2,
  ChevronRight,
  ArrowRightLeft,
  Sparkles,
  LayoutDashboard,
  DollarSign,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { User, AppNotification } from '../types';
import { store } from '../db/store';

interface SidebarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSelectUser: (user: User) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: AppNotification[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onLogout,
  onSelectUser,
  activeTab,
  setActiveTab,
  notifications,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  if (!currentUser) return null;

  const dbState = store.getState();
  const users = dbState.users;

  // Unread notifications for this user
  const unreadNotifs = notifications.filter(
    (n) =>
      !n.is_read &&
      ((currentUser.role === 'admin' && n.recipient_role === 'admin') ||
        n.recipient_user_id === currentUser.id)
  );

  // Live badge counts
  const pendingReportsCount = dbState.laporan.filter(
    (l) => l.status === 'Menunggu Verifikasi'
  ).length;

  const lowStockCount = dbState.stok_gudang.filter(
    (s) => s.status === 'menipis' || s.status === 'habis'
  ).length;

  const pendingPicCount = dbState.users.filter(
    (u) => u.role === 'pic' && u.status_verifikasi === 'pending'
  ).length;

  const picRejectedCount = dbState.laporan.filter(
    (l) => l.pic_id === currentUser.id && l.status === 'Ditolak'
  ).length;

  // Counterparts for fast 1-click role switcher
  const adminCounterpart = users.find((u) => u.role === 'admin') || users[0];
  const picCounterpart =
    users.find((u) => u.email === 'fauzi@salesdist.id' && u.status_verifikasi === 'terverifikasi') ||
    users.find((u) => u.role === 'pic' && u.status_verifikasi === 'terverifikasi');

  const handleResetData = () => {
    if (window.confirm('Reset semua data kembali ke data demo awal (seed data)?')) {
      store.resetToSeed();
    }
  };

  const navItem = (
    id: string,
    label: string,
    icon: React.ReactNode,
    badge?: { count: number; color: string; label?: string }
  ) => {
    const isActive = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => {
          setActiveTab(id);
          setMobileOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
          isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        }`}
      >
        <div className="flex items-center space-x-3">
          <span
            className={`transition-colors ${
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
            }`}
          >
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>

        {badge && badge.count > 0 && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.color} shrink-0`}
          >
            {badge.count} {badge.label || ''}
          </span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 select-none">
      {/* Brand & Logo Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10 shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white">
                SALES<span className="text-blue-400">DIST</span>
              </span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ID
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Distribusi & Verifikasi Penjualan
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card with Quick Switch Trigger */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Pengguna Aktif
          </span>
          <button
            onClick={() => setShowSwitchModal(true)}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 hover:underline"
            title="Ganti Akun Demo"
          >
            <span>Ganti</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
              currentUser.role === 'admin'
                ? 'bg-amber-600 text-white ring-2 ring-amber-400/30'
                : 'bg-blue-600 text-white ring-2 ring-blue-400/30'
            }`}
          >
            {currentUser.nama_lengkap.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate leading-tight">
              {currentUser.nama_lengkap}
            </h4>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {currentUser.role === 'admin' ? 'Administrator' : 'Sales PIC'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Terverifikasi" />
            </div>
          </div>
        </div>

        {/* 1-Click Role Switcher Button */}
        <div className="mt-3">
          {currentUser.role === 'admin' && picCounterpart ? (
            <button
              onClick={() => onSelectUser(picCounterpart)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 text-blue-200 text-xs font-medium flex items-center justify-between transition group"
            >
              <div className="flex items-center space-x-2 truncate">
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Beralih ke PIC ({picCounterpart.nama_lengkap.split(' ')[0]})</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          ) : adminCounterpart ? (
            <button
              onClick={() => onSelectUser(adminCounterpart)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 text-amber-200 text-xs font-medium flex items-center justify-between transition group"
            >
              <div className="flex items-center space-x-2 truncate">
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Beralih ke Versi Admin</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Navigation Links (Scrollable area) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {currentUser.role === 'admin' ? (
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Menu Administrator
            </p>
            <div className="space-y-1">
              {navItem(
                'admin_dashboard',
                'Dashboard Ringkasan',
                <LayoutDashboard className="w-4 h-4" />
              )}
              {navItem(
                'admin_verifikasi',
                'Verifikasi Laporan',
                <FileText className="w-4 h-4" />,
                {
                  count: pendingReportsCount,
                  color: 'bg-amber-500 text-slate-950',
                }
              )}
              {navItem(
                'admin_rekap',
                'Rekap Keuangan',
                <BarChart3 className="w-4 h-4" />
              )}
              {navItem(
                'admin_stok',
                'Stok Gudang',
                <Boxes className="w-4 h-4" />,
                {
                  count: lowStockCount,
                  color: 'bg-rose-500 text-white',
                }
              )}
              {navItem(
                'admin_master',
                'Master Data & PIC',
                <Database className="w-4 h-4" />,
                {
                  count: pendingPicCount,
                  color: 'bg-indigo-500 text-white',
                  label: 'PIC',
                }
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Menu PIC Lapangan
            </p>
            <div className="space-y-1">
              {navItem(
                'pic_dashboard',
                'Beranda PIC',
                <LayoutDashboard className="w-4 h-4" />
              )}
              {navItem(
                'pic_form',
                'Input Laporan Baru',
                <PlusCircle className="w-4 h-4 text-emerald-400" />
              )}
              {navItem(
                'pic_riwayat',
                'Riwayat Laporan',
                <History className="w-4 h-4" />,
                {
                  count: picRejectedCount,
                  color: 'bg-rose-500 text-white',
                  label: 'Revisi',
                }
              )}
            </div>
          </div>
        )}

        {/* Notifications Button */}
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Pusat Komunikasi
          </p>
          <button
            onClick={() => {
              setShowNotifModal(true);
              setMobileOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
          >
            <div className="flex items-center space-x-3">
              <Bell className="w-4 h-4 text-slate-400" />
              <span>Notifikasi</span>
            </div>
            {unreadNotifs.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                {unreadNotifs.length} Baru
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Footer / System Utilities */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30 space-y-2">
        <button
          onClick={handleResetData}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/40 transition"
          title="Kembalikan data ke awal"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Reset Data Demo (Seed)</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-rose-400/90 hover:text-rose-300 hover:bg-rose-950/40 transition"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Keluar (Logout)</span>
        </button>

        <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-slate-800/60">
          SALESDIST ID &bull; v2.4 Multi-Role System
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span className="font-extrabold text-base tracking-tight text-white">
              SALES<span className="text-blue-400">DIST</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNotifModal(true)}
            className="relative p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-950" />
            )}
          </button>

          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentUser.role === 'admin' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {currentUser.nama_lengkap.charAt(0)}
          </div>
        </div>
      </header>

      {/* Desktop Left Sidebar: Fixed / Sticky */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-slate-800/80 sticky top-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 z-20"
              aria-label="Tutup Menu"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Quick Account Switcher Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Pilih Akun Demo Cepat</h3>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Pilih pengguna untuk langsung beralih peran (role guard & tampilan dashboard disesuaikan seketika):
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      setShowSwitchModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                      isCurrent
                        ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/40'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {u.nama_lengkap.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">
                          {u.nama_lengkap}
                        </p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                      {u.role === 'pic' && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                            u.status_verifikasi === 'terverifikasi'
                              ? 'text-emerald-400 bg-emerald-950/60'
                              : u.status_verifikasi === 'pending'
                              ? 'text-amber-400 bg-amber-950/60'
                              : 'text-rose-400 bg-rose-950/60'
                          }`}
                        >
                          {u.status_verifikasi}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Pusat Notifikasi</h3>
                {unreadNotifs.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadNotifs.length} baru
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowNotifModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {notifications.filter(
                (n) =>
                  (currentUser.role === 'admin' && n.recipient_role === 'admin') ||
                  n.recipient_user_id === currentUser.id
              ).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Tidak ada notifikasi saat ini.</p>
                </div>
              ) : (
                notifications
                  .filter(
                    (n) =>
                      (currentUser.role === 'admin' && n.recipient_role === 'admin') ||
                      n.recipient_user_id === currentUser.id
                  )
                  .map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => store.markNotificationAsRead(notif.id)}
                      className={`p-3.5 rounded-xl border text-sm cursor-pointer transition ${
                        notif.is_read
                          ? 'bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-blue-50 border-blue-200 text-slate-900 font-medium shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            notif.type === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : notif.type === 'error'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {notif.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(notif.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <button
                onClick={() => store.markAllNotificationsAsRead(currentUser)}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Tandai semua dibaca
              </button>
              <button
                onClick={() => setShowNotifModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
