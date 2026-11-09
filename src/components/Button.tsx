import { Link } from 'react-router-dom';

type ButtonProps = {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'quiet';
};

export default function Button({ children, to, onClick, variant = 'primary' }: ButtonProps) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition-all duration-200 ${
    variant === 'primary'
      ? 'bg-[#7cfc00] text-[#081006] shadow-[0_0_25px_#7cfc0020] hover:-translate-y-0.5 hover:bg-[#a5ff50]'
      : variant === 'outline'
      ? 'border border-white/15 bg-white/3 text-white hover:border-[#7cfc00]/50'
      : 'text-white/55 hover:text-white'
  }`;
  return to ? (
    <Link className={cls} to={to}>{children}</Link>
  ) : (
    <button className={cls} onClick={onClick}>{children}</button>
  );
}
