import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Download Aplikasi AttendX | Absen.ai",
  description:
    "Download aplikasi AttendX untuk absensi karyawan dengan verifikasi wajah, geofence, dan sinkronisasi ke dashboard HR.",
};

const downloadUrl = "/downloads/attendx-latest.apk";

const features = [
  {
    icon: "face",
    title: "Verifikasi wajah",
    description: "Validasi identitas saat check-in dan check-out langsung dari kamera ponsel.",
  },
  {
    icon: "location_on",
    title: "Geofence akurat",
    description: "Pastikan kehadiran dilakukan dari lokasi kerja yang sudah disetujui perusahaan.",
  },
  {
    icon: "sync",
    title: "Tetap siap offline",
    description: "Aktivitas tersimpan aman dan disinkronkan kembali ketika koneksi tersedia.",
  },
];

const installSteps = [
  ["01", "Download APK", "Tekan tombol download dan tunggu file AttendX selesai diunduh."],
  ["02", "Izinkan instalasi", "Jika diminta, aktifkan izin instalasi aplikasi dari browser Anda."],
  ["03", "Masuk dan absen", "Buka AttendX, masuk dengan akun karyawan, lalu mulai check-in."],
];

export default function DownloadAppPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4fbf7] text-[#012117]">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_12%,rgba(52,211,153,0.22),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(250,204,21,0.13),transparent_25%),linear-gradient(180deg,#f8fffb_0%,#edf9f2_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(rgba(2,44,34,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(2,44,34,0.05)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

        <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="Kembali ke beranda Absen.ai">
            <span className="grid size-10 place-items-center rounded-xl bg-[#022c22] text-lg font-black text-white shadow-lg shadow-emerald-950/15">
              A
            </span>
            <span className="font-bold tracking-tight text-[#022c22]">Absen.ai</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-semibold text-[#3a4b44] transition hover:text-[#047857] sm:block">
              Masuk Dashboard
            </Link>
            <Link href="/" className="rounded-full border border-emerald-900/10 bg-white/75 px-4 py-2 text-sm font-semibold text-[#022c22] shadow-sm backdrop-blur transition hover:border-emerald-700/30 hover:bg-white">
              Kembali
            </Link>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 md:px-10 lg:min-h-[760px] lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#047857] shadow-sm backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Versi terbaru tersedia
            </div>

            <h1 className="text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[#022c22] sm:text-6xl lg:text-[76px]">
              Absensi kerja,
              <span className="mt-2 block text-[#047857]">sepraktis buka ponsel.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#3a4b44] sm:text-lg">
              Download AttendX untuk check-in dengan wajah dan lokasi, mengajukan izin, serta memantau riwayat kehadiran dalam satu aplikasi.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={downloadUrl}
                download
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#022c22] px-7 text-base font-bold text-white shadow-[0_16px_40px_rgba(2,44,34,0.24)] transition hover:-translate-y-1 hover:bg-[#064e3b] hover:shadow-[0_20px_48px_rgba(2,44,34,0.3)]"
              >
                <span className="material-symbols-outlined text-[24px]">android</span>
                Download App Now
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-y-0.5">download</span>
              </a>
              <div className="flex items-center justify-center gap-3 px-3 text-sm text-[#52635c] sm:justify-start">
                <span className="font-semibold text-[#022c22]">v1.0.0</span>
                <span className="size-1 rounded-full bg-emerald-400" />
                <span>APK 94,9 MB</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#3a4b44]">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg text-emerald-600">verified_user</span> File resmi AttendX</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg text-emerald-600">lock</span> Koneksi HTTPS</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg text-emerald-600">update</span> Diperbarui 14 Juli 2026</span>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[520px] justify-center lg:justify-end">
            <div className="absolute left-0 top-16 hidden rounded-2xl border border-white/80 bg-white/75 p-4 shadow-xl shadow-emerald-950/10 backdrop-blur-xl sm:block lg:-left-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><span className="material-symbols-outlined">check_circle</span></span>
                <div><p className="text-xs text-[#64746d]">Status hari ini</p><p className="text-sm font-bold">Check-in berhasil</p></div>
              </div>
            </div>

            <div className="absolute bottom-16 right-0 z-20 hidden rounded-2xl border border-white/80 bg-white/80 p-4 shadow-xl shadow-emerald-950/10 backdrop-blur-xl sm:block lg:-right-4">
              <p className="text-xs font-semibold text-[#64746d]">Lokasi terverifikasi</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-bold text-[#022c22]"><span className="material-symbols-outlined text-emerald-600">location_on</span>Kantor Jakarta</div>
            </div>

            <div className="absolute inset-x-12 bottom-4 top-16 -z-10 rounded-full bg-emerald-400/25 blur-3xl" />
            <div className="relative w-[292px] rotate-[2deg] rounded-[46px] border-[8px] border-[#072c23] bg-[#072c23] p-2 shadow-[0_35px_90px_rgba(2,44,34,0.3)] transition duration-500 hover:rotate-0 sm:w-[330px]">
              <div className="absolute left-1/2 top-3 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-[#072c23]" />
              <div className="relative min-h-[610px] overflow-hidden rounded-[34px] bg-[#f5fbf7] sm:min-h-[660px]">
                <div className="bg-[#064e3b] px-6 pb-24 pt-12 text-white">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs text-white/60">Selamat pagi,</p><p className="mt-1 text-lg font-bold">David Boy</p></div>
                    <span className="grid size-10 place-items-center rounded-full bg-white/10"><span className="material-symbols-outlined text-xl">notifications</span></span>
                  </div>
                  <p className="mt-9 text-center text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Senin, 14 Juli 2026</p>
                  <p className="mt-2 text-center text-4xl font-bold tracking-tight">07:54</p>
                </div>
                <div className="relative -mt-14 px-5">
                  <div className="rounded-3xl border border-emerald-950/5 bg-white p-5 shadow-xl shadow-emerald-950/10">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-[#718078]">Shift Pagi</p><p className="mt-1 text-sm font-bold">08:00 - 17:00</p></div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">Tepat waktu</span>
                    </div>
                    <button type="button" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#022c22] py-4 text-sm font-bold text-white">
                      <span className="material-symbols-outlined text-xl">face</span> Check-in Sekarang
                    </button>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm"><span className="material-symbols-outlined text-emerald-600">calendar_month</span><p className="mt-5 text-xs text-[#718078]">Kehadiran</p><p className="mt-1 text-lg font-bold">21 hari</p></div>
                    <div className="rounded-2xl bg-[#fff6d8] p-4 shadow-sm"><span className="material-symbols-outlined text-amber-600">schedule</span><p className="mt-5 text-xs text-[#756a4a]">Terlambat</p><p className="mt-1 text-lg font-bold">1 kali</p></div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-emerald-950/5 bg-white p-4">
                    <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><span className="material-symbols-outlined">wifi_off</span></span><div><p className="text-sm font-bold">Mode offline siap</p><p className="text-xs text-[#718078]">Data akan tersinkron otomatis</p></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-[#022c22] px-5 py-20 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Satu aplikasi, semua aktivitas</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Dibuat untuk ritme kerja modern.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-white/65 lg:justify-self-end">Dari kantor, rumah, maupun lokasi lapangan, AttendX menjaga pencatatan kehadiran tetap cepat dan transparan untuk karyawan serta tim HR.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map((feature, index) => (
              <article key={feature.title} className="group rounded-3xl border border-white/10 bg-white/[0.055] p-6 transition hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-white/[0.08]">
                <div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-300 text-[#022c22]"><span className="material-symbols-outlined">{feature.icon}</span></span><span className="text-xs font-bold text-white/30">0{index + 1}</span></div>
                <h3 className="mt-8 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#047857]">Cara instalasi</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#022c22] sm:text-4xl">Tiga langkah, langsung siap absen.</h2>
          </div>
          <div className="relative mt-14 grid gap-5 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-8 hidden border-t border-dashed border-emerald-700/25 md:block" />
            {installSteps.map(([number, title, description]) => (
              <article key={number} className="relative rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-[0_18px_45px_rgba(2,44,34,0.06)]">
                <span className="relative z-10 grid size-16 place-items-center rounded-2xl bg-[#d1fae5] text-lg font-black text-[#047857]">{number}</span>
                <h3 className="mt-7 text-xl font-bold text-[#022c22]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#52635c]">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-16 overflow-hidden rounded-[32px] bg-[linear-gradient(120deg,#064e3b,#022c22)] px-6 py-10 text-center text-white shadow-2xl shadow-emerald-950/15 sm:px-10 md:flex md:items-center md:justify-between md:text-left">
            <div><p className="text-sm font-semibold text-emerald-200">AttendX untuk Android</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Siap membuat absensi lebih sederhana?</h2></div>
            <a href={downloadUrl} download className="mt-7 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#34d399] px-7 font-bold text-[#022c22] transition hover:bg-white md:mt-0"><span className="material-symbols-outlined">download</span>Download APK</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-950/10 px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#64746d] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Absen.ai — PT Inovasi Kerja Digital</p>
          <div className="flex items-center gap-5"><Link href="/" className="hover:text-[#047857]">Beranda</Link><Link href="/sign-in" className="hover:text-[#047857]">Masuk</Link></div>
        </div>
      </footer>
    </main>
  );
}
