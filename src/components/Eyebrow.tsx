import { Sparkles } from 'lucide-react';

export default function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#7cfc00]/20 bg-[#7cfc00]/7 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-[#a5ff50]">
      <Sparkles size={12} />
      {children}
    </div>
  );
}
