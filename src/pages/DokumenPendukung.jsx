import React, { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../components/MainLayout";

// ============================================================
// KONFIGURASI API (sederhana, cukup di file ini saja)
// ============================================================
const API_URL = "http://127.0.0.1:8000/api/dokumenpendukung";

// Ambil token dari localStorage lalu tempel ke header setiap request.
// PENTING: key "token" harus sama dengan yang kamu simpan saat login.
const getConfig = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json",
    },
});

// Nama file diselipkan ke dalam data URL saat upload:
//   data:<mime>;name=<nama-file>;base64,<isi>
// Fungsi ini membaca nama itu lagi. Data lama (tanpa nama) tampil "Lihat File".
const getNamaFile = (dataUrl) => {
    const match = /;name=([^;,]+)[;,]/.exec(dataUrl || "");
    return match ? decodeURIComponent(match[1]) : "Lihat File";
};

// Buka file lewat Blob, karena Chrome memblokir link data: langsung di tab baru.
const bukaFile = (dataUrl) => {
    try {
        const [header, base64] = dataUrl.split(",");
        const mime = /data:([^;,]+)/.exec(header)?.[1] || "application/octet-stream";
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
        window.open(url, "_blank");
    } catch {
        alert("File tidak bisa dibuka.");
    }
};

