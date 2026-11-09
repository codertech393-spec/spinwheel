// Single place for sponsor + legal details. Fill in every empty string before launch.
export const EVENT = {
  name: 'Xbox 25',
  sponsor: 'GameSir',
  sponsorBadge: 'SPONSORED BY GAMESIR',
  footerBlurb: 'Xbox 25 is a gaming anniversary giveaway sponsored by GameSir. Take your spin, and if you win, use your tracking number to claim your prize.',
  // TODO: replace with the exact trademark attribution your Xbox/Microsoft permission requires.
  copyright: '© 2026 GameSir. Xbox is a trademark of the Microsoft group of companies and is used with permission.',

  // Official rules details (must be filled by the sponsor / reviewed by counsel).
  sponsorLegalName: '',        // e.g. full registered company name and address
  startDate: '',               // e.g. 'November 4, 2026, 12:00 PM CT'
  endDate: '',
  eligibility: '',             // age, countries / states, exclusions
  entryMethod: 'Visit the Spin & Win page and use your spin. No account, sign-in or purchase is required to enter.', // confirm no-purchase wording with counsel
  spinsPerPerson: 1,           // keep in sync with SPINS_PER_DEVICE on the server
  claimWindow: '',             // e.g. 'within 14 days of winning'
  consoleImage: '/xbox-limited-console.png', // save the official console picture as public/xbox-limited-console.png
  consoleUrl: 'https://www.xbox.com/en-US/consoles/all-consoles',
  consoleAlt: 'Xbox limited edition console',
  consoleValue: '',            // approximate retail value of the console, required in the official rules
  contactEmail: '',            // public support / privacy contact
  governingLaw: '',
};

export const missingEventFields = () =>
  (['sponsorLegalName', 'startDate', 'endDate', 'eligibility', 'claimWindow', 'consoleValue', 'contactEmail', 'governingLaw'] as const).filter((k) => !EVENT[k]);
