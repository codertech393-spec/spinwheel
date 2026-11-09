export type ContactMethod = 'whatsapp' | 'telegram' | 'sms' | 'email';

export const CONTACT_METHODS: {
  id: ContactMethod; label: string; field: string; placeholder: string; hint: string; type: 'tel' | 'text' | 'email';
}[] = [
  { id: 'whatsapp', label: 'WhatsApp', field: 'WhatsApp number', placeholder: '+1 555 123 4567', hint: 'Include your country code, e.g. +1 for the US.', type: 'tel' },
  { id: 'telegram', label: 'Telegram', field: 'Telegram username or number', placeholder: '@username or +1 555 123 4567', hint: 'Your @username, or the phone number linked to your Telegram.', type: 'text' },
  { id: 'sms', label: 'Text message', field: 'Mobile number', placeholder: '+1 555 123 4567', hint: 'Include your country code, e.g. +1 for the US.', type: 'tel' },
  { id: 'email', label: 'Email', field: 'Email address', placeholder: 'you@example.com', hint: "We'll only use this for your prize.", type: 'email' },
];

export const methodLabel = (id?: string) => CONTACT_METHODS.find((m) => m.id === id)?.label ?? 'your chosen method';

// Handy link for the admin to open the chat / compose a message.
export function contactLink(method: string | undefined, value: string): string {
  if (method === 'email') return `mailto:${value}`;
  if (method === 'sms') return `sms:${value}`;
  if (method === 'whatsapp') return `https://wa.me/${value.replace(/\D/g, '')}`;
  if (method === 'telegram') return `https://t.me/${value.startsWith('@') ? value.slice(1) : value}`;
  return '#';
}
