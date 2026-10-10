import { Route } from "react-router-dom";
import { Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import DataPersonel from "../pages/DataPersonel";
import DataPerusahaan from "../pages/DataPerusahaan";
import DokumenPendukung from "../pages/DokumenPendukung";
import PengalamanProyek from "../pages/PengalamanProyek";
import Tender from "../pages/Tender";
import GenerateMDP from "../pages/GeneratepdfMDP";
import Login from "../App";


export default function AppRoute(){
    return(
        <Routes>
            <Route path="/" element={<Login/>}/>
            <Route path="/dashboard" element={<Dashboard/>}/>
            <Route path="/datapersonel" element={<DataPersonel/>}/>
            <Route path="/dataperusahaan" element={<DataPerusahaan/>}/>
            <Route path="/dokumenpendukung" element={<DokumenPendukung/>}/>
            <Route path="/pengalamanproyek" element={<PengalamanProyek/>}/>
            <Route path="/tender" element={<Tender/>}/>
            <Route path="/generatemdp/:template?" element={<GenerateMDP/>}/>
        </Routes>
    )
}