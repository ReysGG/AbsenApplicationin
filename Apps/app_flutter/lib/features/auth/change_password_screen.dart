import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/page_background.dart';
import '../../core/widgets/pressable.dart';
import '../../core/widgets/solid_card.dart';
import 'auth_controller.dart';

/// Lets the signed-in employee rotate their password. Verifies the current
/// password server-side (better-auth) and enforces a minimum length.
class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() =>
      _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_submitting) return;
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).changePassword(
            currentPassword: _currentCtrl.text,
            newPassword: _newCtrl.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Kata sandi berhasil diperbarui.')),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      setState(
        () => _error = e.toString().replaceFirst('Exception: ', ''),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Ganti Kata Sandi'),
        backgroundColor: Colors.transparent,
      ),
      body: PageBackground(
        child: SafeArea(
          top: false,
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                if (_error != null) ...[
                  SolidCard(
                    color: AppColors.errorContainer,
                    child: Row(
                      children: [
                        Icon(Icons.error_outline,
                            color: AppColors.onErrorContainer),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Text(
                            _error!,
                            style: AppTypography.bodyMd.copyWith(
                              color: AppColors.onErrorContainer,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                ],
                _PasswordField(
                  controller: _currentCtrl,
                  label: 'Kata Sandi Saat Ini',
                  obscure: _obscureCurrent,
                  onToggle: () =>
                      setState(() => _obscureCurrent = !_obscureCurrent),
                  validator: (v) =>
                      (v ?? '').isEmpty ? 'Wajib diisi' : null,
                ),
                const SizedBox(height: AppSpacing.md),
                _PasswordField(
                  controller: _newCtrl,
                  label: 'Kata Sandi Baru',
                  obscure: _obscureNew,
                  onToggle: () => setState(() => _obscureNew = !_obscureNew),
                  validator: (v) {
                    final value = v ?? '';
                    if (value.length < 8) {
                      return 'Minimal 8 karakter';
                    }
                    if (value == _currentCtrl.text) {
                      return 'Harus berbeda dari kata sandi lama';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.md),
                _PasswordField(
                  controller: _confirmCtrl,
                  label: 'Konfirmasi Kata Sandi Baru',
                  obscure: _obscureConfirm,
                  onToggle: () =>
                      setState(() => _obscureConfirm = !_obscureConfirm),
                  onSubmitted: _submitting ? null : _submit,
                  validator: (v) =>
                      (v ?? '') != _newCtrl.text ? 'Tidak cocok' : null,
                ),
                const SizedBox(height: AppSpacing.lg),
                Pressable(
                  child: FilledButton(
                    onPressed: _submitting ? null : _submit,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                    ),
                    child: _submitting
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Simpan Kata Sandi'),
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

class _PasswordField extends StatelessWidget {
  const _PasswordField({
    required this.controller,
    required this.label,
    required this.obscure,
    required this.onToggle,
    required this.validator,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String label;
  final bool obscure;
  final VoidCallback onToggle;
  final String? Function(String?) validator;
  final VoidCallback? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelMd),
        const SizedBox(height: AppSpacing.xs),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          textInputAction:
              onSubmitted != null ? TextInputAction.done : TextInputAction.next,
          onFieldSubmitted:
              onSubmitted != null ? (_) => onSubmitted!.call() : null,
          style: TextStyle(color: AppColors.onSurface, fontSize: 15),
          decoration: InputDecoration(
            hintText: 'Masukkan kata sandi',
            prefixIcon: const Icon(Icons.lock_outline_rounded),
            suffixIcon: IconButton(
              icon: Icon(obscure
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined),
              onPressed: onToggle,
            ),
          ),
          validator: validator,
        ),
      ],
    );
  }
}
