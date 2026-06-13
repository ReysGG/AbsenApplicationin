import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../shared/models/app_notification.dart';

/// Public provider for the notification list so it can be refreshed centrally
/// (e.g. by [AppDataRefresher] when an FCM push arrives or the app resumes).
final notificationsListProvider =
    FutureProvider.autoDispose<List<AppNotification>>((ref) async {
  return ref.watch(notificationRepositoryProvider).getAll();
});
