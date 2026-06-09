<!-- Home Dashboard -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Home Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#F9F9FF",
                        "success": "#2E7D32",
                        "secondary-container": "#9c48ea",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#004395",
                        "on-primary-fixed": "#001a42",
                        "secondary": "#8127cf",
                        "primary-container": "#2170E4",
                        "surface-container": "#ededf8",
                        "tertiary": "#792c00",
                        "inverse-surface": "#2e3039",
                        "on-background": "#191b23",
                        "secondary-fixed": "#f0dbff",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "outline": "#727784",
                        "tertiary-fixed": "#ffdbcd",
                        "primary": "#004191",
                        "on-tertiary-fixed": "#360f00",
                        "on-tertiary-container": "#ffc9b3",
                        "on-surface-variant": "#424753",
                        "tertiary-container": "#9f3d01",
                        "outline-variant": "#c2c6d5",
                        "pending": "#ED6C02",
                        "inverse-on-surface": "#f0f0fb",
                        "tertiary-fixed-dim": "#ffb596",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed-variant": "#6900b3",
                        "on-error-container": "#93000a",
                        "surface-dim": "#d9d9e4",
                        "surface-container-high": "#e7e7f3",
                        "secondary-fixed-dim": "#ddb7ff",
                        "surface-bright": "#faf8ff",
                        "surface-container-highest": "#e1e1ed",
                        "on-primary-container": "#c4d5ff",
                        "error": "#BA1A1A",
                        "primary-fixed-dim": "#adc6ff",
                        "on-secondary-container": "#fffbff",
                        "primary-fixed": "#d8e2ff",
                        "surface-variant": "#e1e1ed",
                        "inverse-primary": "#adc6ff",
                        "on-secondary": "#ffffff",
                        "surface": "#FFFFFF",
                        "on-surface": "#191b23",
                        "on-tertiary-fixed-variant": "#7c2e00",
                        "on-secondary-fixed": "#2c0050",
                        "surface-container-low": "#f3f3fe",
                        "surface-tint": "#085ac0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "1rem",
                        "stack-lg": "1.5rem",
                        "margin-tablet": "1.5rem",
                        "margin-mobile": "1rem",
                        "stack-sm": "0.5rem",
                        "gutter": "1rem"
                    },
                    "fontFamily": {
                        "headline-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "label-md": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "label-sm": ["Inter"]
                    },
                    "fontSize": {
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen pb-[80px]">
<!-- TopAppBar -->
<header class="bg-surface dark:bg-surface-dim shadow-sm w-full top-0 sticky z-40 flex items-center justify-between px-margin-mobile py-2">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center">
<img alt="User Avatar" class="w-full h-full object-cover" data-alt="A professional headshot of a modern corporate employee. The person is smiling warmly, set against a clean, bright minimalist background. Soft, high-key lighting enhances the corporate modernism aesthetic. The overall mood is approachable and trustworthy, reflecting enterprise reliability." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdj8aiWnbF5honLv-w5W2PjPCZVN1i6xFBYKYK8JiDiDLqW01Kkn6_H8MbHegRNI_q2x-g_4sZ-OC2aeEzeoQ9iEAJR3I2QkD5nkTubW8X5QsBURFW8gc7cdo6aPQFHNoL7W5iTo71BcJ3z3iSj0JXtOXlh1PVbScNGKf7OhrWIZ1RvnxXMowxNirpx_lex8YKkQTja7wJ60dctJUOIgO44he8WF6udtI13xjMBAj-nnIW6cvPKkPRtAYwqdEYVvmZXKsTViko53c"/>
</div>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary dark:text-primary-fixed">AttendX</h1>
</div>
<button class="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest active:scale-95 transition-transform text-on-surface-variant dark:text-outline-variant relative">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span class="absolute top-3 right-3 w-2 h-2 bg-error rounded-full border border-surface"></span>
</button>
</header>
<main class="px-margin-mobile pt-stack-md pb-stack-lg max-w-md mx-auto md:max-w-3xl flex flex-col gap-stack-lg">
<!-- Greeting Section -->
<section class="flex flex-col gap-1">
<h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Selamat pagi, David</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Senin, 24 Oktober 2023</p>
</section>
<!-- Real-time Clock & Status Card (Bento-style) -->
<section class="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
<!-- Clock & Shift Card -->
<div class="bg-surface rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-surface-container-high p-4 flex flex-col justify-between relative overflow-hidden">
<div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
<div class="flex justify-between items-start mb-4 relative z-10">
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Shift Hari Ini</span>
<span class="font-headline-md text-headline-md text-on-surface mt-1">08:00 - 17:00</span>
</div>
<div class="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 border border-primary/20">
<span class="material-symbols-outlined text-[16px]" data-icon="business" style="font-variation-settings: 'FILL' 1;">business</span>
                        WFO
                    </div>
</div>
<div class="flex flex-col items-center justify-center py-4 bg-surface-container-lowest rounded-lg border border-surface-container-high mt-2 relative z-10">
<div class="font-display-lg text-display-lg text-primary tracking-tight" id="realtime-clock">07:45</div>
<div class="font-body-md text-body-md text-on-surface-variant">Waktu Server (WIB)</div>
</div>
</div>
<!-- Attendance Action Card -->
<div class="bg-surface rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-surface-container-high p-4 flex flex-col justify-between">
<div class="flex flex-col mb-6">
<div class="flex items-center gap-2 mb-1">
<div class="w-2 h-2 rounded-full bg-pending animate-pulse"></div>
<span class="font-label-md text-label-md text-pending">Belum Check-in</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant">Jangan lupa absen sebelum 08:00</p>
</div>
<div class="flex flex-col gap-3 mt-auto">
<button class="w-full bg-[#0058BE] hover:bg-primary text-white py-3 px-4 rounded-xl font-label-md text-label-md shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2">
<span class="material-symbols-outlined" data-icon="login">login</span>
                        Check-in Sekarang
                    </button>
<button class="w-full bg-white border border-[#C2C6D6] hover:bg-surface-container-lowest text-[#191B23] py-3 px-4 rounded-xl font-label-md text-label-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 opacity-50 cursor-not-allowed" disabled="">
<span class="material-symbols-outlined" data-icon="logout">logout</span>
                        Check-out
                    </button>
</div>
</div>
</section>
<!-- Quick Links -->
<section class="flex flex-col gap-stack-sm">
<h3 class="font-label-md text-label-md text-on-surface-variant px-1">Akses Cepat</h3>
<div class="grid grid-cols-3 gap-3">
<button class="bg-surface rounded-xl border border-surface-container-high p-4 flex flex-col items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm active:scale-95">
<div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="history">history</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface">Riwayat</span>
</button>
<button class="bg-surface rounded-xl border border-surface-container-high p-4 flex flex-col items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm active:scale-95">
<div class="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="post_add">post_add</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface">Pengajuan</span>
</button>
<button class="bg-surface rounded-xl border border-surface-container-high p-4 flex flex-col items-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm active:scale-95">
<div class="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface text-center">Jadwal Shift</span>
</button>
</div>
</section>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 py-3 bg-surface dark:bg-surface-dim shadow-[0_-2px_4px_rgba(0,0,0,0.05)] z-50 md:hidden">
<!-- Beranda (Active) -->
<button class="flex flex-col items-center justify-center bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary rounded-full px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest active:scale-95 transition-all duration-200 group">
<span class="material-symbols-outlined mb-1" data-icon="home" style="font-variation-settings: 'FILL' 1;">home</span>
<span class="font-label-sm text-label-sm">Beranda</span>
</button>
<!-- Riwayat -->
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200 group">
<span class="material-symbols-outlined mb-1 group-hover:text-primary transition-colors" data-icon="history">history</span>
<span class="font-label-sm text-label-sm group-hover:text-primary transition-colors">Riwayat</span>
</button>
<!-- Pengajuan -->
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200 group">
<span class="material-symbols-outlined mb-1 group-hover:text-primary transition-colors" data-icon="post_add">post_add</span>
<span class="font-label-sm text-label-sm group-hover:text-primary transition-colors">Pengajuan</span>
</button>
<!-- Shift -->
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200 group">
<span class="material-symbols-outlined mb-1 group-hover:text-primary transition-colors" data-icon="schedule">schedule</span>
<span class="font-label-sm text-label-sm group-hover:text-primary transition-colors">Shift</span>
</button>
<!-- Profil -->
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200 group">
<span class="material-symbols-outlined mb-1 group-hover:text-primary transition-colors" data-icon="person">person</span>
<span class="font-label-sm text-label-sm group-hover:text-primary transition-colors">Profil</span>
</button>
</nav>
<script>
        // Simple clock script for prototype feel
        function updateClock() {
            const now = new Date();
            let hours = now.getHours().toString().padStart(2, '0');
            let minutes = now.getMinutes().toString().padStart(2, '0');
            // Keep it static for design consistency, or uncomment to make it live
            // document.getElementById('realtime-clock').textContent = `${hours}:${minutes}`;
        }
        setInterval(updateClock, 60000);
    </script>
</body></html>

<!-- Splash Screen -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Absensi Digital Karyawan</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#F9F9FF",
                        "success": "#2E7D32",
                        "secondary-container": "#9c48ea",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#004395",
                        "on-primary-fixed": "#001a42",
                        "secondary": "#8127cf",
                        "primary-container": "#2170E4",
                        "surface-container": "#ededf8",
                        "tertiary": "#792c00",
                        "inverse-surface": "#2e3039",
                        "on-background": "#191b23",
                        "secondary-fixed": "#f0dbff",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "outline": "#727784",
                        "tertiary-fixed": "#ffdbcd",
                        "primary": "#004191",
                        "on-tertiary-fixed": "#360f00",
                        "on-tertiary-container": "#ffc9b3",
                        "on-surface-variant": "#424753",
                        "tertiary-container": "#9f3d01",
                        "outline-variant": "#c2c6d5",
                        "pending": "#ED6C02",
                        "inverse-on-surface": "#f0f0fb",
                        "tertiary-fixed-dim": "#ffb596",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed-variant": "#6900b3",
                        "on-error-container": "#93000a",
                        "surface-dim": "#d9d9e4",
                        "surface-container-high": "#e7e7f3",
                        "secondary-fixed-dim": "#ddb7ff",
                        "surface-bright": "#faf8ff",
                        "surface-container-highest": "#e1e1ed",
                        "on-primary-container": "#c4d5ff",
                        "error": "#BA1A1A",
                        "primary-fixed-dim": "#adc6ff",
                        "on-secondary-container": "#fffbff",
                        "primary-fixed": "#d8e2ff",
                        "surface-variant": "#e1e1ed",
                        "inverse-primary": "#adc6ff",
                        "on-secondary": "#ffffff",
                        "surface": "#FFFFFF",
                        "on-surface": "#191b23",
                        "on-tertiary-fixed-variant": "#7c2e00",
                        "on-secondary-fixed": "#2c0050",
                        "surface-container-low": "#f3f3fe",
                        "surface-tint": "#085ac0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "1rem",
                        "stack-lg": "1.5rem",
                        "margin-tablet": "1.5rem",
                        "margin-mobile": "1rem",
                        "stack-sm": "0.5rem",
                        "gutter": "1rem"
                    },
                    "fontFamily": {
                        "headline-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "label-md": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "label-sm": ["Inter"]
                    },
                    "fontSize": {
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        .loading-dot {
            animation: bounce 1.4s infinite ease-in-out both;
        }
        .loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .loading-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface text-on-surface h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden font-body-md antialiased">
<!-- Decorative subtle background elements -->
<div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
<div class="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary-fixed-dim blur-3xl"></div>
<div class="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-secondary-fixed-dim blur-3xl"></div>
</div>
<!-- Main Content Container -->
<div class="flex flex-col items-center justify-center z-10 w-full max-w-sm px-margin-mobile">
<!-- Logo -->
<div class="mb-stack-lg relative">
<div class="w-24 h-24 bg-primary rounded-xl flex items-center justify-center shadow-md transform rotate-3">
<span class="material-symbols-outlined text-on-primary text-5xl transform -rotate-3" style="font-variation-settings: 'FILL' 1;">
                    domain_verification
                </span>
</div>
<!-- Subtle glow behind logo -->
<div class="absolute inset-0 bg-primary opacity-30 rounded-xl blur-lg -z-10 animate-pulse"></div>
</div>
<!-- Typography -->
<h1 class="font-display-lg text-display-lg text-primary mb-stack-sm text-center tracking-tight">
            AttendX
        </h1>
<p class="font-body-lg text-body-lg text-on-surface-variant text-center max-w-xs mx-auto">
            Absensi Digital Karyawan
        </p>
</div>
<!-- Loading Indicator -->
<div class="absolute bottom-16 left-0 w-full flex justify-center items-center gap-2 z-10">
<div class="w-2.5 h-2.5 rounded-full bg-primary loading-dot"></div>
<div class="w-2.5 h-2.5 rounded-full bg-primary loading-dot opacity-80"></div>
<div class="w-2.5 h-2.5 rounded-full bg-primary loading-dot opacity-60"></div>
</div>
<script>
        // Simulate a brief loading sequence before redirecting (for demonstration)
        setTimeout(() => {
            // In a real app, this would route to login or dashboard
            console.log('Splash screen completed.');
        }, 2500);
    </script>
</body></html>

<!-- Login Screen -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Masuk ke Akun</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "background": "#F9F9FF",
                      "success": "#2E7D32",
                      "secondary-container": "#9c48ea",
                      "surface-container-lowest": "#ffffff",
                      "on-error": "#ffffff",
                      "on-primary-fixed-variant": "#004395",
                      "on-primary-fixed": "#001a42",
                      "secondary": "#8127cf",
                      "primary-container": "#2170E4",
                      "surface-container": "#ededf8",
                      "tertiary": "#792c00",
                      "inverse-surface": "#2e3039",
                      "on-background": "#191b23",
                      "secondary-fixed": "#f0dbff",
                      "on-primary": "#ffffff",
                      "on-tertiary": "#ffffff",
                      "outline": "#727784",
                      "tertiary-fixed": "#ffdbcd",
                      "primary": "#004191",
                      "on-tertiary-fixed": "#360f00",
                      "on-tertiary-container": "#ffc9b3",
                      "on-surface-variant": "#424753",
                      "tertiary-container": "#9f3d01",
                      "outline-variant": "#c2c6d5",
                      "pending": "#ED6C02",
                      "inverse-on-surface": "#f0f0fb",
                      "tertiary-fixed-dim": "#ffb596",
                      "error-container": "#ffdad6",
                      "on-secondary-fixed-variant": "#6900b3",
                      "on-error-container": "#93000a",
                      "surface-dim": "#d9d9e4",
                      "surface-container-high": "#e7e7f3",
                      "secondary-fixed-dim": "#ddb7ff",
                      "surface-bright": "#faf8ff",
                      "surface-container-highest": "#e1e1ed",
                      "on-primary-container": "#c4d5ff",
                      "error": "#BA1A1A",
                      "primary-fixed-dim": "#adc6ff",
                      "on-secondary-container": "#fffbff",
                      "primary-fixed": "#d8e2ff",
                      "surface-variant": "#e1e1ed",
                      "inverse-primary": "#adc6ff",
                      "on-secondary": "#ffffff",
                      "surface": "#FFFFFF",
                      "on-surface": "#191b23",
                      "on-tertiary-fixed-variant": "#7c2e00",
                      "on-secondary-fixed": "#2c0050",
                      "surface-container-low": "#f3f3fe",
                      "surface-tint": "#085ac0"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "stack-md": "1rem",
                      "stack-lg": "1.5rem",
                      "margin-tablet": "1.5rem",
                      "margin-mobile": "1rem",
                      "stack-sm": "0.5rem",
                      "gutter": "1rem"
              },
              "fontFamily": {
                      "headline-md": [
                              "Inter"
                      ],
                      "body-lg": [
                              "Inter"
                      ],
                      "label-md": [
                              "Inter"
                      ],
                      "body-md": [
                              "Inter"
                      ],
                      "headline-lg-mobile": [
                              "Inter"
                      ],
                      "headline-lg": [
                              "Inter"
                      ],
                      "display-lg": [
                              "Inter"
                      ],
                      "label-sm": [
                              "Inter"
                      ]
              },
              "fontSize": {
                      "headline-md": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-lg": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ],
                      "label-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "500"
                              }
                      ],
                      "body-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "400"
                              }
                      ],
                      "headline-lg-mobile": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ],
                      "headline-lg": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "fontWeight": "600"
                              }
                      ],
                      "display-lg": [
                              "32px",
                              {
                                      "lineHeight": "40px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "700"
                              }
                      ],
                      "label-sm": [
                              "12px",
                              {
                                      "lineHeight": "16px",
                                      "letterSpacing": "0.05em",
                                      "fontWeight": "600"
                              }
                      ]
              }
      },
          },
        }
    </script>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background min-h-[884px] flex flex-col justify-center items-center selection:bg-primary selection:text-on-primary">
