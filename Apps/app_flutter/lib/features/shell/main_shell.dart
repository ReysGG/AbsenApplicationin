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
        // Set to true so body spans under the floating navigation bar,
        // but we add safe sizing to avoid content clipping.
        extendBody: true,
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

/// Floating bottom nav bar from Image #1/#2 concepts:
/// Melayang (floating) with rounded borders, smooth gradients, and no raw overlap bugs.
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

    return Container(
      // Smooth gradient overlay at the very bottom of the screen (from Image #2 concept)
      // to blend the floating nav beautifully with the scroll background.
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.background.withValues(alpha: 0.0),
            AppColors.background.withValues(alpha: 0.8),
            AppColors.background,
          ],
          stops: const [0.0, 0.4, 1.0],
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        24, // spacing above the nav bar to blend the gradient smoothly
        AppSpacing.md,
        bottomPadding > 0 ? bottomPadding + 6 : AppSpacing.md,
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(32), // Rounded custom shape (Image #1)
          border: Border.all(color: AppColors.cardBorder, width: 1.0),
          boxShadow: [
            BoxShadow(
              color: AppColors.cardShadow.withValues(alpha: AppColors.isDark ? 0.3 : 0.05),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: AppColors.cardShadowAmbient.withValues(alpha: AppColors.isDark ? 0.22 : 0.03),
              blurRadius: 40,
              offset: const Offset(0, 16),
              spreadRadius: -12,
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
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
      duration: const Duration(milliseconds: 320),
    );
    _prevSelected = widget.selected;
  }

  @override
  void didUpdateWidget(_NavItem old) {
    super.didUpdateWidget(old);
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
        ? Colors.white
        : AppColors.onSurfaceVariant.withValues(alpha: 0.8);
    final iconColor = selected
        ? Colors.white
        : AppColors.onSurfaceVariant.withValues(alpha: 0.8);

    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: widget.spec.label,
        excludeSemantics: true,
        child: GestureDetector(
          onTap: widget.onTap,
          behavior: HitTestBehavior.opaque,
          child: AnimatedBuilder(
            animation: _bounce,
            builder: (context, child) {
              final t = Curves.easeOutBack.transform(_bounce.value);
              // Slight stretch bounce scale for active tab
              final scale = selected
                  ? 1.0 + 0.12 * (1 - (t - 1).abs().clamp(0.0, 1.0))
                  : 1.0;
              return Transform.scale(scale: scale, child: child);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                // Capsules gradient background for active item (Image #1/#2)
                gradient: selected
                    ? LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: AppColors.navActiveGradient,
                      )
                    : null,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    selected ? widget.spec.activeIcon : widget.spec.icon,
                    color: iconColor,
                    size: 24,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.spec.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.labelSm.copyWith(
                      color: labelColor,
                      fontSize: 10,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
