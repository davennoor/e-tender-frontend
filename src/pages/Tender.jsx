import { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../components/MainLayout";

// Ambil id user yang sedang login.
// Syarat: saat login, simpan user ke localStorage:
//   localStorage.setItem("user", JSON.stringify(res.data.user));
// Kalau belum tersimpan, otomatis pakai 1 (nilai lama).
const getUserId = () => {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        return user?.id ?? 1;
    } catch {
        return 1;
    }
};

// Laravel hanya menerima "draft" atau "generated" (huruf kecil).
// Nilai apa pun di luar itu (misal "Draft", "Selesai", kosong) diubah jadi nilai yang valid.
const normalStatus = (s) => {
    const v = String(s ?? "").trim().toLowerCase();
    return ["draft", "generated"].includes(v) ? v : "draft";
};

export default function Tender() {
    // --- 1. STATE MANAGEMENT ---
    const [tenderList, setTenderList] = useState([]);
    const [perusahaanList, setPerusahaanList] = useState([]); // Untuk dropdown perusahaan
    const [personelList, setPersonelList] = useState([]); // Semua personel (difilter per perusahaan)
    const [pengalamanList, setPengalamanList] = useState([]); // Semua pengalaman proyek
    const [selectedPersonels, setSelectedPersonels] = useState([]); // id personel yang dicentang
    const [selectedPengalaman, setSelectedPengalaman] = useState([]); // id pengalaman yang dicentang

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("tambah"); // 'tambah' atau 'edit'
    const [selectedId, setSelectedId] = useState(null);

    // Initial state disesuaikan dengan validasi Controller Laravel
    const initialFormState = {
        perusahaan_id: "",
        nama_tender: "",
        instansi: "",
        nilai_penawaran: "",
        lokasi_pekerjaan: "",
        kota_pengadaan: "",
        tanggal_tender: "",
        tahun_anggaran: "",
        durasi: "",
        status_generate: "draft", // HARUS huruf kecil, sesuai validasi in:draft,generated
        file_mdp: "-", // Default karena wajib di validasi backend tapi tidak ada di UI
        user_id: getUserId(), // id user yang login
    };

    const [formData, setFormData] = useState(initialFormState);

    // Axios dengan token
    const token = localStorage.getItem("token");
    const api = axios.create({
        baseURL: "/api",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });

    // --- 2. FETCH DATA DARI API ---
    const fetchTenders = async () => {
        try {
            const response = await api.get("/tender/index");
            setTenderList(response.data.data ?? response.data);
        } catch (error) {
            console.error("Gagal mengambil data tender:", error.response?.data || error);
        }
    };

    const fetchPerusahaan = async () => {
        try {
            const response = await api.get("/perusahaan/index");
            setPerusahaanList(response.data.data ?? response.data);
        } catch (error) {
            console.error("Gagal mengambil data perusahaan:", error.response?.data || error);
        }
    };

    const fetchPersonel = async () => {
        try {
            const response = await api.get("/personel/index");
            setPersonelList(response.data.data ?? response.data);
        } catch (error) {
            console.error("Gagal mengambil data personel:", error.response?.data || error);
        }
    };

    const fetchPengalaman = async () => {
        try {
            const response = await api.get("/pengalamanproyek/index");
            setPengalamanList(response.data.data ?? response.data);
        } catch (error) {
            console.error("Gagal mengambil data pengalaman proyek:", error.response?.data || error);
        }
    };

    useEffect(() => {
        fetchTenders();
        fetchPerusahaan();
        fetchPersonel();
        fetchPengalaman();
    }, []);

    // --- 3. HANDLE PERUBAHAN INPUT ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Ganti perusahaan = daftar personel berubah, jadi centangan lama dikosongkan
        if (name === "perusahaan_id") setSelectedPersonels([]);
    };

    // Centang / hapus centang sebuah id dari daftar
    const toggleId = (list, setList, id) => {
        setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    };

    // Personel yang tampil hanya milik perusahaan yang dipilih
    const personelPerusahaan = personelList.filter(
        (p) => String(p.perusahaan_id) === String(formData.perusahaan_id)
    );

    // --- 4. HANDLE BUKA TUTUP MODAL ---
    const openAddModal = () => {
        setSelectedPersonels([]);
        setSelectedPengalaman([]);
        setFormData(initialFormState);
        setModalMode("tambah");
        setIsModalOpen(true);
    };

    const openEditModal = (tender) => {
        setFormData({
            perusahaan_id: tender.perusahaan_id,
            nama_tender: tender.nama_tender,
            instansi: tender.instansi,
            nilai_penawaran: tender.nilai_penawaran,
            lokasi_pekerjaan: tender.lokasi_pekerjaan,
            kota_pengadaan: tender.kota_pengadaan,
            // potong jam supaya cocok dengan input type="date" (yyyy-mm-dd)
            tanggal_tender: tender.tanggal_tender ? String(tender.tanggal_tender).split("T")[0] : "",
            tahun_anggaran: tender.tahun_anggaran,
            durasi: tender.durasi,
            status_generate: normalStatus(tender.status_generate),
            file_mdp: tender.file_mdp,
            user_id: tender.user_id,
        });
        // Laravel mengirim relasi dengan nama snake_case (pengalaman_proyeks)
        setSelectedPersonels((tender.personels ?? []).map((p) => p.id));
        setSelectedPengalaman(
            (tender.pengalaman_proyeks ?? tender.pengalamanProyeks ?? []).map((p) => p.id)
        );
        setSelectedId(tender.id);
        setModalMode("edit");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setSelectedPersonels([]);
        setSelectedPengalaman([]);
        setSelectedId(null);
    };

    // --- 5. SUBMIT DATA (CREATE / UPDATE) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Pastikan status_generate yang terkirim selalu "draft" atau "generated"
        const payload = {
            ...formData,
            status_generate: normalStatus(formData.status_generate),
            personels: selectedPersonels, // nama key sesuai yang dibaca controller
            pengalamanProyeks: selectedPengalaman,
        };

        try {
            if (modalMode === "tambah") {
                await api.post("/tender/store", payload);
                alert("Data berhasil ditambahkan!");
            } else {
                await api.put(`/tender/update/${selectedId}`, payload);
                alert("Data berhasil diupdate!");
            }
            closeModal();
            fetchTenders(); // Refresh data table
        } catch (error) {
            const res = error.response?.data;
            console.error("Error submitting form:", res || error.message);

            // Tampilkan alasan asli dari Laravel (field mana yang salah)
            let pesan = res?.message || "Terjadi kesalahan!";
            if (res?.error && typeof res.error === "object") {
                pesan += "\n\n" + Object.values(res.error).flat().join("\n");
            } else if (res?.error) {
                pesan += "\n\n" + res.error;
            }
            alert(pesan);
        }
    };

    // --- 6. HAPUS DATA ---
    const handleDelete = async (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            try {
                await api.delete(`/tender/destroy/${id}`);
                alert("Data berhasil dihapus!");
                fetchTenders(); // Refresh table
            } catch (error) {
                console.error("Gagal menghapus:", error.response?.data || error);
                alert(error.response?.data?.message || "Gagal menghapus data.");
            }
        }
    };

    // --- 7. FORMAT MATA UANG ---
    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number);
    };

    return (
        <MainLayout title="Data Tender / Penawaran">
            {/* --- HEADER & TOMBOL TAMBAH --- */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Daftar Tender</h2>
                        <p className="text-sm text-slate-500">Kelola data tender dan pembuatan dokumen penawaran</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-sm flex items-center gap-2"
                    >
                        <span>+</span> Tambah Tender
                    </button>
                </div>

                {/* --- TABEL DATA --- */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4 rounded-l-lg">No</th>
                                <th className="p-4">Nama Perusahaan</th>
                                <th className="p-4">Nama Tender</th>
                                <th className="p-4">Instansi & Lokasi</th>
                                <th className="p-4">Nilai Penawaran</th>
                                <th className="p-4">Tahun / Durasi</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 rounded-r-lg text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {tenderList.length > 0 ? (
                                tenderList.map((tender, index) => (
                                    <tr key={tender.id} className="hover:bg-slate-50/80 transition">
                                        <td className="p-4 font-medium text-slate-500">{index + 1}</td>
                                        <td className="p-4 font-semibold text-slate-700">
                                            {tender.perusahaan?.nama_perusahaan || "N/A"}
                                        </td>
                                        <td className="p-4 font-bold text-slate-800">{tender.nama_tender}</td>
                                        <td className="p-4 text-slate-600 text-sm">
                                            <div>{tender.instansi}</div>
                                            <div className="text-xs text-slate-400">
                                                {tender.kota_pengadaan}, {tender.lokasi_pekerjaan}
                                            </div>
                                        </td>
                                        <td className="p-4 text-emerald-600 font-semibold">
                                            {formatRupiah(tender.nilai_penawaran)}
                                        </td>
                                        <td className="p-4 text-slate-600 text-sm">
                                            <div>{tender.tahun_anggaran}</div>
                                            <div className="text-xs text-slate-400">{tender.durasi} Hari Kalender</div>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                                                    tender.status_generate === "Selesai" || tender.status_generate === "generated"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-amber-50 text-amber-700"
                                                }`}
                                            >
                                                {tender.status_generate}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(tender)}
                                                    className="px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-bold transition"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tender.id)}
                                                    className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-slate-400">
                                        Belum ada data tender. Klik tombol <b>+ Tambah Tender</b> untuk menambahkan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL TAMBAH / EDIT --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8">
                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {modalMode === "tambah" ? "Tambah Data Tender" : "Edit Data Tender"}
                                </h2>
                                <p className="text-sm text-slate-500">Isi seluruh informasi tender penawaran dengan benar</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-red-500 transition text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Body Modal (Form) */}
                        <div className="p-6 sm:p-8">
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Perusahaan Select */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Perusahaan <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="perusahaan_id"
                                            value={formData.perusahaan_id}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800 bg-white"
                                        >
                                            <option value="">-- Pilih Perusahaan --</option>
                                            {perusahaanList.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nama_perusahaan}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Nama Tender */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Nama Tender / Pekerjaan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="nama_tender"
                                            value={formData.nama_tender}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: Pengadaan Sistem Informasi E-Office"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Instansi */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Instansi / Pemberi Kerja <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="instansi"
                                            value={formData.instansi}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: Dinas Komunikasi dan Informatika"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Nilai Penawaran */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Nilai Penawaran (Rp) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="nilai_penawaran"
                                            value={formData.nilai_penawaran}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: 150000000"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Lokasi Pekerjaan */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Lokasi Pekerjaan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="lokasi_pekerjaan"
                                            value={formData.lokasi_pekerjaan}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: Provinsi DKI Jakarta"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Kota Pengadaan */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Kota Pengadaan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="kota_pengadaan"
                                            value={formData.kota_pengadaan}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: Jakarta Selatan"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Tanggal Tender */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Tanggal Tender <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="tanggal_tender"
                                            value={formData.tanggal_tender}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Tahun Anggaran */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Tahun Anggaran <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            maxLength="4"
                                            name="tahun_anggaran"
                                            value={formData.tahun_anggaran}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="2026"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Durasi */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Durasi Pekerjaan (Hari) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="durasi"
                                            value={formData.durasi}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Contoh: 90"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800"
                                        />
                                    </div>

                                    {/* Status Generate */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                            Status Generate Dokumen
                                        </label>
                                        <select
                                            name="status_generate"
                                            value={formData.status_generate}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-sm text-slate-800 bg-white"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="generated">Generated</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Pilih Personel Kunci (sesuai perusahaan terpilih) */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                        Personel Kunci (sesuai perusahaan terpilih)
                                    </label>
                                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
                                        {!formData.perusahaan_id ? (
                                            <p className="text-sm text-slate-400 italic">Pilih perusahaan dulu...</p>
                                        ) : personelPerusahaan.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic">Belum ada personel untuk perusahaan ini.</p>
                                        ) : (
                                            personelPerusahaan.map((p) => (
                                                <label key={p.id} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPersonels.includes(p.id)}
                                                        onChange={() => toggleId(selectedPersonels, setSelectedPersonels, p.id)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span><b>{p.nama_personel}</b> — {p.jabatan}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Pilih Pengalaman Proyek */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                                        Pengalaman Proyek
                                    </label>
                                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
                                        {pengalamanList.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic">Belum ada data pengalaman proyek.</p>
                                        ) : (
                                            pengalamanList.map((p) => (
                                                <label key={p.id} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPengalaman.includes(p.id)}
                                                        onChange={() => toggleId(selectedPengalaman, setSelectedPengalaman, p.id)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span><b>{p.nama_proyek}</b> — {p.pemberi_kerja} ({p.tahun_pelaksanaan})</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Footer Modal / Aksi Form */}
                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-sm transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-bold text-sm transition shadow-sm"
                                    >
                                        {modalMode === "tambah" ? "Simpan Tender" : "Update Tender"}
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