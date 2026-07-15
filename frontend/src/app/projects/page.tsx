import { Briefcase, MoreVertical, Search, Filter } from 'lucide-react';

const MOCK_PROJECTS = [
  { id: 1, name: "Farmers Digital Literacy Workshop", type: "Training", client: "USAID", status: "Active", progress: 65, value: "$45,000" },
  { id: 2, name: "Limpopo Irrigation Feasibility Study", type: "Consulting", client: "World Bank", status: "Planning", progress: 10, value: "$120,000" },
  { id: 3, name: "Community Seed Bank Initiative", type: "CSI", client: "Gates Foundation", status: "Active", progress: 85, value: "$80,000" },
  { id: 4, name: "Agri-Tech Adoption Review 2023", type: "Consulting", client: "FAO", status: "Completed", progress: 100, value: "$65,000" },
  { id: 5, name: "Youth in Agriculture Mentorship", type: "Training", client: "Local Government", status: "Active", progress: 40, value: "$30,000" }
];

export default function ProjectsPage() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 mt-4 shrink-0 px-2 relative z-10">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">Active Projects</h2>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search projects..." className="pl-10 pr-4 py-2 bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-64 text-slate-900 placeholder:text-slate-400" />
          </div>
          <button className="px-4 py-2 bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl text-slate-600 hover:text-slate-900 shadow-sm flex items-center gap-2 text-sm font-bold transition-all">
            <Filter size={16} /> Filter
          </button>
          <button className="px-6 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white hover:shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 transition-all duration-300 shadow-sm flex items-center gap-2">
            <Briefcase size={16} /> New Project
          </button>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto pb-8 px-2 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_4px_24px_rgb(0,0,0,0.02)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/50 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="p-5 pl-8">Project Name</th>
                <th className="p-5">Type</th>
                <th className="p-5">Client / Funder</th>
                <th className="p-5">Progress</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {MOCK_PROJECTS.map(project => (
                <tr key={project.id} className="hover:bg-white/90 transition-colors group cursor-pointer">
                  <td className="p-5 pl-8">
                    <h3 className="font-extrabold text-slate-900 text-[15px] group-hover:text-blue-600 transition-colors">{project.name}</h3>
                    <p className="text-slate-500 text-xs font-semibold mt-1">Value: {project.value}</p>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm
                      ${project.type === 'Training' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                        project.type === 'Consulting' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                        'bg-emerald-50 text-emerald-700 border-emerald-100'}
                    `}>
                      {project.type}
                    </span>
                  </td>
                  <td className="p-5 text-sm text-slate-700 font-bold">
                    {project.client}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-full max-w-[120px] bg-slate-100 rounded-full h-2 shadow-inner overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${project.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-slate-700 text-xs font-bold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${project.status === 'Active' ? 'bg-emerald-500' : project.status === 'Completed' ? 'bg-slate-400' : 'bg-blue-500'}`}></span>
                      {project.status}
                    </span>
                  </td>
                  <td className="p-5 pr-8 text-right">
                    <button className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-md hover:bg-slate-100">
                      <MoreVertical size={18} strokeWidth={2.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
