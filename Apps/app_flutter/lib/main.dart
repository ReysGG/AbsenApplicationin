import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app.dart';
import 'core/services/fcm_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Load Indonesian locale data for date/time formatting.
  await initializeDateFormatting('id_ID', null);

  // Push notifications. Fully guarded: if Firebase credentials are absent or
  // initialization fails, push is silently disabled and the app starts normally.
  try {
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    await FcmService.instance.initFirebaseSafely();
  } catch (_) {
    // Never let push setup block app start.
  }

  runApp(const ProviderScope(child: AttendXApp()));
}
