import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// Pre-camera instruction step shown before face enrollment / verification.
///
/// Reminds the user to remove glasses and anything covering the face, ensure
/// good lighting, and keep a single face in frame. The camera only starts after
/// the user taps "Lanjutkan" ([onContinue]).
///
/// Visual: uses an illustration at `assets/images/face_prep.webp` when present,
/// and gracefully falls back to a themed icon when the asset is missing — so it
/// works before a custom illustration is added.
class FacePrepInstructions extends StatelessWidget {
  const FacePrepInstructions({
    super.key,
    required this.onContinue,
    this.title = 'Sebelum Mulai',
    this.subtitle =
        'Agar wajahmu terdeteksi dengan baik, ikuti panduan singkat ini.',
    this.continueLabel = 'Lanjutkan',
  });

  final VoidCallback onContinue;
  final String title;
  final String subtitle;
  final String continueLabel;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.md,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _Illustration(),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: AppTypography.display.copyWith(
                      color: AppColors.onSurface,
                      fontSize: 26,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    subtitle,
                    textAlign: TextAlign.center,
                    style: AppTypography.bodyMd.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  _Tip(
                    icon: Icons.visibility_off_rounded,
                    tint: AppColors.error,
                    title: 'Lepas kacamata & penutup wajah',
                    body: 'Lepas kacamata, masker, atau topi yang menutupi wajah.',
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _Tip(
                    icon: Icons.wb_sunny_rounded,
                    tint: AppColors.pending,
                    title: 'Pencahayaan cukup',
                    body: 'Cari tempat terang, hindari cahaya dari belakang.',
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _Tip(
                    icon: Icons.face_rounded,
                    tint: AppColors.primary,
                    title: 'Satu wajah, menghadap lurus',
                    body: 'Pastikan hanya wajahmu di bingkai dan tatap kamera.',
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              0,
              AppSpacing.lg,
              AppSpacing.lg,
            ),
            child: FilledButton.icon(
              onPressed: onContinue,
              icon: const Icon(Icons.arrow_forward_rounded),
              label: Text(continueLabel),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(54),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Illustration extends StatelessWidget {
  const _Illustration();

  @override
  Widget build(BuildContext context) {
    // Themed circular backdrop behind the illustration / fallback icon.
    return Center(
      child: Container(
        width: 200,
        height: 200,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primary.withValues(alpha: 0.14),
              AppColors.primary.withValues(alpha: 0.04),
            ],
          ),
        ),
        alignment: Alignment.center,
        child: Image.asset(
          'assets/images/face_prep.webp',
          width: 160,
          height: 160,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => Icon(
            Icons.face_retouching_natural_rounded,
            size: 96,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }
}

class _Tip extends StatelessWidget {
  const _Tip({
    required this.icon,
    required this.tint,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final Color tint;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  tint.withValues(alpha: 0.18),
                  tint.withValues(alpha: 0.08),
                ],
              ),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(icon, color: tint, size: 22),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.labelMd.copyWith(
                    color: AppColors.onSurface,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  body,
                  style: AppTypography.bodySm.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
