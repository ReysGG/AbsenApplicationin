import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/solid_card.dart';
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
  bool _submitting = false;

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

  int? get _dayCount {
    if (_start == null || _end == null) return null;
    return _end!.difference(_start!).inDays + 1;
  }

  Future<void> _pickRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: now.subtract(const Duration(days: 60)),
      lastDate: now.add(const Duration(days: 365)),
      initialDateRange: _start != null && _end != null
          ? DateTimeRange(start: _start!, end: _end!)
          : null,
      helpText: 'Pilih tanggal cuti / izin',
      saveText: 'Pilih',
    );
    if (picked == null) return;

    setState(() {
      _start = DateTime(
        picked.start.year,
        picked.start.month,
        picked.start.day,
      );
      _end = DateTime(picked.end.year, picked.end.month, picked.end.day);
    });
  }

  Future<void> _submit() async {
    final valid = _formKey.currentState!.validate();
    if (!valid || _start == null || _end == null) {
      _shakeCtrl.forward(from: 0);
      if (_start == null || _end == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pilih tanggal pengajuan dulu.')),
        );
      }
      return;
    }

    setState(() => _submitting = true);
    try {
      final submit = ref.read(leaveSubmitProvider);
      await submit(
        LeaveDraft(
          type: _type,
          startDate: _start!,
          endDate: _end!,
          reason: _reasonCtrl.text.trim(),
        ),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pengajuan cuti/izin berhasil dikirim.')),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Gagal mengirim pengajuan: $e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(title: const Text('Ajukan Cuti / Izin')),
      body: SafeArea(
        top: false,
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.md,
              AppSpacing.sm,
              AppSpacing.md,
              AppSpacing.xl,
            ),
            children: [
              _FormHero(type: _type),
              const SizedBox(height: AppSpacing.md),
              _SectionCard(
                title: 'Jenis Pengajuan',
                subtitle: 'Pilih kategori yang paling sesuai.',
                child: Column(
                  children: [
                    for (var i = 0; i < LeaveType.values.length; i++) ...[
                      _TypeOption(
                        type: LeaveType.values[i],
                        selected: _type == LeaveType.values[i],
                        onTap: () =>
                            setState(() => _type = LeaveType.values[i]),
                      ),
                      if (i != LeaveType.values.length - 1)
                        const SizedBox(height: AppSpacing.sm),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              _SectionCard(
                title: 'Tanggal',
                subtitle: 'Pilih rentang hari pengajuan.',
                child: _DatePickerTile(
                  start: _start,
                  end: _end,
                  dayCount: _dayCount,
                  onTap: _pickRange,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              _SectionCard(
                title: 'Alasan',
                subtitle: 'Berikan konteks singkat untuk HR/atasan.',
                child: TextFormField(
                  controller: _reasonCtrl,
                  maxLines: 5,
                  textInputAction: TextInputAction.newline,
                  decoration: const InputDecoration(
                    hintText:
                        'Contoh: Keperluan keluarga / sakit / tugas luar...',
                    alignLabelWithHint: true,
                  ),
                  validator: (value) {
                    final text = (value ?? '').trim();
                    if (text.length < 5) {
                      return 'Alasan minimal 5 karakter';
                    }
                    if (text.length > 500) {
                      return 'Alasan maksimal 500 karakter';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              _AttachmentNotice(type: _type),
              const SizedBox(height: AppSpacing.lg),
              _SubmitButton(
                submitting: _submitting,
                shakeController: _shakeCtrl,
                onTap: _submitting ? null : _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FormHero extends StatelessWidget {
  const _FormHero({required this.type});

  final LeaveType type;

  @override
  Widget build(BuildContext context) {
    final accent = _leaveColor(type);

    return Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: accent,
            borderRadius: BorderRadius.circular(AppRadius.xl),
          ),
          child: Row(
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
                child: Icon(_leaveIcon(type), color: Colors.white, size: 28),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      type.label,
                      style: AppTypography.headlineMd.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Pengajuan akan masuk sebagai status Menunggu sampai disetujui HR/atasan.',
                      style: AppTypography.bodySm.copyWith(
                        color: Colors.white.withValues(alpha: 0.82),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 300.ms, curve: Curves.easeOut)
        .slideY(begin: -0.04, duration: 300.ms, curve: Curves.easeOut);
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.subtitle,
    required this.child,
  });

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SolidCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: AppTypography.titleLg.copyWith(
              color: AppColors.onSurface,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: AppTypography.bodySm.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          child,
        ],
      ),
    );
  }
}

class _TypeOption extends StatelessWidget {
  const _TypeOption({
    required this.type,
    required this.selected,
    required this.onTap,
  });

  final LeaveType type;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = _leaveColor(type);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: AnimatedContainer(
        duration: 180.ms,
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: selected
              ? accent.withValues(alpha: 0.1)
              : AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(
            color: selected ? accent : AppColors.outlineVariant,
            width: selected ? 1.4 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: selected ? 0.16 : 0.1),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(_leaveIcon(type), color: accent, size: 22),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    type.label,
                    style: AppTypography.bodyMd.copyWith(
                      color: AppColors.onSurface,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    _leaveHint(type),
                    style: AppTypography.bodySm.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            AnimatedSwitcher(
              duration: 160.ms,
              child: selected
                  ? Icon(Icons.check_circle_rounded, color: accent)
                  : Icon(
                      Icons.circle_outlined,
                      color: AppColors.outlineVariant,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DatePickerTile extends StatelessWidget {
  const _DatePickerTile({
    required this.start,
    required this.end,
    required this.dayCount,
    required this.onTap,
  });

  final DateTime? start;
  final DateTime? end;
  final int? dayCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final selected = start != null && end != null;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.08)
              : AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.outlineVariant,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(Icons.date_range_rounded, color: AppColors.primary),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    selected
                        ? '${Formatters.shortDate(start!)} - ${Formatters.shortDate(end!)}'
                        : 'Pilih rentang tanggal',
                    style: AppTypography.bodyMd.copyWith(
                      color: selected
                          ? AppColors.onSurface
                          : AppColors.onSurfaceVariant,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    selected
                        ? '$dayCount hari pengajuan'
                        : 'Ketuk untuk membuka kalender',
                    style: AppTypography.bodySm.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: AppColors.onSurfaceVariant,
            ),
          ],
        ),
      ),
    );
  }
}

class _AttachmentNotice extends StatelessWidget {
  const _AttachmentNotice({required this.type});

  final LeaveType type;

  @override
  Widget build(BuildContext context) {
    final important = type == LeaveType.sick;

    return SolidCard(
      color: important
          ? AppColors.pending.withValues(alpha: 0.08)
          : AppColors.surface,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            important ? Icons.medical_information_rounded : Icons.info_rounded,
            color: important ? AppColors.pending : AppColors.primary,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  important ? 'Catatan surat dokter' : 'Lampiran pendukung',
                  style: AppTypography.labelMd.copyWith(
                    color: AppColors.onSurface,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  important
                      ? 'Jika sakit lebih dari 2 hari, siapkan surat dokter untuk disusulkan ke HR/admin.'
                      : 'Form mobile ini mengirim data pengajuan utama. Jika butuh bukti pendukung, susulkan ke HR/admin.',
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
        final v = widget.shakeController.value;
        final dx = v == 0 ? 0.0 : 10.0 * (1 - v) * math.sin(v * math.pi * 6);
        return Transform.translate(offset: Offset(dx, 0), child: child);
      },
      child: Listener(
        onPointerDown: (_) => setState(() => _pressed = true),
        onPointerUp: (_) => setState(() => _pressed = false),
        onPointerCancel: (_) => setState(() => _pressed = false),
        child: AnimatedScale(
          scale: _pressed ? 0.97 : 1.0,
          duration: const Duration(milliseconds: 110),
          curve: Curves.easeOut,
          child: FilledButton(
            onPressed: widget.onTap,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(54),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
            ),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 220),
              child: widget.submitting
                  ? SizedBox(
                      key: const ValueKey('loading'),
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: AppColors.onPrimary,
                      ),
                    )
                  : const Text('Kirim Pengajuan', key: ValueKey('label')),
            ),
          ),
        ),
      ),
    );
  }
}

IconData _leaveIcon(LeaveType type) => switch (type) {
  LeaveType.annual => Icons.beach_access_rounded,
  LeaveType.sick => Icons.medical_services_rounded,
  LeaveType.personal => Icons.family_restroom_rounded,
  LeaveType.businessTrip => Icons.business_center_rounded,
  LeaveType.wfh => Icons.home_work_rounded,
  LeaveType.other => Icons.more_horiz_rounded,
};

Color _leaveColor(LeaveType type) => switch (type) {
  LeaveType.annual => AppColors.brandMid,
  LeaveType.sick => AppColors.error,
  LeaveType.personal => AppColors.accentViolet,
  LeaveType.businessTrip => AppColors.accentGreen,
  LeaveType.wfh => AppColors.accentCyan,
  LeaveType.other => AppColors.onSurfaceVariant,
};

String _leaveHint(LeaveType type) => switch (type) {
  LeaveType.annual => 'Cuti tahunan sesuai saldo/kuota.',
  LeaveType.sick => 'Untuk sakit atau pemulihan kesehatan.',
  LeaveType.personal => 'Izin keperluan pribadi/keluarga.',
  LeaveType.businessTrip => 'Aktivitas kerja di luar kantor.',
  LeaveType.wfh => 'Permintaan bekerja dari rumah.',
  LeaveType.other => 'Gunakan jika kategori tidak tersedia.',
};
