import React, { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../components/MainLayout";

// ============================================================
// KONFIGURASI API (sederhana, cukup di file ini saja)
// ============================================================
const API_URL = "http://127.0.0.1:8000/api/pengalamanproyek";

// Ambil token dari localStorage lalu tempel ke header setiap request.
// PENTING: key "token" harus sama dengan yang kamu simpan saat login.
const getConfig = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json",
    },
});

export default function PengalamanProyek() {
    // --- 1. STATE ---
    const [pengalamanList, setPengalamanList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("tambah");
    const [selectedId, setSelectedId] = useState(null);

    const initialFormState = {
        nama_proyek: "",
        pemberi_kerja: "",
        tahun_pelaksanaan: "",
        nilai_kontrak: "",
        lokasi_proyek: "",
        status_proyek: "Progres",
    };
    const [formData, setFormData] = useState(initialFormState);

    // --- 2. FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/index`, getConfig());
            // Aman untuk response berbentuk [...] maupun { data: [...] }
            setPengalamanList(response.data.data ?? response.data);
        } catch (error) {
            console.error("Gagal mengambil data:", error.response?.data || error);
            if (error.response?.status === 401) {
                alert("Sesi habis atau belum login. Silakan login dulu.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- 3. HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleOpenAdd = () => {
        setModalMode("tambah");
        setFormData(initialFormState);
        setSelectedId(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (data) => {
        setModalMode("edit");
        setSelectedId(data.id);
        setFormData({
            nama_proyek: data.nama_proyek,
            pemberi_kerja: data.pemberi_kerja,
            tahun_pelaksanaan: data.tahun_pelaksanaan,
            nilai_kontrak: data.nilai_kontrak,
            lokasi_proyek: data.lokasi_proyek,
            status_proyek: data.status_proyek,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormState);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === "tambah") {
                await axios.post(`${API_URL}/store`, formData, getConfig());
            } else {
                await axios.put(`${API_URL}/update/${selectedId}`, formData, getConfig());
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Gagal menyimpan data:", error.response?.data || error);
            alert(error.response?.data?.message || "Gagal menyimpan data.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Yakin ingin menghapus data pengalaman proyek ini?")) {
            try {
                await axios.delete(`${API_URL}/destroy/${id}`, getConfig());
                fetchData();
            } catch (error) {
                console.error("Gagal menghapus data:", error.response?.data || error);
                alert(error.response?.data?.message || "Gagal menghapus data.");
            }
        }
    };

    // Format mata uang Rupiah
    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);
    };

    // --- 4. RENDER UI ---
    return (
        <MainLayout title="Data Pengalaman Proyek">
            {/* --- HEADER & TOMBOL TAMBAH --- */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Daftar Pengalaman Proyek</h2>
                        <p className="text-sm text-slate-500">Kelola portofolio pekerjaan dan proyek</p>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-sm flex items-center gap-2"
                    >
                        <span>+</span> Tambah Pengalaman
                    </button>
                </div>

                {/* --- TABEL DATA --- */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4 rounded-l-lg">No</th>
                                <th className="p-4">Nama Proyek</th>
                                <th className="p-4">Pemberi Kerja</th>
                                <th className="p-4">Lokasi</th>
                                <th className="p-4">Nilai Kontrak</th>
                                <th className="p-4">Tahun</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 rounded-r-lg text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-6 text-center text-slate-400">
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : pengalamanList.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-6 text-center text-slate-400">
                                        Belum ada data pengalaman proyek. Klik tombol{" "}
                                        <strong>+ Tambah Pengalaman</strong> untuk menambahkan.
                                    </td>
                                </tr>
                            ) : (
                                pengalamanList.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                        <td className="p-4 font-medium text-slate-500">{index + 1}</td>
                                        <td className="p-4 font-bold text-slate-800">{item.nama_proyek}</td>
                                        <td className="p-4 text-slate-600">{item.pemberi_kerja}</td>
                                        <td className="p-4 text-slate-600">{item.lokasi_proyek}</td>
                                        <td className="p-4 text-emerald-600 font-semibold">
                                            {formatRupiah(item.nilai_kontrak)}
                                        </td>
                                        <td className="p-4 text-slate-600">{item.tahun_pelaksanaan}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                                                    item.status_proyek === "Selesai"
                                                        ? "bg-blue-50 text-blue-700"
                                                        : "bg-amber-50 text-amber-700"
                                                }`}
                                            >
                                                {item.status_proyek}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-bold transition"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL TAMBAH / EDIT --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {modalMode === "tambah" ? "Tambah Pengalaman Proyek" : "Edit Pengalaman Proyek"}
                                </h2>
                                <p className="text-sm text-slate-500">Lengkapi data portofolio pekerjaan dengan benar</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-red-500 transition text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Body Modal (Form) */}
                        <div className="p-6 sm:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Nama Proyek */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Nama Proyek <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="nama_proyek"
                                            value={formData.nama_proyek}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: Pembangunan Gedung Perkantoran"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Pemberi Kerja / Klien */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Pemberi Kerja / Klien <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="pemberi_kerja"
                                            value={formData.pemberi_kerja}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: Dinas Pekerjaan Umum"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Lokasi Proyek */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Lokasi Proyek <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="lokasi_proyek"
                                            value={formData.lokasi_proyek}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: Jakarta Pusat"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Nilai Kontrak */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Nilai Kontrak (Rp) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="nilai_kontrak"
                                            value={formData.nilai_kontrak}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            placeholder="Contoh: 5000000000"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Tahun Pelaksanaan */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Tahun Pelaksanaan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="tahun_pelaksanaan"
                                            value={formData.tahun_pelaksanaan}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: 2025"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Status Proyek */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Status Proyek <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="status_proyek"
                                            value={formData.status_proyek}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800 bg-white"
                                        >
                                            <option value="Selesai">Selesai</option>
                                            <option value="Progres">Progres / Berjalan</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Footer Modal / Aksi Form */}
                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-5 py-2.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-sm transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-bold text-sm transition shadow-sm"
                                    >
                                        Simpan Pengalaman
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}