<main class="w-full max-w-md px-margin-mobile flex flex-col h-full py-8 sm:py-12">
<div class="flex-grow flex flex-col justify-center">
<!-- Brand / Logo -->
<div class="flex items-center gap-2 mb-stack-lg">
<div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
<span class="material-symbols-outlined text-on-primary" style="font-variation-settings: 'FILL' 1;">fingerprint</span>
</div>
<span class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">AttendX</span>
</div>
<!-- Header Content -->
<div class="mb-stack-lg">
<h1 class="font-display-lg text-display-lg text-on-background mb-2">Masuk ke Akun</h1>
<p class="font-body-md text-body-md text-on-surface-variant">Gunakan akun karyawan yang telah didaftarkan perusahaan</p>
</div>
<!-- Form Area -->
<form class="flex flex-col gap-stack-md" onsubmit="event.preventDefault();">
<!-- Email Input -->
<div class="flex flex-col gap-1">
<label class="font-label-md text-label-md text-on-surface ml-1" for="email">Email</label>
<div class="relative flex items-center group">
<span class="material-symbols-outlined absolute left-4 text-outline group-focus-within:text-primary transition-colors duration-200">mail</span>
<input class="w-full bg-surface border border-outline-variant rounded-xl pl-12 pr-4 py-3.5 font-body-lg text-body-lg text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 shadow-sm" id="email" placeholder="contoh@perusahaan.com" required="" type="email"/>
</div>
</div>
<!-- Password Input -->
<div class="flex flex-col gap-1">
<label class="font-label-md text-label-md text-on-surface ml-1" for="password">Kata Sandi</label>
<div class="relative flex items-center group">
<span class="material-symbols-outlined absolute left-4 text-outline group-focus-within:text-primary transition-colors duration-200">lock</span>
<input class="w-full bg-surface border border-outline-variant rounded-xl pl-12 pr-12 py-3.5 font-body-lg text-body-lg text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 shadow-sm" id="password" placeholder="Masukkan kata sandi" required="" type="password"/>
<button aria-label="Toggle password visibility" class="absolute right-4 text-outline hover:text-on-surface-variant focus:outline-none transition-colors" type="button">
<span class="material-symbols-outlined">visibility_off</span>
</button>
</div>
</div>
<!-- Forgot Password Link -->
<div class="flex justify-end mt-1 mb-2">
<a class="font-label-md text-label-md text-primary hover:text-primary-container transition-colors active:scale-95" href="#">Lupa kata sandi?</a>
</div>
<!-- Login Button -->
<button class="w-full bg-primary text-on-primary font-headline-md text-headline-md py-3.5 rounded-full mt-2 shadow-sm hover:bg-primary-container transition-colors duration-200 active:scale-[0.98]" type="submit">
                    Masuk
                </button>
</form>
</div>
<!-- Security Note Footer -->
<div class="mt-8 flex items-center justify-center gap-2 text-outline">
<span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">security</span>
<span class="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Data absensi kamu terlindungi</span>
</div>
</main>
</body></html>

