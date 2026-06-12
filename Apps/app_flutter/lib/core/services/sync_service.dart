import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

import '../../shared/data/attendance_repository.dart';
import 'local_db.dart';

/// Centralizes connectivity checks and the offline → online sync of pending
/// check-ins. The [syncQueueProvider] (UI) and [CheckinFlowController] both use
/// this service.
class SyncService {
  SyncService(this._repo);

  final AttendanceRepository _repo;
  final Connectivity _connectivity = Connectivity();

  /// True when at least one network transport is available.
  Future<bool> isOnline() async {
    final results = await _connectivity.checkConnectivity();
    return _hasConnection(results);
  }

  /// Stream of connectivity-change events mapped to a simple online bool.
  Stream<bool> onConnectivityChanged() =>
      _connectivity.onConnectivityChanged.map(_hasConnection);

  static bool _hasConnection(List<ConnectivityResult> results) =>
      results.any((r) => r != ConnectivityResult.none);

  /// Pushes every pending item to the backend. Returns the number synced.
  ///
  /// On success the row is deleted; on failure it is marked 'failed' so the UI
  /// can show the error and the next connectivity event can retry it.
  Future<int> syncPending() async {
    if (!await isOnline()) return 0;

    final pending = await LocalDb.instance.getPending();
    var synced = 0;

    for (final item in pending) {
      try {
        await LocalDb.instance.updateStatus(item.id, 'syncing');
        final submission = AttendanceSubmission.fromJson(item.payload);
        if (item.type == 'checkout') {
          await _repo.checkOut(submission);
        } else {
          await _repo.checkIn(submission);
        }
        await LocalDb.instance.delete(item.id);
        synced++;
      } catch (_) {
        await LocalDb.instance.updateStatus(item.id, 'failed');
      }
    }
    return synced;
  }
}
