import 'dart:async';

import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Background message handler. Must be a top-level (or static) function and
/// annotated with `@pragma('vm:entry-point')` so it survives tree-shaking and
/// can be invoked from a separate isolate when the app is backgrounded.
///
/// Kept intentionally minimal: when FCM delivers a "notification" payload the
/// system tray notification is shown by the OS automatically, so there's
/// nothing to do for data-only messages here beyond ensuring the isolate can
/// initialize Firebase safely.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // No credentials / init failure — nothing we can do in the background.
  }
}

/// Resilient wrapper around Firebase Cloud Messaging.
///
/// Every entry point is guarded so the app builds and runs even when Firebase
/// credentials (`google-services.json`) are absent or `Firebase.initializeApp`
/// fails. In that case push is silently disabled and all methods become no-ops.
class FcmService {
  FcmService._();

  static final FcmService instance = FcmService._();

  /// True once Firebase initialized successfully. While false every public
  /// method is a no-op.
  bool _enabled = false;

  bool get isEnabled => _enabled;

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  /// Broadcasts foreground FCM messages so the UI can auto-refresh data
  /// (e.g. the leave list + notifications when an approval/rejection arrives).
  /// Safe to listen to even when FCM is disabled — it simply never emits.
  final StreamController<RemoteMessage> _messageController =
      StreamController<RemoteMessage>.broadcast();

  Stream<RemoteMessage> get onMessage => _messageController.stream;

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'attendx_default',
    'AttendX',
    description: 'Notifikasi AttendX (absensi, izin, pengumuman).',
    importance: Importance.high,
  );

  /// Initializes Firebase + local notifications. Never throws: on any failure
  /// push is disabled and the app continues normally.
  Future<void> initFirebaseSafely() async {
    try {
      await Firebase.initializeApp();
      _enabled = true;
    } catch (e, st) {
      _enabled = false;
      debugPrint('[FCM] Firebase init skipped (no/invalid credentials): $e');
      debugPrintStack(stackTrace: st);
      return;
    }

    try {
      await _initLocalNotifications();
      await _requestPermission();
      _wireForegroundHandler();
    } catch (e) {
      // A secondary failure shouldn't disable an otherwise-working Firebase,
      // but push UX may be degraded. Log and continue.
      debugPrint('[FCM] Post-init setup failed: $e');
    }
  }

  Future<void> _initLocalNotifications() async {
    const androidInit =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);
    await _localNotifications.initialize(initSettings);

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);
  }

  Future<void> _requestPermission() async {
    await FirebaseMessaging.instance.requestPermission();
    // Android 13+ runtime POST_NOTIFICATIONS prompt.
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
  }

  void _wireForegroundHandler() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      // Notify listeners (UI auto-refresh) regardless of payload type.
      if (!_messageController.isClosed) {
        _messageController.add(message);
      }
      final notification = message.notification;
      if (notification == null) return;
      _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channel.id,
            _channel.name,
            channelDescription: _channel.description,
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
        ),
      );
    });

    // When the user taps a push that opened the app from background, also
    // signal listeners so the relevant screens refresh.
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (!_messageController.isClosed) {
        _messageController.add(message);
      }
    });
  }

  /// Fetches the FCM device token and registers it with the backend so this
  /// device can receive pushes. No-op when disabled or token unavailable.
  Future<void> registerDeviceToken(Dio dio) async {
    if (!_enabled) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;
      await dio.post<dynamic>(
        '/mobile/me/device-token',
        data: {'token': token, 'platform': 'android'},
      );
    } catch (e) {
      // Best-effort: never block login on a failed registration.
      debugPrint('[FCM] registerDeviceToken failed: $e');
    }
  }

  /// Best-effort removal of this device's token on logout. No-op when disabled.
  Future<void> unregisterDeviceToken(Dio dio) async {
    if (!_enabled) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;
      await dio.delete<dynamic>(
        '/mobile/me/device-token',
        data: {'token': token},
      );
    } catch (e) {
      debugPrint('[FCM] unregisterDeviceToken failed: $e');
    }
  }
}
