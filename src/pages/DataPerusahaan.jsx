import React, { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../components/MainLayout";

export default function DataPerusahaan() {
    // --- STATE MANAGEMENT ---
    const [perusahaanList, setPerusahaanList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("tambah");
    const [selectedId, setSelectedId] = useState(null);

    const initialFormState = {
        nama_perusahaan: "",
        alamat: "",
        npwp: "",
        nib: "",
        nama_direktur: "",
        jabatan_direktur: "",
        nomor_telepon: "",
        email: ""
    };
    const [formData, setFormData] = useState(initialFormState);

    // Helper untuk mengambil config Header Bearer Token
    const getAuthHeader = () => {
        const token = localStorage.getItem("token"); // Pastikan 'token' sesuai dengan key di localStorage pas kamu login
        return {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        };
    };

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:8000/api/perusahaan/index", getAuthHeader());
            setPerusahaanList(response.data.data);
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- HANDLERS ---
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
            nama_perusahaan: data.nama_perusahaan,
            alamat: data.alamat,
            npwp: data.npwp,
            nib: data.nib,
            nama_direktur: data.nama_direktur,
            jabatan_direktur: data.jabatan_direktur,
            nomor_telepon: data.nomor_telepon,
            email: data.email
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
                await axios.post("http://localhost:8000/api/perusahaan/store", formData, getAuthHeader());
            } else {
                await axios.put(`http://localhost:8000/api/perusahaan/update/${selectedId}`, formData, getAuthHeader());
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Gagal menyimpan data:", error.response?.data || error);
            alert(error.response?.data?.message || "Gagal menyimpan data.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Yakin ingin menghapus data perusahaan ini?")) {
            try {
                await axios.delete(`http://localhost:8000/api/perusahaan/destroy/${id}`, getAuthHeader());
                fetchData();
            } catch (error) {
                console.error("Gagal menghapus data:", error);
            }
        }
    };

    // --- RENDER UI ---
    return (
        <MainLayout title="Data Perusahaan">
            {/* --- HEADER & TOMBOL TAMBAH --- */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-slate-800">Daftar Perusahaan</h1>
                <button 
                    onClick={handleOpenAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition"
                >
                    + Tambah Data
                </button>
            </div>

            {/* --- TABEL DATA --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
                            <th className="p-4">No</th>
                            <th className="p-4">Nama Perusahaan</th>
                            <th className="p-4">NPWP / NIB</th>
                            <th className="p-4">Direktur</th>
                            <th className="p-4">Kontak</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="p-6 text-center text-slate-400">Memuat data...</td>
                            </tr>
                        ) : perusahaanList.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-6 text-center text-slate-400">Belum ada data perusahaan.</td>
                            </tr>
                        ) : (
                            perusahaanList.map((item, index) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                    <td className="p-4 text-slate-500">{index + 1}</td>
                                    <td className="p-4 font-semibold text-slate-800">
                                        {item.nama_perusahaan}
                                        <div className="text-xs font-normal text-slate-400 mt-1">{item.alamat}</div>
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">
                                        <div><span className="font-medium">NPWP:</span> {item.npwp}</div>
                                        <div><span className="font-medium">NIB:</span> {item.nib}</div>
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">
                                        <div>{item.nama_direktur}</div>
                                        <div className="text-xs text-slate-400">{item.jabatan_direktur}</div>
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">
                                        <div>{item.nomor_telepon}</div>
                                        <div className="text-xs text-slate-400">{item.email}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleOpenEdit(item)}
                                                className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1 rounded-md text-sm font-semibold transition"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-semibold transition"
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

            {/* --- MODAL / POP-UP FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4">
                            {modalMode === "tambah" ? "Tambah Data Perusahaan" : "Edit Data Perusahaan"}
                        </h2>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-slate-700 font-medium mb-2">Nama Perusahaan</label>
                                <input 
                                    type="text" 
                                    name="nama_perusahaan" 
                                    placeholder="Contoh: PT Solusi Digital Nusantara"
                                    value={formData.nama_perusahaan}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-medium mb-2">NPWP</label>
                                <input 
                                    type="text" 
                                    name="npwp"
                                    placeholder="Contoh: 01.234.567.8-901.000"
                                    value={formData.npwp}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-medium mb-2">NIB</label>
                                <input 
                                    type="text" 
                                    name="nib"
                                    placeholder="Contoh: 1234567890123"
                                    value={formData.nib}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-medium mb-2">Nama Direktur</label>
                                <input 
                                    type="text" 
                                    name="nama_direktur"
                                    placeholder="Contoh: Budi Santoso"
                                    value={formData.nama_direktur}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-medium mb-2">Jabatan Direktur</label>
                                <input 
                                    type="text" 
                                    name="jabatan_direktur"
                                    placeholder="Contoh: Direktur Utama"
                                    value={formData.jabatan_direktur}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-medium mb-2">No. Telepon</label>
                                <input 
                                    type="text" 
                                    name="nomor_telepon"
                                    placeholder="Contoh: 081234567890"
                                    value={formData.nomor_telepon}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-medium mb-2">Email</label>
                                <input 
                                    type="email" 
                                    name="email"
                                    placeholder="Contoh: kontak@perusahaan.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-slate-700 font-medium mb-2">Alamat Lengkap</label>
                                <textarea 
                                    name="alamat"
                                    value={formData.alamat}
                                    placeholder="Contoh: Jl. Jend. Sudirman No. 45, RT 01/RW 02, Jakarta Selatan, DKI Jakarta 12190"
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    rows="3"
                                    required
                                ></textarea>
                            </div>
                            
                            <div className="flex gap-4 md:col-span-2 mt-4 pt-4 border-t">
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition">
                                    Simpan Data
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-lg font-bold transition"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}