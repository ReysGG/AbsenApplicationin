import 'package:equatable/equatable.dart';

import 'enums.dart';

/// The authenticated employee's profile.
class UserProfile extends Equatable {
  const UserProfile({
    required this.id,
    required this.fullName,
    required this.email,
    required this.employeeCode,
    required this.position,
    required this.department,
    required this.workspaceName,
    this.avatarUrl,
    this.allowedWorkModes = const [WorkMode.wfo],
    this.faceEnrolled = false,
  });

  final String id;
  final String fullName;
  final String email;
  final String employeeCode;
  final String position;
  final String department;
  final String workspaceName;
  final String? avatarUrl;
  final List<WorkMode> allowedWorkModes;
  final bool faceEnrolled;

  /// First name for greetings ("Selamat pagi, David").
  String get firstName {
    final trimmed = fullName.trim();
    return trimmed.isEmpty ? '' : trimmed.split(RegExp(r'\s+')).first;
  }

  UserProfile copyWith({bool? faceEnrolled, String? avatarUrl}) => UserProfile(
    id: id,
    fullName: fullName,
    email: email,
    employeeCode: employeeCode,
    position: position,
    department: department,
    workspaceName: workspaceName,
    avatarUrl: avatarUrl ?? this.avatarUrl,
    allowedWorkModes: allowedWorkModes,
    faceEnrolled: faceEnrolled ?? this.faceEnrolled,
  );

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      fullName:
          json['full_name'] as String? ?? json['fullName'] as String? ?? '',
      email: json['email'] as String? ?? '',
      employeeCode:
          json['employee_code'] as String? ??
          json['employeeCode'] as String? ??
          '',
      position: json['position'] as String? ?? '',
      department: json['department'] as String? ?? '',
      workspaceName:
          json['workspace_name'] as String? ??
          json['workspaceName'] as String? ??
          '',
      avatarUrl: json['avatar_url'] as String? ?? json['avatarUrl'] as String?,
      faceEnrolled:
          json['face_enrolled'] as bool? ??
          json['faceEnrolled'] as bool? ??
          false,
    );
  }

  @override
  List<Object?> get props => [id, email, employeeCode];
}
