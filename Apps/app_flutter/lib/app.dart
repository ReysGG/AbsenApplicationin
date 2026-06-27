import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/app_config.dart';
import 'core/providers.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';

class AttendXApp extends ConsumerWidget {
  const AttendXApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);

    final brightness = MediaQuery.platformBrightnessOf(context);
    AppColors.isDark = switch (themeMode) {
      ThemeMode.light => false,
      ThemeMode.dark => true,
      ThemeMode.system => brightness == Brightness.dark,
    };

    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
      // The design system reads colors from the global `AppColors.isDark`
      // flag (static getters) instead of `Theme.of(context)`. Those reads do
      // not depend on the Theme inherited widget, so a theme switch alone does
      // not rebuild them and leaves screens with stale colors (invisible text,
      // missing labels) until a manual refresh. Keying the page subtree on the
      // active brightness forces a full, immediate rebuild so every static
      // color read re-evaluates against the new mode.
      builder: (context, child) {
        return KeyedSubtree(
          key: ValueKey<bool>(AppColors.isDark),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
