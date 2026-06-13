import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/page_background.dart';
import 'auth_controller.dart';

class LockScreen extends ConsumerStatefulWidget {
  const LockScreen({super.key});

  @override
  ConsumerState<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends ConsumerState<LockScreen> {
  final LocalAuthentication _localAuth = LocalAuthentication();
  bool _isAuthenticating = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    // Auto-trigger authentication after the first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _authenticate();
    });
  }

  Future<void> _authenticate() async {
    if (_isAuthenticating) return;

    setState(() {
      _isAuthenticating = true;
      _errorMessage = null;
    });

    try {
      final bool isSupported = await _localAuth.isDeviceSupported();
      final bool canCheck = await _localAuth.canCheckBiometrics;

      if (!isSupported && !canCheck) {
        setState(() {
          _errorMessage = 'Perangkat tidak mendukung autentikasi keamanan lokal.';
          _isAuthenticating = false;
        });
        // If not supported, we fallback by unlocking to avoid bricking the app
        ref.read(authControllerProvider.notifier).unlock();
        return;
      }

      final bool didAuthenticate = await _localAuth.authenticate(
        localizedReason: 'Gunakan sidik jari atau PIN Anda untuk masuk',
        biometricOnly: false,
        persistAcrossBackgrounding: true,
      );

      if (didAuthenticate) {
        ref.read(authControllerProvider.notifier).unlock();
      } else {
        setState(() {
          _errorMessage = 'Autentikasi gagal. Silakan coba lagi.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Terjadi kesalahan: ${e.toString()}';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isAuthenticating = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: PageBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
            child: Column(
              children: [
                const Spacer(flex: 2),
                
                // Brand Logo & Name
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(AppRadius.xl),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x22004191),
                            blurRadius: 20,
                            offset: Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.lock_person_outlined,
                        color: AppColors.onPrimary,
                        size: 40,
                      ),
                    )
                        .animate()
                        .scaleXY(begin: 0.8, end: 1.0, duration: 500.ms, curve: Curves.easeOutBack)
                        .fadeIn(duration: 400.ms),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      AppConfig.appName,
                      style: AppTypography.display.copyWith(
                        color: AppColors.primary,
                        fontSize: 28,
                      ),
                    )
                        .animate(delay: 100.ms)
                        .fadeIn(duration: 400.ms)
                        .slideY(begin: 0.2, curve: Curves.easeOut),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Aplikasi Terkunci',
                      style: AppTypography.bodyMd.copyWith(
                        color: AppColors.onSurfaceVariant,
                        fontWeight: FontWeight.w500,
                      ),
                    )
                        .animate(delay: 200.ms)
                        .fadeIn(duration: 400.ms),
                  ],
                ),
                
                const Spacer(flex: 2),
                
                // Interactive Fingerprint / Auth Trigger area
                GestureDetector(
                  onTap: _isAuthenticating ? null : _authenticate,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLow,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.15),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.08),
                          blurRadius: 24,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Center(
                      child: _isAuthenticating
                          ? SizedBox(
                              width: 40,
                              height: 40,
                              child: CircularProgressIndicator(
                                strokeWidth: 3,
                                color: AppColors.primary,
                              ),
                            )
                          : Icon(
                              Icons.fingerprint,
                              color: AppColors.primary,
                              size: 52,
                            ),
                    ),
                  )
                      .animate(onPlay: (c) => c.repeat(reverse: true))
                      .scaleXY(
                        begin: 0.95,
                        end: 1.05,
                        duration: 1200.ms,
                        curve: Curves.easeInOut,
                      ),
                ),
                
                const SizedBox(height: AppSpacing.xl),
                
                Text(
                  _isAuthenticating ? 'Menunggu autentikasi...' : 'Ketuk untuk membuka kunci',
                  style: AppTypography.labelMd.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                
                if (_errorMessage != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    _errorMessage!,
                    textAlign: TextAlign.center,
                    style: AppTypography.bodyMd.copyWith(
                      color: AppColors.error,
                      fontSize: 12,
                    ),
                  ).animate().shake(duration: 400.ms),
                ],
                
                const Spacer(flex: 3),
                
                // Fallback option: Logout
                TextButton.icon(
                  onPressed: () => _confirmLogout(context),
                  icon: Icon(Icons.logout, color: AppColors.error, size: 18),
                  label: Text(
                    'Keluar Akun',
                    style: AppTypography.labelMd.copyWith(
                      color: AppColors.error,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
                    .animate(delay: 400.ms)
                    .fadeIn(duration: 500.ms),
                  const SizedBox(height: AppSpacing.lg),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Keluar dari akun?'),
        content: const Text('Anda perlu masuk kembali untuk melakukan absensi.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await ref.read(authControllerProvider.notifier).logout();
    }
  }
}
