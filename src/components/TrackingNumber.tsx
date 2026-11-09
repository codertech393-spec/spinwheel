import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

export default function TrackingNumber({ code, prize }: { code: string; prize: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy your tracking number:', code);
    }
  };

  const download = () => {
    const text = `Xbox 25 prize\nPrize: ${prize}\nTracking number: ${code}\nClaim it at: ${window.location.origin}/track/${code}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `xbox-${code}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-[#7cfc00]/30 bg-[#7cfc00]/7 p-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/45">Tracking number</p>
      <p className="mt-2 break-all font-['Orbitron'] text-xl font-bold tracking-wider text-[#a5ff50]">{code}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white/80 hover:border-[#7cfc00]/50">
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white/80 hover:border-[#7cfc00]/50">
          <Download size={14} /> Save as file
        </button>
      </div>
    </div>
  );
}
