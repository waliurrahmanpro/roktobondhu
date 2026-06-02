/** Normalize BD mobile numbers for tel: and WhatsApp links */
export function normalizeBdPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  if (digits.length === 10) return `880${digits}`;
  return digits;
}

export function telLink(phone: string) {
  return `tel:${normalizeBdPhone(phone)}`;
}

export function whatsAppLink(phone: string, message?: string) {
  const base = `https://wa.me/${normalizeBdPhone(phone)}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function formatPhoneDisplay(phone: string) {
  const n = normalizeBdPhone(phone);
  if (n.length === 13 && n.startsWith("880")) {
    return `0${n.slice(3)}`;
  }
  return phone;
}
