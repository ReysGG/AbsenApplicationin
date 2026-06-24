import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/services/fcm_service.dart';
import '../../shared/models/user_profile.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState({
    this.status = AuthStatus.unknown,
    this.profile,
    this.isAppLockEnabled = false,
    this.isLocked = false,
  });

  final AuthStatus status;
  final UserProfile? profile;
  final bool isAppLockEnabled;
  final bool isLocked;

  AuthState copyWith({
    AuthStatus? status,
    UserProfile? profile,
    bool? isAppLockEnabled,
    bool? isLocked,
  }) => AuthState(
        status: status ?? this.status,
        profile: profile ?? this.profile,
        isAppLockEnabled: isAppLockEnabled ?? this.isAppLockEnabled,
        isLocked: isLocked ?? this.isLocked,
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
      if (profile != null) {
        final tokenStore = _ref.read(tokenStoreProvider);
        final appLockEnabled = await tokenStore.isAppLockEnabled();
        state = AuthState(
          status: AuthStatus.authenticated,
          profile: profile,
          isAppLockEnabled: appLockEnabled,
          isLocked: appLockEnabled, // Lock on cold start if enabled
        );
      } else {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    } catch (_) {
      // Network error / unreachable backend on cold start must NOT hang the
      // splash. Treat any failure as "not logged in" and route to login.
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login({required String email, required String password}) async {
    final repo = _ref.read(authRepositoryProvider);
    final profile = await repo.login(email: email, password: password);
    final tokenStore = _ref.read(tokenStoreProvider);
    final appLockEnabled = await tokenStore.isAppLockEnabled();
    state = AuthState(
      status: AuthStatus.authenticated,
      profile: profile,
      isAppLockEnabled: appLockEnabled,
      isLocked: false, // Don't lock immediately after login
    );
    // Best-effort: register this device for push. Never block login.
    try {
      await FcmService.instance
          .registerDeviceToken(_ref.read(dioClientProvider).raw);
    } catch (_) {
      // Ignore — push is non-critical.
    }
  }

  Future<void> setAppLockEnabled(bool enabled) async {
    final tokenStore = _ref.read(tokenStoreProvider);
    await tokenStore.setAppLockEnabled(enabled);
    state = state.copyWith(isAppLockEnabled: enabled);
  }

  void unlock() {
    state = state.copyWith(isLocked: false);
  }

  /// Registers the employee's face and updates the cached profile.
  Future<void> enrollFace() async {
    final repo = _ref.read(authRepositoryProvider);
    final updated = await repo.enrollFace();
    state = state.copyWith(profile: updated);
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

/// Granular selectors — each widget should watch the narrowest slice it needs
/// so that unrelated state changes (e.g. isLocked toggling) don't trigger
/// rebuilds of unrelated widgets.

/// Selects the auth status (authenticated / unauthenticated).
final authStatusProvider = Provider<AuthStatus>((ref) {
  return ref.watch(authControllerProvider.select((s) => s.status));
});

/// Selects the user profile. Rebuilds only when the profile changes.
final authProfileProvider = Provider<UserProfile?>((ref) {
  return ref.watch(authControllerProvider.select((s) => s.profile));
});

/// Selects the app-lock state. Rebuilds only when lock state changes.
final authLockProvider = Provider<({bool isAppLockEnabled, bool isLocked})>((ref) {
  return ref.watch(authControllerProvider.select(
    (s) => (isAppLockEnabled: s.isAppLockEnabled, isLocked: s.isLocked),
  ));
});

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});
