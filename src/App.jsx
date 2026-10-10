import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [form, setForm] = useState({
    email:"",
    password:""
  });
  const [loading,setLoading] = useState(false);
  const [errorMsg,setErrorMsg] = useState("");
  const [showPassword,setShowPassword] = useState(false); // false = password disembunyikan
  const navigate = useNavigate();

  // Sembunyikan notifikasi error otomatis setelah 3 detik
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(""), 3000);
    // Bersihkan timer kalau error berganti / komponen ditutup, supaya tidak bentrok
    return () => clearTimeout(timer);
  }, [errorMsg]);

  const handleChange = (e) => {
    setForm({ ...form,[e.target.name]:e.target.value })
  }

  const handleSubmit= async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try{
      const response = await axios.post('http://127.0.0.1:8000/api/login',form);
      localStorage.setItem("token",response.data.token);
      // Simpan data user (dipakai halaman Tender untuk user_id). Aman kalau tidak ada.
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      navigate("/dashboard");
    }
    catch(error){
      setErrorMsg(
        error.response
          ? "Email atau kata sandi yang Anda masukkan salah."
          : "Tidak dapat terhubung ke server. Pastikan backend sudah berjalan."
      );
    }
    finally{
      setLoading(false);
      setForm({email:"",password:""})
    }
  }

  return (
    <>
    <div className="min-h-screen w-full flex font-sans bg-white">
      {/* Sisi Kiri - Branding & Informasi Sistem */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 p-12 flex-col justify-between border-r border-slate-200">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10   flex items-center justify-center text-white font-bold text-xl  shadow-blue-500/20">
            <img src='/img/davenn.png' />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            E-Tender App
          </span>
        </div>

        {/* Teks Utama Kiri */}
        <div className="max-w-xl my-auto">
          <p className="text-3xl font-light text-slate-600 leading-tight">
            E-Office Tender
          </p>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mt-2 leading-tight tracking-tight">
            Automation & Document Generation System
          </h1>
          <p className="text-slate-500 mt-4 text-base">
            Kelola data perusahaan, kualifikasi tenaga ahli, dan dokumen penawaran MDP secara otomatis dan terintegrasi.
          </p>
        </div>

        {/* Footer Informasi Kiri */}
        <div className="text-xs text-slate-400">
          Versi 1.0.0 &bull; Modul Manajemen Tender & Dokumen
        </div>
      </div>

      {/* Sisi Kanan - Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header Form */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Masuk
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Sign in to your account to start using system
            </p>
          </div>

          {errorMsg &&
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <span className="text-red-500 font-bold text-sm mt-0.5">⚠️</span>
            <div className="text-sm">
              <p className="font-semibold text-red-800">Gagal Masuk</p>
              <p className="text-red-600 text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
}

          {/* Form Utama */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            
            {/* Input Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
              name='email'
                type="email"
                autoComplete='off'
                value={form.email}
                onChange={handleChange}
                placeholder="Ketik email Anda"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition text-sm"
              />
            </div>

            {/* Input Kata Sandi + tombol mata */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  name='password'
                  type={showPassword ? "text" : "password"}
                  placeholder="Kata Sandi"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  {showPassword ? (
                    // Mata dicoret = klik untuk menyembunyikan
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    // Mata terbuka = klik untuk menampilkan
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            

            {/* Tombol Masuk Warna Navy Slate */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition duration-200 text-sm shadow-md active:scale-[0.99]"
            >{loading ? "Loading..." : "Masuk"}</button>

          </form>

          {/* Footer Form */}
          <p className="text-center text-xs text-slate-400 pt-6">
            Hak Cipta 2026, <span className="text-blue-600 font-medium">E-Office Tender</span>. Seluruh Hak Cipta Dilindungi.
          </p>

        </div>
      </div>
    </div>
    </>
  )
}

export default Login