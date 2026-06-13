import 'dart:ui';

import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

/// Wraps `google_mlkit_face_detection`.
///
/// The caller owns the [CameraController] lifecycle; this service handles:
///   - [FaceDetector] creation with classification (eye-open probability) and
///     tracking enabled,
///   - [CameraImage] → [InputImage] conversion for Android NV21 streams,
///   - returning the list of detected [Face]s (or an empty list on error).
class FaceLivenessService {
  FaceLivenessService() {
    _detector = FaceDetector(
      options: FaceDetectorOptions(
        // leftEyeOpenProbability / rightEyeOpenProbability for blink detection.
        enableClassification: true,
        // Smoother per-frame tracking of the same face.
        enableTracking: true,
        // headEulerAngleX/Y/Z (used for the head-turn challenge) are available
        // by default — no extra flag needed.
        performanceMode: FaceDetectorMode.accurate,
        minFaceSize: 0.15,
      ),
    );
  }

  late final FaceDetector _detector;

  /// Converts a [CameraImage] from the Android camera stream (NV21 / YUV_420)
  /// to an [InputImage] that ML Kit can process, taking [rotation] into account
  /// (pass [CameraDescription.sensorOrientation] for the active camera).
  InputImage? cameraImageToInputImage(
    CameraImage image,
    int sensorOrientation, {
    bool isFrontCamera = true,
  }) {
    // ML Kit InputImage for NV21/YUV_420_888 on Android.
    // The camera plugin produces NV21 on Android. We build a flat NV21 byte
    // buffer from the three planes that the plugin exposes.
    try {
      // When the controller requests ImageFormatGroup.nv21, Android delivers a
      // single-plane NV21 buffer. Use it directly — concatenating planes that
      // don't exist (or mismatched strides) is what throws RangeError.
      final Plane plane0 = image.planes.first;
      final Uint8List bytes;
      if (image.planes.length == 1) {
        bytes = plane0.bytes;
      } else {
        // Fallback: concatenate all planes (YUV_420 → approximate NV21).
        final WriteBuffer allBytes = WriteBuffer();
        for (final plane in image.planes) {
          allBytes.putUint8List(plane.bytes);
        }
        bytes = allBytes.done().buffer.asUint8List();
      }

      final imageSize = Size(image.width.toDouble(), image.height.toDouble());
      final rotation = _resolveRotation(sensorOrientation, isFrontCamera);

      final inputImage = InputImage.fromBytes(
        bytes: bytes,
        metadata: InputImageMetadata(
          size: imageSize,
          rotation: rotation,
          format: InputImageFormat.nv21,
          bytesPerRow: plane0.bytesPerRow,
        ),
      );
      return inputImage;
    } catch (_) {
      return null;
    }
  }

  /// Runs face detection on a pre-built [InputImage].
  /// Returns an empty list when detection fails or the image is null.
  Future<List<Face>> detectFaces(InputImage? inputImage) async {
    if (inputImage == null) return const [];
    try {
      return await _detector.processImage(inputImage);
    } catch (_) {
      return const [];
    }
  }

  /// Convenience: convert camera image + detect in one call.
  Future<List<Face>> processFrame(
    CameraImage image,
    int sensorOrientation, {
    bool isFrontCamera = true,
  }) async {
    final inputImage = cameraImageToInputImage(
      image,
      sensorOrientation,
      isFrontCamera: isFrontCamera,
    );
    return detectFaces(inputImage);
  }

  /// Release the underlying ML Kit resources.
  Future<void> close() => _detector.close();

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  static InputImageRotation _resolveRotation(
      int sensorOrientation, bool isFrontCamera) {
    // Front-facing cameras on Android mirror the preview; ML Kit expects the
    // rotation that unrotates the raw sensor buffer to upright portrait.
    if (isFrontCamera) {
      switch (sensorOrientation) {
        case 90:
          return InputImageRotation.rotation270deg;
        case 270:
          return InputImageRotation.rotation90deg;
        case 180:
          return InputImageRotation.rotation180deg;
        default:
          return InputImageRotation.rotation0deg;
      }
    } else {
      switch (sensorOrientation) {
        case 90:
          return InputImageRotation.rotation90deg;
        case 180:
          return InputImageRotation.rotation180deg;
        case 270:
          return InputImageRotation.rotation270deg;
        default:
          return InputImageRotation.rotation0deg;
      }
    }
  }
}
