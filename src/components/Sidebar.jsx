import { Link, useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom";
import axios from "axios";


export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
    if (!window.confirm("Yakin ingin keluar?")) return;

    try {
        // Cabut token di server (route /logout memang dilindungi auth:sanctum)
        await axios.post(
            "/api/logout",
            {},
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    Accept: "application/json",
                },
            }
        );
    } catch (error) {
        // Kalau server gagal (misal token sudah kedaluwarsa), tetap lanjut keluar
        console.error("Logout di server gagal:", error.response?.data || error.message);
    } finally {
        // Selalu bersihkan data login di browser lalu kembali ke halaman login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    }
};

    const hover = (path) =>{
        location.pathname === path;
        return;
    }
    return(
        <>
        <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 space-y-2">
        <div className="px-4 py-3 font-bold text-white text-lg border-b border-slate-800 mb-4">
            E-Tender App
        </div>

        <nav className="space-y-1">
            {/* Warna setelah : -> 'hover:bg-slate-800' */}
            <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${hover("/dashboard")? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
            📊 Dashboard
            </Link>

            {/* Warna setelah : -> 'hover:bg-slate-800' */}
            <Link
            to="/dataperusahaan"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${hover("/dataperusahaan")? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
            🏢 Data Perusahaan
            </Link>

            {/* Warna setelah : -> 'hover:bg-slate-800' */}
            <Link
            to="/datapersonel"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${hover("/datapersonel")? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
            👨‍💼 Data Personel
            </Link>

            {/* Warna setelah : -> 'hover:bg-slate-800' */}
            <Link
            to="/pengalamanproyek"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${hover("/pengalamanproyek")? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
            💼 Pengalaman
            </Link>

            {/* Warna setelah : -> 'hover:bg-slate-800' */}
            <Link
            to="/tender"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${hover("/tender")? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
            📂 Data Tender
            </Link>

            {/* Warna setelah : -> 'hover:bg-slate-800' */}
            <Link
            to="/dokumenpendukung"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${hover("/dokumenpendukung")?'bg-blue-600 text-white' :'hover:bg-slate-800' }`}
            >
            📁 Dokumen Pendukung
            </Link>

            {/* Menu Generate MDP */}
            {/* Warna setelah : -> 'hover:bg-slate-800 text-emerald-400' */}
            <Link
            to="/generatemdp"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${hover("/generatemdp")?'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-900/40':'hover:bg-slate-800 text-emerald-400'}`}
            >
            📄 Generate Dokumen MDP
            </Link>
            <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 mt-4 border-t border-slate-800 text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
            >Logout</button>
        </nav>
        </aside>  
        </>
    )
}