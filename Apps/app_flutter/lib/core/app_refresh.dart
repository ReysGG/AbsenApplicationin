import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/home/home_controller.dart';
import '../features/history/history_controller.dart';
import '../features/leave/leave_controller.dart';
import '../features/notifications/notifications_controller.dart';
import 'services/fcm_service.dart';

/// Wraps the app shell and keeps live data fresh WITHOUT a manual pull-to-
/// refresh, by reacting to two signals:
///
///  1. **Incoming FCM push** (e.g. a leave approval/rejection) — invalidates
///     the leave list + notifications so the open screen updates instantly.
///  2. **App resumed** from background — refreshes the same providers, covering
///     the case where the push arrived while the app was closed.
///
/// Invalidating an `autoDispose` provider that nothing is watching is a safe
/// no-op, so this never wastes network calls for screens that aren't visible.
class AppDataRefresher extends ConsumerStatefulWidget {
  const AppDataRefresher({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<AppDataRefresher> createState() => _AppDataRefresherState();
}

class _AppDataRefresherState extends ConsumerState<AppDataRefresher>
    with WidgetsBindingObserver {
  StreamSubscription<RemoteMessage>? _fcmSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fcmSub = FcmService.instance.onMessage.listen(_onPush);
  }

  @override
  void dispose() {
    _fcmSub?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  void _onPush(RemoteMessage message) {
    final type = message.data['type'] ?? '';
    // Leave decisions → refresh leave + notifications.
    if (type.contains('leave')) {
      _refreshLeave();
    }
    // Always refresh notifications on any push.
    _refreshNotifications();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refreshAll();
    }
  }

  void _refreshLeave() => ref.invalidate(leaveListProvider);
  void _refreshNotifications() => ref.invalidate(notificationsListProvider);

  void _refreshAll() {
    ref.invalidate(leaveListProvider);
    ref.invalidate(notificationsListProvider);
    ref.invalidate(homeDataProvider);
    ref.invalidate(historyProvider);
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
