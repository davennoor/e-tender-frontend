import Sidebar from './Sidebar';

export default function MainLayout({title,children,button}) {
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white p-6 shadow-sm border-b flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <div>{button}</div>
        </header>

        <div className="p-8 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}