<!-- Persiapan Check-in -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" name="viewport"/>
<title>Persiapan Check-in - AttendX</title>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS Config -->
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#F9F9FF",
                        "success": "#2E7D32",
                        "secondary-container": "#9c48ea",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#004395",
                        "on-primary-fixed": "#001a42",
                        "secondary": "#8127cf",
                        "primary-container": "#2170E4",
                        "surface-container": "#ededf8",
                        "tertiary": "#792c00",
                        "inverse-surface": "#2e3039",
                        "on-background": "#191b23",
                        "secondary-fixed": "#f0dbff",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "outline": "#727784",
                        "tertiary-fixed": "#ffdbcd",
                        "primary": "#004191",
                        "on-tertiary-fixed": "#360f00",
                        "on-tertiary-container": "#ffc9b3",
                        "on-surface-variant": "#424753",
                        "tertiary-container": "#9f3d01",
                        "outline-variant": "#c2c6d5",
                        "pending": "#ED6C02",
                        "inverse-on-surface": "#f0f0fb",
                        "tertiary-fixed-dim": "#ffb596",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed-variant": "#6900b3",
                        "on-error-container": "#93000a",
                        "surface-dim": "#d9d9e4",
                        "surface-container-high": "#e7e7f3",
                        "secondary-fixed-dim": "#ddb7ff",
                        "surface-bright": "#faf8ff",
                        "surface-container-highest": "#e1e1ed",
                        "on-primary-container": "#c4d5ff",
                        "error": "#BA1A1A",
                        "primary-fixed-dim": "#adc6ff",
                        "on-secondary-container": "#fffbff",
                        "primary-fixed": "#d8e2ff",
                        "surface-variant": "#e1e1ed",
                        "inverse-primary": "#adc6ff",
                        "on-secondary": "#ffffff",
                        "surface": "#FFFFFF",
                        "on-surface": "#191b23",
                        "on-tertiary-fixed-variant": "#7c2e00",
                        "on-secondary-fixed": "#2c0050",
                        "surface-container-low": "#f3f3fe",
                        "surface-tint": "#085ac0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "1rem",
                        "stack-lg": "1.5rem",
                        "margin-tablet": "1.5rem",
                        "margin-mobile": "1rem",
                        "stack-sm": "0.5rem",
                        "gutter": "1rem"
                    },
                    "fontFamily": {
                        "headline-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "label-md": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "label-sm": ["Inter"]
                    },
                    "fontSize": {
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
        /* Hide scrollbar for a cleaner look */
        ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
        }
        body {
            -webkit-tap-highlight-color: transparent;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined.fill {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .shimmer {
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite linear;
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
<!-- Transactional Header -->
<header class="flex items-center px-margin-mobile py-4 bg-background relative z-10 shrink-0">
<button aria-label="Kembali" class="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container-high transition-colors -ml-2">
<span class="material-symbols-outlined text-on-background text-2xl">arrow_back</span>
</button>
<h1 class="font-headline-md text-headline-md text-on-background ml-2">Persiapan Check-in</h1>
</header>
<!-- Main Content Canvas -->
<main class="flex-1 overflow-y-auto px-margin-mobile pb-32 relative">
<!-- Work Mode Badge Area -->
<div class="mt-stack-md mb-stack-lg flex items-center justify-between">
<span class="font-label-md text-label-md text-on-surface-variant">Mode Kerja</span>
<div class="inline-flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed-variant px-3 py-1.5 rounded-full">
<span class="material-symbols-outlined text-[16px]">business</span>
<span class="font-label-sm text-label-sm uppercase">WFO</span>
</div>
</div>
<!-- Location Status Indicator -->
<div class="bg-surface-container-low rounded-xl p-4 mb-stack-lg border border-outline-variant/30 flex items-center gap-3">
<div class="relative flex h-3 w-3">
<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-pending opacity-75"></span>
<span class="relative inline-flex rounded-full h-3 w-3 bg-pending"></span>
</div>
<p class="font-body-md text-body-md text-on-background">Mengecek lokasi kantor...</p>
</div>
<h2 class="font-label-md text-label-md text-on-surface-variant mb-stack-sm">Persyaratan Sistem</h2>
<!-- Prerequisites Checklist (Bento-style stacked cards) -->
<div class="flex flex-col gap-3">
<!-- GPS Card -->
<div class="bg-surface rounded-xl p-4 shadow-sm border border-outline-variant flex items-center gap-4 relative overflow-hidden transition-all">
<div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-primary text-2xl">satellite_alt</span>
</div>
<div class="flex-1">
<h3 class="font-label-md text-label-md text-on-background">Lokasi GPS</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-[13px] mt-0.5">Mendeteksi koordinat...</p>
</div>
<div class="w-6 h-6 rounded-full border-2 border-outline-variant flex items-center justify-center">
<!-- Icon pending state -->
<span class="material-symbols-outlined text-[14px] text-outline-variant">more_horiz</span>
</div>
<!-- Shimmer effect for pending state -->
<div class="absolute inset-0 shimmer pointer-events-none"></div>
</div>
<!-- Face Validation Card -->
<div class="bg-surface rounded-xl p-4 shadow-sm border border-outline-variant flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-on-surface-variant text-2xl">face</span>
</div>
<div class="flex-1">
<h3 class="font-label-md text-label-md text-on-background text-opacity-50">Validasi Wajah</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-[13px] mt-0.5 text-opacity-50">Menunggu kamera</p>
</div>
<div class="w-6 h-6 rounded-full border-2 border-outline-variant border-opacity-30 flex items-center justify-center">
</div>
</div>
<!-- Liveness Check Card -->
<div class="bg-surface rounded-xl p-4 shadow-sm border border-outline-variant flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-on-surface-variant text-2xl">vital_signs</span>
</div>
<div class="flex-1">
<h3 class="font-label-md text-label-md text-on-background text-opacity-50">Liveness Check</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-[13px] mt-0.5 text-opacity-50">Deteksi pergerakan</p>
</div>
<div class="w-6 h-6 rounded-full border-2 border-outline-variant border-opacity-30 flex items-center justify-center">
</div>
</div>
</div>
</main>
<!-- Fixed Bottom Action Area -->
<div class="fixed bottom-0 left-0 w-full bg-background pt-4 pb-6 px-margin-mobile border-t border-surface-variant z-20">
<div class="flex items-start gap-2 mb-4 justify-center">
<span class="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0 mt-0.5">info</span>
<p class="font-body-md text-body-md text-on-surface-variant text-center text-[13px]">
                Pastikan GPS aktif dan wajah terlihat jelas
            </p>
</div>
<button class="w-full bg-primary hover:bg-surface-tint text-on-primary font-label-md text-label-md py-4 rounded-full shadow-sm active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2">
            Mulai Verifikasi
            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
</button>
</div>
<!-- Script to simulate loading step (optional enhancement for visual feedback) -->
<script>
        // Simple script to change GPS pending state to success after 2 seconds for visual interest
        setTimeout(() => {
            const gpsCard = document.querySelector('.shimmer').parentElement;
            const gpsShimmer = document.querySelector('.shimmer');
            const gpsIconBox = gpsCard.querySelector('.w-6.h-6');
            const gpsSubtitle = gpsCard.querySelector('.flex-1 p');
            
            if(gpsShimmer) gpsShimmer.remove();
            
            gpsIconBox.classList.remove('border-outline-variant');
            gpsIconBox.classList.add('bg-success', 'border-success');
            gpsIconBox.innerHTML = '<span class="material-symbols-outlined text-[14px] text-on-primary font-bold">check</span>';
            
            gpsSubtitle.textContent = 'Akurat (Radius 15m)';
            gpsSubtitle.classList.add('text-success');
            
            const locationStatus = document.querySelector('.animate-ping').parentElement.parentElement;
            locationStatus.innerHTML = `
                <span class="material-symbols-outlined text-success">check_circle</span>
                <p class="font-body-md text-body-md text-success font-medium">Berada di area kantor</p>
            `;
            locationStatus.classList.replace('bg-surface-container-low', 'bg-success/10');
            locationStatus.classList.replace('border-outline-variant/30', 'border-success/30');

            // Visually "unlock" the next steps
            const nextCards = document.querySelectorAll('.text-opacity-50');
            nextCards.forEach(el => el.classList.remove('text-opacity-50'));
            const nextBorders = document.querySelectorAll('.border-opacity-30');
            nextBorders.forEach(el => el.classList.remove('border-opacity-30'));

        }, 2000);
    </script>
</body></html>

<!-- Validasi Lokasi -->
<!DOCTYPE html>

<html class="light" lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Validasi Lokasi</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#F9F9FF",
                        "success": "#2E7D32",
                        "secondary-container": "#9c48ea",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#004395",
                        "on-primary-fixed": "#001a42",
                        "secondary": "#8127cf",
                        "primary-container": "#2170E4",
                        "surface-container": "#ededf8",
                        "tertiary": "#792c00",
                        "inverse-surface": "#2e3039",
                        "on-background": "#191b23",
                        "secondary-fixed": "#f0dbff",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "outline": "#727784",
                        "tertiary-fixed": "#ffdbcd",
                        "primary": "#004191",
                        "on-tertiary-fixed": "#360f00",
                        "on-tertiary-container": "#ffc9b3",
                        "on-surface-variant": "#424753",
                        "tertiary-container": "#9f3d01",
                        "outline-variant": "#c2c6d5",
                        "pending": "#ED6C02",
                        "inverse-on-surface": "#f0f0fb",
                        "tertiary-fixed-dim": "#ffb596",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed-variant": "#6900b3",
                        "on-error-container": "#93000a",
                        "surface-dim": "#d9d9e4",
                        "surface-container-high": "#e7e7f3",
                        "secondary-fixed-dim": "#ddb7ff",
                        "surface-bright": "#faf8ff",
                        "surface-container-highest": "#e1e1ed",
                        "on-primary-container": "#c4d5ff",
                        "error": "#BA1A1A",
                        "primary-fixed-dim": "#adc6ff",
                        "on-secondary-container": "#fffbff",
                        "primary-fixed": "#d8e2ff",
                        "surface-variant": "#e1e1ed",
                        "inverse-primary": "#adc6ff",
                        "on-secondary": "#ffffff",
                        "surface": "#FFFFFF",
                        "on-surface": "#191b23",
                        "on-tertiary-fixed-variant": "#7c2e00",
                        "on-secondary-fixed": "#2c0050",
                        "surface-container-low": "#f3f3fe",
                        "surface-tint": "#085ac0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "1rem",
                        "stack-lg": "1.5rem",
                        "margin-tablet": "1.5rem",
                        "margin-mobile": "1rem",
                        "stack-sm": "0.5rem",
                        "gutter": "1rem"
                    },
                    "fontFamily": {
                        "headline-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "label-md": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "label-sm": ["Inter"]
                    },
                    "fontSize": {
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .fill-icon {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col">
<!-- TopAppBar -->
<header class="bg-surface shadow-sm w-full top-0 flex items-center justify-between px-margin-mobile py-2 z-50">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary-fixed overflow-hidden">
<span class="material-symbols-outlined text-sm">person</span>
</div>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">AttendX</h1>
</div>
<button class="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-transform">
<span class="material-symbols-outlined">notifications</span>
</button>
</header>
<!-- Main Content Canvas -->
<main class="flex-1 flex flex-col px-margin-mobile pt-stack-lg pb-32 gap-stack-md w-full max-w-md mx-auto">
<!-- Header Section -->
<div class="flex items-center gap-3 mb-2">
<button class="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface">
<span class="material-symbols-outlined">arrow_back</span>
</button>
<h2 class="font-headline-md text-headline-md text-on-surface">Validasi Lokasi</h2>
</div>
<!-- Map Card -->
<div class="bg-surface rounded-[12px] border border-outline-variant shadow-sm overflow-hidden flex flex-col">
<!-- Map Area -->
<div class="relative w-full h-64 bg-surface-container-low" data-alt="A detailed, modern digital map view focused on a corporate office location in Jakarta. The map style is clean, bright, and professional, using a light mode aesthetic with soft whites, pale grays, and subtle blue accents for water features. Roads are rendered with crisp, thin lines. The lighting represents a clear daytime view. The overall mood is precise, efficient, and technologically advanced, fitting an enterprise software interface." data-location="Jakarta" style="">
<img alt="Map background" class="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[30%] mix-blend-multiply" data-alt="A detailed, modern digital map view focused on a corporate office location in Jakarta. The map style is clean, bright, and professional, using a light mode aesthetic with soft whites, pale grays, and subtle blue accents for water features. Roads are rendered with crisp, thin lines. The lighting represents a clear daytime view. The overall mood is precise, efficient, and technologically advanced, fitting an enterprise software interface." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJMKu5ZIGFSQ22LwCMhCY3cjCv6F16Yr2OFdkfUb3e5aFfiCAl-vDBxLskqwVBoqkWtYswKpTFA8XWO-C-7LQS8T2DpktbwYnm-G8b9TGlmydC2Iw3czSsS9m2xNv8G5z9ROwVR__g0oToA3iOB1MtNBav9XqwodXbIXXCJQ2JeJtjuZJ6ycKR9AYRWDGvR9D2Rxwi1wVWauVbbBHVro_zMdngcSDZu1z8E-X9rS2veRvK5ou36jFEwYMSOdMe3-GENEhAiBStJcg"/>
<!-- Geofence Overlay -->
<div class="absolute inset-0 flex items-center justify-center">
<div class="w-32 h-32 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center animate-pulse">
<!-- Current Location Pin -->
<div class="relative flex items-center justify-center">
<span class="material-symbols-outlined fill-icon text-primary text-4xl drop-shadow-md">location_on</span>
<div class="absolute w-3 h-3 bg-white rounded-full top-[6px]"></div>
</div>
</div>
</div>
</div>
<!-- Location Details -->
<div class="p-4 flex flex-col gap-2">
<div class="flex justify-between items-start">
<div>
<h3 class="font-label-md text-label-md text-on-surface mb-1">Kantor Pusat</h3>
<p class="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">radar</span>
                            Radius valid: 100 meter
                        </p>
</div>
<!-- Status Badge -->
<div class="bg-[#E8F5E9] border border-success/20 px-3 py-1 rounded-full flex items-center gap-1">
<span class="material-symbols-outlined text-success text-[14px] fill-icon">check_circle</span>
<span class="font-label-sm text-label-sm text-success">Dalam Radius</span>
</div>
</div>
</div>
</div>
<!-- Alternate Warning Card (Simulated as present for design preview) -->
<div class="bg-error-container rounded-lg p-3 flex items-start gap-3 border border-error/20">
<span class="material-symbols-outlined text-error mt-0.5">warning</span>
<div>
<p class="font-label-md text-label-md text-on-error-container">Lokasi di luar radius</p>
<p class="font-body-sm text-body-md text-error/80 text-[12px] mt-0.5">Anda harus berada dalam radius 100 meter dari titik absensi.</p>
</div>
</div>
</main>
<!-- Bottom Fixed Action -->
<div class="fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant p-margin-mobile pb-safe z-40 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
<div class="w-full max-w-md">
<button class="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all text-on-primary font-label-md text-label-md py-4 rounded-full flex items-center justify-center gap-2 shadow-sm">
<span>Lanjut Verifikasi Wajah</span>
<span class="material-symbols-outlined text-[20px]">arrow_forward</span>
</button>
</div>
</div>
</body></html>

<!-- Check-in Berhasil -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Check-in Berhasil</title>
<!-- Google Fonts: Inter & Material Symbols Outlined -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#F9F9FF",
                        "success": "#2E7D32",
                        "secondary-container": "#9c48ea",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#004395",
                        "on-primary-fixed": "#001a42",
                        "secondary": "#8127cf",
                        "primary-container": "#2170E4",
                        "surface-container": "#ededf8",
                        "tertiary": "#792c00",
                        "inverse-surface": "#2e3039",
                        "on-background": "#191b23",
                        "secondary-fixed": "#f0dbff",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "outline": "#727784",
                        "tertiary-fixed": "#ffdbcd",
                        "primary": "#004191",
                        "on-tertiary-fixed": "#360f00",
                        "on-tertiary-container": "#ffc9b3",
                        "on-surface-variant": "#424753",
                        "tertiary-container": "#9f3d01",
                        "outline-variant": "#c2c6d5",
                        "pending": "#ED6C02",
                        "inverse-on-surface": "#f0f0fb",
                        "tertiary-fixed-dim": "#ffb596",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed-variant": "#6900b3",
                        "on-error-container": "#93000a",
                        "surface-dim": "#d9d9e4",
                        "surface-container-high": "#e7e7f3",
                        "secondary-fixed-dim": "#ddb7ff",
                        "surface-bright": "#faf8ff",
                        "surface-container-highest": "#e1e1ed",
                        "on-primary-container": "#c4d5ff",
                        "error": "#BA1A1A",
                        "primary-fixed-dim": "#adc6ff",
                        "on-secondary-container": "#fffbff",
                        "primary-fixed": "#d8e2ff",
                        "surface-variant": "#e1e1ed",
                        "inverse-primary": "#adc6ff",
                        "on-secondary": "#ffffff",
                        "surface": "#FFFFFF",
                        "on-surface": "#191b23",
                        "on-tertiary-fixed-variant": "#7c2e00",
                        "on-secondary-fixed": "#2c0050",
                        "surface-container-low": "#f3f3fe",
                        "surface-tint": "#085ac0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "1rem",
                        "stack-lg": "1.5rem",
                        "margin-tablet": "1.5rem",
                        "margin-mobile": "1rem",
                        "stack-sm": "0.5rem",
                        "gutter": "1rem"
                    },
                    "fontFamily": {
                        "headline-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "label-md": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "label-sm": ["Inter"]
                    },
                    "fontSize": {
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }]
                    },
                    "keyframes": {
                        "popIn": {
                            "0%": { transform: "scale(0.8)", opacity: "0" },
                            "100%": { transform: "scale(1)", opacity: "1" }
                        },
                        "slideUp": {
                            "0%": { transform: "translateY(20px)", opacity: "0" },
                            "100%": { transform: "translateY(0)", opacity: "1" }
                        }
                    },
                    "animation": {
                        "pop-in": "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                        "slide-up": "slideUp 0.6s ease-out forwards"
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .icon-fill {
            font-variation-settings: 'FILL' 1;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen flex flex-col items-center justify-center relative px-margin-mobile py-8 overflow-hidden antialiased">
<!-- Decorative background elements -->
<div class="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-success/5 via-transparent to-transparent pointer-events-none z-0"></div>
<main class="w-full max-w-md z-10 flex flex-col items-center flex-grow justify-center">
<!-- Success Animation & Hero -->
<div class="flex flex-col items-center text-center animate-pop-in mb-stack-lg">
<div class="relative mb-6">
<div class="absolute inset-0 bg-success/10 rounded-full scale-150 blur-xl"></div>
<span class="material-symbols-outlined icon-fill text-[80px] text-success relative z-10 drop-shadow-md">check_circle</span>
</div>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Check-in Berhasil</h1>
<p class="font-body-md text-body-md text-on-surface-variant">Absensi kamu berhasil dicatat</p>
</div>
<!-- Summary Card -->
<div class="w-full bg-surface rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-surface-container-highest p-6 mb-stack-lg animate-slide-up" style="animation-delay: 0.2s; opacity: 0;">
<div class="flex flex-col space-y-4">
<!-- Highlighted Row: Jam Masuk -->
<div class="flex justify-between items-center pb-4 border-b border-surface-container-highest">
<span class="font-body-md text-body-md text-on-surface-variant">Jam Masuk</span>
<span class="font-headline-md text-headline-md text-primary">07:58</span>
</div>
<!-- Detail Rows -->
<div class="flex justify-between items-center py-2">
<span class="font-body-md text-body-md text-on-surface-variant">Shift</span>
<span class="font-label-md text-label-md text-on-surface">08:00 - 17:00</span>
</div>
<div class="flex justify-between items-center py-2">
<span class="font-body-md text-body-md text-on-surface-variant">Mode</span>
<span class="font-label-md text-label-md text-on-surface bg-surface-container-high px-3 py-1 rounded-md">WFO</span>
</div>
<div class="flex justify-between items-center py-2">
<span class="font-body-md text-body-md text-on-surface-variant">Validasi wajah</span>
<div class="flex items-center space-x-1 text-success bg-success/10 px-2 py-0.5 rounded-full">
<span class="material-symbols-outlined icon-fill text-[14px]">verified</span>
<span class="font-label-sm text-label-sm">Berhasil</span>
</div>
</div>
<div class="flex justify-between items-center pt-2">
<span class="font-body-md text-body-md text-on-surface-variant">Validasi lokasi</span>
<div class="flex items-center space-x-1 text-success bg-success/10 px-2 py-0.5 rounded-full">
<span class="material-symbols-outlined icon-fill text-[14px]">location_on</span>
<span class="font-label-sm text-label-sm">Berhasil</span>
</div>
</div>
</div>
</div>
</main>
<!-- Bottom Action -->
<div class="w-full max-w-md z-10 mt-auto pt-6 pb-2 animate-slide-up" style="animation-delay: 0.4s; opacity: 0;">
<button class="w-full bg-primary hover:bg-surface-tint text-on-primary font-label-md text-label-md py-4 rounded-full flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm">
<span>Kembali ke Beranda</span>
</button>
</div>
</body></html>

<!-- Daftar Pengajuan -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Pengajuan</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#F9F9FF",
                        "success": "#2E7D32",
                        "secondary-container": "#9c48ea",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#004395",
                        "on-primary-fixed": "#001a42",
                        "secondary": "#8127cf",
                        "primary-container": "#2170E4",
                        "surface-container": "#ededf8",
                        "tertiary": "#792c00",
                        "inverse-surface": "#2e3039",
                        "on-background": "#191b23",
                        "secondary-fixed": "#f0dbff",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "outline": "#727784",
                        "tertiary-fixed": "#ffdbcd",
                        "primary": "#004191",
                        "on-tertiary-fixed": "#360f00",
                        "on-tertiary-container": "#ffc9b3",
                        "on-surface-variant": "#424753",
                        "tertiary-container": "#9f3d01",
                        "outline-variant": "#c2c6d5",
                        "pending": "#ED6C02",
                        "inverse-on-surface": "#f0f0fb",
                        "tertiary-fixed-dim": "#ffb596",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed-variant": "#6900b3",
                        "on-error-container": "#93000a",
                        "surface-dim": "#d9d9e4",
                        "surface-container-high": "#e7e7f3",
                        "secondary-fixed-dim": "#ddb7ff",
                        "surface-bright": "#faf8ff",
                        "surface-container-highest": "#e1e1ed",
                        "on-primary-container": "#c4d5ff",
                        "error": "#BA1A1A",
                        "primary-fixed-dim": "#adc6ff",
                        "on-secondary-container": "#fffbff",
                        "primary-fixed": "#d8e2ff",
                        "surface-variant": "#e1e1ed",
                        "inverse-primary": "#adc6ff",
                        "on-secondary": "#ffffff",
                        "surface": "#FFFFFF",
                        "on-surface": "#191b23",
                        "on-tertiary-fixed-variant": "#7c2e00",
                        "on-secondary-fixed": "#2c0050",
                        "surface-container-low": "#f3f3fe",
                        "surface-tint": "#085ac0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "1rem",
                        "stack-lg": "1.5rem",
                        "margin-tablet": "1.5rem",
                        "margin-mobile": "1rem",
                        "stack-sm": "0.5rem",
                        "gutter": "1rem"
                    },
                    "fontFamily": {
                        "headline-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "label-md": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "label-sm": ["Inter"]
                    },
                    "fontSize": {
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen pb-24 md:hidden">
<!-- TopAppBar -->
<header class="bg-surface dark:bg-surface-dim shadow-sm w-full top-0 flex items-center justify-between px-margin-mobile py-2 sticky z-40">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md">
                U
            </div>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary dark:text-primary-fixed">AttendX</h1>
</div>
<button aria-label="Notifications" class="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-transform">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
</header>
<main class="px-margin-mobile py-stack-md">
<!-- Header Section -->
<div class="mb-stack-lg flex justify-between items-center">
<h2 class="font-headline-md text-headline-md">Pengajuan</h2>
<button class="bg-primary text-on-primary font-label-md px-4 py-2 rounded-full flex items-center gap-2 active:scale-95 transition-transform shadow-sm">
<span class="material-symbols-outlined text-[18px]">add</span>
                Buat
            </button>
</div>
<!-- Filter Tabs (Horizontal Scroll) -->
<div class="flex gap-2 overflow-x-auto pb-2 mb-stack-md hide-scrollbar">
<button class="bg-secondary-container text-on-secondary-container font-label-md px-4 py-1.5 rounded-full whitespace-nowrap">Semua</button>
<button class="bg-surface border border-outline-variant text-on-surface-variant font-label-md px-4 py-1.5 rounded-full whitespace-nowrap">Izin</button>
<button class="bg-surface border border-outline-variant text-on-surface-variant font-label-md px-4 py-1.5 rounded-full whitespace-nowrap">Cuti</button>
<button class="bg-surface border border-outline-variant text-on-surface-variant font-label-md px-4 py-1.5 rounded-full whitespace-nowrap">Pending</button>
</div>
<!-- List Cards -->
<div class="flex flex-col gap-stack-md">
<!-- Pending Card -->
<div class="bg-surface rounded-lg p-4 border border-surface-container-highest shadow-[0_2px_4px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-transform">
<div class="flex justify-between items-start mb-2">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-pending bg-pending/10 p-1.5 rounded-full text-[20px]">schedule</span>
<h3 class="font-label-md text-label-md">Izin Sakit</h3>
</div>
<span class="bg-pending/12 text-pending font-label-sm text-label-sm px-2.5 py-0.5 rounded-full">Pending</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant mb-3">12 Okt 2023</p>
<p class="font-body-md text-body-md line-clamp-2">Demam tinggi dan flu, butuh istirahat selama 2 hari sesuai surat dokter lampiran.</p>
</div>
<!-- Approved Card -->
<div class="bg-surface rounded-lg p-4 border border-surface-container-highest shadow-[0_2px_4px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-transform">
<div class="flex justify-between items-start mb-2">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-success bg-success/10 p-1.5 rounded-full text-[20px]">beach_access</span>
<h3 class="font-label-md text-label-md">Cuti Tahunan</h3>
</div>
<span class="bg-success/12 text-success font-label-sm text-label-sm px-2.5 py-0.5 rounded-full">Disetujui</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant mb-3">01 Okt - 05 Okt 2023</p>
<p class="font-body-md text-body-md line-clamp-2">Liburan keluarga tahunan.</p>
</div>
<!-- Rejected Card -->
<div class="bg-surface rounded-lg p-4 border border-surface-container-highest shadow-[0_2px_4px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-transform">
<div class="flex justify-between items-start mb-2">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-error bg-error/10 p-1.5 rounded-full text-[20px]">event_busy</span>
<h3 class="font-label-md text-label-md">Izin Keperluan</h3>
</div>
<span class="bg-error/12 text-error font-label-sm text-label-sm px-2.5 py-0.5 rounded-full">Ditolak</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant mb-3">25 Sep 2023</p>
<p class="font-body-md text-body-md line-clamp-2">Keperluan keluarga mendadak, tidak bisa ditinggalkan.</p>
</div>
</div>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 py-3 bg-surface dark:bg-surface-dim shadow-[0_-2px_4px_rgba(0,0,0,0.05)] z-50">
<!-- Inactive -->
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined mb-1 text-[24px]" data-icon="home">home</span>
<span class="font-label-sm text-label-sm">Beranda</span>
</a>
<!-- Inactive -->
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined mb-1 text-[24px]" data-icon="history">history</span>
<span class="font-label-sm text-label-sm">Riwayat</span>
</a>
<!-- Active -->
<a class="flex flex-col items-center justify-center bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary rounded-full px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined mb-1 text-[24px]" data-icon="post_add" data-weight="fill" style="font-variation-settings: 'FILL' 1;">post_add</span>
<span class="font-label-sm text-label-sm">Pengajuan</span>
</a>
<!-- Inactive -->
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined mb-1 text-[24px]" data-icon="schedule">schedule</span>
<span class="font-label-sm text-label-sm">Shift</span>
</a>
<!-- Inactive -->
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined mb-1 text-[24px]" data-icon="person">person</span>
<span class="font-label-sm text-label-sm">Profil</span>
</a>
</nav>
<style>
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
</body></html>

<!-- Detail Presensi -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Detail Presensi</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "background": "#F9F9FF",
                      "success": "#2E7D32",
                      "secondary-container": "#9c48ea",
                      "surface-container-lowest": "#ffffff",
                      "on-error": "#ffffff",
                      "on-primary-fixed-variant": "#004395",
                      "on-primary-fixed": "#001a42",
                      "secondary": "#8127cf",
                      "primary-container": "#2170E4",
                      "surface-container": "#ededf8",
                      "tertiary": "#792c00",
                      "inverse-surface": "#2e3039",
                      "on-background": "#191b23",
                      "secondary-fixed": "#f0dbff",
                      "on-primary": "#ffffff",
                      "on-tertiary": "#ffffff",
                      "outline": "#727784",
                      "tertiary-fixed": "#ffdbcd",
                      "primary": "#004191",
                      "on-tertiary-fixed": "#360f00",
                      "on-tertiary-container": "#ffc9b3",
                      "on-surface-variant": "#424753",
                      "tertiary-container": "#9f3d01",
                      "outline-variant": "#c2c6d5",
                      "pending": "#ED6C02",
                      "inverse-on-surface": "#f0f0fb",
                      "tertiary-fixed-dim": "#ffb596",
                      "error-container": "#ffdad6",
                      "on-secondary-fixed-variant": "#6900b3",
                      "on-error-container": "#93000a",
                      "surface-dim": "#d9d9e4",
                      "surface-container-high": "#e7e7f3",
                      "secondary-fixed-dim": "#ddb7ff",
                      "surface-bright": "#faf8ff",
                      "surface-container-highest": "#e1e1ed",
                      "on-primary-container": "#c4d5ff",
                      "error": "#BA1A1A",
                      "primary-fixed-dim": "#adc6ff",
                      "on-secondary-container": "#fffbff",
                      "primary-fixed": "#d8e2ff",
                      "surface-variant": "#e1e1ed",
                      "inverse-primary": "#adc6ff",
                      "on-secondary": "#ffffff",
                      "surface": "#FFFFFF",
                      "on-surface": "#191b23",
                      "on-tertiary-fixed-variant": "#7c2e00",
                      "on-secondary-fixed": "#2c0050",
                      "surface-container-low": "#f3f3fe",
                      "surface-tint": "#085ac0"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "stack-md": "1rem",
                      "stack-lg": "1.5rem",
                      "margin-tablet": "1.5rem",
                      "margin-mobile": "1rem",
                      "stack-sm": "0.5rem",
                      "gutter": "1rem"
              },
              "fontFamily": {
                      "headline-md": ["Inter"],
                      "body-lg": ["Inter"],
                      "label-md": ["Inter"],
                      "body-md": ["Inter"],
                      "headline-lg-mobile": ["Inter"],
                      "headline-lg": ["Inter"],
                      "display-lg": ["Inter"],
                      "label-sm": ["Inter"]
              },
              "fontSize": {
                      "headline-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                      "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                      "label-md": ["14px", {"lineHeight": "20px", "fontWeight": "500"}],
                      "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                      "headline-lg-mobile": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                      "headline-lg": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                      "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                      "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}]
              }
            }
          }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        /* Subtle scrollbar for inner areas if needed */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d9d9e4; border-radius: 4px; }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen font-body-md antialiased pb-stack-lg">
