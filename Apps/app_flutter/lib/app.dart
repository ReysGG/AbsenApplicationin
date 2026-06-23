import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/app_config.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';

class AttendXApp extends ConsumerWidget {
  const AttendXApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    // Read active system brightness to dynamically update isDark.
    final brightness = MediaQuery.platformBrightnessOf(context);
    AppColors.isDark = brightness == Brightness.dark;

    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system, // Follow system automatically
      routerConfig: router,
    );
  }
}
