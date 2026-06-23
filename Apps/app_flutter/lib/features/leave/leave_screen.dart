import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/status_styles.dart';
import '../../core/widgets/animated_entrance.dart';
import '../../core/widgets/brand_header.dart';
import '../../core/widgets/solid_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../shared/models/enums.dart';
import '../../shared/models/leave_request.dart';
import 'leave_controller.dart';

class LeaveScreen extends ConsumerStatefulWidget {
  const LeaveScreen({super.key});

  @override
  ConsumerState<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends ConsumerState<LeaveScreen> {
  LeaveStatus? _filter;
  String? _cancellingId;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(leaveListProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: SafeArea(
        child: async.when(
              loading: () => const _LeaveLoading(),
              error: (e, _) => _LeaveError(
                message: e.toString(),
                onRetry: () => ref.refresh(leaveListProvider),
              ),
              data: _buildContent,
            ),
        ),
    );
  }

  Widget _buildContent(List<LeaveRequest> items) {
    final filtered = _filter == null
        ? items
        : items.where((e) => e.status == _filter).toList();
    final summary = _LeaveSummary.from(items);

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(leaveListProvider.future),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          MediaQuery.of(context).padding.bottom + 104,
        ),
        children: [
          _LeaveHero(
            summary: summary,
            onCreate: () => context.push(AppRoutes.createLeave),
          ),
          const SizedBox(height: AppSpacing.md),
          _FilterRow(
            selected: _filter,
            onChanged: (status) => setState(() => _filter = status),
          ),
          const SizedBox(height: AppSpacing.md),
          if (filtered.isEmpty)
            _EmptyLeaveState(
              filtered: _filter != null,
              onCreate: () => context.push(AppRoutes.createLeave),
              onClearFilter: () => setState(() => _filter = null),
            )
          else ...[
            for (var i = 0; i < filtered.length; i++) ...[
              _LeaveCard(
                request: filtered[i],
                index: i,
                cancelling: _cancellingId == filtered[i].id,
                onCancel: filtered[i].status == LeaveStatus.pending
                    ? () => _cancel(filtered[i])
                    : null,
                key: ValueKey('${_filter?.name ?? 'all'}-${filtered[i].id}'),
              ),
              if (i != filtered.length - 1)
                const SizedBox(height: AppSpacing.sm),
            ],
          ],
        ],
      ),
    );
  }

  Future<void> _cancel(LeaveRequest request) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Batalkan pengajuan?'),
        content: Text(
          'Pengajuan ${request.type.label} tanggal '
          '${Formatters.shortDate(request.startDate)} akan dibatalkan.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Tidak'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Batalkan'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _cancellingId = request.id);
    try {
      await ref.read(leaveCancelProvider)(request.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pengajuan berhasil dibatalkan.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal membatalkan pengajuan: $e')),
      );
    } finally {
      if (mounted) setState(() => _cancellingId = null);
    }
  }
}

class _LeaveSummary {
  const _LeaveSummary({
    required this.pending,
    required this.approved,
    required this.approvedDays,
  });

  final int pending;
  final int approved;
  final int approvedDays;

  static _LeaveSummary from(List<LeaveRequest> items) {
    final approvedItems = items.where((e) => e.status == LeaveStatus.approved);
    return _LeaveSummary(
      pending: items.where((e) => e.status == LeaveStatus.pending).length,
      approved: approvedItems.length,
      approvedDays: approvedItems.fold<int>(0, (sum, e) => sum + e.dayCount),
    );
  }
}

class _LeaveHero extends StatelessWidget {
  const _LeaveHero({required this.summary, required this.onCreate});

