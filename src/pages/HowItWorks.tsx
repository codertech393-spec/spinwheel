import PageIntro from '../components/PageIntro';
import { EVENT } from '../config/event';

const steps = [
  ['01', 'Take your spin', 'Open Spin & Win and spin the wheel. There is no account or sign-in. If it lands on Try Again, just spin again.'],
  ['02', 'Get your tracking number', 'If you win, a tracking number appears on screen. Copy it or save it as a file. It is the only way to claim your prize, and every win also includes the Xbox limited edition console.'],
  ['03', 'Track your prize', 'Enter your number on the Track Prize page to see what you won and exactly how to claim it.'],
  ['04', 'Claim it', 'Follow the claim steps and tell us how to reach you: WhatsApp, Telegram, text message or email. The status on your tracking page updates as the team processes it.'],
];

export default function HowItWorks() {
  return (
    <PageIntro eyebrow="Quick guide" title="HOW IT WORKS" description={`Four simple steps to join ${EVENT.name}.`}>
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map(([n, t, d]) => (
          <div key={n} className="rounded-2xl border border-white/8 bg-[#111612] p-6">
            <span className="font-['Orbitron'] text-3xl font-bold text-[#7cfc00]">{n}</span>
            <h3 className="mt-4 font-bold">{t}</h3>
            <p className="mt-2 text-sm leading-6 text-white/45">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/3 p-5 text-sm leading-6 text-white/55">
        Staying safe: keep your tracking number private, because anyone who has it can claim the prize. The event team will never ask for your password, card number or bank details. See the official rules for eligibility and full terms.
      </div>
    </PageIntro>
  );
}
