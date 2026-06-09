import '../models/app_notification.dart';
import 'mock_data.dart';

abstract interface class NotificationRepository {
  Future<List<AppNotification>> getAll();
  Future<void> markRead(String id);
  Future<void> markAllRead();
}

class MockNotificationRepository implements NotificationRepository {
  List<AppNotification> _items = [...MockData.notifications()];

  @override
  Future<List<AppNotification>> getAll() async {
    await Future<void>.delayed(const Duration(milliseconds: 350));
    final sorted = [..._items]
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return sorted;
  }

  @override
  Future<void> markRead(String id) async {
    _items = _items
        .map((n) => n.id == id ? n.copyWith(read: true) : n)
        .toList();
  }

  @override
  Future<void> markAllRead() async {
    _items = _items.map((n) => n.copyWith(read: true)).toList();
  }
}
