import { Trophy, Award, Search, Plus, Calendar, ExternalLink } from 'lucide-react';

const MOCK_AWARDS = [
  { id: 1, title: "Agripreneur of the Year 2024", organization: "African Farming Magazine", deadline: "2024-09-15", status: "Drafting", image: "bg-amber-100", icon: "text-amber-600" },
  { id: 2, title: "Tech in Agriculture Excellence", organization: "Global Tech Awards", deadline: "2024-10-01", status: "Not Started", image: "bg-blue-100", icon: "text-blue-600" },
  { id: 3, title: "Sustainable Farming Initiative", organization: "UN Environmental Programme", deadline: "2024-08-30", status: "Submitted", image: "bg-emerald-100", icon: "text-emerald-600" },
  { id: 4, title: "Women in Agriculture Leadership", organization: "Women in Tech Africa", deadline: "2024-11-20", status: "Shortlisted", image: "bg-purple-100", icon: "text-purple-600" }
];

export default function AwardsPage() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-hidden relative">
      <div className="absolute top-20 right-40 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 mt-4 shrink-0 px-2 relative z-10">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">Award Opportunities</h2>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search awards..." className="pl-10 pr-4 py-2 bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm w-64 text-slate-900 placeholder:text-slate-400" />
          </div>
          <button className="px-6 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-bold text-white hover:shadow-[0_4px_14px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 transition-all duration-300 shadow-sm flex items-center gap-2">
            <Plus size={16} strokeWidth={3} /> Track Award
          </button>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto pb-8 px-2 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_AWARDS.map(award => (
            <div key={award.id} className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_4px_24px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-amber-100/60 transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col">
              
              <div className={`h-32 ${award.image} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                <Trophy size={48} className={`${award.icon} opacity-80 drop-shadow-sm`} strokeWidth={1.5} />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/90 backdrop-blur-sm shadow-sm
                    ${award.status === 'Submitted' ? 'text-blue-600' : 
                      award.status === 'Shortlisted' ? 'text-emerald-600' : 
                      award.status === 'Drafting' ? 'text-amber-600' : 'text-slate-500'}`}>
                    {award.status}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-extrabold text-slate-900 text-lg leading-tight mb-2 group-hover:text-amber-600 transition-colors">
                  {award.title}
                </h3>
                <p className="text-slate-500 text-sm font-semibold mb-6">
                  {award.organization}
                </p>
                
                <div className="mt-auto pt-5 border-t border-slate-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                    <Calendar size={14} className="text-slate-400" />
                    Deadline: {award.deadline}
                  </div>
                  <button className="text-slate-400 group-hover:text-amber-500 transition-colors p-1 bg-slate-50 rounded-lg group-hover:bg-amber-50">
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
