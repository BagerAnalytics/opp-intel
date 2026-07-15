export default function ProjectsPage() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-hidden">
      <div className="flex items-center justify-between mb-8 mt-4 shrink-0 px-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Projects</h2>
      </div>
      
      <main className="flex-1 overflow-x-auto pb-8 px-2">
        <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Projects Module Coming Soon</h3>
          <p className="text-slate-500">
            This space will house Training, Consulting, CSI projects, and other opportunities currently in flight.
          </p>
        </div>
      </main>
    </div>
  );
}
