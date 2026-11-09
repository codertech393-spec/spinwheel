import Eyebrow from './Eyebrow';

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function PageIntro({ eyebrow, title, description, children }: PageIntroProps) {
  return (
    <div className="mx-auto min-h-[65vh] max-w-7xl px-5 py-14 md:px-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="font-['Orbitron'] text-3xl font-extrabold md:text-4xl">{title}</h1>
      <p className="mb-10 mt-4 max-w-2xl text-sm leading-6 text-white/50">{description}</p>
      {children}
    </div>
  );
}
