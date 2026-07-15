export default function AwardsPage() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-hidden">
      <div className="flex items-center justify-between mb-8 mt-4 shrink-0 px-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Awards</h2>
      </div>
      
      <main className="flex-1 overflow-x-auto pb-8 px-2">
        <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Awards Module Coming Soon</h3>
          <p className="text-slate-500">
            This space will house Award opportunities and other recognition-based applications.
          </p>
        </div>
      </main>
    </div>
  );
}
