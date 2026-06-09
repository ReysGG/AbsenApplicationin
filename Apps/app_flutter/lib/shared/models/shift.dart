import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

import 'enums.dart';

/// A scheduled work shift for a given day.
class Shift extends Equatable {
  const Shift({
    required this.id,
    required this.name,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.workMode,
    this.gracePeriodMinutes = 10,
    this.isDayOff = false,
  });

  final String id;
  final String name;
  final DateTime date;
  final TimeOfDay startTime;
  final TimeOfDay endTime;
  final WorkMode workMode;
  final int gracePeriodMinutes;
  final bool isDayOff;

  String _fmt(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  String get startLabel => _fmt(startTime);
  String get endLabel => _fmt(endTime);
  String get rangeLabel => isDayOff ? 'Libur' : '$startLabel - $endLabel';

  @override
  List<Object?> get props => [id, date];
}
