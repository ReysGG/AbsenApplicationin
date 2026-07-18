import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:screen_brightness/screen_brightness.dart';

import '../../core/config/app_config.dart';
import '../../core/network/api_exception.dart';
import '../../core/router/app_routes.dart';
import '../../core/services/face_liveness_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/face_prep_instructions.dart';
import 'checkin_flow_controller.dart';

/// The liveness challenges, run in a random order.
enum _Challenge { blink, turnHead }

/// Step 3: real-time face detection + 2-step liveness challenge using the front
/// camera and ML Kit. A face must be present throughout; the user must pass a
/// BLINK challenge (eyes open → closed → open) and a TURN HEAD challenge
/// (headEulerAngleY beyond ±20°), shown in random order.
class FaceVerificationScreen extends ConsumerStatefulWidget {
  const FaceVerificationScreen({super.key});

  @override
  ConsumerState<FaceVerificationScreen> createState() =>
      _FaceVerificationScreenState();
}

class _FaceVerificationScreenState
    extends ConsumerState<FaceVerificationScreen> {
  CameraController? _controller;
  final FaceLivenessService _liveness = FaceLivenessService();

  bool _initializing = true;
  bool _busy = false;
  bool _submitting = false;
  String? _error;

  /// Show pre-camera instructions first; camera starts after "Lanjutkan".
  bool _showInstructions = true;

  bool _faceDetected = false;

  // Ordered list of challenges (randomized) + which are done.
  late final List<_Challenge> _order;
  int _current = 0;
  final Set<_Challenge> _passed = {};
  bool _awaitingNeutralCapture = false;
  String? _neutralCaptureHint;
  Timer? _neutralCaptureTimer;
  static const _neutralCaptureDelay = Duration(seconds: 2);

  // Blink state machine: need open → closed → open again.
  bool _sawOpen = false;
  bool _sawClosed = false;

  int _sensorOrientation = 90;

  @override
  void initState() {
    super.initState();
    if (kIsWeb) {
      _submitWebBypass();
      return;
    }
    _order = [_Challenge.blink, _Challenge.turnHead]..shuffle(Random());
    // Brightness boost + camera start after the instruction step (_startCamera).
  }

  void _startCamera() {
    setState(() => _showInstructions = false);
    _boostBrightness();
    _initCamera();
  }

  Future<void> _submitWebBypass() async {
    await Future.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    if (!AppConfig.useMockData) {
      setState(
        () => _error =
            'Verifikasi wajah hanya tersedia di aplikasi mobile dengan kamera perangkat.',
      );
      return;
    }

    ref
        .read(checkinFlowProvider.notifier)
        .setFaceResult(
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

  Future<void> _boostBrightness() async {
    try {
      await ScreenBrightness().setApplicationScreenBrightness(1.0);
    } catch (_) {
      // Non-critical — proceed at the device's current brightness.
    }
  }

  Future<void> _restoreBrightness() async {
    try {
      await ScreenBrightness().resetApplicationScreenBrightness();
    } catch (_) {}
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
    } on CameraException catch (e) {
      if (!mounted) return;
      setState(() {
        _initializing = false;
        _error = e.code == 'CameraAccessDenied'
            ? 'Izin kamera ditolak. Berikan izin kamera untuk verifikasi wajah.'
            : 'Kamera tidak tersedia: ${e.description ?? e.code}';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _initializing = false;
        _error =
            'Kamera tidak tersedia. Gunakan perangkat dengan kamera depan.';
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

      if (faces.isEmpty) {
        if (_faceDetected && mounted) setState(() => _faceDetected = false);
        return;
      }

      final face = faces.first;
      if (!_faceDetected && mounted) setState(() => _faceDetected = true);

      if (_awaitingNeutralCapture) {
        _evaluateNeutralCapture(face, image);
        return;
      }

      _evaluateChallenge(face);
    } finally {
      _busy = false;
    }
  }

  void _evaluateChallenge(Face face) {
    if (_current >= _order.length) return;
    final challenge = _order[_current];

    var advanced = false;
    switch (challenge) {
      case _Challenge.blink:
        final left = face.leftEyeOpenProbability;
        final right = face.rightEyeOpenProbability;
        if (left == null || right == null) break;
        final bothOpen = left > 0.7 && right > 0.7;
        final bothClosed = left < 0.3 && right < 0.3;
        if (bothOpen && !_sawClosed) {
          _sawOpen = true;
        } else if (bothClosed && _sawOpen) {
          _sawClosed = true;
        } else if (bothOpen && _sawOpen && _sawClosed) {
          advanced = true; // open → closed → open complete
        }
        break;
      case _Challenge.turnHead:
        final y = face.headEulerAngleY;
        if (y != null && y.abs() > 20) {
          advanced = true;
        }
        break;
    }

    if (advanced) {
      _passed.add(challenge);
      _sawOpen = false;
      _sawClosed = false;
      if (mounted) {
        setState(() => _current++);
      }
      if (_passed.length == _order.length) {
        _beginNeutralCapture();
      }
    }
  }

  void _beginNeutralCapture() {
    if (_submitting || _awaitingNeutralCapture) return;
    _neutralCaptureTimer?.cancel();
    setState(() {
      _awaitingNeutralCapture = true;
      _neutralCaptureHint = 'Hadapkan wajah lurus dan tatap kamera sebentar';
    });
    // Liveness is already complete. Give the user a short moment to face the
    // camera, then let the server-side face model authoritatively validate the
    // still image instead of depending on jittery ML Kit frame probabilities.
    _neutralCaptureTimer = Timer(_neutralCaptureDelay, () {
      if (!mounted || !_awaitingNeutralCapture || _submitting) return;
      unawaited(_captureAndSubmit());
    });
  }

  void _evaluateNeutralCapture(Face face, CameraImage image) {
    final yaw = face.headEulerAngleY ?? 0;
    final roll = face.headEulerAngleZ ?? 0;
    final leftEye = face.leftEyeOpenProbability;
    final rightEye = face.rightEyeOpenProbability;
    final faceWidthRatio = face.boundingBox.width / image.width;
    String? hint;
    if (faceWidthRatio < 0.18) {
      hint = 'Dekatkan wajah sedikit ke kamera';
    } else if (faceWidthRatio > 0.80) {
      hint = 'Jauhkan wajah sedikit dari kamera';
    } else if (yaw.abs() > 15 || roll.abs() > 15) {
      hint = 'Hadapkan wajah lurus ke kamera';
    } else if ((leftEye != null && leftEye < 0.4) ||
        (rightEye != null && rightEye < 0.4)) {
      hint = 'Buka mata dan tatap kamera';
    }
    final nextHint = hint ?? 'Tahan posisi, sedang mengambil foto wajah';
    if (_neutralCaptureHint != nextHint && mounted) {
      setState(() => _neutralCaptureHint = nextHint);
    }
  }

  Future<void> _captureAndSubmit() async {
    if (_submitting) return;
    _neutralCaptureTimer?.cancel();
    setState(() => _submitting = true);

    // Stop the stream before navigating away.
    try {
      await _controller?.stopImageStream();
    } catch (_) {}

    String? faceImageBase64;
    try {
      final controller = _controller;
      if (controller != null && controller.value.isInitialized) {
        final shot = await controller.takePicture();
        final bytes = await shot.readAsBytes();
        faceImageBase64 = base64Encode(bytes);
      }
    } catch (_) {}

    if (faceImageBase64 == null || faceImageBase64.isEmpty) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = 'Foto wajah gagal diambil. Coba verifikasi ulang.';
      });
      return;
    }

    ref
        .read(checkinFlowProvider.notifier)
        .setFaceResult(
          faceVerified: true,
          liveness: true,
          checksPassed: _passed.length,
          checksTotal: _order.length,
          faceImageBase64: faceImageBase64,
        );
    try {
      final record = await ref.read(checkinFlowProvider.notifier).submit();
      if (!mounted) return;
      context.pushReplacement('${AppRoutes.checkinSuccess}?id=${record.id}');
    } catch (e) {
      // Never hang on the "Memproses absensi..." spinner if the server rejects
      // the submission (e.g. already checked out, no check-in yet). Surface the
      // message with a retry instead.
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = e is ApiException
            ? e.message
            : 'Gagal memproses absensi. Periksa koneksi lalu coba lagi.';
      });
    }
  }

  @override
  void dispose() {
    _neutralCaptureTimer?.cancel();
    _restoreBrightness();
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

  String get _instruction {
    if (_submitting) return 'Memproses absensi...';
    if (_awaitingNeutralCapture) {
      if (!_faceDetected) return 'Posisikan wajah di dalam bingkai';
      return _neutralCaptureHint ??
          'Hadapkan wajah lurus dan tatap kamera sebentar';
    }
    if (!_faceDetected) return 'Posisikan wajah di dalam bingkai';
    if (_current >= _order.length) return 'Verifikasi selesai';
    return switch (_order[_current]) {
      _Challenge.blink => 'Kedipkan mata perlahan',
      _Challenge.turnHead => 'Hadapkan kepala ke kiri atau ke kanan',
    };
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: AppSpacing.md),
              Text(
                _error ?? 'Memproses...',
                style: AppTypography.bodyMd.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      );
    }
    final total = _order.length;
    final done = _passed.length;
    final progress = total == 0 ? 0.0 : done / total;

    if (_showInstructions) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          foregroundColor: AppColors.onSurface,
          elevation: 0,
          title: const Text('Verifikasi Wajah'),
        ),
        body: FacePrepInstructions(onContinue: _startCamera),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF191B23),
        elevation: 0,
        title: const Text('Verifikasi Wajah'),
      ),
      body: _error != null
          ? _ErrorView(message: _error!, onRetry: _retry)
          : Column(
              children: [
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
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                  ),
                  child: Column(
                    children: [
                      Text(
                        _instruction,
                        textAlign: TextAlign.center,
                        style: AppTypography.headlineMd.copyWith(
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      // Per-challenge checkmarks.
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          for (final c in _order) ...[
                            Icon(
                              _passed.contains(c)
                                  ? Icons.check_circle
                                  : Icons.radio_button_unchecked,
                              color: _passed.contains(c)
                                  ? AppColors.success
                                  : AppColors.outlineVariant,
                              size: 20,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              c == _Challenge.blink ? 'Kedip' : 'Hadap',
                              style: AppTypography.labelSm.copyWith(
                                color: AppColors.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                          ],
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(AppRadius.full),
                        child: LinearProgressIndicator(
                          value: _submitting ? null : progress,
                          minHeight: 8,
                          backgroundColor: AppColors.surfaceContainerHigh,
                          valueColor: AlwaysStoppedAnimation(AppColors.primary),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        _awaitingNeutralCapture
                            ? 'Menyelesaikan verifikasi wajah'
                            : 'Tantangan $done dari $total',
                        style: AppTypography.labelSm.copyWith(
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
              ],
            ),
    );
  }

  Widget _buildPreview() {
    final controller = _controller;
    if (_initializing ||
        controller == null ||
        !controller.value.isInitialized) {
      return Container(
        color: Colors.black26,
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primaryFixedDim),
        ),
      );
    }
    if (_submitting) {
      return Container(
        color: Colors.black26,
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primaryFixedDim),
        ),
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
    _neutralCaptureTimer?.cancel();
    final oldController = _controller;
    _controller = null;
    try {
      if (oldController != null) {
        if (oldController.value.isStreamingImages) {
          await oldController.stopImageStream();
        }
        await oldController.dispose();
      }
    } catch (_) {}
    if (!mounted) return;
    setState(() {
      _error = null;
      _initializing = true;
      _submitting = false;
      _faceDetected = false;
      _current = 0;
      _passed.clear();
      _sawOpen = false;
      _sawClosed = false;
      _awaitingNeutralCapture = false;
      _neutralCaptureHint = null;
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
            Icon(
              Icons.videocam_off_outlined,
              size: 56,
              color: AppColors.primary,
            ),
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
