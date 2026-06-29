/// Centralized route path + name constants.
abstract final class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const welcome = '/welcome';
  static const lock = '/lock';

  // Shell tabs
  static const home = '/home';
  static const history = '/history';
  static const leave = '/leave';
  static const schedule = '/schedule';
  static const profile = '/profile';

  // Detail / flow routes
  static const attendanceDetail = '/history/detail';
  static const checkinPrep = '/checkin';
  static const locationValidation = '/checkin/location';
  static const faceVerification = '/checkin/face';
  static const checkinSuccess = '/checkin/success';
  static const createLeave = '/leave/create';
  static const notifications = '/notifications';
  static const syncStatus = '/sync';
  static const faceEnroll = '/face-enroll';
  static const changePassword = '/profile/change-password';
}
