import Link from "next/link";
import { Home, FileText, Calendar, Settings as SettingsIcon } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#050607] border-r border-white/[0.02] min-h-screen">
      <div className="px-4 py-6 flex flex-col h-full">
        <div>
          <Link href="/" className="flex items-center gap-3 mb-8">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-bold text-background">α</span>
            <span className="font-semibold text-white">get<span className="text-accent">ALPHA</span></span>
          </Link>

          <nav className="mt-6 flex flex-col gap-1">
            <NavItem href="/dashboard" icon={<Home size={18} />}>Dashboard</NavItem>
            <NavItem href="/journal" icon={<FileText size={18} />}>Journal</NavItem>
            <NavItem href="/session-brief" icon={<FileText size={18} />}>Session Brief</NavItem>
            <NavItem href="/calendar" icon={<Calendar size={18} />}>Calendar</NavItem>
          </nav>
        </div>

        <div className="mt-auto pt-6">
          <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.02]">
            <SettingsIcon size={16} /> <span className="text-sm text-zinc-400">Settings</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.02]">
      <span className="opacity-70 group-hover:opacity-100">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
