export function say(text: string) {
  return `<Say voice="alice">${text}</Say>`;
}
export function dialE164(e164: string, seconds?: number) {
  const limit = seconds ? ` timeLimit="${seconds}"` : '';
  return `<Dial${limit}>${e164}</Dial>`;
}
export function respond(inner: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
}
