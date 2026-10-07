/**
 * CRM CRA Outreach Formatters
 * Formats dates, phone numbers, and numbers according to standard Indian business norms.
 */

export function formatIndianDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

export function formatIndianDateTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
}

export function formatIndianTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
}

export function formatIndianPhone(phoneInput?: string | null): string {
  if (!phoneInput || !phoneInput.trim()) return '—';
  const clean = phoneInput.replace(/[^0-9+]/g, '');
  if (clean.length === 10 && !clean.startsWith('+')) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  if (clean.startsWith('+91') && clean.length === 13) {
    return `+91 ${clean.slice(3, 8)} ${clean.slice(8)}`;
  }
  if (clean.startsWith('91') && clean.length === 12) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  return phoneInput.trim();
}

export function formatIndianNumber(numInput?: number | string | null): string {
  if (numInput === undefined || numInput === null) return '0';
  const num = typeof numInput === 'string' ? parseFloat(numInput) : numInput;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

export function formatIndianCurrency(numInput?: number | string | null): string {
  if (numInput === undefined || numInput === null) return '₹0';
  const num = typeof numInput === 'string' ? parseFloat(numInput) : numInput;
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Returns the YYYY-MM-DD date key in Indian Standard Time (IST / Asia/Kolkata).
 */
export function getISTDateKey(dateInput?: string | number | Date | null): string {
  if (!dateInput) return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  }
}

/**
 * Formats an IST YYYY-MM-DD date key into a user-friendly label with day of the week.
 */
export function formatISTDateHeading(istDateKey: string): {
  label: string;
  subLabel: string;
  isToday: boolean;
  isYesterday: boolean;
} {
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayKey = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const isToday = istDateKey === todayKey;
  const isYesterday = istDateKey === yesterdayKey;

  try {
    const [year, month, day] = istDateKey.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const fullDate = dateObj.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let subLabel = '';
    if (isToday) subLabel = "Today's Sheet";
    else if (isYesterday) subLabel = "Yesterday";
    else subLabel = fullDate.split(',')[0]; // Weekday name

    return {
      label: fullDate,
      subLabel,
      isToday,
      isYesterday,
    };
  } catch {
    return {
      label: istDateKey,
      subLabel: isToday ? "Today's Sheet" : istDateKey,
      isToday,
      isYesterday,
    };
  }
}

/**
 * Returns current date in Indian Standard Time (IST) as YYYY-MM-DD
 */
export function getTodayISTDateString(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Formats a timestamp into IST with 12-hour AM/PM format
 */
export function formatISTTime(dateInput?: string | number | Date | null, includeSeconds: boolean = false): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return (
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
        hour12: true,
      }).format(d) + ' IST'
    );
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats a date into IST format (e.g. "07 Oct 2026")
 */
export function formatISTDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats total minutes into hours and minutes (e.g. "6h 15m")
 */
export function formatMinutesToHours(minutes: number): string {
  const safeMin = Math.max(0, Math.round(minutes || 0));
  const hrs = Math.floor(safeMin / 60);
  const mins = safeMin % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

