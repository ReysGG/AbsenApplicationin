import 'package:equatable/equatable.dart';

import 'enums.dart';

/// A leave / permit request submitted by the employee.
class LeaveRequest extends Equatable {
  const LeaveRequest({
    required this.id,
    required this.type,
    required this.startDate,
    required this.endDate,
    required this.reason,
    required this.status,
    this.attachmentName,
    this.submittedAt,
    this.reviewerNote,
  });

  final String id;
  final LeaveType type;
  final DateTime startDate;
  final DateTime endDate;
  final String reason;
  final LeaveStatus status;
  final String? attachmentName;
  final DateTime? submittedAt;
  final String? reviewerNote;

  int get dayCount => endDate.difference(startDate).inDays + 1;

  @override
  List<Object?> get props => [id];
}
