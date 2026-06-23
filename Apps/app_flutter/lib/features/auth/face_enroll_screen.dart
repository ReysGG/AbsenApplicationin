import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

import '../../core/router/app_routes.dart';
import '../../core/services/face_liveness_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import 'auth_controller.dart';

/// First-time face enrollment. HR creates the account; here the employee
/// registers their face. We require ONE clear, frontal face with both eyes
/// open, held steady for a moment, then call the backend to flip
/// faceProfileStatus → Registered.
///
/// NOTE: this captures a good-quality reference frame and marks the profile
/// enrolled. True 1:1 embedding matching at check-in is a documented future
/// step (the backend integrity layer already accepts an optional faceMatchScore).
class FaceEnrollScreen extends ConsumerStatefulWidget {
  const FaceEnrollScreen({super.key});

  @override
  ConsumerState<FaceEnrollScreen> createState() => _FaceEnrollScreenState();
}

class _FaceEnrollScreenState extends ConsumerState<FaceEnrollScreen> {
  CameraController? _controller;
  final FaceLivenessService _liveness = FaceLivenessService();

  bool _initializing = true;
  bool _busy = false;
  bool _submitting = false;
  String? _error;

  /// How many consecutive "good" frames we've seen (debounce before capture).
  int _goodFrames = 0;
  static const _requiredGoodFrames = 8; // ~0.8s at ~10fps
  String _hint = 'Posisikan wajah di dalam bingkai';

  /// After a few seconds without an automatic capture (e.g. glasses confuse the
  /// eye-open detector), offer a manual capture escape so the user is never
  /// permanently stuck.
  bool _showManualCapture = false;
  Timer? _fallbackTimer;

