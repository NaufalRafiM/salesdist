/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, LaporanDistribusi } from './types';
import { store } from './db/store';
import { Sidebar } from './components/Sidebar';
import { AuthDashboard } from './components/Auth/AuthDashboard';
import { PICDashboard } from './components/PIC/PICDashboard';
import { LaporanForm } from './components/PIC/LaporanForm';
import { RiwayatLaporan } from './components/PIC/RiwayatLaporan';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { VerifikasiLaporan } from './components/Admin/VerifikasiLaporan';
import { RekapKeuangan } from './components/Admin/RekapKeuangan';
import { StokGudangView } from './components/Admin/StokGudangView';
import { MasterDataView } from './components/Admin/MasterDataView';

export default function App() {
  const [dbState, setDbState] = useState(() => store.getState());

  // Subscribe to store updates
  useEffect(() => {
    return store.subscribe(() => {
      setDbState({ ...store.getState() });
    });
  }, []);

  // Awal aplikasi dibuka: belum login (masuk ke halaman form Login / Registrasi terlebih dahulu)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<string>('pic_dashboard');

  // State when PIC is revising a rejected report
  const [reportToRevise, setReportToRevise] = useState<LaporanDistribusi | null>(null);

  // Role-based Route Guard
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'pic' && activeTab.startsWith('admin_')) {
      setActiveTab('pic_dashboard');
    } else if (currentUser.role === 'admin' && activeTab.startsWith('pic_')) {
      setActiveTab('admin_dashboard');
    }
  }, [currentUser, activeTab]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab(user.role === 'admin' ? 'admin_dashboard' : 'pic_dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setReportToRevise(null);
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setActiveTab(user.role === 'admin' ? 'admin_dashboard' : 'pic_dashboard');
    setReportToRevise(null);
  };

  const handleStartRevision = (report: LaporanDistribusi) => {
    setReportToRevise(report);
    setActiveTab('pic_form');
  };

  const handleFormSuccess = () => {
    setReportToRevise(null);
    setActiveTab('pic_riwayat');
  };

  if (!currentUser) {
    return <AuthDashboard onLoginSuccess={handleLoginSuccess} />;
  }

  // Find demo counterparts for 1-click switching
  const adminUser = dbState.users.find((u) => u.role === 'admin') || dbState.users[0];
  const picUser =
    dbState.users.find((u) => u.email === 'fauzi@salesdist.id' && u.status_verifikasi === 'terverifikasi') ||
    dbState.users.find((u) => u.role === 'pic' && u.status_verifikasi === 'terverifikasi');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900 font-sans antialiased overflow-hidden">
      {/* Left Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSelectUser={handleSelectUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={dbState.notifikasi}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Floating Banner */}
        <div className="bg-slate-900 border-b border-slate-800 text-slate-200 py-2.5 px-4 sm:px-8 text-xs shrink-0 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentUser.role === 'admin' ? 'bg-amber-400' : 'bg-blue-400'
                } animate-pulse`}
              />
              <span className="font-medium text-slate-300">
                Mode Aktif:{' '}
                <strong className="text-white">
                  {currentUser.role === 'admin' ? 'Versi Admin Dashboard' : 'Versi Sales PIC Lapangan'}
                </strong>{' '}
                ({currentUser.nama_lengkap})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {currentUser.role === 'admin' ? (
                picUser && (
                  <button
                    onClick={() => handleSelectUser(picUser)}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-sm transition flex items-center space-x-1"
                  >
                    <span>Beralih ke PIC ({picUser.nama_lengkap})</span>
                    <span>&rarr;</span>
                  </button>
                )
              ) : (
                adminUser && (
                  <button
                    onClick={() => handleSelectUser(adminUser)}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] shadow-sm transition flex items-center space-x-1"
                  >
                    <span>Beralih ke Admin ({adminUser.nama_lengkap})</span>
                    <span>&rarr;</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Route View */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* PIC Views */}
          {currentUser.role === 'pic' && (
            <>
              {activeTab === 'pic_dashboard' && (
                <PICDashboard
                  currentUser={currentUser}
                  onNavigateToForm={() => {
                    setReportToRevise(null);
                    setActiveTab('pic_form');
                  }}
                  onNavigateToHistory={() => setActiveTab('pic_riwayat')}
                  onReviseReport={handleStartRevision}
                />
              )}

              {activeTab === 'pic_form' && (
                <LaporanForm
                  currentUser={currentUser}
                  onSuccess={handleFormSuccess}
                  reportToRevise={reportToRevise}
                  onCancelRevise={() => {
                    setReportToRevise(null);
                    setActiveTab('pic_riwayat');
                  }}
                />
              )}

              {activeTab === 'pic_riwayat' && (
                <RiwayatLaporan
                  currentUser={currentUser}
                  onReviseReport={handleStartRevision}
                  onOpenCreateForm={() => {
                    setReportToRevise(null);
                    setActiveTab('pic_form');
                  }}
                />
              )}
            </>
          )}

          {/* Admin Views */}
          {currentUser.role === 'admin' && (
            <>
              {activeTab === 'admin_dashboard' && (
                <AdminDashboard
                  currentUser={currentUser}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'admin_verifikasi' && (
                <VerifikasiLaporan currentUser={currentUser} />
              )}

              {activeTab === 'admin_rekap' && <RekapKeuangan />}

              {activeTab === 'admin_stok' && <StokGudangView />}

              {activeTab === 'admin_master' && <MasterDataView />}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3.5 px-4 sm:px-8 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              <strong>SALESDIST ID</strong> &bull; Sistem Distribusi & Laporan Penjualan Lapangan (PIC & Admin)
            </p>
            <p className="text-[11px] text-slate-400">
              Terhubung ke database relasional internal &bull; Semua transaksi terverifikasi
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