<!-- TopAppBar Shared Component -->
<header class="fixed w-full top-0 z-50 bg-surface shadow-sm flex items-center justify-between px-margin-mobile py-2">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center overflow-hidden">
<span class="material-symbols-outlined text-sm">person</span>
</div>
<span class="font-headline-lg-mobile text-headline-lg-mobile text-primary">AttendX</span>
</div>
<button aria-label="Notifications" class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-transform">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
</header>
<!-- Main Canvas -->
<main class="pt-[72px] px-margin-mobile flex flex-col gap-stack-lg max-w-md mx-auto">
<!-- Header Section: Back Navigation & Context -->
<section class="flex flex-col gap-stack-sm mt-stack-sm">
<div class="flex items-center gap-2 -ml-2">
<button aria-label="Kembali" class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-95 transition-transform" onclick="history.back()">
<span class="material-symbols-outlined">arrow_back</span>
</button>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-on-background">Detail Presensi</h1>
</div>
<div class="flex items-center justify-between pl-1">
<div class="flex flex-col">
<span class="font-body-md text-body-md text-on-surface-variant">Tanggal</span>
<span class="font-label-md text-label-md text-on-background">Senin, 16 Oktober 2023</span>
</div>
<!-- Status Badge -->
<div class="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-success/30">
<span class="material-symbols-outlined text-[16px] text-success">check_circle</span>
<span class="font-label-sm text-label-sm text-success uppercase tracking-wider">Hadir</span>
</div>
</div>
</section>
<!-- Time & Shift Overview Card (Bento Style) -->
<section class="bg-surface rounded-xl p-stack-md shadow-sm border border-surface-container-highest grid grid-cols-2 gap-stack-md">
<!-- Shift -->
<div class="col-span-2 flex items-center justify-between pb-stack-sm border-b border-surface-container-highest">
<div class="flex items-center gap-2 text-on-surface-variant">
<span class="material-symbols-outlined text-[20px]">schedule</span>
<span class="font-body-md text-body-md">Shift Reguler</span>
</div>
<span class="font-label-md text-label-md text-on-background">08:00 - 17:00</span>
</div>
<!-- Jam Masuk -->
<div class="flex flex-col gap-1">
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Jam Masuk</span>
<div class="flex items-center gap-2">
<div class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
<span class="material-symbols-outlined text-[18px] text-primary">login</span>
</div>
<span class="font-headline-md text-headline-md text-on-surface">07:45</span>
</div>
</div>
<!-- Jam Pulang -->
<div class="flex flex-col gap-1">
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Jam Pulang</span>
<div class="flex items-center gap-2">
<div class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
<span class="material-symbols-outlined text-[18px] text-on-surface-variant">logout</span>
</div>
<span class="font-headline-md text-headline-md text-on-surface">17:10</span>
</div>
</div>
<!-- Total Jam -->
<div class="col-span-2 bg-surface-container-low rounded-lg p-3 flex items-center justify-between mt-1 border border-surface-container">
<span class="font-body-md text-body-md text-on-surface-variant">Total Jam Kerja</span>
<span class="font-label-md text-label-md text-primary">9 Jam 25 Menit</span>
</div>
</section>
<!-- Validation & Metrics Card -->
<section class="bg-surface rounded-xl p-stack-md shadow-sm border border-surface-container-highest flex flex-col gap-stack-md">
<h2 class="font-label-md text-label-md text-on-background mb-1">Informasi Validasi</h2>
<ul class="flex flex-col gap-3">
<!-- Mode Kerja -->
<li class="flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">work</span>
</div>
<span class="font-body-md text-body-md text-on-surface-variant">Mode Kerja</span>
</div>
<span class="font-label-md text-label-md text-on-background">Work From Office (WFO)</span>
</li>
<!-- Validasi Lokasi -->
<li class="flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">location_on</span>
</div>
<span class="font-body-md text-body-md text-on-surface-variant">Validasi Lokasi</span>
</div>
<div class="flex items-center gap-1 text-success">
<span class="material-symbols-outlined text-[16px]">check_circle</span>
<span class="font-label-sm text-label-sm uppercase">Sesuai Radius</span>
</div>
</li>
<!-- Validasi Wajah -->
<li class="flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">face</span>
</div>
<span class="font-body-md text-body-md text-on-surface-variant">Validasi Wajah</span>
</div>
<div class="flex items-center gap-1 text-success">
<span class="material-symbols-outlined text-[16px]">check_circle</span>
<span class="font-label-sm text-label-sm uppercase">Terverifikasi</span>
</div>
</li>
<!-- Status Sinkronisasi -->
<li class="flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">sync_saved_locally</span>
</div>
<span class="font-body-md text-body-md text-on-surface-variant">Status Sinkronisasi</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px]">cloud_done</span>
<span class="font-label-sm text-label-sm uppercase">Tersinkron</span>
</div>
</li>
</ul>
</section>
<!-- Location Maps Section -->
<section class="flex flex-col gap-stack-sm">
<h2 class="font-label-md text-label-md text-on-background px-1">Detail Titik Lokasi</h2>
<div class="grid grid-cols-1 gap-stack-sm">
<!-- Lokasi Check-in -->
<div class="bg-surface rounded-xl p-3 shadow-sm border border-surface-container-highest flex items-start gap-3">
<div class="w-10 h-10 rounded-full bg-primary-fixed flex-shrink-0 flex items-center justify-center text-primary mt-1">
<span class="material-symbols-outlined">pin_drop</span>
</div>
<div class="flex flex-col gap-1 w-full">
<div class="flex items-center justify-between">
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Lokasi Check-in</span>
<span class="font-label-sm text-label-sm text-on-surface-variant">07:45</span>
</div>
<span class="font-label-md text-label-md text-on-background leading-tight">Gedung Sudirman Center, Lantai 12</span>
<span class="font-body-sm text-[12px] text-outline mt-1 truncate">Lat: -6.2215, Long: 106.8043</span>
</div>
</div>
<!-- Lokasi Check-out -->
<div class="bg-surface rounded-xl p-3 shadow-sm border border-surface-container-highest flex items-start gap-3 opacity-90">
<div class="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0 flex items-center justify-center text-on-surface-variant mt-1">
<span class="material-symbols-outlined">pin_drop</span>
</div>
<div class="flex flex-col gap-1 w-full">
<div class="flex items-center justify-between">
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Lokasi Check-out</span>
<span class="font-label-sm text-label-sm text-on-surface-variant">17:10</span>
</div>
<span class="font-label-md text-label-md text-on-background leading-tight">Gedung Sudirman Center, Lantai 1</span>
<span class="font-body-sm text-[12px] text-outline mt-1 truncate">Lat: -6.2216, Long: 106.8042</span>
</div>
</div>
</div>
</section>
</main>
<!-- BottomNavBar Suppressed: Detail screens imply temporary departure from main nav flow -->
</body></html>

<!-- Verifikasi Wajah -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Verifikasi Wajah</title>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind Configuration -->
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "background": "#F9F9FF",
                        "success": "#2E7D32",
                        "secondary-container": "#9c48ea",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#004395",
                        "on-primary-fixed": "#001a42",
                        "secondary": "#8127cf",
                        "primary-container": "#2170E4",
                        "surface-container": "#ededf8",
                        "tertiary": "#792c00",
                        "inverse-surface": "#2e3039",
                        "on-background": "#191b23",
                        "secondary-fixed": "#f0dbff",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "outline": "#727784",
                        "tertiary-fixed": "#ffdbcd",
                        "primary": "#004191",
                        "on-tertiary-fixed": "#360f00",
                        "on-tertiary-container": "#ffc9b3",
                        "on-surface-variant": "#424753",
                        "tertiary-container": "#9f3d01",
                        "outline-variant": "#c2c6d5",
                        "pending": "#ED6C02",
                        "inverse-on-surface": "#f0f0fb",
                        "tertiary-fixed-dim": "#ffb596",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed-variant": "#6900b3",
                        "on-error-container": "#93000a",
                        "surface-dim": "#d9d9e4",
                        "surface-container-high": "#e7e7f3",
                        "secondary-fixed-dim": "#ddb7ff",
                        "surface-bright": "#faf8ff",
                        "surface-container-highest": "#e1e1ed",
                        "on-primary-container": "#c4d5ff",
                        "error": "#BA1A1A",
                        "primary-fixed-dim": "#adc6ff",
                        "on-secondary-container": "#fffbff",
                        "primary-fixed": "#d8e2ff",
                        "surface-variant": "#e1e1ed",
                        "inverse-primary": "#adc6ff",
                        "on-secondary": "#ffffff",
                        "surface": "#FFFFFF",
                        "on-surface": "#191b23",
                        "on-tertiary-fixed-variant": "#7c2e00",
                        "on-secondary-fixed": "#2c0050",
                        "surface-container-low": "#f3f3fe",
                        "surface-tint": "#085ac0"
                    },
                    borderRadius: {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    spacing: {
                        "stack-md": "1rem",
                        "stack-lg": "1.5rem",
                        "margin-tablet": "1.5rem",
                        "margin-mobile": "1rem",
                        "stack-sm": "0.5rem",
                        "gutter": "1rem"
                    },
                    fontFamily: {
                        "headline-md": ["Inter", "sans-serif"],
                        "body-lg": ["Inter", "sans-serif"],
                        "label-md": ["Inter", "sans-serif"],
                        "body-md": ["Inter", "sans-serif"],
                        "headline-lg-mobile": ["Inter", "sans-serif"],
                        "headline-lg": ["Inter", "sans-serif"],
                        "display-lg": ["Inter", "sans-serif"],
                        "label-sm": ["Inter", "sans-serif"]
                    },
                    fontSize: {
                        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
                        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
                        "label-md": ["14px", { lineHeight: "20px", fontWeight: "500" }],
                        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
                        "headline-lg-mobile": ["20px", { lineHeight: "28px", fontWeight: "600" }],
                        "headline-lg": ["24px", { lineHeight: "32px", fontWeight: "600" }],
                        "display-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
                        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }]
                    },
                    keyframes: {
                        scan: {
                            '0%, 100%': { transform: 'translateY(-100%)' },
                            '50%': { transform: 'translateY(100%)' },
                        }
                    },
                    animation: {
                        'scan': 'scan 3s ease-in-out infinite',
                    }
                }
            }
        }
    </script>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen font-sans antialiased selection:bg-primary-container selection:text-on-primary-container">
