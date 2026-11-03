import React, { useRef } from 'react';
import { CreditCard, Upload, CheckCircle2, AlertCircle, Sparkles, RefreshCw, ShieldCheck, MapPin, Phone, Users } from 'lucide-react';
import { SAMPLE_KTP_PHOTO } from '../../data/seedData';

interface IdentityDocumentUploadProps {
  nik: string;
  onNikChange: (val: string) => void;
  nip: string;
  onNipChange: (val: string) => void;
  ktpPhotoUrl?: string;
  onKtpPhotoChange: (url: string) => void;
  address: string;
  onAddressChange: (val: string) => void;
  emergencyName: string;
  onEmergencyNameChange: (val: string) => void;
  emergencyPhone: string;
  onEmergencyPhoneChange: (val: string) => void;
  emergencyRelation: string;
  onEmergencyRelationChange: (val: string) => void;
  nikError?: string | null;
  ktpError?: string | null;
}

export const IdentityDocumentUpload: React.FC<IdentityDocumentUploadProps> = ({
  nik,
  onNikChange,
  nip,
  onNipChange,
  ktpPhotoUrl,
  onKtpPhotoChange,
  address,
  onAddressChange,
  emergencyName,
  onEmergencyNameChange,
  emergencyPhone,
  onEmergencyPhoneChange,
  emergencyRelation,
  onEmergencyRelationChange,
  nikError,
  ktpError,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleNikInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numbers and max 16 digits
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 16);
    onNikChange(cleaned);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onKtpPhotoChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isNikComplete = nik.length === 16;

  return (
    <div className="space-y-4">
      {/* NIK and Employee ID Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Nomor Induk Kependudukan (NIK) <span className="text-rose-400">*</span>
            </label>
            <span
              className={`text-[10px] font-mono font-bold ${
                isNikComplete ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {nik.length}/16 Digit
            </span>
          </div>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={nik}
              onChange={handleNikInput}
              placeholder="3273xxxxxxxxxxxx"
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border text-white font-mono text-sm outline-none transition ${
                nikError
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500'
                  : isNikComplete
                  ? 'border-emerald-500/60 focus:ring-2 focus:ring-emerald-500'
                  : 'border-slate-700 focus:ring-2 focus:ring-blue-500'
              }`}
            />
            {isNikComplete && (
              <div className="absolute right-3 top-3 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
          {nikError ? (
            <p className="text-[11px] text-rose-400 mt-1">{nikError}</p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-0.5">
              16 digit nomor e-KTP resmi terbitan Kementerian Dalam Negeri / Dukcapil.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
            NIP / ID Karyawan Lapangan
          </label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={nip}
              onChange={(e) => onNipChange(e.target.value)}
              placeholder="PIC-DIST-2026-xxx (Opsional)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Disediakan otomatis oleh sistem jika dikosongkan.
          </p>
        </div>
      </div>

      {/* KTP Document Card / Photo Upload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Unggah Foto Fisik e-KTP Asli <span className="text-rose-400">*</span>
          </label>
          {ktpPhotoUrl && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Dokumen Terunggah</span>
            </span>
          )}
        </div>

        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
          {ktpPhotoUrl ? (
            <div className="space-y-3">
              <div className="relative max-w-md mx-auto aspect-[16/10] rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-900 group">
                <img
                  src={ktpPhotoUrl}
                  alt="Pratinjau e-KTP"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>e-KTP Siap Diverifikasi Admin</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ganti Foto KTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => onKtpPhotoChange(SAMPLE_KTP_PHOTO)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gunakan Sampel Demo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <CreditCard className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-200">
                  Ambil Foto / Unggah Kartu e-KTP Fisik
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                  Pastikan foto tidak buram, seluruh bagian e-KTP terlihat jelas, dan nama serta NIK dapat terbaca oleh sistem.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih Berkas Foto e-KTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => onKtpPhotoChange(SAMPLE_KTP_PHOTO)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center justify-center space-x-2 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gunakan Sampel e-KTP Demo</span>
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {ktpError && (
          <p className="text-[11px] text-rose-400 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{ktpError}</span>
          </p>
        )}
      </div>

      {/* Domicile Address Field */}
      <div>
        <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
          Alamat Domisili Sesuai e-KTP <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Jl. Nama Jalan No. XX, Kelurahan, Kecamatan, Kota/Kabupaten"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Emergency Contact Block (Standard Corporate KYC) */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Kontak Darurat (Keluarga / Kerabat Terdekat)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Nama Kontak
            </label>
            <input
              type="text"
              value={emergencyName}
              onChange={(e) => onEmergencyNameChange(e.target.value)}
              placeholder="e.g. Ibu Aminah"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Nomor Telepon / WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => onEmergencyPhoneChange(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Hubungan Keluarga
            </label>
            <select
              value={emergencyRelation}
              onChange={(e) => onEmergencyRelationChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Orang Tua">Orang Tua (Ayah / Ibu)</option>
              <option value="Pasangan">Suami / Istri</option>
              <option value="Saudara Kandung">Saudara Kandung</option>
              <option value="Kerabat">Kerabat Dekat</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
