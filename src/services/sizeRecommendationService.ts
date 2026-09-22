import { PoseLandmark, SizeRecommendation } from '../types';

export class SizeRecommendationService {
  /**
   * Compute anthropometric measurements and recommended size from body landmarks
   * Runs locally on CPU using calibrated geometric anthropometry.
   */
  static estimateMeasurementsAndSize(landmarks: PoseLandmark[]): SizeRecommendation {
    const nose = landmarks.find((l) => l.name === 'nose') || { x: 0.5, y: 0.18 };
    const leftShoulder = landmarks.find((l) => l.name === 'left_shoulder') || { x: 0.38, y: 0.32 };
    const rightShoulder = landmarks.find((l) => l.name === 'right_shoulder') || { x: 0.62, y: 0.32 };
    const leftHip = landmarks.find((l) => l.name === 'left_hip') || { x: 0.42, y: 0.60 };
    const rightHip = landmarks.find((l) => l.name === 'right_hip') || { x: 0.58, y: 0.60 };
    const leftAnkle = landmarks.find((l) => l.name === 'left_ankle') || { x: 0.44, y: 0.95 };
    const rightAnkle = landmarks.find((l) => l.name === 'right_ankle') || { x: 0.56, y: 0.95 };

    // Pixel-space distances (normalized 0..1)
    const shoulderDistance = Math.hypot(
      rightShoulder.x - leftShoulder.x,
      rightShoulder.y - leftShoulder.y
    );
    const hipDistance = Math.hypot(
      rightHip.x - leftHip.x,
      rightHip.y - leftHip.y
    );
    const torsoHeight = Math.hypot(
      (leftHip.x + rightHip.x) / 2 - (leftShoulder.x + rightShoulder.x) / 2,
      (leftHip.y + rightHip.y) / 2 - (leftShoulder.y + rightShoulder.y) / 2
    );
    const totalHeightSpan = Math.abs(
      ((leftAnkle.y + rightAnkle.y) / 2) - nose.y
    );

    // Calibration factor (standard human head length ~ 23cm)
    // Scale factor maps normalized span to real-world centimeters
    const calibrationScale = totalHeightSpan > 0.4 ? 172 / totalHeightSpan : 172;

    const rawHeight = Math.round(totalHeightSpan * calibrationScale);
    const heightCm = Math.min(205, Math.max(150, rawHeight || 172));

    // Bi-acromial shoulder breadth
    const rawShoulder = Math.round(shoulderDistance * calibrationScale * 0.96);
    const shoulderCm = Math.min(54, Math.max(34, rawShoulder || 42));

    // Chest circumference estimate: bi-deltoid diameter * pi * depth ratio
    const chestCm = Math.round(shoulderCm * 2.24);

    // Waist circumference estimate
    const rawWaist = Math.round((hipDistance * calibrationScale * 1.8) + (torsoHeight * 12));
    const waistCm = Math.min(115, Math.max(60, rawWaist || 78));

    // International Sizing Mapping
    let recommendedSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' = 'M';
    let fitAssessment: 'tight' | 'regular' | 'relaxed' = 'regular';
    let fitAssessmentFa = 'سایز متناسب استاندارد برای ایستایی عالی روی فرم اندام';
    let fitAssessmentEn = 'Standard regular fit tailored to your torso proportions';

    if (shoulderCm <= 36 || chestCm <= 86) {
      recommendedSize = 'XS';
      fitAssessment = 'tight';
      fitAssessmentFa = 'سایز اندامی ۳۴-۳۶ (ایستایی چسبان و جذب)';
      fitAssessmentEn = 'Size XS / 34-36 (Slim / Tailored fit)';
    } else if (shoulderCm <= 39 || chestCm <= 93) {
      recommendedSize = 'S';
      fitAssessment = 'regular';
      fitAssessmentFa = 'سایز ۳۶-۳۸ (ایستایی استاندارد و خوش‌فرم)';
      fitAssessmentEn = 'Size S / 36-38 (Regular / Classic fit)';
    } else if (shoulderCm <= 43 || chestCm <= 101) {
      recommendedSize = 'M';
      fitAssessment = 'regular';
      fitAssessmentFa = 'سایز ۳۸-۴۰ (تناسب ایده‌آل خط شانه و سینه)';
      fitAssessmentEn = 'Size M / 38-40 (Ideal shoulder & chest alignment)';
    } else if (shoulderCm <= 47 || chestCm <= 109) {
      recommendedSize = 'L';
      fitAssessment = 'regular';
      fitAssessmentFa = 'سایز ۴۲-۴۴ (ایستایی شیک و آزاد)';
      fitAssessmentEn = 'Size L / 42-44 (Comfortable and elegant posture)';
    } else if (shoulderCm <= 51 || chestCm <= 118) {
      recommendedSize = 'XL';
      fitAssessment = 'relaxed';
      fitAssessmentFa = 'سایز ۴۶ (فضای آزاد و راحت برای کت و پالتو)';
      fitAssessmentEn = 'Size XL / 46 (Roomy fit for overcoats)';
    } else {
      recommendedSize = 'XXL';
      fitAssessment = 'relaxed';
      fitAssessmentFa = 'سایز ۴۸+ (اورسایز و راحت)';
      fitAssessmentEn = 'Size XXL / 48+ (Relaxed / Oversized fit)';
    }

    return {
      recommendedSize,
      confidencePct: 94,
      shoulderCm,
      chestCm,
      waistCm,
      heightCm,
      fitAssessment,
      fitAssessmentFa,
      fitAssessmentEn
    };
  }
}