<!-- Main Container - Mobile Constrained -->
<main class="w-full max-w-md mx-auto min-h-screen bg-background flex flex-col relative overflow-hidden shadow-2xl sm:border-x sm:border-outline-variant/30">
<!-- Transactional Header -->
<header class="flex items-center justify-between px-margin-mobile py-4 w-full z-20 bg-background/80 backdrop-blur-md sticky top-0">
<button aria-label="Kembali" class="p-2 -ml-2 rounded-full hover:bg-surface-container-high text-on-surface transition-colors active:scale-95 flex items-center justify-center">
<span class="material-symbols-outlined">arrow_back</span>
</button>
<h1 class="font-headline-md text-headline-md text-on-surface">Verifikasi Wajah</h1>
<div class="w-10"></div> <!-- Visual Balance -->
</header>
<!-- Content Canvas -->
<div class="flex-1 flex flex-col items-center pt-stack-md pb-margin-mobile relative">
<!-- Instruction Text -->
<p class="font-body-lg text-body-lg text-on-surface-variant text-center px-margin-mobile mb-stack-lg z-10">
                Posisikan wajah di dalam frame
            </p>
<!-- Camera Viewport / Biometric UI -->
<div class="relative w-[280px] h-[380px] rounded-[140px] overflow-hidden border-4 border-primary/20 shadow-[0_8px_32px_rgba(0,65,145,0.12)] bg-surface-container-highest flex items-center justify-center z-10 isolate ring-1 ring-black/5">
<!-- Simulated Camera Feed -->
<div class="absolute inset-0 bg-cover bg-center" data-alt="A close-up, front-facing portrait of a professional individual looking directly into the camera with a neutral expression. The background is a soft, out-of-focus modern office environment. The lighting is bright, even, and flattering, aligning with a clean, light-mode corporate aesthetic featuring crisp whites and subtle cool tones." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuC6IEQi-1Ned5sedT8w90IBKa0dcS23NXIkGqHjOjmP2MDE5DF-XqsuMN_NmkdwNtApfHFM6W2ue-oa9ApgTQEOd3dgyds1ul9830LcUN1tWOKiNW-FwmWaLAJ97Oroti4Elyd2lxAwkpqaPa2Krkj22dOCULta3ACpwGpYvoyU1ZeJFhjPye0EXfEeMxG9yPjQDijD9EYF0qtnrEbLyFlizaqZd2ycbRqqbyFJFvJAwf-TBX_kLHDgO4wwjxL0aKTD2I_zdTGUaE4')">
</div>
<!-- Overlay Gradient for Depth -->
<div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
<!-- Face Frame Guidelines (Dashed Oval) -->
<div class="absolute inset-4 border-2 border-dashed border-white/60 rounded-[120px] pointer-events-none"></div>
<!-- Scanning Animation Line -->
<div class="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-primary/30 to-primary/60 border-b-2 border-primary animate-scan pointer-events-none mix-blend-overlay"></div>
<!-- Corner Reticles (Top Left, Top Right, Bottom Left, Bottom Right) -->
<div class="absolute top-8 left-8 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg opacity-80"></div>
<div class="absolute top-8 right-8 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg opacity-80"></div>
<div class="absolute bottom-8 left-8 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg opacity-80"></div>
<div class="absolute bottom-8 right-8 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg opacity-80"></div>
</div>
<!-- Liveness Instruction Card -->
<div class="mt-stack-lg z-10 w-full px-margin-mobile">
<div class="bg-surface shadow-sm border border-outline-variant/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:shadow-md animate-pulse">
<div class="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">visibility</span>
</div>
<div class="flex-1 text-left">
<p class="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-0.5">Liveness Check</p>
<p class="font-headline-md text-headline-md text-on-surface">Kedipkan mata</p>
</div>
</div>
</div>
<!-- Spacer -->
<div class="flex-1"></div>
<!-- Status & Progress -->
<div class="w-full px-margin-mobile mt-stack-lg flex flex-col gap-3">
<div class="flex justify-between items-end">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-[18px] animate-spin">sync</span>
<span class="font-label-md text-label-md text-primary">Mendeteksi wajah...</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">65%</span>
</div>
<!-- Progress Bar Track -->
<div class="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
<!-- Progress Bar Fill -->
<div class="h-full bg-primary rounded-full transition-all duration-300 w-[65%]"></div>
</div>
</div>
<!-- Action Button Area -->
<div class="px-margin-mobile w-full mt-stack-lg pb-stack-md">
<button class="w-full py-3.5 px-4 bg-surface text-on-surface border border-outline-variant rounded-full font-label-md text-label-md flex justify-center items-center gap-2 active:scale-95 transition-all hover:bg-surface-container-low shadow-sm">
<span class="material-symbols-outlined text-[20px]">refresh</span>
                    Coba Lagi
                </button>
</div>
</div>
</main>
</body></html>

<!-- Riwayat Presensi -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Riwayat Presensi - AttendX</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "background": "#F9F9FF",
                      "success": "#2E7D32",
                      "secondary-container": "#9c48ea",
                      "surface-container-lowest": "#ffffff",
                      "on-error": "#ffffff",
                      "on-primary-fixed-variant": "#004395",
                      "on-primary-fixed": "#001a42",
                      "secondary": "#8127cf",
                      "primary-container": "#2170E4",
                      "surface-container": "#ededf8",
                      "tertiary": "#792c00",
                      "inverse-surface": "#2e3039",
                      "on-background": "#191b23",
                      "secondary-fixed": "#f0dbff",
                      "on-primary": "#ffffff",
                      "on-tertiary": "#ffffff",
                      "outline": "#727784",
                      "tertiary-fixed": "#ffdbcd",
                      "primary": "#004191",
                      "on-tertiary-fixed": "#360f00",
                      "on-tertiary-container": "#ffc9b3",
                      "on-surface-variant": "#424753",
                      "tertiary-container": "#9f3d01",
                      "outline-variant": "#c2c6d5",
                      "pending": "#ED6C02",
                      "inverse-on-surface": "#f0f0fb",
                      "tertiary-fixed-dim": "#ffb596",
                      "error-container": "#ffdad6",
                      "on-secondary-fixed-variant": "#6900b3",
                      "on-error-container": "#93000a",
                      "surface-dim": "#d9d9e4",
                      "surface-container-high": "#e7e7f3",
                      "secondary-fixed-dim": "#ddb7ff",
                      "surface-bright": "#faf8ff",
                      "surface-container-highest": "#e1e1ed",
                      "on-primary-container": "#c4d5ff",
                      "error": "#BA1A1A",
                      "primary-fixed-dim": "#adc6ff",
                      "on-secondary-container": "#fffbff",
                      "primary-fixed": "#d8e2ff",
                      "surface-variant": "#e1e1ed",
                      "inverse-primary": "#adc6ff",
                      "on-secondary": "#ffffff",
                      "surface": "#FFFFFF",
                      "on-surface": "#191b23",
                      "on-tertiary-fixed-variant": "#7c2e00",
                      "on-secondary-fixed": "#2c0050",
                      "surface-container-low": "#f3f3fe",
                      "surface-tint": "#085ac0"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "stack-md": "1rem",
                      "stack-lg": "1.5rem",
                      "margin-tablet": "1.5rem",
                      "margin-mobile": "1rem",
                      "stack-sm": "0.5rem",
                      "gutter": "1rem"
              },
              "fontFamily": {
                      "headline-md": [
                              "Inter"
                      ],
                      "body-lg": [
                              "Inter"
                      ],
                      "label-md": [
                              "Inter"
                      ],
                      "body-md": [
                              "Inter"
                      ],
                      "headline-lg-mobile": [
                              "Inter"
                      ],
                      "headline-lg": [
                              "Inter"
                      ],
                      "display-lg": [
                              "Inter"
                      ],
                      "label-sm": [
                              "Inter"
                      ]
              },
              "fontSize": {
                      "headline-md": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-lg": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ],
                      "label-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "500"
                              }
                      ],
                      "body-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "400"
                              }
                      ],
                      "headline-lg-mobile": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ],
                      "headline-lg": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "fontWeight": "600"
                              }
                      ],
                      "display-lg": [
                              "32px",
                              {
                                      "lineHeight": "40px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "700"
                              }
                      ],
                      "label-sm": [
                              "12px",
                              {
                                      "lineHeight": "16px",
                                      "letterSpacing": "0.05em",
                                      "fontWeight": "600"
                              }
                      ]
              }
      },
          },
        }
      </script>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background pb-24 md:pb-0">
<!-- Top App Bar -->
<header class="w-full top-0 bg-surface dark:bg-surface-dim shadow-sm flex items-center justify-between px-margin-mobile py-2">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
<span class="material-symbols-outlined text-outline" data-icon="person">person</span>
</div>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary dark:text-primary-fixed">AttendX</h1>
</div>
<button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest active:scale-95 transition-transform text-on-surface-variant dark:text-outline-variant">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
</header>
<main class="px-margin-mobile pt-stack-md pb-stack-lg max-w-screen-md mx-auto">
<h2 class="font-headline-md text-headline-md mb-stack-md">Riwayat Presensi</h2>
<!-- Filter Chips -->
<div class="flex gap-2 mb-stack-lg overflow-x-auto pb-2 scrollbar-hide">
<button class="px-4 py-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md whitespace-nowrap">
                Hari ini
            </button>
<button class="px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant font-label-md text-label-md whitespace-nowrap hover:bg-surface-container-low transition-colors">
                Minggu ini
            </button>
<button class="px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant font-label-md text-label-md whitespace-nowrap hover:bg-surface-container-low transition-colors">
                Bulan ini
            </button>
</div>
<!-- History List -->
<div class="flex flex-col gap-stack-md">
<!-- Card 1: Hadir & WFO -->
<div class="bg-surface rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
<div class="flex justify-between items-center">
<span class="font-label-md text-label-md text-on-surface-variant">Senin, 5 Juni</span>
<div class="flex gap-2">
<span class="px-2 py-1 rounded-full bg-success/10 text-success font-label-sm text-label-sm">Hadir</span>
<span class="px-2 py-1 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm">WFO</span>
</div>
</div>
<div class="flex justify-between items-center border-t border-surface-container pt-3">
<div class="flex flex-col">
<span class="font-body-md text-body-md text-outline">Masuk</span>
<span class="font-headline-md text-headline-md">07:58</span>
</div>
<span class="material-symbols-outlined text-outline-variant">arrow_forward</span>
<div class="flex flex-col text-right">
<span class="font-body-md text-body-md text-outline">Pulang</span>
<span class="font-headline-md text-headline-md">17:05</span>
</div>
</div>
</div>
<!-- Card 2: Terlambat & WFH -->
<div class="bg-surface rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
<div class="flex justify-between items-center">
<span class="font-label-md text-label-md text-on-surface-variant">Selasa, 6 Juni</span>
<div class="flex gap-2">
<span class="px-2 py-1 rounded-full bg-error/10 text-error font-label-sm text-label-sm">Terlambat</span>
<span class="px-2 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm">WFH</span>
</div>
</div>
<div class="flex justify-between items-center border-t border-surface-container pt-3">
<div class="flex flex-col">
<span class="font-body-md text-body-md text-outline">Masuk</span>
<span class="font-headline-md text-headline-md text-error">08:15</span>
</div>
<span class="material-symbols-outlined text-outline-variant">arrow_forward</span>
<div class="flex flex-col text-right">
<span class="font-body-md text-body-md text-outline">Pulang</span>
<span class="font-headline-md text-headline-md">17:00</span>
</div>
</div>
</div>
<!-- Card 3: Pending Sync -->
<div class="bg-surface rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3 opacity-80">
<div class="flex justify-between items-center">
<span class="font-label-md text-label-md text-on-surface-variant">Rabu, 7 Juni</span>
<div class="flex gap-2">
<span class="px-2 py-1 rounded-full bg-pending/10 text-pending font-label-sm text-label-sm flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">sync</span>
                            Pending Sync
                        </span>
<span class="px-2 py-1 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm">WFO</span>
</div>
</div>
<div class="flex justify-between items-center border-t border-surface-container pt-3">
<div class="flex flex-col">
<span class="font-body-md text-body-md text-outline">Masuk</span>
<span class="font-headline-md text-headline-md">08:00</span>
</div>
<span class="material-symbols-outlined text-outline-variant">arrow_forward</span>
<div class="flex flex-col text-right">
<span class="font-body-md text-body-md text-outline">Pulang</span>
<span class="font-headline-md text-headline-md">--:--</span>
</div>
</div>
</div>
</div>
</main>
<!-- Bottom Navigation Bar (Mobile) -->
<nav class="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-2 py-3 bg-surface dark:bg-surface-dim shadow-[0_-2px_4px_rgba(0,0,0,0.05)] z-50">
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200">
<span class="material-symbols-outlined" data-icon="home">home</span>
<span class="font-label-sm text-label-sm mt-1">Beranda</span>
</button>
<button class="flex flex-col items-center justify-center bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary rounded-full px-4 py-1 active:scale-95 transition-all duration-200">
<span class="material-symbols-outlined" data-icon="history" style="font-variation-settings: 'FILL' 1;">history</span>
<span class="font-label-sm text-label-sm mt-1">Riwayat</span>
</button>
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200">
<span class="material-symbols-outlined" data-icon="post_add">post_add</span>
<span class="font-label-sm text-label-sm mt-1">Pengajuan</span>
</button>
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200">
<span class="material-symbols-outlined" data-icon="schedule">schedule</span>
<span class="font-label-sm text-label-sm mt-1">Shift</span>
</button>
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200">
<span class="material-symbols-outlined" data-icon="person">person</span>
<span class="font-label-sm text-label-sm mt-1">Profil</span>
</button>
</nav>
<!-- Side Navigation (Desktop) - Hidden on mobile, but structurally present for responsive logic -->
<nav class="hidden md:flex fixed left-0 top-0 h-full w-64 bg-surface dark:bg-surface-dim shadow-sm flex-col py-stack-lg px-margin-tablet z-40 border-r border-surface-container">
<h2 class="font-headline-lg text-headline-lg text-primary mb-stack-lg px-4">AttendX</h2>
<div class="flex flex-col gap-2">
<button class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors w-full text-left">
<span class="material-symbols-outlined" data-icon="home">home</span>
<span class="font-label-md text-label-md">Beranda</span>
</button>
<button class="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary-container text-on-secondary-container w-full text-left">
<span class="material-symbols-outlined" data-icon="history" style="font-variation-settings: 'FILL' 1;">history</span>
<span class="font-label-md text-label-md">Riwayat</span>
</button>
<button class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors w-full text-left">
<span class="material-symbols-outlined" data-icon="post_add">post_add</span>
<span class="font-label-md text-label-md">Pengajuan</span>
</button>
<button class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors w-full text-left">
<span class="material-symbols-outlined" data-icon="schedule">schedule</span>
<span class="font-label-md text-label-md">Shift</span>
</button>
<button class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors w-full text-left">
<span class="material-symbols-outlined" data-icon="person">person</span>
<span class="font-label-md text-label-md">Profil</span>
</button>
</div>
</nav>
<style>
        /* Utility to hide scrollbar for horizontal scrolling chips */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
