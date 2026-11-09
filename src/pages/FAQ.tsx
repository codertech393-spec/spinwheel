import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import PageIntro from '../components/PageIntro';
import { EVENT } from '../config/event';

const qs = [
  ['Do I need an account?', `No. Everyone gets ${EVENT.spinsPerPerson} spin${EVENT.spinsPerPerson === 1 ? '' : 's'}. There is nothing to sign up for.`],
  ['What is a tracking number?', 'If you win, we give you a tracking number such as XB25-ABCD-EFGH-JKLM. Enter it on the Track Prize page to see your prize, how to claim it and its status.'],
  ['What if the wheel lands on Try Again?', "Nothing is lost. A Try Again spin does not count, so you just spin the wheel again until it lands on a prize."],
  ['Do winners get the console too?', 'Yes. Every winning spin also includes the Xbox limited edition console, shown on your tracking page next to your prize.'],
  ['I lost my tracking number.', 'On the same browser you won with, open Spin & Win and your number is shown there again. If you cleared your browser data or switched devices, contact us through the Contact page. We may not be able to recover it, so save the number when you win.'],
  ['How do I claim my prize?', "Open the Track Prize page, enter your number, read the claim steps and press 'Request claim', pick how you want to be contacted (WhatsApp, Telegram, text message or email) and add your number or username. The status on that page updates as the team processes it."],
  ['How are results decided?', 'Each spin is drawn at random on our server, using the odds published in the official rules.'],
  ['Will you ask for my password or payment details?', 'Never. If anyone claiming to be from the event asks for them, do not respond and contact us through the Contact page.'],
  ['Who runs this?', `${EVENT.name} is sponsored by ${EVENT.sponsor}. See the official rules for the full sponsor details.`],
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <PageIntro eyebrow="Support center" title="FREQUENTLY ASKED QUESTIONS" description="Quick answers about spins, tracking numbers and claiming.">
      <div className="max-w-3xl space-y-3">
        {qs.map(([q, a], i) => (
          <button key={q} onClick={() => setOpen(open === i ? -1 : i)} className="w-full rounded-2xl border border-white/8 bg-[#111612] p-5 text-left">
            <div className="flex items-center justify-between font-bold">
              {q}
              <ChevronRight className={`transition ${open === i ? 'rotate-90 text-[#7cfc00]' : ''}`} />
            </div>
            <AnimatePresence>
              {open === i && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-4 text-sm leading-6 text-white/50">
                  {a}
                </motion.p>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>
    </PageIntro>
  );
}
