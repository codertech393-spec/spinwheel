export type Prize = { name: string; kind: string; value: string; color: string; icon: string };

export const prizes: Prize[] = [
  { name: '$5,000', kind: 'Cash reward', value: '$5,000', color: '#7cfc00', icon: '💵' },
  { name: 'Game Pass', kind: 'Gaming reward', value: '1 year', color: '#164b27', icon: '🎮' },
  { name: 'Try Again', kind: 'No prize', value: 'Good luck', color: '#222a25', icon: '✨' },
  { name: '$10,000', kind: 'Cash reward', value: '$10,000', color: '#a5ff50', icon: '💸' },
  { name: 'Controller', kind: 'Gaming gear', value: 'Prize', color: '#234b36', icon: '🕹️' },
  { name: '$25,000', kind: 'Cash reward', value: '$25,000', color: '#c2ff82', icon: '💰' },
  { name: 'Try Again', kind: 'No prize', value: 'Good luck', color: '#222a25', icon: '✨' },
  { name: 'Grand Prize', kind: 'Featured reward', value: 'Mystery', color: '#315e25', icon: '🏆' },
];

export const demoWinners: [string, string][] = [
  ['PixelPilot', 'Xbox gift card'],
  ['NovaQuest', '$10,000'],
  ['LunarByte', 'Gaming headset'],
  ['TurboFox', 'Game Pass reward'],
];
