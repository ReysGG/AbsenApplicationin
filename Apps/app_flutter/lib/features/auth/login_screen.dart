import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/page_background.dart';
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
      body: PageBackground(
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.lg,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Logo pill ──────────────────────────────────────────
                    _LogoPill()
                        .animate()
                        .scaleXY(
                          begin: 0.7,
                          end: 1.0,
                          duration: 450.ms,
                          curve: Curves.easeOutBack,
                        )
                        .fadeIn(),
                    const SizedBox(height: AppSpacing.lg),

                    // ── Card ───────────────────────────────────────────────
                    _LoginCard(
                      formKey: _formKey,
                      emailCtrl: _emailCtrl,
                      passwordCtrl: _passwordCtrl,
                      obscure: _obscure,
                      loading: _loading,
                      error: _error,
                      onToggleObscure: () =>
                          setState(() => _obscure = !_obscure),
                      onSubmit: _loading ? null : _submit,
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // ── Illustration ── (karakter di bawah card) ──────────
                    _CharacterIllustration()
                        .animate()
                        .fadeIn(duration: 600.ms)
                        .slideY(begin: 0.08, curve: Curves.easeOut),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Logo Pill
// ────────────────────────────────────────────────────────────────────────────
class _LogoPill extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: AppColors.headerGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppRadius.full),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.30),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.verified_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 6),
            Text(
              AppConfig.appName,
              style: AppTypography.titleLg.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Character Illustration (bawah card)
// ────────────────────────────────────────────────────────────────────────────
class _CharacterIllustration extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        height: 220,
        child: Image.asset(
          'assets/images/login_illustration.png',
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Login Card
// ────────────────────────────────────────────────────────────────────────────
class _LoginCard extends StatelessWidget {
  const _LoginCard({
    required this.formKey,
    required this.emailCtrl,
    required this.passwordCtrl,
    required this.obscure,
    required this.loading,
    required this.error,
    required this.onToggleObscure,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController emailCtrl;
  final TextEditingController passwordCtrl;
  final bool obscure;
  final bool loading;
  final String? error;
  final VoidCallback onToggleObscure;
  final VoidCallback? onSubmit;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.xxl),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Heading
            Text('Selamat Datang Kembali', style: AppTypography.display)
                .animate(delay: 80.ms)
                .fadeIn(duration: 320.ms)
                .slideY(begin: 0.08, curve: Curves.easeOut),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Masuk untuk mencatat kehadiranmu hari ini',
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onSurfaceVariant),
            )
                .animate(delay: 140.ms)
                .fadeIn(duration: 320.ms)
                .slideY(begin: 0.08, curve: Curves.easeOut),
            const SizedBox(height: AppSpacing.lg),

            if (error != null) ...[
              _ErrorBanner(message: error!)
                  .animate()
                  .shake(hz: 4, curve: Curves.easeInOut)
                  .fadeIn(duration: 240.ms),
              const SizedBox(height: AppSpacing.md),
            ],

            // Email
            _Field(
              delay: 200.ms,
              label: 'Email',
              child: TextFormField(
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.email],
                style: TextStyle(
                    color: AppColors.onSurface, fontSize: 15),
                decoration: _inputDecoration(
                  hint: 'nama@perusahaan.com',
                  icon: Icons.mail_outline_rounded,
                ),
                validator: (v) {
                  final value = v?.trim() ?? '';
                  if (value.isEmpty) return 'Email wajib diisi';
                  if (!value.contains('@')) return 'Format email tidak valid';
                  return null;
                },
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // Password
            _Field(
              delay: 280.ms,
              label: 'Kata Sandi',
              child: TextFormField(
                controller: passwordCtrl,
                obscureText: obscure,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.password],
                onFieldSubmitted: (_) => onSubmit?.call(),
                style: TextStyle(
                    color: AppColors.onSurface, fontSize: 15),
                decoration: _inputDecoration(
                  hint: 'Masukkan kata sandi',
                  icon: Icons.lock_outline_rounded,
                  suffix: IconButton(
                    tooltip: obscure
                        ? 'Tampilkan kata sandi'
                        : 'Sembunyikan kata sandi',
                    icon: Icon(obscure
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined),
                    onPressed: onToggleObscure,
                  ),
                ),
                validator: (v) {
                  if ((v ?? '').isEmpty) return 'Kata sandi wajib diisi';
                  return null;
                },
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () {},
                child: const Text('Lupa Kata Sandi?'),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),

            // Submit button — gradient
            _PressableButton(
              onPressed: onSubmit,
              child: Container(
                height: 54,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: AppColors.headerGradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.30),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: loading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.login_rounded,
                              color: Colors.white, size: 20),
                          const SizedBox(width: AppSpacing.xs),
                          Text(
                            'Masuk',
                            style: AppTypography.titleLg.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
              ),
            ).animate(delay: 360.ms).fadeIn(duration: 320.ms).slideY(
                  begin: 0.08,
                  curve: Curves.easeOut,
                ),

            const SizedBox(height: AppSpacing.xl),

            // Security note
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.shield_outlined, size: 15, color: AppColors.outline),
                const SizedBox(width: AppSpacing.xs),
                Expanded(
                  child: Text(
                    'Data Anda dilindungi dengan enkripsi end-to-end',
                    style:
                        AppTypography.labelSm.copyWith(color: AppColors.outline),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.md),

            // Demo credentials
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.outlineVariant),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Akun demo',
                      style: AppTypography.labelSm
                          .copyWith(color: AppColors.brandMid, letterSpacing: 0)),
                  const SizedBox(height: 2),
                  Text('karyawan@attendx.dev', style: AppTypography.labelMd),
                  Text('Attendx2024!',
                      style: AppTypography.bodyMd
                          .copyWith(color: AppColors.onSurfaceVariant)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
    Widget? suffix,
  }) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon),
      suffixIcon: suffix,
      filled: true,
      fillColor: AppColors.surface,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        borderSide: BorderSide(color: AppColors.outlineVariant),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        borderSide: BorderSide(color: AppColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        borderSide: BorderSide(color: AppColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        borderSide: BorderSide(color: AppColors.error, width: 2),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers (shared with old code, kept identical to avoid regressions)
// ────────────────────────────────────────────────────────────────────────────

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
    return GestureDetector(
      onTap: widget.onPressed,
      child: Listener(
        onPointerDown: (_) => _set(0.96),
        onPointerUp: (_) => _set(1.0),
        onPointerCancel: (_) => _set(1.0),
        child: AnimatedScale(
          scale: _scale,
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOut,
          child: MouseRegion(
            cursor: widget.onPressed != null
                ? SystemMouseCursors.click
                : SystemMouseCursors.basic,
            child: widget.child,
          ),
        ),
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
