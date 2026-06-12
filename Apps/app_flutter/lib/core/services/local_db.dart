import 'dart:convert';

import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

/// A single pending check-in / check-out stored locally for later sync.
class PendingCheckin {
  const PendingCheckin({
    required this.id,
    required this.payload,
    required this.type,
    required this.capturedAt,
    required this.status,
    required this.createdAt,
  });

  final int id;

  /// JSON-encoded submission payload (same shape as the remote POST body).
  final Map<String, dynamic> payload;

  /// 'checkin' | 'checkout'
  final String type;

  final DateTime capturedAt;

  /// 'pending' | 'syncing' | 'synced' | 'failed'
  final String status;

  final DateTime createdAt;

  PendingCheckin copyWith({String? status}) => PendingCheckin(
        id: id,
        payload: payload,
        type: type,
        capturedAt: capturedAt,
        status: status ?? this.status,
        createdAt: createdAt,
      );

  factory PendingCheckin.fromMap(Map<String, dynamic> m) => PendingCheckin(
        id: m['id'] as int,
        payload: jsonDecode(m['payload'] as String) as Map<String, dynamic>,
        type: m['type'] as String,
        capturedAt: DateTime.parse(m['captured_at'] as String),
        status: m['status'] as String,
        createdAt: DateTime.parse(m['created_at'] as String),
      );

  Map<String, dynamic> toMap() => {
        'payload': jsonEncode(payload),
        'type': type,
        'captured_at': capturedAt.toUtc().toIso8601String(),
        'status': status,
        'created_at': createdAt.toUtc().toIso8601String(),
      };
}

/// Thin SQLite wrapper for pending check-in/out items.
///
/// Call [open] once (e.g. in app startup or lazily on first access) and close
/// when the app terminates. The database is stored in the default database
/// directory for the platform.
class LocalDb {
  LocalDb._();

  static final LocalDb instance = LocalDb._();

  Database? _db;

  Future<Database> get _database async {
    _db ??= await _open();
    return _db!;
  }

  Future<Database> _open() async {
    final dir = await getDatabasesPath();
    final path = p.join(dir, 'attendx_offline.db');
    return openDatabase(
      path,
      version: 1,
      onCreate: (db, _) async {
        await db.execute('''
          CREATE TABLE pending_checkins (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            payload      TEXT    NOT NULL,
            type         TEXT    NOT NULL DEFAULT 'checkin',
            captured_at  TEXT    NOT NULL,
            status       TEXT    NOT NULL DEFAULT 'pending',
            created_at   TEXT    NOT NULL
          )
        ''');
      },
    );
  }

  /// Insert a new pending item. Returns the row id.
  Future<int> insert(Map<String, dynamic> payload, String type,
      DateTime capturedAt) async {
    final db = await _database;
    return db.insert('pending_checkins', {
      'payload': jsonEncode(payload),
      'type': type,
      'captured_at': capturedAt.toUtc().toIso8601String(),
      'status': 'pending',
      'created_at': DateTime.now().toUtc().toIso8601String(),
    });
  }

  /// Returns all rows that are NOT yet synced (status != 'synced').
  Future<List<PendingCheckin>> getPending() async {
    final db = await _database;
    final rows = await db.query(
      'pending_checkins',
      where: "status != 'synced'",
      orderBy: 'created_at ASC',
    );
    return rows.map(PendingCheckin.fromMap).toList();
  }

  /// Returns ALL rows (for display in the sync queue UI).
  Future<List<PendingCheckin>> getAll() async {
    final db = await _database;
    final rows =
        await db.query('pending_checkins', orderBy: 'created_at DESC');
    return rows.map(PendingCheckin.fromMap).toList();
  }

  /// Update a row's status ('pending' | 'syncing' | 'synced' | 'failed').
  Future<void> updateStatus(int id, String status) async {
    final db = await _database;
    await db.update(
      'pending_checkins',
      {'status': status},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Hard-delete a synced row to keep the table small.
  Future<void> delete(int id) async {
    final db = await _database;
    await db.delete('pending_checkins', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> close() async {
    await _db?.close();
    _db = null;
  }
}
