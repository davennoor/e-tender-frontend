import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/MainLayout';
import { useParams } from 'react-router-dom';

const TEMPLATES = [
    { value: 'formal',  label: 'Formal',  desc: 'Cover, surat penawaran resmi, dan tabel lengkap' },
    { value: 'modern',  label: 'Modern',  desc: 'Berwarna, ada kartu ringkasan dan nomor halaman' },
    { value: 'ringkas', label: 'Ringkas', desc: 'Semua data dalam 1 halaman' },
];
export default function GeneratepdfMDP() {
    // --- 1. SETUP STATE ---
    const [tenderList, setTenderList] = useState([]);
    const [selectedTender, setSelectedTender] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { template: templateParam } = useParams(); // dari URL /generatemdp/modern
    const [template, setTemplate] = useState(
        TEMPLATES.some((t) => t.value === templateParam) ? templateParam : 'formal'
    );

    // Konfigurasi Token Auth (Sesuaikan dengan cara kamu menyimpan token saat login)
    // Misalnya disimpan di localStorage:
    const token = localStorage.getItem('token'); 

    // --- 2. FETCH DATA TENDER ---
    useEffect(() => {
        const fetchTenders = async () => {
            try {
                // Ganti URL dengan base URL backend kamu jika berbeda
                const response = await axios.get('/api/tender/index', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                if (response.data.status === 'success') {
                    setTenderList(response.data.data);
                }
            } catch (error) {
                console.error("Gagal mengambil data tender:", error);
                alert("Gagal mengambil data tender. Pastikan Anda sudah login.");
            }
        };

        fetchTenders();
    }, [token]);

    // --- 3. HANDLE PILIHAN TENDER ---
    const handleTenderChange = (e) => {
        const tenderId = parseInt(e.target.value);
        // Cari data tender yang dipilih dari list
        const foundTender = tenderList.find(t => t.id === tenderId);
        
        if (foundTender) {
            setSelectedTender(foundTender);
        } else {
            setSelectedTender(null);
        }
    };

    // --- 4. HANDLE GENERATE PDF (BLOB) ---
    const handleGeneratePdf = async () => {
        if (!selectedTender) {
            alert("Silakan pilih tender terlebih dahulu!");
            return;
        }

        setIsGenerating(true);

        try {
            // Kita request ke endpoint generate-pdf milik Laravel
            const response = await axios.get(`/api/tender/${selectedTender.id}/generate-pdf`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params:{template},
                // PENTING: responseType wajib 'blob' untuk menangani file binary/stream
                responseType: 'blob' 
            });

            // Membuat URL Blob sementara dari response data
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            // Membuat elemen link (<a>) virtual untuk men-trigger download
            const link = document.createElement('a');
            link.href = url;
            // Nama file saat di-download user
            link.setAttribute('download', `Dokumen_MDP_${selectedTender.nama_tender}.pdf`); 
            document.body.appendChild(link);
            link.click();

            // Bersihkan DOM dari link virtual
            link.remove();
            window.URL.revokeObjectURL(url);
            
            alert("PDF Berhasil digenerate dan didownload!");

        } catch (error) {
            console.error("Error generating PDF:", error);
            let pesan = "Gagal membuat dokumen PDF.";
            try {
                const json = JSON.parse(await error.response.data.text());
                pesan = `${json.message || pesan}\n${json.error || ""}`;
            } catch { /* abaikan kalau bukan JSON */ }
            alert(pesan);
        } finally {
                    setIsGenerating(false);
                }
            };

    const daftarPersonel = selectedTender?.personels ?? [];
    const daftarPengalaman = selectedTender?.pengalaman_proyeks ?? selectedTender?.pengalamanProyeks ?? [];

    return (
        <MainLayout title="Download Dokumen MDP">
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* --- HEADER & TOMBOL GENERATE --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Generate Dokumen MDP</h1>
                    <p className="text-sm text-slate-500 mt-1">Pilih data pendukung untuk dibuatkan otomatis dokumen penawaran PDF</p>
                </div>
                <button
                    disabled={!selectedTender || isGenerating}
                    onClick={handleGeneratePdf}
                    className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition disabled:bg-slate-300 cursor-pointer flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <span>Sedang Memproses...</span>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>Generate & Download PDF</span>
                        </>
                    )}
                </button>
            </div>

            {/* --- STEP 1: PILIH TENDER & PERUSAHAAN --- */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">1</span>
                    <h2 className="text-lg font-bold text-slate-800">Tender & Perusahaan</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                            Pilih Paket Tender <span className="text-rose-500">*</span>
                        </label>
                        <select
                            onChange={handleTenderChange}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-700 bg-white"
                        >
                            <option value="">-- Pilih Tender --</option>
                            {tenderList.map((tender) => (
                                <option key={tender.id} value={tender.id}>
                                    {tender.nama_tender} ({tender.instansi})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                            Perusahaan Penawar (Otomatis)
                        </label>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                Template Dokumen
                            </label>
                            <select
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-700 bg-white"
                            >
                                {TEMPLATES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1.5">
                                {TEMPLATES.find((t) => t.value === template)?.desc}
                            </p>
                        </div>
                        <div className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-semibold">
                            {selectedTender && selectedTender.perusahaan 
                                ? selectedTender.perusahaan.nama_perusahaan 
                                : "Pilih tender untuk melihat perusahaan"}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- STEP 2: LIST PERSONEL KUNCI --- */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">2</span>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Personel Kunci Terdaftar</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Personel yang terhubung dengan tender ini dan akan dicetak</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {!selectedTender ? (
                        <p className="text-sm text-slate-400 italic">Pilih tender terlebih dahulu...</p>
                    ) : daftarPersonel.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Tidak ada data personel untuk tender ini.</p>
                    ) : (
                        daftarPersonel.map((personel) => (
                            <div key={personel.id} className="flex items-start gap-4 p-4 border border-blue-500 bg-blue-50/30 rounded-xl transition">
                                <input
                                    type="checkbox"
                                    checked
                                    readOnly
                                    className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 cursor-not-allowed opacity-70"
                                />
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{personel.nama_personel}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">{personel.jabatan}</span>
                                        <span className="text-xs text-slate-500">{personel.pendidikan}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- STEP 3: LIST PENGALAMAN PROYEK --- */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">3</span>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Pengalaman Proyek Terdaftar</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Daftar pengalaman proyek yang terhubung dengan tender ini</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {!selectedTender ? (
                        <p className="text-sm text-slate-400 italic">Pilih tender terlebih dahulu...</p>
                    ) : daftarPengalaman.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Tidak ada data pengalaman proyek untuk tender ini.</p>
                    ) : (
                        daftarPengalaman.map((pengalaman) => (
                            <div key={pengalaman.id} className="flex items-start gap-4 p-4 border border-blue-500 bg-blue-50/30 rounded-xl transition">
                                <input
                                    type="checkbox"
                                    checked
                                    readOnly
                                    className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 cursor-not-allowed opacity-70"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800 leading-tight">{pengalaman.nama_proyek}</p>
                                    <div className="mt-2 text-xs text-slate-600 flex flex-col gap-1">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                            {pengalaman.pemberi_kerja}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                            Tahun: {pengalaman.tahun_pelaksanaan}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            {/* CSS Tambahan untuk Scrollbar */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9; 
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1; 
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8; 
                }
            `}} />
        </div>
        </MainLayout>
    );
}