import 'package:equatable/equatable.dart';

enum NotificationKind { reminder, approval, sync, info }

/// An in-app notification entry.
class AppNotification extends Equatable {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.kind,
    this.read = false,
  });

  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final NotificationKind kind;
  final bool read;

  AppNotification copyWith({bool? read}) => AppNotification(
    id: id,
    title: title,
    body: body,
    createdAt: createdAt,
    kind: kind,
    read: read ?? this.read,
  );

  @override
  List<Object?> get props => [id, read];
}