</body></html>

<!-- Buat Pengajuan -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Buat Pengajuan</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "background": "#F9F9FF",
                      "success": "#2E7D32",
                      "secondary-container": "#9c48ea",
                      "surface-container-lowest": "#ffffff",
                      "on-error": "#ffffff",
                      "on-primary-fixed-variant": "#004395",
                      "on-primary-fixed": "#001a42",
                      "secondary": "#8127cf",
                      "primary-container": "#2170E4",
                      "surface-container": "#ededf8",
                      "tertiary": "#792c00",
                      "inverse-surface": "#2e3039",
                      "on-background": "#191b23",
                      "secondary-fixed": "#f0dbff",
                      "on-primary": "#ffffff",
                      "on-tertiary": "#ffffff",
                      "outline": "#727784",
                      "tertiary-fixed": "#ffdbcd",
                      "primary": "#004191",
                      "on-tertiary-fixed": "#360f00",
                      "on-tertiary-container": "#ffc9b3",
                      "on-surface-variant": "#424753",
                      "tertiary-container": "#9f3d01",
                      "outline-variant": "#c2c6d5",
                      "pending": "#ED6C02",
                      "inverse-on-surface": "#f0f0fb",
                      "tertiary-fixed-dim": "#ffb596",
                      "error-container": "#ffdad6",
                      "on-secondary-fixed-variant": "#6900b3",
                      "on-error-container": "#93000a",
                      "surface-dim": "#d9d9e4",
                      "surface-container-high": "#e7e7f3",
                      "secondary-fixed-dim": "#ddb7ff",
                      "surface-bright": "#faf8ff",
                      "surface-container-highest": "#e1e1ed",
                      "on-primary-container": "#c4d5ff",
                      "error": "#BA1A1A",
                      "primary-fixed-dim": "#adc6ff",
                      "on-secondary-container": "#fffbff",
                      "primary-fixed": "#d8e2ff",
                      "surface-variant": "#e1e1ed",
                      "inverse-primary": "#adc6ff",
                      "on-secondary": "#ffffff",
                      "surface": "#FFFFFF",
                      "on-surface": "#191b23",
                      "on-tertiary-fixed-variant": "#7c2e00",
                      "on-secondary-fixed": "#2c0050",
                      "surface-container-low": "#f3f3fe",
                      "surface-tint": "#085ac0"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "stack-md": "1rem",
                      "stack-lg": "1.5rem",
                      "margin-tablet": "1.5rem",
                      "margin-mobile": "1rem",
                      "stack-sm": "0.5rem",
                      "gutter": "1rem"
              },
              "fontFamily": {
                      "headline-md": ["Inter"],
                      "body-lg": ["Inter"],
                      "label-md": ["Inter"],
                      "body-md": ["Inter"],
                      "headline-lg-mobile": ["Inter"],
                      "headline-lg": ["Inter"],
                      "display-lg": ["Inter"],
                      "label-sm": ["Inter"]
              },
              "fontSize": {
                      "headline-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                      "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                      "label-md": ["14px", {"lineHeight": "20px", "fontWeight": "500"}],
                      "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                      "headline-lg-mobile": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                      "headline-lg": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                      "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                      "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}]
              }
            }
          }
        }
    </script>
<style>
        body { font-family: 'Inter', sans-serif; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .icon-fill {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen pb-24 md:pb-0">
<!-- TopAppBar (From JSON, Semantic Relevance: True for top-level) -->
<header class="bg-surface shadow-sm w-full top-0 flex items-center justify-between px-margin-mobile py-2 fixed z-40 md:hidden">
<div class="flex items-center gap-2">
<div class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                U
             </div>
</div>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary">AttendX</h1>
<button class="active:scale-95 transition-transform text-primary">
<span class="material-symbols-outlined">notifications</span>
</button>
</header>
<!-- Desktop Sidebar (Hidden on Mobile) -->
<aside class="hidden md:flex flex-col w-64 bg-surface h-screen fixed left-0 top-0 border-r border-outline-variant shadow-sm z-40 pt-6">
<div class="px-6 pb-6 border-b border-outline-variant">
<h1 class="font-headline-lg text-headline-lg text-primary">AttendX</h1>
</div>
<nav class="flex-1 flex flex-col gap-2 p-4">
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
<span class="material-symbols-outlined">home</span>
<span class="font-label-md text-label-md">Beranda</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
<span class="material-symbols-outlined">history</span>
<span class="font-label-md text-label-md">Riwayat</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary-container text-on-secondary-container transition-colors" href="#">
<span class="material-symbols-outlined icon-fill">post_add</span>
<span class="font-label-md text-label-md">Pengajuan</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
<span class="material-symbols-outlined">schedule</span>
<span class="font-label-md text-label-md">Shift</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
<span class="material-symbols-outlined">person</span>
<span class="font-label-md text-label-md">Profil</span>
</a>
</nav>
</aside>
<!-- Main Content Canvas -->
<main class="pt-16 md:pt-8 md:pl-64 px-margin-mobile md:px-margin-tablet max-w-3xl mx-auto">
<div class="py-6">
<h2 class="font-display-lg text-display-lg mb-2">Buat Pengajuan</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Lengkapi form di bawah ini untuk mengajukan izin atau cuti.</p>
</div>
<!-- Segmented Control -->
<div class="flex p-1 bg-surface-container-low rounded-xl mb-stack-lg shadow-sm border border-outline-variant">
<button class="flex-1 py-2 px-4 rounded-lg bg-white shadow-sm font-label-md text-label-md text-on-surface border border-outline-variant transition-all">Izin</button>
<button class="flex-1 py-2 px-4 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-highest transition-all">Cuti</button>
</div>
<!-- Form Section -->
<form class="space-y-stack-md bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant">
<!-- Jenis Pengajuan -->
<div class="flex flex-col gap-1">
<label class="font-label-md text-label-md text-on-surface" for="jenis">Jenis Pengajuan</label>
<div class="relative">
<select class="w-full appearance-none bg-surface border border-outline rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="jenis">
<option disabled="" selected="" value="">Pilih jenis izin</option>
<option value="sakit">Sakit</option>
<option value="kepentingan_keluarga">Kepentingan Keluarga</option>
<option value="lainnya">Lainnya</option>
</select>
<span class="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none">expand_more</span>
</div>
</div>
<!-- Tanggal -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
<div class="flex flex-col gap-1">
<label class="font-label-md text-label-md text-on-surface" for="tgl_mulai">Tanggal Mulai</label>
<div class="relative">
<input class="w-full bg-surface border border-outline rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="tgl_mulai" type="date"/>
</div>
</div>
<div class="flex flex-col gap-1">
<label class="font-label-md text-label-md text-on-surface" for="tgl_selesai">Tanggal Selesai</label>
<div class="relative">
<input class="w-full bg-surface border border-outline rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="tgl_selesai" type="date"/>
</div>
</div>
</div>
<!-- Alasan -->
<div class="flex flex-col gap-1">
<label class="font-label-md text-label-md text-on-surface" for="alasan">Alasan</label>
<textarea class="w-full bg-surface border border-outline rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" id="alasan" placeholder="Tuliskan alasan pengajuan secara detail..." rows="4"></textarea>
</div>
<!-- Upload Bukti -->
<div class="flex flex-col gap-1">
<label class="font-label-md text-label-md text-on-surface">Upload Bukti</label>
<div class="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group">
<div class="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">upload_file</span>
</div>
<span class="font-label-md text-label-md text-on-surface text-center">Tap untuk upload atau ambil foto</span>
<span class="font-body-md text-body-md text-on-surface-variant text-center mt-1 text-xs">Maksimal 5MB (JPG, PNG, PDF)</span>
</div>
</div>
<hr class="border-outline-variant my-stack-md"/>
<!-- Submit Action -->
<div class="flex flex-col gap-3">
<button class="w-full bg-[#0058BE] text-white font-label-md text-label-md py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md hover:bg-primary" type="submit">
<span class="material-symbols-outlined text-[20px]">send</span>
                    Kirim Pengajuan
                </button>
<p class="font-body-md text-[12px] text-center text-on-surface-variant flex items-center justify-center gap-1">
<span class="material-symbols-outlined text-[16px]">info</span>
                    Pengajuan akan dikirim ke admin untuk ditinjau
                </p>
</div>
</form>
</main>
<!-- BottomNavBar (From JSON, Active: Pengajuan) -->
<nav class="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 py-3 bg-surface shadow-[0_-2px_4px_rgba(0,0,0,0.05)] z-50 md:hidden">
<a class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-high rounded-full active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined">home</span>
<span class="font-label-sm text-label-sm mt-1">Beranda</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-high rounded-full active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined">history</span>
<span class="font-label-sm text-label-sm mt-1">Riwayat</span>
</a>
<a class="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined icon-fill">post_add</span>
<span class="font-label-sm text-label-sm mt-1">Pengajuan</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-high rounded-full active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined">schedule</span>
<span class="font-label-sm text-label-sm mt-1">Shift</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-high rounded-full active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined">person</span>
<span class="font-label-sm text-label-sm mt-1">Profil</span>
</a>
</nav>
<script>
        // Simple client-side interactivity for the segmented control
        document.addEventListener('DOMContentLoaded', () => {
            const tabs = document.querySelectorAll('.bg-surface-container-low button');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Reset all tabs
                    tabs.forEach(t => {
                        t.classList.remove('bg-white', 'shadow-sm', 'text-on-surface', 'border-outline-variant');
                        t.classList.add('text-on-surface-variant', 'border-transparent', 'hover:bg-surface-container-highest');
                        // Ensure border class isn't overriding layout
                        t.style.borderColor = 'transparent';
                    });
                    // Set active tab
                    tab.classList.add('bg-white', 'shadow-sm', 'text-on-surface', 'border-outline-variant');
                    tab.classList.remove('text-on-surface-variant', 'border-transparent', 'hover:bg-surface-container-highest');
                    tab.style.borderColor = ''; // reset inline style
                });
            });
        });
    </script>
</body></html>

<!-- Sinkronisasi Offline -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Sinkronisasi Offline</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#F9F9FF",
                        "success": "#2E7D32",
                        "secondary-container": "#9c48ea",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#004395",
                        "on-primary-fixed": "#001a42",
                        "secondary": "#8127cf",
                        "primary-container": "#2170E4",
                        "surface-container": "#ededf8",
                        "tertiary": "#792c00",
                        "inverse-surface": "#2e3039",
                        "on-background": "#191b23",
                        "secondary-fixed": "#f0dbff",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "outline": "#727784",
                        "tertiary-fixed": "#ffdbcd",
                        "primary": "#004191",
                        "on-tertiary-fixed": "#360f00",
                        "on-tertiary-container": "#ffc9b3",
                        "on-surface-variant": "#424753",
                        "tertiary-container": "#9f3d01",
                        "outline-variant": "#c2c6d5",
                        "pending": "#ED6C02",
                        "inverse-on-surface": "#f0f0fb",
                        "tertiary-fixed-dim": "#ffb596",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed-variant": "#6900b3",
                        "on-error-container": "#93000a",
                        "surface-dim": "#d9d9e4",
                        "surface-container-high": "#e7e7f3",
                        "secondary-fixed-dim": "#ddb7ff",
                        "surface-bright": "#faf8ff",
                        "surface-container-highest": "#e1e1ed",
                        "on-primary-container": "#c4d5ff",
                        "error": "#BA1A1A",
                        "primary-fixed-dim": "#adc6ff",
                        "on-secondary-container": "#fffbff",
                        "primary-fixed": "#d8e2ff",
                        "surface-variant": "#e1e1ed",
                        "inverse-primary": "#adc6ff",
                        "on-secondary": "#ffffff",
                        "surface": "#FFFFFF",
                        "on-surface": "#191b23",
                        "on-tertiary-fixed-variant": "#7c2e00",
                        "on-secondary-fixed": "#2c0050",
                        "surface-container-low": "#f3f3fe",
                        "surface-tint": "#085ac0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "1rem",
                        "stack-lg": "1.5rem",
                        "margin-tablet": "1.5rem",
                        "margin-mobile": "1rem",
                        "stack-sm": "0.5rem",
                        "gutter": "1rem"
                    },
                    "fontFamily": {
                        "headline-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "label-md": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "label-sm": ["Inter"]
                    },
                    "fontSize": {
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        /* Custom opacity for badges based on design system rules */
        .bg-pending-subtle {
            background-color: rgba(237, 108, 2, 0.12);
        }
        .bg-success-subtle {
            background-color: rgba(46, 125, 50, 0.12);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen flex flex-col font-body-md">
<!-- TopAppBar -->
<header class="w-full top-0 bg-surface dark:bg-surface-dim shadow-sm flex items-center justify-between px-margin-mobile py-2 w-full z-10 sticky">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container overflow-hidden">
<span class="material-symbols-outlined text-sm" data-icon="person">person</span>
</div>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary dark:text-primary-fixed">AttendX</h1>
</div>
<button class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-low dark:hover:bg-surface-container-highest active:scale-95 transition-transform">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
</header>
<!-- Main Canvas -->
<main class="flex-1 flex flex-col px-margin-mobile py-stack-lg gap-stack-lg max-w-md mx-auto w-full">
<!-- Header Section -->
<section class="flex flex-col gap-stack-sm">
<h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-background">Sinkronisasi Offline</h2>
<p class="font-body-md text-body-md text-on-surface-variant">
                Koneksi internet Anda sedang tidak stabil. Data absensi Anda tersimpan secara lokal dan akan disinkronkan otomatis saat koneksi kembali.
            </p>
</section>
<!-- Status Card -->
<section class="bg-surface rounded-xl border border-outline-variant p-margin-mobile flex flex-col gap-stack-md shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
<div class="flex items-start justify-between">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
<span class="material-symbols-outlined" data-icon="cloud_off">cloud_off</span>
</div>
<div class="flex flex-col">
<span class="font-label-md text-label-md text-on-background">Status Sinkronisasi</span>
<span class="font-body-lg text-body-lg text-pending">1 data menunggu</span>
</div>
</div>
<div class="bg-pending-subtle text-pending px-3 py-1 rounded-full flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]" data-icon="sync" data-weight="fill" style="font-variation-settings: 'FILL' 1;">sync</span>
<span class="font-label-sm text-label-sm uppercase">Pending Sync</span>
</div>
</div>
<button class="w-full bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md flex justify-center items-center gap-2 mt-2 active:scale-[0.98] transition-transform shadow-sm" id="syncButton">
<span class="material-symbols-outlined" data-icon="sync">sync</span>
                Coba Sinkronkan
            </button>
<!-- Success Message (Hidden by default, used for interaction) -->
<div class="hidden items-center gap-2 text-success justify-center mt-2" id="syncSuccess">
<span class="material-symbols-outlined text-[18px]" data-icon="check_circle" data-weight="fill" style="font-variation-settings: 'FILL' 1;">check_circle</span>
<span class="font-label-md text-label-md">Data berhasil disinkronkan</span>
</div>
</section>
<!-- List Section -->
<section class="flex flex-col gap-stack-sm">
<h3 class="font-label-md text-label-md text-on-surface-variant mb-1">Riwayat Tertunda</h3>
<!-- List Item -->
<div class="bg-surface rounded-lg p-margin-mobile flex justify-between items-center border border-surface-variant shadow-sm">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
<span class="material-symbols-outlined" data-icon="login">login</span>
</div>
<div class="flex flex-col">
<span class="font-headline-md text-headline-md text-on-background">Check-in</span>
<span class="font-body-md text-body-md text-on-surface-variant">07:58 • Hari ini</span>
</div>
</div>
<span class="font-label-sm text-label-sm text-pending bg-pending-subtle px-2 py-1 rounded">Belum tersinkron</span>
</div>
</section>
</main>
<script>
        // Simple interaction for the button to show success state
        document.getElementById('syncButton').addEventListener('click', function() {
            const btn = this;
            const successMsg = document.getElementById('syncSuccess');
            const icon = btn.querySelector('.material-symbols-outlined');
            
            // Simulate loading
            icon.classList.add('animate-spin');
            btn.classList.add('opacity-80');
            
            setTimeout(() => {
                icon.classList.remove('animate-spin');
                btn.classList.add('hidden');
                successMsg.classList.remove('hidden');
                successMsg.classList.add('flex');
            }, 1500);
        });
    </script>
</body></html>

<!-- Jadwal Shift -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Jadwal Shift - AttendX</title>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Config -->
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "background": "#F9F9FF",
                      "success": "#2E7D32",
                      "secondary-container": "#9c48ea",
                      "surface-container-lowest": "#ffffff",
                      "on-error": "#ffffff",
                      "on-primary-fixed-variant": "#004395",
                      "on-primary-fixed": "#001a42",
                      "secondary": "#8127cf",
                      "primary-container": "#2170E4",
                      "surface-container": "#ededf8",
                      "tertiary": "#792c00",
                      "inverse-surface": "#2e3039",
                      "on-background": "#191b23",
                      "secondary-fixed": "#f0dbff",
                      "on-primary": "#ffffff",
                      "on-tertiary": "#ffffff",
                      "outline": "#727784",
                      "tertiary-fixed": "#ffdbcd",
                      "primary": "#004191",
                      "on-tertiary-fixed": "#360f00",
                      "on-tertiary-container": "#ffc9b3",
                      "on-surface-variant": "#424753",
                      "tertiary-container": "#9f3d01",
                      "outline-variant": "#c2c6d5",
                      "pending": "#ED6C02",
                      "inverse-on-surface": "#f0f0fb",
                      "tertiary-fixed-dim": "#ffb596",
                      "error-container": "#ffdad6",
                      "on-secondary-fixed-variant": "#6900b3",
                      "on-error-container": "#93000a",
                      "surface-dim": "#d9d9e4",
                      "surface-container-high": "#e7e7f3",
                      "secondary-fixed-dim": "#ddb7ff",
                      "surface-bright": "#faf8ff",
                      "surface-container-highest": "#e1e1ed",
                      "on-primary-container": "#c4d5ff",
                      "error": "#BA1A1A",
                      "primary-fixed-dim": "#adc6ff",
                      "on-secondary-container": "#fffbff",
                      "primary-fixed": "#d8e2ff",
                      "surface-variant": "#e1e1ed",
                      "inverse-primary": "#adc6ff",
                      "on-secondary": "#ffffff",
                      "surface": "#FFFFFF",
                      "on-surface": "#191b23",
                      "on-tertiary-fixed-variant": "#7c2e00",
                      "on-secondary-fixed": "#2c0050",
                      "surface-container-low": "#f3f3fe",
                      "surface-tint": "#085ac0"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "stack-md": "1rem",
                      "stack-lg": "1.5rem",
                      "margin-tablet": "1.5rem",
                      "margin-mobile": "1rem",
                      "stack-sm": "0.5rem",
                      "gutter": "1rem"
              },
              "fontFamily": {
                      "headline-md": [
                              "Inter"
                      ],
                      "body-lg": [
                              "Inter"
                      ],
                      "label-md": [
                              "Inter"
                      ],
                      "body-md": [
                              "Inter"
                      ],
                      "headline-lg-mobile": [
                              "Inter"
                      ],
                      "headline-lg": [
                              "Inter"
                      ],
                      "display-lg": [
                              "Inter"
                      ],
                      "label-sm": [
                              "Inter"
                      ]
              },
              "fontSize": {
                      "headline-md": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-lg": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ],
                      "label-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "500"
                              }
                      ],
                      "body-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "400"
                              }
                      ],
                      "headline-lg-mobile": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ],
                      "headline-lg": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "fontWeight": "600"
                              }
                      ],
                      "display-lg": [
                              "32px",
                              {
                                      "lineHeight": "40px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "700"
                              }
                      ],
                      "label-sm": [
                              "12px",
                              {
                                      "lineHeight": "16px",
                                      "letterSpacing": "0.05em",
                                      "fontWeight": "600"
                              }
                      ]
              }
            }
          }
        }
    </script>
