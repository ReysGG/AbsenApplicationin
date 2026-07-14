import unittest

import cv2
import numpy as np

from app.main import _analyze_eyewear, _face_quality


class FakeFace:
    def __init__(self) -> None:
        self.bbox = np.array([70, 45, 330, 355], dtype=np.float32)
        self.kps = np.array(
            [
                [145, 155],
                [255, 155],
                [200, 215],
                [160, 280],
                [240, 280],
            ],
            dtype=np.float32,
        )
        self.pose = np.array([0, 0, 0], dtype=np.float32)


class EyewearAnalysisTests(unittest.TestCase):
    def setUp(self) -> None:
        self.face = FakeFace()

    def test_clear_eye_area_is_not_blocked(self) -> None:
        image = np.full((400, 400, 3), 190, dtype=np.uint8)

        result = _analyze_eyewear(image, self.face)

        self.assertEqual(result.type, "none")
        self.assertFalse(result.blocksEyes)
        self.assertGreater(result.eyeVisibilityScore, 0.8)

    def test_dark_bilateral_eye_cover_is_blocked(self) -> None:
        image = np.full((400, 400, 3), 195, dtype=np.uint8)
        cv2.rectangle(image, (108, 128), (182, 181), (8, 8, 8), -1)
        cv2.rectangle(image, (218, 128), (292, 181), (8, 8, 8), -1)

        result = _analyze_eyewear(image, self.face)
        quality = _face_quality(image, self.face)

        self.assertEqual(result.type, "dark_glasses")
        self.assertTrue(result.blocksEyes)
        self.assertEqual(quality.obstruction.status, "blocked")

    def test_missing_landmarks_does_not_reject(self) -> None:
        image = np.full((400, 400, 3), 190, dtype=np.uint8)
        self.face.kps = None

        result = _analyze_eyewear(image, self.face)

        self.assertEqual(result.type, "unknown")
        self.assertFalse(result.blocksEyes)


if __name__ == "__main__":
    unittest.main()
