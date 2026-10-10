import React, { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../components/MainLayout";

export default function DataPersonel() {
    // 1. STATE MANAGEMENT
    const [personelList, setPersonelList] = useState([]);
    const [perusahaanOptions, setPerusahaanOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("tambah");
    const [selectedId, setSelectedId] = useState(null);

    const initialFormState = {
        perusahaan_id: "",
        nama_personel: "",
        jabatan: "",
        pendidikan: "",
        sertifikasi: "",
        nomor_sertifikat: "",
        pengalaman_kerja: ""
    };

    const [formData, setFormData] = useState(initialFormState);

    // Helper untuk konfigurasi Bearer Token Sanctum
    const getAuthHeader = () => {
        const token = localStorage.getItem("token");
        return {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        };
    };

    // 2. FETCH DATA FROM API
    const fetchPersonel = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:8000/api/personel/index", getAuthHeader());
            if (response.data.status === "success") {
                setPersonelList(response.data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil data personel:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch daftar perusahaan untuk pilihan dropdown di modal
    const fetchPerusahaanOptions = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/perusahaan/index", getAuthHeader());
            if (response.data.status === "success" || Array.isArray(response.data.data)) {
                setPerusahaanOptions(response.data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil data dropdown perusahaan:", error);
        }
    };

    useEffect(() => {
        fetchPersonel();
        fetchPerusahaanOptions();
    }, []);

    // 3. HANDLERS FOR MODAL & FORM
    const handleOpenAddModal = () => {
        setModalMode("tambah");
        setSelectedId(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (personel) => {
        setModalMode("edit");
        setSelectedId(personel.id);
        setFormData({
            perusahaan_id: personel.perusahaan_id || "",
            nama_personel: personel.nama_personel || "",
            jabatan: personel.jabatan || "",
            pendidikan: personel.pendidikan || "",
            sertifikasi: personel.sertifikasi || "",
            nomor_sertifikat: personel.nomor_sertifikat || "",
            pengalaman_kerja: personel.pengalaman_kerja || ""
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setSelectedId(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            pengalaman_kerja: parseInt(formData.pengalaman_kerja, 10) || 0
        };

        try {
            if (modalMode === "tambah") {
                await axios.post("http://localhost:8000/api/personel/store", payload, getAuthHeader());
            } else {
                await axios.put(`http://localhost:8000/api/personel/update/${selectedId}`, payload, getAuthHeader());
            }

            fetchPersonel();
            handleCloseModal();
        } catch (error) {
            console.error("Gagal menyimpan data:", error.response?.data || error);
            alert(error.response?.data?.message || "Gagal menyimpan data personel.");
        }
    };

    const PENDIDIKAN = [
    { value: "Tidak Tamat", label: "Tidak Tamat Sekolah" },
    { value: "SD",  label: "SD / MI" },
    { value: "SMP", label: "SMP / MTs" },
    { value: "SMA", label: "SMA / MA" },
    { value: "SMK", label: "SMK / MAK" },
    { value: "D1",  label: "Diploma I (D1)" },
    { value: "D2",  label: "Diploma II (D2)" },
    { value: "D3",  label: "Diploma III (D3)" },
    { value: "D4",  label: "Diploma IV / Sarjana Terapan (D4)" },
    { value: "S1",  label: "Sarjana (S1)" },
    { value: "S2",  label: "Magister (S2)" },
    { value: "S3",  label: "Doktor (S3)" },
];

    const handleDelete = async (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data personel ini?")) {
            try {
                await axios.delete(`http://localhost:8000/api/personel/destroy/${id}`, getAuthHeader());
                fetchPersonel();
            } catch (error) {
                console.error("Gagal menghapus data:", error);
                alert("Gagal menghapus data personel.");
            }
        }
    };

    // 4. UI RENDER
    return (
        <MainLayout title="Data Personel / Tenaga Ahli">
            {/* --- HEADER & TOMBOL TAMBAH --- */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-slate-800">Daftar Tenaga Ahli</h1>
                <button 
                    onClick={handleOpenAddModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition cursor-pointer"
                >
                    + Tambah Personel
                </button>
            </div>

            {/* --- TABEL DATA --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
                            <th className="p-4">No</th>
                            <th className="p-4">Nama Personel</th>
                            <th className="p-4">Nama Perusahaan</th>
                            <th className="p-4">Jabatan</th>
                            <th className="p-4">Pendidikan</th>
                            <th className="p-4">Pengalaman Kerja</th>
                            <th className="p-4">Sertifikasi</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="p-6 text-center text-slate-400">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : personelList.length > 0 ? (
                            personelList.map((item, index) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                    <td className="p-4 text-slate-500">{index + 1}</td>
                                    <td className="p-4 font-semibold text-slate-800">{item.nama_personel}</td>
                                    <td className="p-4 font-medium text-slate-700">
                                        {item.perusahaan?.nama_perusahaan || "-"}
                                    </td>
                                    <td className="p-4 text-slate-600">{item.jabatan}</td>
                                    <td className="p-4 text-slate-600">{item.pendidikan}</td>
                                    <td className="p-4 text-slate-600">{item.pengalaman_kerja} Tahun</td>
                                    <td className="p-4 text-slate-600 text-sm">
                                        <div>{item.sertifikasi}</div>
                                        <div className="text-xs text-slate-400">No: {item.nomor_sertifikat}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleOpenEditModal(item)}
                                                className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1 rounded-md text-sm font-semibold transition cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-semibold transition cursor-pointer"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="p-6 text-center text-slate-400">
                                    Belum ada data tenaga ahli.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL TAMBAH / EDIT --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">
                                {modalMode === "tambah" ? "Tambah Tenaga Ahli" : "Edit Tenaga Ahli"}
                            </h2>
                            <button 
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-red-500 transition text-xl font-bold leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Body Modal (Form) */}
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                <div className="md:col-span-2">
                                    <label className="block text-slate-700 font-medium mb-1 text-sm">Pilih Perusahaan</label>
                                    <select 
                                        name="perusahaan_id"
                                        value={formData.perusahaan_id}
                                        onChange={handleInputChange}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                        required
                                    >
                                        <option value="">-- Pilih Perusahaan --</option>
                                        {perusahaanOptions.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nama_perusahaan}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-slate-700 font-medium mb-1 text-sm">Nama Lengkap Personel</label>
                                    <input 
                                        type="text" 
                                        name="nama_personel"
                                        placeholder="Contoh: Ahmad Subagja, S.T."
                                        value={formData.nama_personel}
                                        onChange={handleInputChange}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-medium mb-1 text-sm">Jabatan / Posisi</label>
                                    <input 
                                        type="text" 
                                        name="jabatan"
                                        placeholder="Contoh: Senior Software Engineer"
                                        value={formData.jabatan}
                                        onChange={handleInputChange}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-medium mb-1 text-sm">Pendidikan Terakhir</label>
                                    <select
                                    name="pendidikan"
                                    value={formData.pendidikan}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white"
                                >
                                    <option value="">-- Pilih Pendidikan --</option>
                                    {PENDIDIKAN.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-medium mb-1 text-sm">Sertifikasi / Keahlian</label>
                                    <input 
                                        type="text" 
                                        name="sertifikasi"
                                        placeholder="Contoh: Ahli K3 Umum / AWS Certified"
                                        value={formData.sertifikasi}
                                        onChange={handleInputChange}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-medium mb-1 text-sm">No. Sertifikat</label>
                                    <input 
                                        type="text" 
                                        name="nomor_sertifikat"
                                        placeholder="Contoh: 123/SKK/LPJK/2024"
                                        value={formData.nomor_sertifikat}
                                        onChange={handleInputChange}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-slate-700 font-medium mb-1 text-sm">Pengalaman Kerja (Tahun)</label>
                                    <input 
                                        type="number" 
                                        name="pengalaman_kerja"
                                        placeholder="Contoh: 5"
                                        value={formData.pengalaman_kerja}
                                        onChange={handleInputChange}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Footer / Aksi Form */}
                                <div className="flex justify-end gap-3 md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                                    <button 
                                        type="button" 
                                        onClick={handleCloseModal}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2 rounded-lg font-semibold transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition shadow-sm shadow-blue-600/30 cursor-pointer"
                                    >
                                        Simpan
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