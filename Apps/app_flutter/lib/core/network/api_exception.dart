/// Normalized error surfaced to the UI layer. Repositories convert Dio errors,
/// HTTP status codes, and offline conditions into this single type so the
/// presentation layer never depends on the transport package.
class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode, this.isNetwork = false});

  final String message;
  final int? statusCode;
  final bool isNetwork;

  bool get isUnauthorized => statusCode == 401;
  bool get isRateLimited => statusCode == 429;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
