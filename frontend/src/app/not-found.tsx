import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Mesh Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#C2E7FF]/20 rounded-full blur-[100px] mix-blend-multiply" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#E8DEF8]/30 rounded-full blur-[120px] mix-blend-multiply" />
      
      <div className="glass-panel p-12 rounded-[40px] flex flex-col items-center text-center max-w-lg w-full relative z-10 border border-white/50 shadow-2xl">
        <div className="w-24 h-24 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 shadow-sm border border-white/50 mb-8">
          <Compass size={40} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl font-semibold text-slate-800 tracking-tight mb-4">404 Not Found</h1>
        <p className="text-lg font-medium text-slate-500 leading-relaxed mb-10">
          The opportunity or page you are looking for has been archived, expired, or doesn't exist.
        </p>
        
        <Link 
          href="/" 
          className="flex items-center gap-2 bg-[#202124] text-white px-8 py-4 rounded-2xl font-medium shadow-xl shadow-[#202124]/20 hover:bg-[#3c4043] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <ArrowLeft size={18} />
          Return to Dashboard
        </Link>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-8 text-center w-full text-slate-500 font-semibold tracking-widest text-[10px] uppercase">
        Premier Agric x Badger Analytics
      </div>
    </div>
  );
}
