export type Issue = { slug:string; title:string; short:string; time:string; bullets:string[] };
export const ISSUES: Issue[] = [
  { slug:'wifi-not-working', title:'Wi‑Fi Not Connecting', short:'3 steps • 5–8 min', time:'5–8 min', bullets:['Check router lights','Forget & rejoin network','Restart router/phone'] },
  { slug:'phone-storage-full', title:'Phone Storage Full', short:'4 steps • 6–10 min', time:'6–10 min', bullets:['Find biggest apps','Clear cache safely','Back up photos','Delete duplicates'] },
  { slug:'password-reset', title:'Password Reset Basics', short:'4 steps • 5–7 min', time:'5–7 min', bullets:['Find official reset page','2-step code basics','Update recovery email','Write new password rules'] },
  { slug:'email-setup', title:'Email Setup & Fix', short:'3 steps • 6–8 min', time:'6–8 min', bullets:['Incoming/outgoing servers','App password (if needed)','Test send/receive'] },
  { slug:'whatsapp-fb-login', title:'WhatsApp / Facebook Login', short:'3 steps • 5–8 min', time:'5–8 min', bullets:['Verify phone/email','Clear login blockers','Account recovery path'] },
  { slug:'update-apps', title:'OS & App Updates', short:'3 steps • 4–6 min', time:'4–6 min', bullets:['Battery/Wi‑Fi ready','Update system/app','Restart if needed'] },
  { slug:'scam-sms-check', title:'Scam / SMS Safety Check', short:'2 steps • 3–5 min', time:'3–5 min', bullets:['Red‑flag checklist','Report & block safely'] },
  { slug:'contacts-calendar-sync', title:'Contacts/Calendar Sync', short:'3 steps • 5–8 min', time:'5–8 min', bullets:['Account sync toggle','Default account','Merge duplicates'] },
  { slug:'bluetooth-pairing', title:'Bluetooth Pairing', short:'3 steps • 4–6 min', time:'4–6 min', bullets:['Forget device','Pairing mode','Reconnect'] },
  { slug:'printer-connect', title:'Printer Won’t Connect', short:'4 steps • 7–10 min', time:'7–10 min', bullets:['Wi‑Fi vs USB','Install driver/app','Printer IP check','Test page'] },
  { slug:'app-install-setup', title:'App Install & Setup', short:'3 steps • 4–6 min', time:'4–6 min', bullets:['Find official app','Permissions','Login safely'] },
  { slug:'photo-backup', title:'Photo Backup', short:'3 steps • 6–8 min', time:'6–8 min', bullets:['Choose provider','Wi‑Fi only','Free up space safely'] }
];
export const getIssue = (slug:string) => ISSUES.find(i => i.slug === slug);
