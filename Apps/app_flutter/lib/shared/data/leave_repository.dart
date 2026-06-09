import '../models/enums.dart';
import '../models/leave_request.dart';
import 'mock_data.dart';

class LeaveDraft {
  const LeaveDraft({
    required this.type,
    required this.startDate,
    required this.endDate,
    required this.reason,
    this.attachmentName,
  });

  final LeaveType type;
  final DateTime startDate;
  final DateTime endDate;
  final String reason;
  final String? attachmentName;
}

abstract interface class LeaveRepository {
  Future<List<LeaveRequest>> getRequests();
  Future<LeaveRequest> submit(LeaveDraft draft);
  Future<void> cancel(String id);
}

class MockLeaveRepository implements LeaveRepository {
  final List<LeaveRequest> _items = [...MockData.leaveRequests()];

  @override
  Future<List<LeaveRequest>> getRequests() async {
    await _delay();
    final sorted = [..._items]
      ..sort((a, b) => b.startDate.compareTo(a.startDate));
    return sorted;
  }

  @override
  Future<LeaveRequest> submit(LeaveDraft draft) async {
    await _delay();
    final request = LeaveRequest(
      id: 'lv-${DateTime.now().millisecondsSinceEpoch}',
      type: draft.type,
      startDate: draft.startDate,
      endDate: draft.endDate,
      reason: draft.reason,
      status: LeaveStatus.pending,
      attachmentName: draft.attachmentName,
      submittedAt: DateTime.now(),
    );
    _items.insert(0, request);
    return request;
  }

  @override
  Future<void> cancel(String id) async {
    await _delay();
    final idx = _items.indexWhere((e) => e.id == id);
    if (idx != -1) {
      final r = _items[idx];
      _items[idx] = LeaveRequest(
        id: r.id,
        type: r.type,
        startDate: r.startDate,
        endDate: r.endDate,
        reason: r.reason,
        status: LeaveStatus.cancelled,
        attachmentName: r.attachmentName,
        submittedAt: r.submittedAt,
        reviewerNote: r.reviewerNote,
      );
    }
  }

  Future<void> _delay() =>
      Future<void>.delayed(const Duration(milliseconds: 500));
}
