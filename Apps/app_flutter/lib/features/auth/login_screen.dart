import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/aurora_background.dart';
import '../../core/widgets/solid_card.dart';
import 'auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).login(
            email: _emailCtrl.text.trim(),
            password: _passwordCtrl.text,
          );
      // Router redirect handles navigation on auth state change.
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AuroraBackground(
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.xl,
                ),
                child: SolidCard(
                  entrance: false,
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Brand
                        Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius:
                                    BorderRadius.circular(AppRadius.lg),
                              ),
                              child: Icon(Icons.verified_outlined,
                                  color: AppColors.onPrimary, size: 22),
                            )
                                .animate()
                                .scaleXY(
                                  begin: 0.6,
                                  end: 1.0,
                                  duration: 500.ms,
                                  curve: Curves.easeOutBack,
                                )
                                .fadeIn(),
                            const SizedBox(width: AppSpacing.sm),
                            Text(AppConfig.appName,
                                style: AppTypography.titleLg.copyWith(
                                  color: AppColors.primary,
                                )),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        Text('Selamat Datang Kembali', style: AppTypography.display)
                            .animate(delay: 80.ms)
                            .fadeIn(duration: 320.ms)
                            .slideY(begin: 0.08, curve: Curves.easeOut),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Silakan masuk ke akun Anda untuk melanjutkan',
                          style: AppTypography.bodyMd.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        )
                            .animate(delay: 140.ms)
                            .fadeIn(duration: 320.ms)
                            .slideY(begin: 0.08, curve: Curves.easeOut),
                        const SizedBox(height: AppSpacing.lg),

                        if (_error != null) ...[
                          _ErrorBanner(message: _error!)
                              .animate()
                              .shake(hz: 4, curve: Curves.easeInOut)
                              .fadeIn(duration: 240.ms),
                          const SizedBox(height: AppSpacing.md),
                        ],

                        _Field(
                          delay: 200.ms,
                          label: 'Email',
                          child: TextFormField(
                            controller: _emailCtrl,
                            keyboardType: TextInputType.emailAddress,
                            textInputAction: TextInputAction.next,
                            autofillHints: const [AutofillHints.email],
                            style: TextStyle(
                                color: AppColors.onSurface,
                                fontSize: 15,
                                fontFamily: 'Inter'),
                            decoration: InputDecoration(
                              hintText: 'nama@perusahaan.com',
                              prefixIcon: const Icon(Icons.mail_outline),
                              filled: true,
                              fillColor: AppColors.surface,
                              enabledBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.lg),
                                borderSide: BorderSide(
                                    color: AppColors.outlineVariant),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.lg),
                                borderSide: BorderSide(
                                    color: AppColors.primary, width: 2),
                              ),
                            ),
                            validator: (v) {
                              final value = v?.trim() ?? '';
                              if (value.isEmpty) return 'Email wajib diisi';
                              if (!value.contains('@')) {
                                  return 'Format email tidak valid';
                               }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),

                        _Field(
                          delay: 280.ms,
                          label: 'Kata Sandi',
                          child: TextFormField(
                            controller: _passwordCtrl,
                            obscureText: _obscure,
                            textInputAction: TextInputAction.done,
                            autofillHints: const [AutofillHints.password],
                            onFieldSubmitted: (_) => _submit(),
                            style: TextStyle(
                                color: AppColors.onSurface,
                                fontSize: 15,
                                fontFamily: 'Inter'),
                            decoration: InputDecoration(
                              hintText: 'Masukkan kata sandi',
                              prefixIcon: const Icon(Icons.lock_outline),
                              filled: true,
                              fillColor: AppColors.surface,
                              enabledBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.lg),
                                borderSide: BorderSide(
                                    color: AppColors.outlineVariant),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.lg),
                                borderSide: BorderSide(
                                    color: AppColors.primary, width: 2),
                              ),
                              suffixIcon: IconButton(
                                icon: Icon(_obscure
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined),
                                onPressed: () =>
                                    setState(() => _obscure = !_obscure),
                              ),
                            ),
                            validator: (v) {
                              if ((v ?? '').isEmpty) {
                                return 'Kata sandi wajib diisi';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                      'Hubungi admin HR untuk reset kata sandi.'),
                                ),
                              );
                            },
                            child: const Text('Lupa Kata Sandi?'),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        _PressableButton(
                          onPressed: _loading ? null : _submit,
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(AppRadius.lg),
                              color: AppColors.primary,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.25),
                                  blurRadius: 16,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: _loading ? null : _submit,
                                borderRadius: BorderRadius.circular(AppRadius.lg),
                                child: Container(
                                  height: 52,
                                  alignment: Alignment.center,
                                  child: _loading
                                      ? const SizedBox(
                                          width: 22,
                                          height: 22,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.5,
                                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                          ),
                                        )
                                      : const Text(
                                          'Masuk',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
                                ),
                              ),
                            ),
                          ),
                        )
                            .animate(delay: 360.ms)
                            .fadeIn(duration: 320.ms)
                            .slideY(begin: 0.08, curve: Curves.easeOut),
                        const SizedBox(height: AppSpacing.xl),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.shield_outlined,
                                size: 18, color: AppColors.outline),
                            const SizedBox(width: AppSpacing.xs),
                            Expanded(
                              child: Text(
                                'Keamanan data Anda terjamin oleh sistem enkripsi kami.',
                                style: AppTypography.labelSm.copyWith(
                                  color: AppColors.outline,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF4F6FB),
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            border: Border.all(color: const Color(0xFFD6DAE5)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Akun demo',
                                  style: AppTypography.labelSm.copyWith(
                                      color: AppColors.brandMid,
                                      letterSpacing: 0)),
                              const SizedBox(height: 2),
                              Text('karyawan@attendx.dev',
                                  style: AppTypography.labelMd),
                              Text('Attendx2024!',
                                  style: AppTypography.bodyMd.copyWith(
                                      color: AppColors.onSurfaceVariant)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
 
/// Labelled form field with a soft glow when its descendant gains focus.
/// Wraps the field in a [Focus] node and reacts via [AnimatedContainer].
class _Field extends StatefulWidget {
  const _Field({
    required this.label,
    required this.child,
    required this.delay,
  });
 
  final String label;
  final Widget child;
  final Duration delay;
 
  @override
  State<_Field> createState() => _FieldState();
}
 
class _FieldState extends State<_Field> {
  bool _focused = false;
 
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: AppTypography.labelMd),
        const SizedBox(height: AppSpacing.xs),
        Focus(
          onFocusChange: (f) => setState(() => _focused = f),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOut,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              boxShadow: _focused
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.22),
                        blurRadius: 16,
                        spreadRadius: 1,
                      ),
                    ]
                  : const [],
            ),
            child: widget.child,
          ),
        ),
      ],
    )
        .animate(delay: widget.delay)
        .fadeIn(duration: 320.ms)
        .slideY(begin: 0.08, curve: Curves.easeOut);
  }
}
 
/// Scales its child down briefly on tap-down for tactile feedback.
class _PressableButton extends StatefulWidget {
  const _PressableButton({required this.child, required this.onPressed});
 
  final Widget child;
  final VoidCallback? onPressed;
 
  @override
  State<_PressableButton> createState() => _PressableButtonState();
}
 
class _PressableButtonState extends State<_PressableButton> {
  double _scale = 1.0;
 
  void _set(double v) {
    if (widget.onPressed == null) return;
    setState(() => _scale = v);
  }
 
  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _set(0.96),
      onPointerUp: (_) => _set(1.0),
      onPointerCancel: (_) => _set(1.0),
      child: AnimatedScale(
        scale: _scale,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}
 
class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;
 
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.errorContainer,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: AppColors.onErrorContainer),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style: AppTypography.bodyMd.copyWith(
                color: AppColors.onErrorContainer,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