<style>
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen pb-24 font-body-md antialiased selection:bg-primary-fixed selection:text-primary-fixed">
<!-- TopAppBar -->
<header class="w-full top-0 bg-surface shadow-sm flex items-center justify-between px-margin-mobile py-2 z-40 sticky">
<div class="w-10 h-10 rounded-full overflow-hidden border border-outline-variant shrink-0">
<img alt="User Profile" class="w-full h-full object-cover" data-alt="A professional headshot of a young corporate employee in a brightly lit modern office. The lighting is soft and neutral, conveying trust and efficiency. The background is slightly blurred with light cool tones matching the light mode enterprise app aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQJFXa7vJWLz9wP5vG_JSnY0h0raA1HJCSWA_gm4icUWa8RV6_65FSX_xsQADv03Eu_zAX6ySxJyKQDd__PzYJXmUdGkYy9v1CDz8sY8NCMRi8BcJu_9RZxyqBr3CEyfupZq1wtBdKAls4gTBU8EXi5OSyA5g6rJNu0SrWuvQtn_kKG09lRyG5pDx7GERCjRwMYjQKXKBO8X3evl3ImC1HNgU-GQ8JEgt36tQTA6TkMJAn2kngeRPrzk7Z1mjBtyB6A4lapMLpcTQ"/>
</div>
<div class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">AttendX</div>
<button aria-label="Notifications" class="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest rounded-full active:scale-95 transition-transform">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
</header>
<!-- Main Content Canvas -->
<main class="px-margin-mobile pt-stack-lg space-y-stack-lg">
<!-- Header & Week Selector -->
<section class="space-y-stack-md">
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Jadwal Shift</h1>
<!-- Calendar Ribbon -->
<div class="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 pt-1 -mx-2 px-2 snap-x">
<!-- Day Item (Past) -->
<button class="snap-start shrink-0 flex flex-col items-center justify-center w-[52px] h-[64px] rounded-xl bg-surface border border-surface-variant hover:bg-surface-container-low transition-colors duration-200">
<span class="font-label-sm text-label-sm text-outline mb-1">Sen</span>
<span class="font-headline-md text-headline-md text-on-surface-variant opacity-60">12</span>
</button>
<!-- Day Item (Active / Today) -->
<button class="snap-start shrink-0 flex flex-col items-center justify-center w-[52px] h-[64px] rounded-xl bg-primary text-on-primary shadow-[0_4px_12px_rgba(0,65,145,0.2)] transform scale-105 transition-transform duration-200">
<span class="font-label-sm text-label-sm text-primary-fixed-dim mb-1">Sel</span>
<span class="font-headline-md text-headline-md text-on-primary">13</span>
</button>
<!-- Day Item (Future) -->
<button class="snap-start shrink-0 flex flex-col items-center justify-center w-[52px] h-[64px] rounded-xl bg-surface border border-surface-variant hover:bg-surface-container-low transition-colors duration-200">
<span class="font-label-sm text-label-sm text-outline mb-1">Rab</span>
<span class="font-headline-md text-headline-md text-on-surface-variant">14</span>
</button>
<!-- Day Item (Future) -->
<button class="snap-start shrink-0 flex flex-col items-center justify-center w-[52px] h-[64px] rounded-xl bg-surface border border-surface-variant hover:bg-surface-container-low transition-colors duration-200">
<span class="font-label-sm text-label-sm text-outline mb-1">Kam</span>
<span class="font-headline-md text-headline-md text-on-surface-variant">15</span>
</button>
<!-- Day Item (Future) -->
<button class="snap-start shrink-0 flex flex-col items-center justify-center w-[52px] h-[64px] rounded-xl bg-surface border border-surface-variant hover:bg-surface-container-low transition-colors duration-200">
<span class="font-label-sm text-label-sm text-outline mb-1">Jum</span>
<span class="font-headline-md text-headline-md text-on-surface-variant">16</span>
</button>
<!-- Day Item (Weekend) -->
<button class="snap-start shrink-0 flex flex-col items-center justify-center w-[52px] h-[64px] rounded-xl bg-surface-container-lowest border border-dashed border-outline-variant opacity-70">
<span class="font-label-sm text-label-sm text-outline mb-1">Sab</span>
<span class="font-headline-md text-headline-md text-outline">17</span>
</button>
</div>
</section>
<!-- Shift List / Timeline -->
<section class="space-y-stack-sm relative">
<!-- Subtle vertical timeline line -->
<div class="absolute left-6 top-6 bottom-6 w-px bg-surface-variant -z-10 hidden md:block"></div>
<!-- Card: Senin (WFO) -->
<article class="bg-surface rounded-xl border border-surface-variant p-4 flex flex-col gap-3 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
<!-- Status Accent Line -->
<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
<div class="flex justify-between items-start pl-2">
<div>
<div class="font-label-sm text-label-sm text-outline mb-1 uppercase tracking-wider">Senin, 12 Agu</div>
<div class="font-headline-md text-headline-md text-on-surface">08:00 - 17:00</div>
</div>
<div class="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm flex items-center gap-1 border border-primary-fixed-dim">
                        WFO
                    </div>
</div>
<div class="flex items-center gap-2 text-on-surface-variant mt-2 pt-3 border-t border-surface-container-high pl-2">
<span class="material-symbols-outlined text-[18px] opacity-70" style="font-variation-settings: 'FILL' 1;">location_on</span>
<span class="font-body-md text-body-md">Kantor Pusat - Menara Sudirman</span>
</div>
</article>
<!-- Card: Selasa (WFH - Today) -->
<article class="bg-surface rounded-xl border border-primary-fixed-dim p-4 flex flex-col gap-3 relative overflow-hidden shadow-[0_2px_8px_rgba(33,112,228,0.08)] ring-1 ring-primary/5">
<!-- Status Accent Line -->
<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary"></div>
<div class="flex justify-between items-start pl-2">
<div>
<div class="font-label-sm text-label-sm text-primary mb-1 uppercase tracking-wider flex items-center gap-1">
<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Hari Ini, 13 Agu
                        </div>
<div class="font-headline-md text-headline-md text-on-surface">08:00 - 17:00</div>
</div>
<div class="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm flex items-center gap-1 border border-secondary-fixed-dim">
                        WFH
                    </div>
</div>
<div class="flex items-center gap-2 text-on-surface-variant mt-2 pt-3 border-t border-surface-container-high pl-2">
<span class="material-symbols-outlined text-[18px] opacity-70">home</span>
<span class="font-body-md text-body-md">Kerja dari Rumah</span>
</div>
</article>
<!-- Card: Rabu (Libur) -->
<article class="bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center gap-2 py-8 opacity-80">
<div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline mb-1">
<span class="material-symbols-outlined">event_busy</span>
</div>
<div class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">Rabu, 14 Agu</div>
<div class="font-body-lg text-body-lg text-outline">Libur Nasional</div>
</article>
<!-- Card: Kamis (Pending/Shift B) -->
<article class="bg-surface rounded-xl border border-surface-variant p-4 flex flex-col gap-3 relative overflow-hidden shadow-sm">
<!-- Status Accent Line -->
<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-pending"></div>
<div class="flex justify-between items-start pl-2">
<div>
<div class="font-label-sm text-label-sm text-outline mb-1 uppercase tracking-wider">Kamis, 15 Agu</div>
<div class="font-headline-md text-headline-md text-on-surface">13:00 - 22:00</div>
</div>
<div class="px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm flex items-center gap-1 border border-tertiary-fixed-dim">
                        Shift Malam
                    </div>
</div>
<div class="flex items-center gap-2 text-on-surface-variant mt-2 pt-3 border-t border-surface-container-high pl-2">
<span class="material-symbols-outlined text-[18px] opacity-70" style="font-variation-settings: 'FILL' 1;">location_on</span>
<span class="font-body-md text-body-md">Kantor Cabang - Blok M</span>
</div>
</article>
</section>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 py-3 bg-surface shadow-[0_-2px_4px_rgba(0,0,0,0.05)] z-50">
<!-- Beranda -->
<button class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-high rounded-full active:scale-95 transition-all duration-200">
<span class="material-symbols-outlined mb-1" data-icon="home">home</span>
<span class="font-label-sm text-[10px] leading-tight">Beranda</span>
</button>
<!-- Riwayat -->
<button class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-high rounded-full active:scale-95 transition-all duration-200">
<span class="material-symbols-outlined mb-1" data-icon="history">history</span>
<span class="font-label-sm text-[10px] leading-tight">Riwayat</span>
</button>
<!-- Pengajuan -->
<button class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-high rounded-full active:scale-95 transition-all duration-200">
<span class="material-symbols-outlined mb-1" data-icon="post_add">post_add</span>
<span class="font-label-sm text-[10px] leading-tight">Pengajuan</span>
</button>
<!-- Shift (Active) -->
<button class="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 active:scale-95 transition-all duration-200 shadow-sm">
<span class="material-symbols-outlined mb-1" data-icon="schedule" style="font-variation-settings: 'FILL' 1;">schedule</span>
<span class="font-label-sm text-[10px] leading-tight font-bold">Shift</span>
</button>
<!-- Profil -->
<button class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container-high rounded-full active:scale-95 transition-all duration-200">
<span class="material-symbols-outlined mb-1" data-icon="person">person</span>
<span class="font-label-sm text-[10px] leading-tight">Profil</span>
</button>
</nav>
</body></html>

