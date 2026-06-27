import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/attendance/checkin_prep_screen.dart';
import '../../features/attendance/checkin_success_screen.dart';
import '../../features/attendance/face_verification_screen.dart';
import '../../features/attendance/location_validation_screen.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/splash_screen.dart';
import '../../features/auth/lock_screen.dart';
import '../../features/auth/face_enroll_screen.dart';
import '../../features/auth/change_password_screen.dart';
import '../../features/history/attendance_detail_screen.dart';
import '../../features/history/history_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/leave/create_leave_screen.dart';
import '../../features/leave/leave_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/schedule/schedule_screen.dart';
import '../../features/shell/main_shell.dart';
import '../../features/sync/sync_status_screen.dart';
import 'app_routes.dart';

final _rootKey = GlobalKey<NavigatorState>();
final _shellKey = GlobalKey<NavigatorState>();

/// Builds the app router with an auth-aware redirect.
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _AuthRefreshNotifier(ref);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: AppRoutes.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loc = state.matchedLocation;

      // Still resolving the stored session → stay on splash.
      if (auth.status == AuthStatus.unknown) {
        return loc == AppRoutes.splash ? null : AppRoutes.splash;
      }

      final loggedIn = auth.status == AuthStatus.authenticated;

      // Session resolved — splash is no longer a valid resting place.
      if (!loggedIn) {
        // Unauthenticated: only the login screen is allowed.
        return loc == AppRoutes.login ? null : AppRoutes.login;
      }

      // Authenticated but locked: force redirect to Lock Screen.
      if (auth.isLocked) {
        return loc == AppRoutes.lock ? null : AppRoutes.lock;
      }

      // On web: skip face enrollment entirely (camera/ML not supported).
      if (!kIsWeb) {
        // Authenticated + unlocked but face not yet enrolled → enroll first.
        final profile = auth.profile;
        if (profile != null && !profile.faceEnrolled) {
          return loc == AppRoutes.faceEnroll ? null : AppRoutes.faceEnroll;
        }
        // Enrolled — don't let them linger on the enrollment screen.
        if (loc == AppRoutes.faceEnroll) return AppRoutes.home;
      } else {
        // Web: bounce away from enroll screen if somehow navigated there.
        if (loc == AppRoutes.faceEnroll) return AppRoutes.home;
      }

      // Authenticated and unlocked: bounce away from splash/login/lock into the app.
      if (loc == AppRoutes.splash || loc == AppRoutes.login || loc == AppRoutes.lock) {
        return AppRoutes.home;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (_, _) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (_, _) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.lock,
        builder: (_, _) => const LockScreen(),
      ),

      // Full-screen flows (outside the bottom-nav shell)
      GoRoute(
        path: AppRoutes.checkinPrep,
        builder: (context, state) => CheckinPrepScreen(
          isCheckout: state.uri.queryParameters['mode'] == 'checkout',
          checkInModeName: state.uri.queryParameters['wm'],
        ),
      ),
      GoRoute(
        path: AppRoutes.locationValidation,
        builder: (_, _) => const LocationValidationScreen(),
      ),
      GoRoute(
        path: AppRoutes.faceVerification,
        builder: (_, _) => const FaceVerificationScreen(),
      ),
      GoRoute(
        path: AppRoutes.checkinSuccess,
        builder: (context, state) =>
            CheckinSuccessScreen(recordId: state.uri.queryParameters['id']),
      ),
      GoRoute(
        path: AppRoutes.attendanceDetail,
        builder: (context, state) =>
            AttendanceDetailScreen(recordId: state.uri.queryParameters['id']!),
      ),
      GoRoute(
        path: AppRoutes.createLeave,
        builder: (_, _) => const CreateLeaveScreen(),
      ),
      GoRoute(
        path: AppRoutes.notifications,
        builder: (_, _) => const NotificationsScreen(),
      ),
      GoRoute(
        path: AppRoutes.syncStatus,
        builder: (_, _) => const SyncStatusScreen(),
      ),
      GoRoute(
        path: AppRoutes.faceEnroll,
        builder: (_, _) => const FaceEnrollScreen(),
      ),
      GoRoute(
        path: AppRoutes.changePassword,
        builder: (_, _) => const ChangePasswordScreen(),
      ),

      // Bottom-nav shell
      StatefulShellRoute.indexedStack(
        parentNavigatorKey: _rootKey,
        builder: (context, state, navigationShell) =>
            MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            navigatorKey: _shellKey,
            routes: [
              GoRoute(
                path: AppRoutes.home,
                builder: (_, _) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.history,
              builder: (_, _) => const HistoryScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.leave,
              builder: (_, _) => const LeaveScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.schedule,
              builder: (_, _) => const ScheduleScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.profile,
              builder: (_, _) => const ProfileScreen(),
            ),
          ]),
        ],
      ),
    ],
  );
});

/// Bridges Riverpod auth state changes to GoRouter's refresh mechanism.
class _AuthRefreshNotifier extends ChangeNotifier {
  _AuthRefreshNotifier(Ref ref) {
    ref.listen(authControllerProvider, (_, _) => notifyListeners());
  }
}
