---
name: flutter-web-bypass-mobile-features
description: Pattern for gracefully bypassing mobile-only Flutter features (camera, ML Kit, sensors) when running on web using kIsWeb guards — router redirect, initState, and build-level bypasses.
source: auto-skill
extracted_at: '2026-06-22T08:05:37.949Z'
---

# Flutter: Bypassing Mobile-Only Features on Web

## Context
Learned from the AttendX app where `google_mlkit_face_detection` + `camera`
packages crash on `flutter run -d chrome`. The user wanted to preview the full
app in a browser without fixing the underlying incompatible packages.

---

## The three-layer bypass pattern

Apply `kIsWeb` guards at three levels:

### 1. Router redirect (`app_router.dart`)

Wrap the mobile-only redirect guard in `if (!kIsWeb)`:

```dart
import 'package:flutter/foundation.dart'; // ← add this

// In the redirect callback:
if (!kIsWeb) {
  final profile = auth.profile;
  if (profile != null && !profile.faceEnrolled) {
    return loc == AppRoutes.faceEnroll ? null : AppRoutes.faceEnroll;
  }
  if (loc == AppRoutes.faceEnroll) return AppRoutes.home;
} else {
  // Web: bounce away from the feature screen if somehow navigated there.
  if (loc == AppRoutes.faceEnroll) return AppRoutes.home;
}
```

This stops the router from forcing web users into a screen that requires camera.

---

### 2. `initState` guard (skip camera init on web)

```dart
@override
void initState() {
  super.initState();
  if (kIsWeb) {
    _submitWebBypass(); // auto-complete the flow
    return;
  }
  _boostBrightness();
  _initCamera();
}
```

**Why `return` matters:** Without it, `_initCamera()` still runs even after the
web branch executes.

---

### 3. `build` guard (show a different UI on web)

Two patterns depending on the feature:

**A) Auto-submit / spinner** (for transient screens like face verification):
```dart
@override
Widget build(BuildContext context) {
  if (kIsWeb) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(_error ?? 'Memproses...'),
          ],
        ),
      ),
    );
  }
  // normal mobile build below...
}
```

**B) Informational bypass page** (for enrollment/setup screens):
```dart
@override
Widget build(BuildContext context) {
  if (kIsWeb) return _WebBypassView(onContinue: () => context.go(AppRoutes.home));
  // normal mobile build...
}

class _WebBypassView extends StatelessWidget {
  const _WebBypassView({required this.onContinue});
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // gradient icon container
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: AppColors.headerGradient, ...),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Icon(Icons.web_rounded, size: 40, color: Colors.white),
                ),
                const SizedBox(height: 24),
                Text('Mode Web', style: AppTypography.headlineMd),
                const SizedBox(height: 8),
                Text('Fitur ini tidak tersedia di browser.\nGunakan aplikasi mobile.'),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: onContinue,
                    icon: const Icon(Icons.arrow_forward_rounded),
                    label: const Text('Lanjut ke Dashboard'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## Auto-submit bypass method (face verification pattern)

For a screen that normally does async work then navigates on success:

```dart
Future<void> _submitWebBypass() async {
  // Small delay so the loading UI renders before we navigate.
  await Future.delayed(const Duration(milliseconds: 300));
  if (!mounted) return;

  // Mark the step as passed in state.
  ref.read(checkinFlowProvider.notifier).setFaceResult(
    faceVerified: true,
    liveness: true,
    checksPassed: 2,
    checksTotal: 2,
    faceImageBase64: null,
  );

  try {
    final record = await ref.read(checkinFlowProvider.notifier).submit();
    if (!mounted) return;
    context.pushReplacement('${AppRoutes.checkinSuccess}?id=${record.id}');
  } catch (e) {
    if (!mounted) return;
    setState(() => _error = e.toString());
  }
}
```

---

## Checklist

- [ ] Add `import 'package:flutter/foundation.dart';` to every file that uses `kIsWeb`
- [ ] Router: wrap mandatory redirect in `if (!kIsWeb)`
- [ ] `initState`: add `if (kIsWeb) { ...; return; }` before camera/sensor init
- [ ] `build`: return web-specific UI (spinner or info page) at the top of build
- [ ] Any new `AppRoutes` references in a file need the router import added too
- [ ] `AppSpacing.xxl` does **not** exist — largest spacing is `AppSpacing.xl`; `AppRadius` has `xxl`
- [ ] `flutter analyze --no-pub` → no issues before shipping

## Token gotchas (AttendX-specific)

| What I tried | What actually exists |
|---|---|
| `AppSpacing.xxl` | ❌ — use `AppSpacing.xl` (largest) |
| `AppTypography.titleMd` | ❌ — use `AppTypography.titleLg` |
| `AppTypography.headingMd` | ❌ — use `AppTypography.headlineMd` |
| `AppColors.cardSurface` | ❌ — use `AppColors.surface` |
| `AppColors.headerGradient` | ✅ getter returning `List<Color>` |
| `AppRadius.xxl` | ✅ = 24.0 |
