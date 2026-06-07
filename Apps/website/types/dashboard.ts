/**
 * types/dashboard.ts
 *
 * Tipe data yang digunakan oleh layout dashboard dan sidebar.
 *
 * DashboardUser di-populate dari session better-auth + data profil /me,
 * lalu di-pass sebagai props dari Server Component layout ke Client Component
 * sidebar.
 *
 * Requirements: 3.4, 3.11, 13.3
 */

/**
 * Representasi user yang sedang login untuk kebutuhan dashboard.
 * Data berasal dari session + endpoint /me.
 *
 * Kompatibel dengan SessionUser dari lib/permissionGuards.ts —
 * field `name` wajib ada agar helper hasPermission/isStakeholder bisa
 * menerima tipe ini secara langsung.
 */
export interface DashboardUser {
  /** better-auth user id */
  id: string;
  /** Alamat email user */
  email: string;
  /**
   * Nama lengkap user.
   * Alias: field `name` (dibutuhkan oleh SessionUser dari permissionGuards).
   */
  name: string;
  /** Nama lengkap user — identik dengan `name`, untuk keterbacaan di UI */
  fullName: string;
  /**
   * Roles workspace user, contoh: ['stakeholder'] atau ['support_admin'].
   * End user murni tidak bisa akses dashboard (R3.4).
   */
  roles: string[];
  /**
   * Permission keys yang dimiliki user.
   * Stakeholder selalu punya semua permission secara implisit (R3.2).
   */
  permissions: string[];
  /** ID workspace yang sedang aktif */
  workspaceId?: string;
}
