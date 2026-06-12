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
import '../../core/widgets/aurora_background.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/lottie_icon.dart';
import '../../core/widgets/pressable.dart';
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

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(leaveListProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: const Text('Pengajuan')),
      floatingActionButton: Pressable(
        child: FloatingActionButton.extended(
          onPressed: () => context.push(AppRoutes.createLeave),
          icon: const Icon(Icons.add),
          label: const Text('Ajukan'),
        ),
      )
          .animate()
          .fadeIn(duration: 320.ms, delay: 200.ms, curve: Curves.easeOut)
          .slideY(begin: 0.4, duration: 360.ms, curve: Curves.easeOutBack),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                child: Row(
                  children: [
                    _Chip(
                      label: 'Semua',
                      selected: _filter == null,
                      onTap: () => setState(() => _filter = null),
                    ),
                    for (final s in [
                      LeaveStatus.pending,
                      LeaveStatus.approved,
                      LeaveStatus.rejected,
                    ])
                      _Chip(
                        label: s.label,
                        selected: _filter == s,
                        onTap: () => setState(() => _filter = s),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: async.when(
                  loading: () => const Center(
                      child: LottieIcon(LottieIcon.loading, size: 96)),
                  error: (e, _) => Center(child: Text(e.toString())),
                  data: (items) {
                    final filtered = _filter == null
                        ? items
                        : items.where((e) => e.status == _filter).toList();
                    if (filtered.isEmpty) {
                      return _empty();
                    }
                    return RefreshIndicator(
                      onRefresh: () async =>
                          ref.refresh(leaveListProvider.future),
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(
                            AppSpacing.md, AppSpacing.sm, AppSpacing.md, 96),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) => _LeaveCard(
                          request: filtered[i],
                          index: i,
                          // Re-key per filter so cards re-stagger on filter change.
                          key: ValueKey('${_filter?.name ?? 'all'}-${filtered[i].id}'),
                        ),
                        separatorBuilder: (_, _) =>
                            const SizedBox(height: AppSpacing.sm),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _empty() => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const LottieIcon(LottieIcon.empty, size: 160),
            const SizedBox(height: AppSpacing.sm),
            Text('Belum ada pengajuan',
                    style: AppTypography.bodyMd
                        .copyWith(color: AppColors.onSurfaceVariant))
                .animate()
                .fadeIn(duration: 400.ms, delay: 150.ms),
          ],
        ),
      );
}

class _LeaveCard extends StatelessWidget {
  const _LeaveCard({required this.request, required this.index, super.key});
  final LeaveRequest request;
  final int index;

  @override
  Widget build(BuildContext context) {
    final dateLabel = request.dayCount == 1
        ? Formatters.shortDate(request.startDate)
        : '${Formatters.shortDate(request.startDate)} - ${Formatters.shortDate(request.endDate)}';
    return AnimatedEntrance(
      delay: (70 * index).ms,
      slideBegin: 0.08,
      duration: 320.ms,
      child: GlassCard(
        // Entrance handled by AnimatedEntrance (GlassCard.animate field shadows
        // the flutter_animate extension).
        animate: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(request.type.label, style: AppTypography.labelMd),
                StatusBadge(
                  label: request.status.label,
                  color: StatusStyles.leave(request.status),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                Icon(Icons.event,
                    size: 16, color: AppColors.onSurfaceVariant),
                const SizedBox(width: 4),
                Text('$dateLabel · ${request.dayCount} hari',
                    style: AppTypography.labelSm.copyWith(
                        color: AppColors.onSurfaceVariant, letterSpacing: 0)),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(request.reason,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.bodyMd),
            if (request.attachmentName != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Icon(Icons.attach_file,
                      size: 16, color: AppColors.primary),
                  const SizedBox(width: 4),
                  Text(request.attachmentName!,
                      style: AppTypography.labelSm.copyWith(
                          color: AppColors.primary, letterSpacing: 0)),
                ],
              ),
            ],
            if (request.reviewerNote != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Text('Catatan HR: ${request.reviewerNote}',
                    style: AppTypography.labelSm.copyWith(
                        color: AppColors.onSurfaceVariant, letterSpacing: 0)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.sm),
      child: AnimatedScale(
        scale: selected ? 1.05 : 1.0,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutBack,
        child: ChoiceChip(
          label: Text(label),
          selected: selected,
          showCheckmark: false,
          onSelected: (_) => onTap(),
          backgroundColor: AppColors.glassFill,
          selectedColor: AppColors.primary,
          side: BorderSide(
            color: selected
                ? Colors.transparent
                : AppColors.glassBorder,
          ),
          labelStyle: AppTypography.labelMd.copyWith(
            color: selected ? AppColors.onPrimary : AppColors.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
