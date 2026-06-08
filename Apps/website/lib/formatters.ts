/**
 * lib/formatters.ts
 *
 * Shared formatting utilities untuk date, time, dan label.
 * Dipakai di semua workspace pages — attendance, audit-log, exports, dll.
 */

/**
 * Format ISO string ke tanggal + waktu lokal Indonesia.
 * Contoh output: "08/06/2026, 09:30:00"
 */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

/**
 * Format ISO string ke waktu saja (HH:MM).
 * Contoh output: "09:30"
 */
export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

/**
 * Format ISO string ke tanggal lokal Indonesia.
 * Contoh output: "08/06/2026"
 */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID");
  } catch {
    return iso;
  }
}

/**
 * Format ISO string ke tanggal panjang Indonesia.
 * Contoh output: "Minggu, 8 Juni 2026"
 */
export function formatDateLong(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Format timestamp ke relative time Indonesia.
 * Contoh output: "5 menit lalu", "2 jam lalu", "3 hari lalu"
 */
export function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  } catch {
    return "";
  }
}

/**
 * Kembalikan string tanggal hari ini dalam format YYYY-MM-DD.
 */
export function todayDateString(): string {
  return new Date().toLocaleDateString("en-CA");
}

/**
 * Label untuk WorkMode enum.
 */
export function workModeLabel(mode: string | null): string {
  if (!mode) return "—";
  const map: Record<string, string> = {
    WFO: "Kantor",
    WFH: "WFH",
    Hybrid: "Hybrid",
  };
  return map[mode] ?? mode;
}
