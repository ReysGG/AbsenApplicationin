import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_refresh.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

/// Bottom-navigation shell hosting the 5 primary tabs:
/// Beranda · Riwayat · Pengajuan · Shift · Profil.
class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _tabs = [
    _TabSpec(Icons.home_outlined, Icons.home, 'Beranda'),
    _TabSpec(Icons.history_outlined, Icons.history, 'Riwayat'),
    _TabSpec(Icons.edit_calendar_outlined, Icons.edit_calendar, 'Izin'),
    _TabSpec(Icons.calendar_today_outlined, Icons.calendar_today, 'Jadwal'),
    _TabSpec(Icons.person_outline, Icons.person, 'Profil'),
  ];

  void _onTap(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    final current = navigationShell.currentIndex;
    return AppDataRefresher(
      child: Scaffold(
        body: navigationShell,
        bottomNavigationBar: _AppNavBar(
          tabs: _tabs,
          current: current,
          onTap: _onTap,
        ),
      ),
    );
  }
}

class _TabSpec {
  const _TabSpec(this.icon, this.activeIcon, this.label);
  final IconData icon;
  final IconData activeIcon;
  final String label;
}

/// Floating bottom nav bar: a rounded surface pill that hovers above the
/// content with a soft shadow. A gradient icon chip + spring bounce mark the
/// active tab. Modern Playful (see DESIGN.md).
class _AppNavBar extends StatelessWidget {
  const _AppNavBar({
    required this.tabs,
    required this.current,
    required this.onTap,
  });

  final List<_TabSpec> tabs;
  final int current;
  final void Function(int) onTap;

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        0,
        AppSpacing.md,
        bottomPadding > 0 ? bottomPadding : AppSpacing.md,
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.xxxl),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: AppColors.cardShadow,
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
            BoxShadow(
              color: AppColors.cardShadowAmbient,
              blurRadius: 28,
              offset: const Offset(0, 12),
              spreadRadius: -8,
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              for (var i = 0; i < tabs.length; i++)
                _NavItem(
                  spec: tabs[i],
                  selected: i == current,
                  onTap: () => onTap(i),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatefulWidget {
  const _NavItem({
    required this.spec,
    required this.selected,
    required this.onTap,
  });

  final _TabSpec spec;
  final bool selected;
  final VoidCallback onTap;

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _bounce;
  bool _prevSelected = false;

  @override
  void initState() {
    super.initState();
    _bounce = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    );
    _prevSelected = widget.selected;
  }

  @override
  void didUpdateWidget(_NavItem old) {
    super.didUpdateWidget(old);
    // Trigger bounce only on the moment of selection.
    if (widget.selected && !_prevSelected) {
      _bounce.forward(from: 0);
    }
    _prevSelected = widget.selected;
  }

  @override
  void dispose() {
    _bounce.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final selected = widget.selected;
    final labelColor = selected
        ? AppColors.primary
        : AppColors.onSurfaceVariant;
    final iconColor = selected
        ? AppColors.onPrimary
        : AppColors.onSurfaceVariant;

    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: widget.spec.label,
        excludeSemantics: true,
        child: GestureDetector(
          onTap: widget.onTap,
          behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
            margin: const EdgeInsets.symmetric(horizontal: 2),
            decoration: BoxDecoration(
              color: selected
                  ? AppColors.primary.withValues(alpha: 0.13)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(AppRadius.full),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Icon with spring-bounce scale on selection.
                AnimatedBuilder(
                  animation: _bounce,
                  builder: (context, child) {
                    // Spring: overshoot then settle using easeOutBack applied
                    // to the bounce controller value.
                    final t = Curves.easeOutBack.transform(_bounce.value);
                    final scale = selected
                        ? 1.0 + 0.28 * (1 - (t - 1).abs().clamp(0.0, 1.0))
                        : 1.0;
                    return Transform.scale(scale: scale, child: child);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutCubic,
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: selected ? AppColors.primary : Colors.transparent,
                      borderRadius: BorderRadius.circular(AppRadius.full),
                    ),
                    child: Icon(
                      selected ? widget.spec.activeIcon : widget.spec.icon,
                      color: iconColor,
                      size: 22,
                    ),
                  ),
                ),
                const SizedBox(height: 3),
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 200),
                  style: AppTypography.labelSm.copyWith(
                    color: labelColor,
                    letterSpacing: 0,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                  ),
                  child: Text(
                    widget.spec.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
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
