import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/attendance_record.dart';
import '../models/shift.dart';
import '../models/work_location.dart';
import 'api_mappers.dart';
import 'attendance_repository.dart';

/// Remote implementation backed by the backend mobile API (`/mobile/me/*`,
/// `/mobile/check-in`, `/mobile/check-out`).
class RemoteAttendanceRepository implements AttendanceRepository {
  RemoteAttendanceRepository(this._client);

  final DioClient _client;
  Dio get _dio => _client.raw;

  List<dynamic> _list(Response<Map<String, dynamic>> res) =>
      (res.data?['data'] as List<dynamic>? ?? const []);

  Map<String, dynamic> _obj(Response<Map<String, dynamic>> res) =>
      (res.data?['data'] as Map<String, dynamic>? ?? const {});

  @override
  Future<TodayAttendance> getToday() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/mobile/me/today');
      final today = _obj(res)['today'];
      if (today == null) return const TodayAttendance();
      final record = ApiMappers.attendance(today as Map<String, dynamic>);
      return TodayAttendance(
        checkIn: record.checkInAt != null ? record : null,
        checkOut: record.checkOutAt != null ? record : null,
      );
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }

  @override
  Future<List<AttendanceRecord>> getHistory() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/mobile/me/attendance');
      return _list(res)
          .map((e) => ApiMappers.attendance(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }

  @override
  Future<AttendanceRecord> getDetail(String id) async {
    try {
      final res =
          await _dio.get<Map<String, dynamic>>('/mobile/me/attendance/$id');
      return ApiMappers.attendance(_obj(res));
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }

  @override
  Future<List<WorkLocation>> getAssignedLocations() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/mobile/me/locations');
      return _list(res)
          .map((e) => ApiMappers.location(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }

  @override
  Future<Shift?> getTodayShift() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/mobile/me/shift');
      final data = res.data?['data'];
      if (data == null) return null;
      return ApiMappers.shift(data as Map<String, dynamic>, DateTime.now());
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }

  Map<String, dynamic> _submissionBody(AttendanceSubmission s) => {
        'workMode': s.workMode.name, // 'wfo' | 'wfh'
        'latitude': s.latitude,
        'longitude': s.longitude,
        'faceVerified': s.faceVerified,
        'livenessPassed': s.livenessPassed,
        'isMocked': s.isMocked,
        if (s.livenessChecksPassed != null)
          'livenessChecksPassed': s.livenessChecksPassed,
        if (s.livenessChecksTotal != null)
          'livenessChecksTotal': s.livenessChecksTotal,
        if (s.locationId != null) 'locationId': s.locationId,
        if (s.capturedAt != null)
          'capturedAt': s.capturedAt!.toUtc().toIso8601String(),
        if (s.faceImageBase64 != null) 'faceImageBase64': s.faceImageBase64,
      };

  @override
  Future<AttendanceRecord> checkIn(AttendanceSubmission submission) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/mobile/check-in',
        data: _submissionBody(submission),
      );
      return ApiMappers.attendance(_obj(res));
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }

  @override
  Future<AttendanceRecord> checkOut(AttendanceSubmission submission) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/mobile/check-out',
        data: _submissionBody(submission),
      );
      return ApiMappers.attendance(_obj(res));
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }
}
