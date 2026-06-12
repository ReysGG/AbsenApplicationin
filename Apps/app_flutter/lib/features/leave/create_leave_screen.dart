import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/animated_entrance.dart';
import '../../core/widgets/aurora_background.dart';
import '../../core/widgets/glass_card.dart';
import '../../shared/data/leave_repository.dart';
import '../../shared/models/enums.dart';
import 'leave_controller.dart';

class CreateLeaveScreen extends ConsumerStatefulWidget {
  const CreateLeaveScreen({super.key});

  @override
  ConsumerState<CreateLeaveScreen> createState() => _CreateLeaveScreenState();
}

class _CreateLeaveScreenState extends ConsumerState<CreateLeaveScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _reasonCtrl = TextEditingController();
  LeaveType _type = LeaveType.annual;
  DateTime? _start;
  DateTime? _end;
  String? _attachmentName;
  bool _submitting = false;

  // Shake controller for validation feedback.
  late final AnimationController _shakeCtrl;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
  }

  @override
  void dispose() {
    _reasonCtrl.dispose();
    _shakeCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: now.subtract(const Duration(days: 30)),
      lastDate: now.add(const Duration(days: 365)),
      initialDateRange: _start != null && _end != null
          ? DateTimeRange(start: _start!, end: _end!)
          : null,
    );
    if (picked != null) {
      setState(() {
        _start = picked.start;
        _end = picked.end;
      });
    }
  }

  Future<void> _submit() async {
    final valid = _formKey.currentState!.validate();
    if (!valid || _start == null || _end == null) {
      // Trigger shake on the submit button to signal the error.
      _shakeCtrl.forward(from: 0);
      if (_start == null || _end == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Pilih tanggal pengajuan terlebih dahulu.')),
        );
      }
      return;
    }
    setState(() => _submitting = true);
    try {
      final submit = ref.read(leaveSubmitProvider);
      await submit(LeaveDraft(
        type: _type,
        startDate: _start!,
        endDate: _end!,
        reason: _reasonCtrl.text.trim(),
        attachmentName: _attachmentName,
      ));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pengajuan berhasil dikirim.')),
      );
      context.pop();
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Buat Pengajuan'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.md,
                AppSpacing.md,
                AppSpacing.xl,
              ),
              children: [
                // ── Leave type section ──────────────────────────────────────
                GlassCard(
                  animate: true,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Jenis Pengajuan', style: AppTypography.labelMd),
                      const SizedBox(height: AppSpacing.sm),
                      Wrap(
                        spacing: AppSpacing.sm,
                        runSpacing: AppSpacing.xs,
                        children: [
                          for (final t in LeaveType.values)
                            _TypeChip(
                              type: t,
                              selected: _type == t,
                              onTap: () => setState(() => _type = t),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Date range section ──────────────────────────────────────
                AnimatedEntrance(
                  delay: 60.ms,
                  child: GlassCard(
                  animate: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Tanggal', style: AppTypography.labelMd),
                      const SizedBox(height: AppSpacing.sm),
                      InkWell(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        onTap: _pickRange,
                        child: InputDecorator(
                          decoration: InputDecoration(
                            prefixIcon: const Icon(Icons.calendar_month),
                            filled: true,
                            fillColor:
                                AppColors.glassFill.withValues(alpha: 0.4),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppRadius.lg),
                              borderSide: BorderSide(
                                  color: AppColors.glassBorder),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppRadius.lg),
                              borderSide: BorderSide(
                                  color: AppColors.glassBorder),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppRadius.lg),
                              borderSide: BorderSide(
                                  color: AppColors.primary, width: 1.5),
                            ),
                          ),
                          child: Text(
                            _start == null
                                ? 'Pilih rentang tanggal'
                                : '${Formatters.shortDate(_start!)} – ${Formatters.shortDate(_end!)}',
                            style: AppTypography.bodyLg.copyWith(
                              color: _start == null
                                  ? AppColors.onSurfaceVariant
                                  : AppColors.onSurface,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Reason section ──────────────────────────────────────────
                AnimatedEntrance(
                  delay: 120.ms,
                  child: GlassCard(
                  animate: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Alasan', style: AppTypography.labelMd),
                      const SizedBox(height: AppSpacing.sm),
                      TextFormField(
                        controller: _reasonCtrl,
                        maxLines: 4,
                        decoration: InputDecoration(
                          hintText: 'Jelaskan alasan pengajuan...',
                          alignLabelWithHint: true,
                          filled: true,
                          fillColor:
                              AppColors.glassFill.withValues(alpha: 0.4),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                            borderSide:
                                BorderSide(color: AppColors.glassBorder),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                            borderSide:
                                BorderSide(color: AppColors.glassBorder),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                            borderSide: BorderSide(
                                color: AppColors.primary, width: 1.5),
                          ),
                          errorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                            borderSide: BorderSide(
                                color: AppColors.error, width: 1.5),
                          ),
                          focusedErrorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                            borderSide: BorderSide(
                                color: AppColors.error, width: 1.5),
                          ),
                        ),
                        validator: (v) {
                          if ((v ?? '').trim().length < 5) {
                            return 'Alasan minimal 5 karakter';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Attachment section ──────────────────────────────────────
                AnimatedEntrance(
                  delay: 180.ms,
                  child: GlassCard(
                  animate: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Bukti Pendukung (opsional)',
                          style: AppTypography.labelMd),
                      const SizedBox(height: AppSpacing.sm),
                      OutlinedButton.icon(
                        onPressed: () {
                          setState(
                              () => _attachmentName = 'bukti_pengajuan.pdf');
                        },
                        icon: const Icon(Icons.upload_file),
                        label: Text(_attachmentName ?? 'Unggah Bukti'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          side: BorderSide(color: AppColors.glassBorder),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                          ),
                        ),
                      ),
                    ],
                  ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),

                // ── Submit button ───────────────────────────────────────────
                _SubmitButton(
                  submitting: _submitting,
                  shakeController: _shakeCtrl,
                  onTap: _submitting ? null : _submit,
                )
                    .animate(delay: 240.ms)
                    .fadeIn(duration: 300.ms, curve: Curves.easeOut)
                    .slideY(begin: 0.06, duration: 320.ms, curve: Curves.easeOut),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Type chip ───────────────────────────────────────────────────────────────

class _TypeChip extends StatelessWidget {
  const _TypeChip({
    required this.type,
    required this.selected,
    required this.onTap,
  });
  final LeaveType type;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: selected ? 1.05 : 1.0,
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOutBack,
      child: ChoiceChip(
        label: Text(type.label),
        selected: selected,
        showCheckmark: false,
        onSelected: (_) => onTap(),
        backgroundColor: AppColors.glassFill,
        selectedColor: AppColors.primary,
        side: BorderSide(
          color: selected ? Colors.transparent : AppColors.glassBorder,
        ),
        labelStyle: AppTypography.labelMd.copyWith(
          color: selected ? AppColors.onPrimary : AppColors.onSurfaceVariant,
        ),
      ),
    );
  }
}

// ── Submit button with press-scale + shake ──────────────────────────────────

class _SubmitButton extends StatefulWidget {
  const _SubmitButton({
    required this.submitting,
    required this.shakeController,
    required this.onTap,
  });
  final bool submitting;
  final AnimationController shakeController;
  final VoidCallback? onTap;

  @override
  State<_SubmitButton> createState() => _SubmitButtonState();
}

class _SubmitButtonState extends State<_SubmitButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.shakeController,
      builder: (context, child) {
        // Sine-based shake: a few quick oscillations that decay to zero.
        final v = widget.shakeController.value;
        final dx = v == 0
            ? 0.0
            : 10.0 * (1 - v) * math.sin(v * math.pi * 6);
        return Transform.translate(
          offset: Offset(dx, 0),
          child: child,
        );
      },
      child: GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _pressed ? 0.97 : 1.0,
          duration: const Duration(milliseconds: 110),
          curve: Curves.easeOut,
          child: FilledButton(
            onPressed: widget.onTap,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
            ),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              transitionBuilder: (c, anim) =>
                  FadeTransition(opacity: anim, child: c),
              child: widget.submitting
                  ? SizedBox(
                      key: const ValueKey('loading'),
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.5, color: AppColors.onPrimary),
                    )
                  : const Text('Kirim Pengajuan', key: ValueKey('label')),
            ),
          ),
        ),
      ),
    );
  }
}
