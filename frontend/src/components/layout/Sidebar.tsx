import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200/60 h-screen flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-200/60">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">
          Opp<span className="text-gray-400">Intel</span>
        </h1>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        <Link href="/" className="block px-3 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium text-sm transition-colors">
          Dashboard
        </Link>
        <Link href="/opportunities" className="block px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium text-sm transition-colors">
          Opportunities
        </Link>
        <Link href="/network" className="block px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium text-sm transition-colors">
          Contact Network
        </Link>
        <Link href="/compliance" className="block px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium text-sm transition-colors">
          Compliance Data
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-200/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white font-medium text-xs shadow-sm">
            PA
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">Premier Agric</p>
            <p className="text-gray-400 text-xs">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