export default function DokumenPendukung() {
    // --- 1. STATE MANAGEMENT ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('tambah');
    const [selectedId, setSelectedId] = useState(null);

    const [dokumenList, setDokumenList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Daftar perusahaan untuk dropdown (diambil dari API)
    const [perusahaanList, setPerusahaanList] = useState([]);
    const [perusahaanId, setPerusahaanId] = useState("");

    const [searchTerm, setSearchTerm] = useState('');
    const [filterJenis, setFilterJenis] = useState('');

    const initialFormState = {
        nama_dokumen: '',
        jenis_dokumen: '',
        tanggal_upload: '',
        status_dokumen: 'aktif', // disamakan dengan value <option> di bawah
        file_dokumen: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // --- 2. FUNGSI FETCH DATA ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/index`, getConfig());
            // Aman untuk response berbentuk [...] maupun { data: [...] }
            setDokumenList(response.data.data ?? response.data);
        } catch (error) {
            console.error("Error fetching data:", error.response?.data || error);
            if (error.response?.status === 401) {
                alert("Sesi habis atau belum login. Silakan login dulu.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Ambil daftar perusahaan dari API untuk dropdown
    const fetchPerusahaan = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/perusahaan/index", getConfig());
            setPerusahaanList(response.data.data ?? response.data);
        } catch (error) {
            console.error("Gagal mengambil data perusahaan:", error.response?.data || error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchPerusahaan();
    }, []);

    // --- 3. FUNGSI HANDLE FORM ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // selipkan nama file: data:<mime>;name=<nama>;base64,<isi>
                const denganNama = reader.result.replace(
                    ";base64,",
                    `;name=${encodeURIComponent(file.name)};base64,`
                );
                setFormData(prev => ({ ...prev, file_dokumen: denganNama }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'tambah') {
                await axios.post(`${API_URL}/store`, formData, getConfig());
            } else {
                await axios.put(`${API_URL}/update/${selectedId}`, formData, getConfig());
            }
            fetchData();
            setIsModalOpen(false);
            setFormData(initialFormState);
        } catch (error) {
            console.error("Error submit:", error.response?.data || error);
            // Tampilkan pesan asli dari Laravel supaya mudah dilacak
            alert(error.response?.data?.message || "Gagal menyimpan data. Cek console log.");
        }
    };

    // --- 4. FUNGSI AKSI (HAPUS & BUKA MODAL) ---
    const handleDelete = async (id) => {
        if (window.confirm("Yakin ingin menghapus data ini?")) {
            try {
                await axios.delete(`${API_URL}/destroy/${id}`, getConfig());
                fetchData();
            } catch (error) {
                console.error("Error delete:", error.response?.data || error);
                alert(error.response?.data?.message || "Gagal menghapus data.");
            }
        }
    };

    const openTambahModal = () => {
        setModalMode('tambah');
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const openEditModal = (dokumen) => {
        setModalMode('edit');
        setSelectedId(dokumen.id);
        // Format tanggal agar cocok dengan input type="date"
        const formattedDate = dokumen.tanggal_upload ? dokumen.tanggal_upload.split('T')[0] : '';

        setFormData({
            nama_dokumen: dokumen.nama_dokumen,
            jenis_dokumen: dokumen.jenis_dokumen,
            tanggal_upload: formattedDate,
            status_dokumen: dokumen.status_dokumen,
            file_dokumen: dokumen.file_dokumen
        });
        setIsModalOpen(true);
    };

    // --- 5. FILTER DATA TABLE ---
    const filteredData = (dokumenList || []).filter((item) => {
        const matchSearch = item.nama_dokumen.toLowerCase().includes(searchTerm.toLowerCase());
        const matchJenis = filterJenis === '' || item.jenis_dokumen === filterJenis;
        return matchSearch && matchJenis;
    });

    return (
        <MainLayout title="Kelola Dokumen Pendukung">
            <div className="space-y-6">

                {/* --- HEADER & TOMBOL TAMBAH --- */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Dokumen Pendukung</h2>
                        <p className="text-sm text-slate-500">Kelola dan pantau seluruh dokumen legalitas dan berkas pendukung tender</p>
                    </div>
                    <button
                        onClick={openTambahModal}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-sm gap-2"
                    >
                        <span>+</span> Tambah Dokumen
                    </button>
                </div>

                {/* --- FILTER & PENCARIAN --- */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Cari berdasarkan nama dokumen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            value={filterJenis}
                            onChange={(e) => setFilterJenis(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-slate-700 bg-white"
                        >
                            <option value="">Semua Jenis Dokumen</option>
                            <option value="NIB">NIB</option>
                            <option value="NPWP">NPWP</option>
                            <option value="Akta Perusahaan">Akta Perusahaan</option>
                            <option value="Sertifikat">Sertifikat / SBU</option>
                            <option value="Izin Usaha">Izin Usaha</option>
                            <option value="Lainnya">Dokumen Lainnya</option>
                        </select>
                    </div>
                </div>

                {/* --- TABEL DATA --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs uppercase font-bold tracking-wider">
                                    <th className="py-4 px-6">No</th>
                                    <th className="py-4 px-6">Nama Dokumen</th>
                                    <th className="py-4 px-6">Jenis</th>
                                    <th className="py-4 px-6">Tgl Upload</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6">Berkas</th>
                                    <th className="py-4 px-6 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">

                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8 text-slate-500">Memuat data...</td>
                                    </tr>
                                ) : filteredData.length > 0 ? (
                                    filteredData.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                            <td className="py-4 px-6 font-medium text-slate-400">{index + 1}</td>
                                            <td className="py-4 px-6 font-semibold text-slate-800">{item.nama_dokumen}</td>
                                            <td className="py-4 px-6">
                                                <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">
                                                    {item.jenis_dokumen}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 whitespace-nowrap">{item.tanggal_upload}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${item.status_dokumen === 'Aktif' || item.status_dokumen === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {item.status_dokumen}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                {item.file_dokumen ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => bukaFile(item.file_dokumen)}
                                                        title={getNamaFile(item.file_dokumen)}
                                                        className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 underline gap-1 max-w-[180px]"
                                                    >
                                                        <span className="truncate">📎 {getNamaFile(item.file_dokumen)}</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Tidak ada file</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition">
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-12 text-slate-400">
                                            Belum ada data dokumen pendukung yang sesuai.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- MODAL TAMBAH / EDIT DOKUMEN --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">

                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {modalMode === 'tambah' ? 'Tambah Dokumen' : 'Edit Dokumen'}
                                </h2>
                                <p className="text-sm text-slate-500">Unggah berkas pendukung untuk legalitas tender</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-red-500 transition text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Body Modal (Form) */}
                        <div className="p-6 sm:p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* Pilihan Perusahaan (Opsional Visual) */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                        Pilih Perusahaan <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={perusahaanId}
                                        onChange={(e) => setPerusahaanId(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800 bg-white"
                                    >
                                        <option value="">
                                            {perusahaanList.length === 0 ? "-- Belum ada data perusahaan --" : "-- Pilih Perusahaan --"}
                                        </option>
                                        {perusahaanList.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nama_perusahaan}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Nama Dokumen */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Nama Dokumen <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="nama_dokumen"
                                            value={formData.nama_dokumen}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: Akta Pendirian"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Jenis Dokumen */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Jenis Dokumen <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="jenis_dokumen"
                                            value={formData.jenis_dokumen}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800 bg-white"
                                        >
                                            <option value="">-- Pilih Jenis --</option>
                                            <option value="NIB">NIB</option>
                                            <option value="NPWP">NPWP</option>
                                            <option value="Akta Perusahaan">Akta Perusahaan</option>
                                            <option value="Sertifikat">Sertifikat / SBU</option>
                                            <option value="Izin Usaha">Izin Usaha</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Tanggal Upload / Berlaku */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Tanggal Dokumen <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="tanggal_upload"
                                            value={formData.tanggal_upload}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Status Dokumen */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Status <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="status_dokumen"
                                            value={formData.status_dokumen}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800 bg-white"
                                        >
                                            <option value="aktif">Aktif</option>
                                            <option value="tidak_aktif">Tidak Aktif / Expired</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Unggah Berkas */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                        Upload File Berkas <span className="text-slate-400 text-[10px] normal-case">(PDF, JPG, PNG)</span>
                                    </label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        required={modalMode === 'tambah' || !formData.file_dokumen} // Wajib jika nambah baru / belum ada file
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-600 
                                        file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {modalMode === 'edit' && formData.file_dokumen && (
                                        <p className="text-xs text-slate-500 mt-2">Biarkan kosong jika tidak ingin mengubah file.</p>
                                    )}
                                </div>

                                {/* Footer Modal / Aksi Form */}
                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-sm transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-bold text-sm transition shadow-sm"
                                    >
                                        Simpan Dokumen
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* --- END MODAL --- */}
        </MainLayout>
    );
}