  int _sensorOrientation = 90;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) _initCamera();
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.isNotEmpty
            ? cameras.first
            : (throw Exception('Tidak ada kamera tersedia')),
      );
      _sensorOrientation = front.sensorOrientation;

      final controller = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.nv21,
      );
      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      _controller = controller;
      setState(() => _initializing = false);
      await controller.startImageStream(_onFrame);
      // Safety net: if auto-detection can't lock on within a few seconds
      // (glasses/glare/lighting), reveal a manual capture button.
      _fallbackTimer?.cancel();
      _fallbackTimer = Timer(const Duration(seconds: 7), () {
        if (mounted && !_submitting) {
          setState(() => _showManualCapture = true);
        }
      });
    } on CameraException catch (e) {
      if (!mounted) return;
      setState(() {
        _initializing = false;
        _error = e.code == 'CameraAccessDenied'
            ? 'Izin kamera ditolak. Berikan izin kamera untuk mendaftarkan wajah.'
            : 'Kamera tidak tersedia: ${e.description ?? e.code}';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _initializing = false;
        _error = 'Kamera tidak tersedia. Gunakan perangkat dengan kamera depan.';
      });
    }
  }

  Future<void> _onFrame(CameraImage image) async {
    if (_busy || _submitting || !mounted) return;
    _busy = true;
    try {
      final faces = await _liveness.processFrame(
        image,
        _sensorOrientation,
        isFrontCamera: true,
      );
      _evaluate(faces, image);
    } finally {
      _busy = false;
    }
  }

  void _evaluate(List<Face> faces, CameraImage image) {
    String? hint;
    var good = false;

    if (faces.isEmpty) {
      hint = 'Posisikan wajah di dalam bingkai';
    } else if (faces.length > 1) {
      hint = 'Pastikan hanya ada satu wajah';
    } else {
      final face = faces.first;
      final left = face.leftEyeOpenProbability;
      final right = face.rightEyeOpenProbability;
      final yaw = face.headEulerAngleY ?? 0;
      final roll = face.headEulerAngleZ ?? 0;
      final faceWidthRatio = face.boundingBox.width / image.width;

      if (faceWidthRatio < 0.18) {
        hint = 'Dekatkan wajah ke kamera';
      } else if (faceWidthRatio > 0.80) {
        hint = 'Jauhkan sedikit wajahmu';
      } else if (yaw.abs() > 20 || roll.abs() > 20) {
        hint = 'Hadapkan wajah lurus ke kamera';
      } else if (left != null && right != null && left < 0.35 && right < 0.35) {
        // Only block when BOTH eyes are clearly closed. Glasses + glare make the
        // eye-open probability unreliable, so we demand strong evidence before
        // blocking — this was the main cause of enrollment getting stuck.
        hint = 'Buka mata dan tatap kamera';
      } else {
        hint = 'Tahan… sedang merekam wajahmu';
        good = true;
      }
    }

    if (good) {
      _goodFrames++;
      if (_goodFrames >= _requiredGoodFrames) {
        _enroll();
        return;
      }
    } else {
      // Soft-decay instead of a hard reset: one dropped or averted frame
      // shouldn't wipe all progress (robust against glasses / minor movement).
      _goodFrames = _goodFrames > 2 ? _goodFrames - 2 : 0;
    }

    if (mounted && hint != _hint) setState(() => _hint = hint!);
  }

  Future<void> _enroll() async {
    if (_submitting) return;
    setState(() => _submitting = true);
    _fallbackTimer?.cancel();
    try {
      await _controller?.stopImageStream();
    } catch (_) {}
    try {
      await ref.read(authControllerProvider.notifier).enrollFace();
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          icon: Icon(Icons.verified_rounded,
              color: AppColors.success, size: 48),
          title: const Text('Wajah Terdaftar'),
          content: const Text(
              'Wajahmu berhasil didaftarkan. Sekarang kamu bisa melakukan absensi.'),
          actions: [
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Selesai'),
            ),
          ],
        ),
      );
      if (mounted) context.pop();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = 'Gagal mendaftarkan wajah: ${e.toString()}';
      });
    }
  }

  @override
  void dispose() {
    _fallbackTimer?.cancel();
    final controller = _controller;
    _controller = null;
    () async {
      try {
        if (controller != null) {
          if (controller.value.isStreamingImages) {
            await controller.stopImageStream();
          }
          await controller.dispose();
        }
      } catch (_) {}
      await _liveness.close();
    }();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) return _WebBypassView(onContinue: () => context.go(AppRoutes.home));
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
        title: const Text('Daftarkan Wajah'),
      ),
      body: _error != null
          ? _ErrorView(message: _error!, onRetry: _retry)
          : Column(
              children: [
                const SizedBox(height: AppSpacing.lg),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: Text(
                    'Pastikan wajahmu jelas, menghadap lurus, dan pencahayaan cukup.',
                    textAlign: TextAlign.center,
                    style: AppTypography.bodyMd
                        .copyWith(color: AppColors.onSurfaceVariant),
                  ),
                ),
                const Spacer(),
                Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(160),
                    child: SizedBox(
                      width: 260,
                      height: 320,
                      child: _buildPreview(),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: Text(
                    _submitting ? 'Mendaftarkan wajah…' : _hint,
                    textAlign: TextAlign.center,
                    style: AppTypography.headlineMd
                        .copyWith(color: AppColors.onSurface),
                  ),
                ),
                if (_showManualCapture && !_submitting) ...[
                  const SizedBox(height: AppSpacing.md),
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                    child: Column(
                      children: [
                        Text(
                          'Kesulitan terdeteksi otomatis? Ambil foto manual.',
                          textAlign: TextAlign.center,
                          style: AppTypography.bodyMd
                              .copyWith(color: AppColors.onSurfaceVariant),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        FilledButton.icon(
                          onPressed: _enroll,
                          icon: const Icon(Icons.camera_alt_rounded),
                          label: const Text('Ambil Foto'),
                        ),
                      ],
                    ),
                  ),
                ],
                const Spacer(),
              ],
            ),
    );
  }

  Widget _buildPreview() {
    final controller = _controller;
    if (_initializing ||
        controller == null ||
        !controller.value.isInitialized ||
        _submitting) {
      return Container(
        color: AppColors.surfaceContainerHigh,
        child: const Center(child: CircularProgressIndicator()),
      );
    }
    return FittedBox(
      fit: BoxFit.cover,
      child: SizedBox(
        width: controller.value.previewSize?.height ?? 260,
        height: controller.value.previewSize?.width ?? 320,
        child: CameraPreview(controller),
      ),
    );
  }

  Future<void> _retry() async {
    setState(() {
      _error = null;
      _initializing = true;
      _goodFrames = 0;
    });
    await _initCamera();
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.videocam_off_outlined, size: 56, color: AppColors.primary),
            const SizedBox(height: AppSpacing.md),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppTypography.bodyMd.copyWith(color: AppColors.onSurface),
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Coba Lagi'),
            ),
          ],
        ),
      ),
    );
  }
}

class _WebBypassView extends StatelessWidget {
  const _WebBypassView({required this.onContinue});
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: AppColors.headerGradient,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Icon(Icons.web_rounded, size: 40, color: Colors.white),
                ),
                const SizedBox(height: AppSpacing.xl),
                Text(
                  'Mode Web',
                  style: AppTypography.headlineMd.copyWith(color: AppColors.onSurface),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Pendaftaran wajah tidak tersedia di browser.\nFitur ini hanya tersedia di aplikasi mobile.',
                  style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xl),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: onContinue,
                    icon: const Icon(Icons.arrow_forward_rounded),
                    label: const Text('Lanjut ke Dashboard'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                    ),
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
