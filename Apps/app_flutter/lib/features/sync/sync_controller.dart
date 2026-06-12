import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/services/local_db.dart';
import '../../core/services/sync_service.dart';
import '../../shared/models/enums.dart';

/// A queued attendance event awaiting upload (UI model).
@immutable
class SyncItem {
  const SyncItem({
    required this.id,
    required this.label,
    required this.detail,
    required this.status,
    required this.dbId,
  });

  /// Display label derived from the payload type.
  final String id;
  final String label;
  final String detail;
  final SyncStatus status;

  /// The underlying local DB row id (for updateStatus / delete).
  final int dbId;

  SyncItem copyWith({SyncStatus? status}) => SyncItem(
        id: id,
        label: label,
        detail: detail,
        status: status ?? this.status,
        dbId: dbId,
      );
}

/// Converts a [PendingCheckin] row into the display model the UI expects.
SyncItem _toSyncItem(PendingCheckin row) {
  final label = row.type == 'checkout' ? 'Check-out Offline' : 'Check-in Offline';
  final mode = (row.payload['workMode'] as String? ?? 'wfo').toUpperCase();
  final ts = _formatTs(row.capturedAt);
  final detail = 'Tersimpan lokal · $ts · $mode';

  final status = switch (row.status) {
    'syncing' => SyncStatus.syncing,
    'synced'  => SyncStatus.synced,
    'failed'  => SyncStatus.failed,
    _         => SyncStatus.pending,
  };

  return SyncItem(
    id: 'db-${row.id}',
    label: label,
    detail: detail,
    status: status,
    dbId: row.id,
  );
}

String _formatTs(DateTime dt) {
  final local = dt.toLocal();
  final now = DateTime.now();
  final diff = now.difference(local);
  if (diff.inDays >= 1) {
    return '${diff.inDays} hari lalu ${_hm(local)}';
  }
  if (diff.inHours >= 1) {
    return '${diff.inHours} jam lalu';
  }
  return '${diff.inMinutes} menit lalu';
}

String _hm(DateTime dt) =>
    '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

/// Drives the offline sync queue UI.
///
/// - Reads pending rows from SQLite on construction and on each sync.
/// - Listens to connectivity_plus; auto-triggers [syncNow] when the device
///   comes back online.
/// - Exposes [syncNow] for the manual "Sinkronkan Sekarang" button.
class SyncQueueController extends StateNotifier<List<SyncItem>> {
  SyncQueueController(this._syncService) : super(const []) {
    _load();
    _connectivitySub = _syncService.onConnectivityChanged().listen((online) {
      if (online) syncNow();
    });
  }

  final SyncService _syncService;
  StreamSubscription<bool>? _connectivitySub;

  Future<void> _load() async {
    try {
      final rows = await LocalDb.instance.getAll();
      state = rows.map(_toSyncItem).toList();
    } catch (_) {
      // DB not yet initialised on first launch — ignore.
    }
  }

  Future<void> syncNow() async {
    // Optimistically mark all pending as syncing in the UI.
    state = [
      for (final item in state)
        if (item.status == SyncStatus.pending || item.status == SyncStatus.failed)
          item.copyWith(status: SyncStatus.syncing)
        else
          item,
    ];

    await _syncService.syncPending();
    // Reload from DB to reflect the authoritative state after sync.
    await _load();
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }
}

final syncQueueProvider =
    StateNotifierProvider<SyncQueueController, List<SyncItem>>((ref) {
  return SyncQueueController(ref.read(syncServiceProvider));
});