<!-- Notifikasi -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AttendX - Notifikasi</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#F9F9FF",
                        "success": "#2E7D32",
                        "secondary-container": "#9c48ea",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#004395",
                        "on-primary-fixed": "#001a42",
                        "secondary": "#8127cf",
                        "primary-container": "#2170E4",
                        "surface-container": "#ededf8",
                        "tertiary": "#792c00",
                        "inverse-surface": "#2e3039",
                        "on-background": "#191b23",
                        "secondary-fixed": "#f0dbff",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "outline": "#727784",
                        "tertiary-fixed": "#ffdbcd",
                        "primary": "#004191",
                        "on-tertiary-fixed": "#360f00",
                        "on-tertiary-container": "#ffc9b3",
                        "on-surface-variant": "#424753",
                        "tertiary-container": "#9f3d01",
                        "outline-variant": "#c2c6d5",
                        "pending": "#ED6C02",
                        "inverse-on-surface": "#f0f0fb",
                        "tertiary-fixed-dim": "#ffb596",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed-variant": "#6900b3",
                        "on-error-container": "#93000a",
                        "surface-dim": "#d9d9e4",
                        "surface-container-high": "#e7e7f3",
                        "secondary-fixed-dim": "#ddb7ff",
                        "surface-bright": "#faf8ff",
                        "surface-container-highest": "#e1e1ed",
                        "on-primary-container": "#c4d5ff",
                        "error": "#BA1A1A",
                        "primary-fixed-dim": "#adc6ff",
                        "on-secondary-container": "#fffbff",
                        "primary-fixed": "#d8e2ff",
                        "surface-variant": "#e1e1ed",
                        "inverse-primary": "#adc6ff",
                        "on-secondary": "#ffffff",
                        "surface": "#FFFFFF",
                        "on-surface": "#191b23",
                        "on-tertiary-fixed-variant": "#7c2e00",
                        "on-secondary-fixed": "#2c0050",
                        "surface-container-low": "#f3f3fe",
                        "surface-tint": "#085ac0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "1rem",
                        "stack-lg": "1.5rem",
                        "margin-tablet": "1.5rem",
                        "margin-mobile": "1rem",
                        "stack-sm": "0.5rem",
                        "gutter": "1rem"
                    },
                    "fontFamily": {
                        "headline-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "label-md": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "label-sm": ["Inter"]
                    },
                    "fontSize": {
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen pb-20 md:pb-0">
<!-- TopAppBar Semantic Shell -->
<header class="bg-surface shadow-sm w-full top-0 sticky z-40">
<div class="flex items-center justify-between px-margin-mobile py-2 w-full">
<div class="flex items-center gap-3">
<button class="text-on-surface hover:bg-surface-container-low active:scale-95 transition-transform p-2 rounded-full" onclick="history.back()">
<span class="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
</button>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Notifikasi</h1>
</div>
<button class="font-label-md text-label-md text-primary active:scale-95 transition-transform px-2 py-1 rounded-md hover:bg-surface-container-low">
                Tandai semua dibaca
            </button>
</div>
</header>
<!-- Canvas -->
<main class="max-w-3xl mx-auto px-margin-mobile py-stack-md flex flex-col gap-stack-sm">
<!-- Section: Hari Ini -->
<div class="mb-2">
<h2 class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-stack-sm">Hari Ini</h2>
<div class="flex flex-col gap-[2px] bg-outline-variant/30 rounded-xl overflow-hidden">
<!-- Notification Card: Unread -->
<div class="bg-surface p-4 flex gap-4 items-start relative hover:bg-surface-container-lowest transition-colors cursor-pointer group">
<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
<div class="w-10 h-10 rounded-full bg-primary-container/10 text-primary flex items-center justify-center shrink-0">
<span class="material-symbols-outlined" data-icon="alarm">alarm</span>
</div>
<div class="flex-1">
<div class="flex justify-between items-baseline mb-1">
<h3 class="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-2">
                                Pengingat Check-in
                                <span class="w-2 h-2 rounded-full bg-primary inline-block"></span>
</h3>
<span class="font-body-md text-body-md text-on-surface-variant text-xs">10 menit lalu</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant">Jangan lupa check-in sebelum pukul 08:00</p>
</div>
</div>
<!-- Notification Card: Unread -->
<div class="bg-surface p-4 flex gap-4 items-start relative hover:bg-surface-container-lowest transition-colors cursor-pointer group">
<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
<div class="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
<span class="material-symbols-outlined" data-icon="check_circle">check_circle</span>
</div>
<div class="flex-1">
<div class="flex justify-between items-baseline mb-1">
<h3 class="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-2">
                                Pengajuan cuti disetujui
                                <span class="w-2 h-2 rounded-full bg-primary inline-block"></span>
</h3>
<span class="font-body-md text-body-md text-on-surface-variant text-xs">1 jam lalu</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant">Pengajuan cuti tahunan Anda untuk tanggal 25-26 Oct telah disetujui oleh HR.</p>
</div>
</div>
</div>
</div>
<!-- Section: Kemarin -->
<div class="mt-4">
<h2 class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-stack-sm">Kemarin</h2>
<div class="flex flex-col gap-[2px] bg-outline-variant/30 rounded-xl overflow-hidden">
<!-- Notification Card: Read -->
<div class="bg-surface p-4 flex gap-4 items-start relative hover:bg-surface-container-lowest transition-colors cursor-pointer opacity-75 group">
<div class="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
<span class="material-symbols-outlined" data-icon="cloud_sync">cloud_sync</span>
</div>
<div class="flex-1">
<div class="flex justify-between items-baseline mb-1">
<h3 class="font-label-md text-label-md text-on-surface">Data offline berhasil disinkronkan</h3>
<span class="font-body-md text-body-md text-on-surface-variant text-xs">Kemarin, 17:30</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant">Log absensi saat Anda offline telah berhasil diunggah ke server.</p>
</div>
</div>
<!-- Notification Card: Read -->
<div class="bg-surface p-4 flex gap-4 items-start relative hover:bg-surface-container-lowest transition-colors cursor-pointer opacity-75 group">
<div class="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
<span class="material-symbols-outlined" data-icon="campaign">campaign</span>
</div>
<div class="flex-1">
<div class="flex justify-between items-baseline mb-1">
<h3 class="font-label-md text-label-md text-on-surface">Pembaruan Kebijakan Perusahaan</h3>
<span class="font-body-md text-body-md text-on-surface-variant text-xs">Kemarin, 09:00</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant">Terdapat pembaruan pada SOP klaim medis. Silakan baca detailnya.</p>
</div>
</div>
</div>
</div>
</main>
<!-- BottomNavBar is suppressed as Notifications is typically a task-focused overlay or sub-page accessed via top nav, 
         or it's not a primary top-level destination listed in the provided JSON intent (Beranda, Riwayat, Pengajuan, Shift, Profil). -->
</body></html>

<!-- Profil -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" name="viewport"/>
<title>AttendX - Profile</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#F9F9FF",
                        "success": "#2E7D32",
                        "secondary-container": "#9c48ea",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#004395",
                        "on-primary-fixed": "#001a42",
                        "secondary": "#8127cf",
                        "primary-container": "#2170E4",
                        "surface-container": "#ededf8",
                        "tertiary": "#792c00",
                        "inverse-surface": "#2e3039",
                        "on-background": "#191b23",
                        "secondary-fixed": "#f0dbff",
                        "on-primary": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "outline": "#727784",
                        "tertiary-fixed": "#ffdbcd",
                        "primary": "#004191",
                        "on-tertiary-fixed": "#360f00",
                        "on-tertiary-container": "#ffc9b3",
                        "on-surface-variant": "#424753",
                        "tertiary-container": "#9f3d01",
                        "outline-variant": "#c2c6d5",
                        "pending": "#ED6C02",
                        "inverse-on-surface": "#f0f0fb",
                        "tertiary-fixed-dim": "#ffb596",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed-variant": "#6900b3",
                        "on-error-container": "#93000a",
                        "surface-dim": "#d9d9e4",
                        "surface-container-high": "#e7e7f3",
                        "secondary-fixed-dim": "#ddb7ff",
                        "surface-bright": "#faf8ff",
                        "surface-container-highest": "#e1e1ed",
                        "on-primary-container": "#c4d5ff",
                        "error": "#BA1A1A",
                        "primary-fixed-dim": "#adc6ff",
                        "on-secondary-container": "#fffbff",
                        "primary-fixed": "#d8e2ff",
                        "surface-variant": "#e1e1ed",
                        "inverse-primary": "#adc6ff",
                        "on-secondary": "#ffffff",
                        "surface": "#FFFFFF",
                        "on-surface": "#191b23",
                        "on-tertiary-fixed-variant": "#7c2e00",
                        "on-secondary-fixed": "#2c0050",
                        "surface-container-low": "#f3f3fe",
                        "surface-tint": "#085ac0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "1rem",
                        "stack-lg": "1.5rem",
                        "margin-tablet": "1.5rem",
                        "margin-mobile": "1rem",
                        "stack-sm": "0.5rem",
                        "gutter": "1rem"
                    },
                    "fontFamily": {
                        "headline-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "label-md": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "label-sm": ["Inter"]
                    },
                    "fontSize": {
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .icon-fill {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background antialiased min-h-screen flex flex-col pb-[80px]">
<!-- TopAppBar -->
<header class="w-full top-0 bg-surface dark:bg-surface-dim shadow-sm sticky z-40">
<div class="flex items-center justify-between px-margin-mobile py-2 w-full h-[64px]">
<div class="flex items-center gap-4">
<img alt="Avatar" class="w-10 h-10 rounded-full object-cover border border-outline-variant" data-alt="A close-up portrait of a professional corporate employee avatar in a modern light-mode setting. Soft, natural lighting highlights the subject's face against a clean, white background. The image has a crisp, polished aesthetic suitable for an enterprise SaaS application profile picture." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDc5vvHp998TEyHIOvfc9ZK2ydIiSXAGxitkWgavkfLxsWsRitcIMOF55oW7F5r-MHtTrmM4z4EfJrQA3-ONpfjYH_R2sl2LmxoIVWUIRYWQ10F5_7yufxxHS09CVNGw3DNv4Mqgu-wR03iaXpljsChNjL7fMOy-GX7NBQLIbyFbnGVgE_CBZPi-eqUDlQTv8-dpgOVhtI33LYpx9oUYmRrMbQDGrnGOIeSHy3lV11e_vLO3tN9Af_Otk66P9WNQGawoCsrXo6R2E4"/>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary dark:text-primary-fixed">AttendX</h1>
</div>
<button aria-label="Notifications" class="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest active:scale-95 transition-transform text-on-surface-variant dark:text-outline-variant">
<span class="material-symbols-outlined">notifications</span>
</button>
</div>
</header>
<!-- Main Content Canvas -->
<main class="flex-1 px-margin-mobile py-stack-md flex flex-col gap-stack-lg w-full max-w-md mx-auto">
<!-- Profile Header Bento Card -->
<section class="bg-surface rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col items-center text-center gap-4 relative overflow-hidden">
<!-- Decorative background blob -->
<div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
<div class="relative">
<img alt="David Boy Avatar" class="w-24 h-24 rounded-full object-cover border-4 border-surface shadow-sm relative z-10" data-alt="A professional studio headshot of a modern employee named David Boy, looking confident and approachable. The lighting is bright and evenly distributed, typical of a high-end corporate directory. The background is a subtle, clean off-white gradient, complementing the app's clean Material 3 design system." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeNh91VS06x5obn6ChxSM6P0rRp5WwEeGXAxqO42BvtNK1fHF9q5ThYxT0T3HxBWD_Qzl-t71o78icMu2PLViGRfABQ9JBrykXHDhMOBczcrm6w64wOQo6QLBQMWmJthMRYMtzE4X49oRBGahW2Svd_x3uv-JyN8ti5npgFnU5YdshW87iikfOXHrkTCbgA7LcyKNKFT0pzgi7Tqx6ArEto__TJsmzGrR-WvQImDgSaeF-jmIJciAy-c5EGymZpkcKAWj6USDA1pA"/>
<!-- Status Badge Absolute -->
<div class="absolute bottom-0 right-0 z-20 bg-success/12 px-3 py-1 rounded-full border-2 border-surface flex items-center shadow-sm">
<span class="w-2 h-2 rounded-full bg-success mr-1.5"></span>
<span class="font-label-sm text-label-sm text-success">Aktif</span>
</div>
</div>
<div class="flex flex-col items-center z-10">
<h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-background mb-1">David Boy</h2>
<p class="font-body-md text-body-md text-on-surface-variant">EMP-2023-0894</p>
</div>
<div class="flex items-center justify-center gap-2 w-full mt-2 z-10">
<div class="bg-surface-container-low px-4 py-2 rounded-lg flex-1 border border-outline-variant/30">
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">Position</p>
<p class="font-label-md text-label-md text-on-surface">Senior Developer</p>
</div>
<div class="bg-surface-container-low px-4 py-2 rounded-lg flex-1 border border-outline-variant/30">
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">Division</p>
<p class="font-label-md text-label-md text-on-surface">Engineering</p>
</div>
</div>
</section>
<!-- Menu List -->
<section class="flex flex-col gap-2">
<h3 class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-2 mb-1">Pengaturan</h3>
<div class="bg-surface rounded-xl border border-outline-variant/30 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
<button class="w-full flex items-center justify-between p-4 bg-surface hover:bg-surface-container-low transition-colors active:scale-[0.98] border-b border-outline-variant/20 last:border-0 group">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
<span class="material-symbols-outlined icon-fill">notifications</span>
</div>
<span class="font-body-lg text-body-lg text-on-surface">Pengaturan Notifikasi</span>
</div>
<span class="material-symbols-outlined text-outline-variant">chevron_right</span>
</button>
<button class="w-full flex items-center justify-between p-4 bg-surface hover:bg-surface-container-low transition-colors active:scale-[0.98] border-b border-outline-variant/20 last:border-0 group">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
<span class="material-symbols-outlined icon-fill">help</span>
</div>
<span class="font-body-lg text-body-lg text-on-surface">Bantuan</span>
</div>
<span class="material-symbols-outlined text-outline-variant">chevron_right</span>
</button>
<button class="w-full flex items-center justify-between p-4 bg-surface hover:bg-surface-container-low transition-colors active:scale-[0.98] group">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
<span class="material-symbols-outlined icon-fill">info</span>
</div>
<span class="font-body-lg text-body-lg text-on-surface">Tentang Aplikasi</span>
</div>
<span class="material-symbols-outlined text-outline-variant">chevron_right</span>
</button>
</div>
</section>
<!-- Logout Button -->
<section class="mt-4 mb-stack-lg">
<button class="w-full flex items-center justify-center gap-2 p-4 bg-surface rounded-xl border border-error-container text-error hover:bg-error-container/50 active:scale-95 transition-all shadow-sm">
<span class="material-symbols-outlined">logout</span>
<span class="font-label-md text-label-md">Keluar</span>
</button>
</section>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 py-3 bg-surface dark:bg-surface-dim shadow-[0_-2px_4px_rgba(0,0,0,0.05)] z-50 md:hidden pb-[calc(12px+env(safe-area-inset-bottom))]">
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200 group" href="#">
<span class="material-symbols-outlined group-hover:icon-fill transition-all">home</span>
<span class="font-label-sm text-label-sm mt-1">Beranda</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200 group" href="#">
<span class="material-symbols-outlined group-hover:icon-fill transition-all">history</span>
<span class="font-label-sm text-label-sm mt-1">Riwayat</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200 group" href="#">
<span class="material-symbols-outlined group-hover:icon-fill transition-all">post_add</span>
<span class="font-label-sm text-label-sm mt-1">Pengajuan</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full active:scale-95 transition-all duration-200 group" href="#">
<span class="material-symbols-outlined group-hover:icon-fill transition-all">schedule</span>
<span class="font-label-sm text-label-sm mt-1">Shift</span>
</a>
<!-- Active Nav Item -->
<a class="flex flex-col items-center justify-center bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary rounded-full px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined icon-fill">person</span>
<span class="font-label-sm text-label-sm mt-1">Profil</span>
</a>
</nav>
<script>
        // Simple interaction script to add visual feedback to menu items
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('touchstart', () => {
                btn.style.transform = 'scale(0.98)';
            }, {passive: true});
            btn.addEventListener('touchend', () => {
                btn.style.transform = 'scale(1)';
            }, {passive: true});
        });
    </script>
</body></html>