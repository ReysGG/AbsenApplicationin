import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../shared/data/leave_repository.dart';
import '../../shared/models/leave_request.dart';

final leaveListProvider = FutureProvider.autoDispose<List<LeaveRequest>>((
  ref,
) async {
  return ref.watch(leaveRepositoryProvider).getRequests();
});

/// Submits a new leave request and refreshes the list.
final leaveSubmitProvider = Provider<Future<LeaveRequest> Function(LeaveDraft)>(
  (ref) {
    return (draft) async {
      final result = await ref.read(leaveRepositoryProvider).submit(draft);
      ref.invalidate(leaveListProvider);
      return result;
    };
  },
);

/// Cancels a pending leave request and refreshes the list.
final leaveCancelProvider = Provider<Future<void> Function(String)>((ref) {
  return (id) async {
    await ref.read(leaveRepositoryProvider).cancel(id);
    ref.invalidate(leaveListProvider);
  };
});
