import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import 'checkin_flow_controller.dart';

/// Step 3: face recognition + liveness. Simulated here with a stepped liveness
/// challenge (look straight → blink → turn head). Real `camera` +
/// `google_mlkit_face_detection` integration lands in Fase 3.
class FaceVerificationScreen extends ConsumerStatefulWidget {
  const FaceVerificationScreen({super.key});

  @override
  ConsumerState<FaceVerificationScreen> createState() =>
      _FaceVerificationScreenState();
}

class _FaceVerificationScreenState
    extends ConsumerState<FaceVerificationScreen> {
  static const _challenges = [
    (Icons.face, 'Posisikan wajah di dalam bingkai'),
    (Icons.visibility, 'Kedipkan mata perlahan'),
    (Icons.sync, 'Gerakkan kepala ke kiri & kanan'),
  ];

  int _step = 0;
  bool _submitting = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _runChallenge();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _runChallenge() {
    _timer = Timer.periodic(const Duration(milliseconds: 1400), (t) {
      if (!mounted) return;
      if (_step < _challenges.length - 1) {
        setState(() => _step++);
      } else {
        t.cancel();
        _complete();
      }
    });
  }

  Future<void> _complete() async {
    ref.read(checkinFlowProvider.notifier).setFaceResult(
          faceVerified: true,
          liveness: true,
        );
    setState(() => _submitting = true);
    final record = await ref.read(checkinFlowProvider.notifier).submit();
    if (!mounted) return;
    context.pushReplacement('${AppRoutes.checkinSuccess}?id=${record.id}');
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_step + 1) / _challenges.length;
    final challenge = _challenges[_step];

    return Scaffold(
      backgroundColor: AppColors.inverseSurface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.inverseOnSurface,
        title: const Text('Verifikasi Wajah'),
      ),
      body: Column(
        children: [
          const Spacer(),
          // Camera viewport placeholder with oval guide + scanning ring
          Center(
            child: Container(
              width: 260,
              height: 320,
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(160),
                border: Border.all(
                  color: AppColors.primaryFixedDim,
                  width: 3,
                ),
              ),
              child: Center(
                child: _submitting
                    ? const CircularProgressIndicator(
                        color: AppColors.primaryFixedDim)
                    : Icon(challenge.$1,
                        size: 64, color: AppColors.primaryFixedDim),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Column(
              children: [
                Text(
                  _submitting ? 'Memproses absensi...' : challenge.$2,
                  textAlign: TextAlign.center,
                  style: AppTypography.headlineMd
                      .copyWith(color: AppColors.inverseOnSurface),
                ),
                const SizedBox(height: AppSpacing.md),
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  child: LinearProgressIndicator(
                    value: _submitting ? null : progress,
                    minHeight: 8,
                    backgroundColor: Colors.white24,
                    valueColor: const AlwaysStoppedAnimation(
                        AppColors.primaryFixedDim),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Langkah ${_step + 1} dari ${_challenges.length}',
                  style: AppTypography.labelSm
                      .copyWith(color: AppColors.outlineVariant),
                ),
              ],
            ),
          ),
          const Spacer(),
        ],
      ),
    );
  }
}
