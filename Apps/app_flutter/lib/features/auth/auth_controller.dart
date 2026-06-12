import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/services/fcm_service.dart';
import '../../shared/models/user_profile.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState({this.status = AuthStatus.unknown, this.profile});

  final AuthStatus status;
  final UserProfile? profile;

  AuthState copyWith({AuthStatus? status, UserProfile? profile}) => AuthState(
        status: status ?? this.status,
        profile: profile ?? this.profile,
      );
}

/// Owns the session lifecycle. The router listens to this for redirects.
class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(const AuthState()) {
    _restore();
  }

  final Ref _ref;

  Future<void> _restore() async {
    try {
      final repo = _ref.read(authRepositoryProvider);
      final profile = await repo.restoreSession();
      state = profile != null
          ? AuthState(status: AuthStatus.authenticated, profile: profile)
          : const AuthState(status: AuthStatus.unauthenticated);
    } catch (_) {
      // Network error / unreachable backend on cold start must NOT hang the
      // splash. Treat any failure as "not logged in" and route to login.
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login({required String email, required String password}) async {
    final repo = _ref.read(authRepositoryProvider);
    final profile = await repo.login(email: email, password: password);
    state = AuthState(status: AuthStatus.authenticated, profile: profile);
    // Best-effort: register this device for push. Never block login.
    try {
      await FcmService.instance
          .registerDeviceToken(_ref.read(dioClientProvider).raw);
    } catch (_) {
      // Ignore — push is non-critical.
    }
  }

  Future<void> logout() async {
    // Best-effort: drop this device's push token before clearing the session,
    // while the bearer token is still available for the authed delete call.
    try {
      await FcmService.instance
          .unregisterDeviceToken(_ref.read(dioClientProvider).raw);
    } catch (_) {
      // Ignore — proceed with logout regardless.
    }
    await _ref.read(authRepositoryProvider).logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});
