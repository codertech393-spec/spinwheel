import { useState } from 'react';
import { EVENT } from '../config/event';

// Shows the console picture from /public (see EVENT.consoleImage), linked to the Xbox consoles page.
// Falls back to an icon if the file is missing.
export default function ConsoleImage({ className = '' }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  const inner = failed ? (
    <div role="img" aria-label={EVENT.consoleAlt} className={`grid place-items-center rounded-xl bg-[#7cfc00]/10 text-5xl ${className}`}>🎮</div>
  ) : (
    <img src={EVENT.consoleImage} alt={EVENT.consoleAlt} onError={() => setFailed(true)} className={`object-contain ${className}`} />
  );
  return (
    <a href={EVENT.consoleUrl} target="_blank" rel="noopener noreferrer" title="See Xbox consoles on xbox.com" className="block">
      {inner}
    </a>
  );
}
