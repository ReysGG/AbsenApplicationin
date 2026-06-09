import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/models/enums.dart';

/// A queued attendance event awaiting upload.
@immutable
class SyncItem {
  const SyncItem({
    required this.id,
    required this.label,
    required this.detail,
    required this.status,
  });

  final String id;
  final String label;
  final String detail;
  final SyncStatus status;

  SyncItem copyWith({SyncStatus? status}) => SyncItem(
        id: id,
        label: label,
        detail: detail,
        status: status ?? this.status,
      );
}

/// Holds the offline sync queue. Backed by a local DB (drift/hive) and driven
/// by `connectivity_plus` in the full Fase 5 implementation; this in-memory
/// version models the same behavior for the UI.
class SyncQueueController extends StateNotifier<List<SyncItem>> {
  SyncQueueController()
      : super(const [
          SyncItem(
            id: 's1',
            label: 'Check-in WFH',
            detail: 'Tersimpan lokal · 3 hari lalu 08:02',
            status: SyncStatus.pending,
          ),
        ]);

  Future<void> syncNow() async {
    state = [
      for (final item in state)
        item.status == SyncStatus.pending
            ? item.copyWith(status: SyncStatus.syncing)
            : item,
    ];
    await Future<void>.delayed(const Duration(seconds: 1));
    state = [
      for (final item in state) item.copyWith(status: SyncStatus.synced),
    ];
  }
}

final syncQueueProvider =
    StateNotifierProvider<SyncQueueController, List<SyncItem>>((ref) {
  return SyncQueueController();
});
