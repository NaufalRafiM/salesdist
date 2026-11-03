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
} from 'lucide-react';
import { User, AppNotification } from '../types';
import { store } from '../db/store';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSelectUser: (user: User) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: AppNotification[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onSelectUser,
  activeTab,
  setActiveTab,
  notifications,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const users = store.getState().users;
  const unreadNotifs = notifications.filter(
    (n) =>
      !n.is_read &&
      ((currentUser.role === 'admin' && n.recipient_role === 'admin') ||
        n.recipient_user_id === currentUser.id)
  );

  const handleResetData = () => {
    store.resetToSeed();
    setShowUserDropdown(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab(currentUser.role === 'admin' ? 'admin_dashboard' : 'pic_dashboard')}
                className="flex items-center space-x-2 text-left focus:outline-none"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-xl tracking-tight text-white">SALES<span className="text-blue-400">DIST</span></span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      ID
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block">Sistem Distribusi Penjualan & Verifikasi</p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {currentUser.role === 'admin' ? (
                <>
                  <button
                    onClick={() => setActiveTab('admin_dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      activeTab === 'admin_dashboard'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('admin_verifikasi')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      activeTab === 'admin_verifikasi'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Verifikasi Laporan</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('admin_rekap')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      activeTab === 'admin_rekap'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Rekap Keuangan</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('admin_stok')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      activeTab === 'admin_stok'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Boxes className="w-4 h-4" />
                    <span>Stok Gudang</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('admin_master')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      activeTab === 'admin_master'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>Master Data</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('pic_dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      activeTab === 'pic_dashboard'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Beranda PIC</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('pic_form')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      activeTab === 'pic_form'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Input Laporan</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('pic_riwayat')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                      activeTab === 'pic_riwayat'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Riwayat Laporan</span>
                  </button>
                </>
              )}
            </nav>

            {/* Right Tools (Notif + User profile + Switcher) */}
            <div className="flex items-center space-x-3">
              {/* Notif button */}
              <button
                onClick={() => setShowNotifModal(true)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-900">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* User Switcher & Info */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentUser.role === 'admin' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {currentUser.nama_lengkap.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold leading-tight text-slate-100">{currentUser.nama_lengkap}</p>
                    <p className="text-[10px] text-blue-300 uppercase tracking-wide font-medium">
                      {currentUser.role === 'admin' ? 'Administrator' : 'Sales PIC Lapangan'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-slate-200">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Masuk Sebagai:</p>
                      <p className="text-sm font-bold text-white">{currentUser.nama_lengkap}</p>
                      <p className="text-xs text-slate-400">{currentUser.email}</p>
                    </div>

                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Ganti Akun Demo Cepat:
                      </p>
                      <div className="space-y-1">
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSelectUser(u);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition ${
                              u.id === currentUser.id
                                ? 'bg-blue-600 text-white font-medium'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="truncate">{u.nama_lengkap}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              u.role === 'admin' ? 'bg-amber-900/60 text-amber-300' : 'bg-slate-700 text-slate-300'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="px-2 pt-1">
                      <button
                        onClick={handleResetData}
                        className="w-full text-left px-3 py-2 rounded-md text-xs text-amber-400 hover:bg-amber-950/40 flex items-center space-x-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reset Data Awal (Seed Data)</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-md text-xs text-rose-400 hover:bg-rose-950/40 flex items-center space-x-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-2 pb-4 space-y-1">
            {currentUser.role === 'admin' ? (
              <>
                <button
                  onClick={() => {
                    setActiveTab('admin_dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                    activeTab === 'admin_dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard Admin</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin_verifikasi');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                    activeTab === 'admin_verifikasi' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Verifikasi Laporan</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin_rekap');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                    activeTab === 'admin_rekap' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Rekap Keuangan</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin_stok');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                    activeTab === 'admin_stok' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  <span>Stok Gudang</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin_master');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                    activeTab === 'admin_master' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Master Data</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setActiveTab('pic_dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                    activeTab === 'pic_dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Beranda PIC</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('pic_form');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                    activeTab === 'pic_form' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Input Laporan Distribusi</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('pic_riwayat');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                    activeTab === 'pic_riwayat' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Riwayat Laporan</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Notification Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
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
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          notif.type === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : notif.type === 'error'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {notif.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{notif.message}</p>
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
