import '../models/shift.dart';
import 'mock_data.dart';

abstract interface class ScheduleRepository {
  /// Returns the 7 shifts for the week containing [anchor].
  Future<List<Shift>> getWeek(DateTime anchor);
}

class MockScheduleRepository implements ScheduleRepository {
  @override
  Future<List<Shift>> getWeek(DateTime anchor) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    return MockData.weekShifts();
  }
}
