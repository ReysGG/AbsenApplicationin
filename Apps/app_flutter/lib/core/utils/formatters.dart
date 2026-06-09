import 'package:intl/intl.dart';

/// Indonesian-locale date/time formatting helpers.
abstract final class Formatters {
  static final _dayDate = DateFormat('EEEE, d MMMM yyyy', 'id_ID');
  static final _shortDate = DateFormat('d MMM yyyy', 'id_ID');
  static final _time = DateFormat('HH:mm', 'id_ID');
  static final _dayNameShort = DateFormat('EEE', 'id_ID');

  static String fullDate(DateTime d) => _dayDate.format(d);
  static String shortDate(DateTime d) => _shortDate.format(d);
  static String time(DateTime d) => _time.format(d);
  static String dayNameShort(DateTime d) => _dayNameShort.format(d);

  static String greeting(DateTime now) {
    final h = now.hour;
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 19) return 'Selamat sore';
    return 'Selamat malam';
  }

  static String duration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    if (h == 0) return '$m menit';
    return '$h jam $m menit';
  }
}