  final _LeaveSummary summary;
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: AppColors.headerGradient,
            ),
            borderRadius: BorderRadius.circular(AppRadius.xxl),
            boxShadow: [
              BoxShadow(
                color: AppColors.softGlow(AppColors.brandMid),
                blurRadius: 24,
                offset: const Offset(0, 10),
                spreadRadius: -6,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                    ),
                    child: const Icon(
                      Icons.edit_calendar_rounded,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Cuti & Izin',
                          style: AppTypography.headlineLg.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          'Ajukan dan pantau status persetujuanmu',
                          style: AppTypography.bodySm.copyWith(
                            color: Colors.white.withValues(alpha: 0.82),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: _HeroMetric(
                      label: 'Menunggu',
                      value: '${summary.pending}',
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _HeroMetric(
                      label: 'Disetujui',
                      value: '${summary.approved}',
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _HeroMetric(
                      label: 'Hari cuti',
                      value: '${summary.approvedDays}',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              FilledButton.icon(
                onPressed: onCreate,
                icon: const Icon(Icons.add_rounded),
                label: const Text('Ajukan Cuti / Izin'),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.brandMid,
                  minimumSize: const Size.fromHeight(48),
                  textStyle: AppTypography.labelMd.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 320.ms, curve: Curves.easeOut)
        .slideY(begin: -0.04, duration: 320.ms, curve: Curves.easeOut);
  }
}

class _HeroMetric extends StatelessWidget {
  const _HeroMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: AppTypography.titleLg.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.labelSm.copyWith(
              color: Colors.white.withValues(alpha: 0.72),
              letterSpacing: 0,
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow({required this.selected, required this.onChanged});

  final LeaveStatus? selected;
  final ValueChanged<LeaveStatus?> onChanged;

  @override
  Widget build(BuildContext context) {
    final filters = <({String label, LeaveStatus? status})>[
      (label: 'Semua', status: null),
      for (final status in LeaveStatus.values)
        (label: status.label, status: status),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final filter in filters) ...[
            _FilterChip(
              label: filter.label,
              selected: selected == filter.status,
              onTap: () => onChanged(filter.status),
            ),
            const SizedBox(width: AppSpacing.sm),
          ],
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      showCheckmark: false,
      onSelected: (_) => onTap(),
      backgroundColor: AppColors.surface,
      selectedColor: AppColors.primary,
      side: BorderSide(
        color: selected ? Colors.transparent : AppColors.outlineVariant,
      ),
      labelStyle: AppTypography.labelMd.copyWith(
        color: selected ? AppColors.onPrimary : AppColors.onSurfaceVariant,
        fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
      ),
    );
  }
}

class _LeaveCard extends StatelessWidget {
  const _LeaveCard({
    required this.request,
    required this.index,
    required this.cancelling,
    required this.onCancel,
    super.key,
  });

  final LeaveRequest request;
  final int index;
  final bool cancelling;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    final accent = StatusStyles.leave(request.status);
    final dateLabel = request.dayCount == 1
        ? Formatters.shortDate(request.startDate)
        : '${Formatters.shortDate(request.startDate)} - ${Formatters.shortDate(request.endDate)}';

    return AnimatedEntrance(
      delay: (55 * index).ms,
      slideBegin: 0.05,
      duration: 280.ms,
      child: SolidCard(
        entrance: false,
        padding: EdgeInsets.zero,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.xl),
          child: IntrinsicHeight(
            child: Row(
              children: [
                Container(width: 5, color: accent),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    request.type.label,
                                    style: AppTypography.titleLg.copyWith(
                                      color: AppColors.onSurface,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '$dateLabel · ${request.dayCount} hari',
                                    style: AppTypography.bodySm.copyWith(
                                      color: AppColors.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            StatusBadge(
                              label: request.status.label,
                              color: accent,
                              icon: _statusIcon(request.status),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          request.reason,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.bodyMd.copyWith(
                            color: AppColors.onSurface,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Wrap(
                          spacing: AppSpacing.sm,
                          runSpacing: AppSpacing.xs,
                          children: [
                            _MetaPill(
                              icon: Icons.access_time_rounded,
                              label: request.submittedAt == null
                                  ? 'Baru diajukan'
                                  : 'Diajukan ${Formatters.shortDate(request.submittedAt!)}',
                            ),
                            if (request.attachmentName != null)
                              _MetaPill(
                                icon: Icons.attach_file_rounded,
                                label: request.attachmentName!,
                              ),
                          ],
                        ),
                        if (request.reviewerNote != null) ...[
                          const SizedBox(height: AppSpacing.sm),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(AppSpacing.sm),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainerLow,
                              borderRadius: BorderRadius.circular(AppRadius.md),
                            ),
                            child: Text(
                              'Catatan HR: ${request.reviewerNote}',
                              style: AppTypography.bodySm.copyWith(
                                color: AppColors.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                        if (onCancel != null) ...[
                          const SizedBox(height: AppSpacing.sm),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton.icon(
                              onPressed: cancelling ? null : onCancel,
                              icon: cancelling
                                  ? SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: AppColors.error,
                                      ),
                                    )
                                  : const Icon(Icons.close_rounded),
                              label: const Text('Batalkan'),
                              style: TextButton.styleFrom(
                                foregroundColor: AppColors.error,
                              ),
                            ),
                          ),
                        ],
                      ],
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

  IconData _statusIcon(LeaveStatus status) => switch (status) {
    LeaveStatus.pending => Icons.hourglass_top_rounded,
    LeaveStatus.approved => Icons.check_circle_rounded,
    LeaveStatus.rejected => Icons.cancel_rounded,
    LeaveStatus.cancelled => Icons.remove_circle_rounded,
  };
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.onSurfaceVariant),
          const SizedBox(width: 4),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 220),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.labelSm.copyWith(
                color: AppColors.onSurfaceVariant,
                letterSpacing: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyLeaveState extends StatelessWidget {
  const _EmptyLeaveState({
    required this.filtered,
    required this.onCreate,
    required this.onClearFilter,
  });

  final bool filtered;
  final VoidCallback onCreate;
  final VoidCallback onClearFilter;

  @override
  Widget build(BuildContext context) {
    return SolidCard(
          child: Column(
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary.withValues(alpha: 0.20),
                      AppColors.primary.withValues(alpha: 0.08),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
                child: Icon(
                  filtered
                      ? Icons.filter_alt_off_rounded
                      : Icons.event_available_rounded,
                  color: AppColors.primary,
                  size: 34,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                filtered
                    ? 'Tidak ada data pada filter ini'
                    : 'Belum ada pengajuan',
                style: AppTypography.titleLg.copyWith(
                  color: AppColors.onSurface,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                filtered
                    ? 'Coba pilih filter lain untuk melihat pengajuan cuti.'
                    : 'Buat pengajuan cuti, sakit, izin pribadi, dinas luar, atau WFH request dari sini.',
                textAlign: TextAlign.center,
                style: AppTypography.bodyMd.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              if (filtered)
                OutlinedButton.icon(
                  onPressed: onClearFilter,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Tampilkan Semua'),
                )
              else
                FilledButton.icon(
                  onPressed: onCreate,
                  icon: const Icon(Icons.add_rounded),
                  label: const Text('Ajukan Cuti / Izin'),
                ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 260.ms, curve: Curves.easeOut)
        .slideY(begin: 0.04, duration: 260.ms, curve: Curves.easeOut);
  }
}

class _LeaveLoading extends StatelessWidget {
  const _LeaveLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        Container(
              height: 220,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(AppRadius.xxxl),
              ),
            )
            .animate(onPlay: (c) => c.repeat(reverse: true))
            .fade(begin: 0.45, end: 1, duration: 700.ms),
        const SizedBox(height: AppSpacing.md),
        for (var i = 0; i < 3; i++) ...[
          Container(
                height: 132,
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
              )
              .animate(
                onPlay: (c) => c.repeat(reverse: true),
                delay: (i * 80).ms,
              )
              .fade(begin: 0.45, end: 1, duration: 700.ms),
          const SizedBox(height: AppSpacing.sm),
        ],
      ],
    );
  }
}

class _LeaveError extends StatelessWidget {
  const _LeaveError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: SolidCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cloud_off_rounded, size: 44, color: AppColors.error),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Gagal memuat pengajuan',
                style: AppTypography.titleLg.copyWith(
                  color: AppColors.onSurface,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                message,
                textAlign: TextAlign.center,
                style: AppTypography.bodyMd.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
