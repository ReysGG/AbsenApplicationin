import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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
    _TabSpec(Icons.post_add_outlined, Icons.post_add, 'Pengajuan'),
    _TabSpec(Icons.schedule_outlined, Icons.schedule, 'Shift'),
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
    return Scaffold(
      body: navigationShell,
      extendBody: true, // content flows behind the translucent nav bar
      bottomNavigationBar: _GlassNavBar(
        tabs: _tabs,
        current: current,
        onTap: _onTap,
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

/// Glass bottom nav bar: backdrop-blurred container + pill indicator that
/// moves with a spring curve. Each icon bounces on selection.
class _GlassNavBar extends StatelessWidget {
  const _GlassNavBar({
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

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.glassFillStrong,
            border: Border(
              top: BorderSide(
                color: AppColors.glassBorder.withValues(alpha: 0.5),
                width: 1,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.glassShadow,
                blurRadius: 24,
                offset: Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: EdgeInsets.only(
                top: 6,
                bottom: bottomPadding > 0 ? 2 : 8,
                left: 4,
                right: 4,
              ),
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

class _NavItemState extends State<_NavItem> with SingleTickerProviderStateMixin {
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
    final labelColor =
        selected ? AppColors.primary : AppColors.onSurfaceVariant;
    final iconColor =
        selected ? AppColors.onPrimary : AppColors.onSurfaceVariant;

    return Expanded(
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
              // Icon with spring-bounce scale on selection
              AnimatedBuilder(
                animation: _bounce,
                builder: (context, child) {
                  // Spring: overshoot then settle using easeOutBack applied
                  // to the bounce controller value.
                  final t = Curves.easeOutBack.transform(_bounce.value);
                  final scale = selected
                      ? 1.0 + 0.28 * (1 - (t - 1).abs().clamp(0.0, 1.0))
                      : 1.0;
                  return Transform.scale(
                    scale: scale,
                    child: child,
                  );
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: selected
                        ? AppColors.primary
                        : Colors.transparent,
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
    );
  }
}
