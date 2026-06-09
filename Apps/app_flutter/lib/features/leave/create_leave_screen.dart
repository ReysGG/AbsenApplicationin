import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../shared/data/leave_repository.dart';
import '../../shared/models/enums.dart';
import 'leave_controller.dart';

class CreateLeaveScreen extends ConsumerStatefulWidget {
  const CreateLeaveScreen({super.key});

  @override
  ConsumerState<CreateLeaveScreen> createState() => _CreateLeaveScreenState();
}

class _CreateLeaveScreenState extends ConsumerState<CreateLeaveScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonCtrl = TextEditingController();
  LeaveType _type = LeaveType.annual;
  DateTime? _start;
  DateTime? _end;
  String? _attachmentName;
  bool _submitting = false;

  @override
  void dispose() {
    _reasonCtrl.dispose();
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
    if (!_formKey.currentState!.validate()) return;
    if (_start == null || _end == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih tanggal pengajuan terlebih dahulu.')),
      );
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
      appBar: AppBar(title: const Text('Buat Pengajuan')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            Text('Jenis Pengajuan', style: AppTypography.labelMd),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              children: [
                for (final t in LeaveType.values)
                  ChoiceChip(
                    label: Text(t.label),
                    selected: _type == t,
                    showCheckmark: false,
                    onSelected: (_) => setState(() => _type = t),
                    selectedColor: AppColors.primary,
                    labelStyle: AppTypography.labelMd.copyWith(
                      color: _type == t
                          ? AppColors.onPrimary
                          : AppColors.onSurfaceVariant,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            Text('Tanggal', style: AppTypography.labelMd),
            const SizedBox(height: AppSpacing.sm),
            InkWell(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              onTap: _pickRange,
              child: InputDecorator(
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.calendar_month),
                ),
                child: Text(
                  _start == null
                      ? 'Pilih rentang tanggal'
                      : '${Formatters.shortDate(_start!)} - ${Formatters.shortDate(_end!)}',
                  style: AppTypography.bodyLg.copyWith(
                    color: _start == null
                        ? AppColors.onSurfaceVariant
                        : AppColors.onSurface,
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            Text('Alasan', style: AppTypography.labelMd),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              controller: _reasonCtrl,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Jelaskan alasan pengajuan...',
                alignLabelWithHint: true,
              ),
              validator: (v) {
                if ((v ?? '').trim().length < 5) {
                  return 'Alasan minimal 5 karakter';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.lg),

            Text('Bukti Pendukung (opsional)', style: AppTypography.labelMd),
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: () {
                // File picker integration in a later pass; simulate selection.
                setState(() => _attachmentName = 'bukti_pengajuan.pdf');
              },
              icon: const Icon(Icons.upload_file),
              label: Text(_attachmentName ?? 'Unggah Bukti'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: FilledButton(
            onPressed: _submitting ? null : _submit,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: _submitting
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                        strokeWidth: 2.5, color: AppColors.onPrimary),
                  )
                : const Text('Kirim Pengajuan'),
          ),
        ),
      ),
    );
  }
}
