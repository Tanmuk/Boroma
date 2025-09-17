export type Issue = {
  slug: string
  title: string
  time: string // e.g., "5–8"
  steps: string[]
  checklist?: string[]
}

// 21 issues total (9 existing + 12 new)
export const ISSUES: Issue[] = [
  {
    slug: 'wifi-not-connecting',
    title: 'Wi-Fi Not Connecting',
    time: '5–8',
    steps: ['Check router lights', 'Toggle Wi-Fi & airplane mode', 'Forget & rejoin network with correct password'],
    checklist: ['Be near the router', 'Know your Wi-Fi password', 'Have device charger nearby'],
  },
  {
    slug: 'phone-storage-full',
    title: 'Phone Storage Full',
    time: '6–10',
    steps: ['Identify biggest storage users', 'Clear app caches and downloads', 'Back up & remove large photos/videos'],
  },
  {
    slug: 'password-reset-basics',
    title: 'Password Reset Basics',
    time: '5–7',
    steps: ['Open “Forgot password” page', 'Get recovery code by SMS/email', 'Create a new strong password'],
  },
  {
    slug: 'email-setup-fix',
    title: 'Email Setup & Fix',
    time: '6–8',
    steps: ['Open mail app settings', 'Add or repair account', 'Send a test message'],
  },
  {
    slug: 'whatsapp-facebook-login',
    title: 'WhatsApp / Facebook Login',
    time: '5–8',
    steps: ['Verify phone/email', 'Enter or reset password', 'Approve security prompts'],
  },
  {
    slug: 'os-app-updates',
    title: 'OS & App Updates',
    time: '4–6',
    steps: ['Check for updates', 'Clear space if needed', 'Install & reboot'],
  },
  {
    slug: 'scam-sms-safety-check',
    title: 'Scam / SMS Safety Check',
    time: '3–5',
    steps: ['Review suspicious texts/calls', 'Block & report senders', 'Turn on spam filters'],
  },
  {
    slug: 'contacts-calendar-sync',
    title: 'Contacts/Calendar Sync',
    time: '5–8',
    steps: ['Confirm account sign-in', 'Enable sync for contacts/calendar', 'Force a refresh & verify'],
  },
  {
    slug: 'bluetooth-pairing',
    title: 'Bluetooth Pairing',
    time: '4–6',
    steps: ['Turn device discoverable', 'Forget old pairings', 'Pair again and test audio'],
  },
  // extra shown in your screenshots
  {
    slug: 'printer-wont-connect',
    title: "Printer Won’t Connect",
    time: '7–10',
    steps: ['Power-cycle printer', 'Join correct Wi-Fi', 'Re-add printer in system settings', 'Print a test page'],
  },
  {
    slug: 'app-install-setup',
    title: 'App Install & Setup',
    time: '4–6',
    steps: ['Find official app', 'Grant permissions safely', 'Login/setup basics'],
  },
  {
    slug: 'photo-backup',
    title: 'Photo Backup',
    time: '6–8',
    steps: ['Enable cloud backup', 'Free up local space', 'Verify photos on another device'],
  },
  // ===== 12 NEW ISSUES =====
  {
    slug: 'video-calling-setup',
    title: 'Video Calling (Zoom/FaceTime)',
    time: '6–9',
    steps: ['Open or install app', 'Grant camera/mic permissions', 'Place a test call'],
  },
  {
    slug: 'ringtone-volume-setup',
    title: 'Ringtone & Volume Setup',
    time: '2–4',
    steps: ['Adjust volume buttons', 'Pick a louder ringtone', 'Turn off Do Not Disturb'],
  },
  {
    slug: 'spam-call-blocking',
    title: 'Spam Call Blocking',
    time: '4–6',
    steps: ['Enable built-in spam filters', 'Block repeat offenders', 'Silence unknown callers (optional)'],
  },
  {
    slug: 'wifi-password-change',
    title: 'Wi-Fi Password Change',
    time: '6–9',
    steps: ['Log into router', 'Change Wi-Fi password', 'Reconnect devices securely'],
  },
  {
    slug: 'new-phone-setup',
    title: 'New Phone Setup',
    time: '10–15',
    steps: ['Sign in with Apple/Google ID', 'Restore from backup', 'Enable essential protections'],
  },
  {
    slug: 'account-id-recovery',
    title: 'Apple/Google ID Recovery',
    time: '8–12',
    steps: ['Open account recovery', 'Verify identity with code', 'Set new password & sign in'],
  },
  {
    slug: 'two-factor-setup',
    title: 'Two-Factor Auth Setup',
    time: '6–9',
    steps: ['Turn on 2-step verification', 'Choose SMS or Authenticator app', 'Store backup codes safely'],
  },
  {
    slug: 'text-messaging-basics',
    title: 'Text Messaging Basics',
    time: '3–5',
    steps: ['Find the Messages app', 'Send a test text', 'Share a photo or emoji'],
  },
  {
    slug: 'contacts-transfer',
    title: 'Contacts Transfer',
    time: '6–9',
    steps: ['Export from old phone/cloud', 'Import to new phone', 'Merge duplicates'],
  },
  {
    slug: 'photo-sharing',
    title: 'Photo Sharing',
    time: '4–6',
    steps: ['Open Photos', 'Share via link or message', 'Adjust privacy settings'],
  },
  {
    slug: 'accessibility-setup',
    title: 'Screen Reader / Accessibility',
    time: '6–9',
    steps: ['Enable larger text', 'Turn on VoiceOver/TalkBack', 'Customize gestures'],
  },
  {
    slug: 'battery-charging-tips',
    title: 'Battery & Charging Tips',
    time: '3–5',
    steps: ['Check battery health', 'Use the right charger', 'Enable optimized charging'],
  },
]

export function getIssueBySlug(slug: string) {
  return ISSUES.find((i) => i.slug === slug)
}
