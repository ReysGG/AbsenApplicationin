import '../models/user_profile.dart';

/// Authentication boundary. Mock implementation lets the full UI flow run
/// before Firebase/mobile-auth endpoints exist (Fase 6).
abstract interface class AuthRepository {
  /// Returns the current profile if a valid session exists, else null.
  Future<UserProfile?> restoreSession();

  /// Signs in with email + password. Returns the authenticated profile.
  Future<UserProfile> login({required String email, required String password});

  Future<void> logout();
}

/// In-memory mock used while [AppConfig.useMockData] is true.
class MockAuthRepository implements AuthRepository {
  UserProfile? _current;

  static const _demoProfile = UserProfile(
    id: 'emp-001',
    fullName: 'David Boy',
    email: 'david@inovasikerja.id',
    employeeCode: 'IKD-0012',
    position: 'Software Engineer',
    department: 'Engineering',
    workspaceName: 'PT Inovasi Kerja Digital',
    faceEnrolled: true,
  );

  @override
  Future<UserProfile?> restoreSession() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    return _current;
  }

  @override
  Future<UserProfile> login({
    required String email,
    required String password,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 900));
    if (password.length < 4) {
      throw const _AuthError('Email atau kata sandi salah.');
    }
    _current = _demoProfile;
    return _demoProfile;
  }

  @override
  Future<void> logout() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    _current = null;
  }
}

class _AuthError implements Exception {
  const _AuthError(this.message);
  final String message;
  @override
  String toString() => message;
}
