import { CustomerProfile, PoseLandmark } from '../types';

const STORAGE_KEY = 'fitai_customer_database';

// Default initial registered customer profiles
const INITIAL_PROFILES: CustomerProfile[] = [
  {
    id: 'cust-maryam-01',
    name: 'مریم رضایی',
    registeredAt: '1403/05/12',
    lastVisit: 'دیروز - ۱۶:۴۰',
    visitsCount: 5,
    gender: 'women',
    estimatedAgeRange: '25–34',
    recommendedSize: 'M',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    faceEmbedding: [0.48, 0.52, 0.18, 0.23, 0.19, 0.42, 0.58, 0.12, 0.25, 0.44],
    bodyMeasurements: {
      heightCm: 168,
      shoulderCm: 39,
      chestCm: 90,
      waistCm: 72,
    },
    preferredStyles: ['کلاسیک مجلسی', 'پالتوهای پشمی و ابریشم', 'استایل رسمی'],
    favoriteCategories: ['jackets', 'dresses'],
    likedProductIds: ['prod-camel-coat-01', 'prod-evening-dress-03'],
    notes: 'مشتری دائمی بوتیک - علاقه به رنگ‌های نود و بژ و پارچه‌های طبیعی ابریشم و فوتر'
  },
  {
    id: 'cust-ali-02',
    name: 'علی میرزایی',
    registeredAt: '1403/04/20',
    lastVisit: '۳ روز پیش',
    visitsCount: 8,
    gender: 'men',
    estimatedAgeRange: '28–36',
    recommendedSize: 'L',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    faceEmbedding: [0.46, 0.54, 0.20, 0.25, 0.22, 0.40, 0.60, 0.14, 0.28, 0.48],
    bodyMeasurements: {
      heightCm: 182,
      shoulderCm: 46,
      chestCm: 104,
      waistCm: 84,
    },
    preferredStyles: ['کت تک پشمی', 'کاپشن چرم مینیمال', 'استایل کاری'],
    favoriteCategories: ['jackets', 'upper_body'],
    likedProductIds: ['prod-leather-moto-02', 'prod-tailored-suit-05'],
    notes: 'علاقه به چرم طبیعی و کت‌های فوتر خوش‌دوخت - اندازه شانه پهن'
  },
  {
    id: 'cust-sara-03',
    name: 'سارا احمدی',
    registeredAt: '1403/06/01',
    lastVisit: 'هفته گذشته',
    visitsCount: 3,
    gender: 'women',
    estimatedAgeRange: '20–26',
    recommendedSize: 'S',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    faceEmbedding: [0.49, 0.51, 0.17, 0.22, 0.18, 0.43, 0.57, 0.11, 0.23, 0.41],
    bodyMeasurements: {
      heightCm: 164,
      shoulderCm: 37,
      chestCm: 85,
      waistCm: 66,
    },
    preferredStyles: ['دامن و پیراهن کژوال', 'مخمل و کتان'],
    favoriteCategories: ['dresses', 'upper_body'],
    likedProductIds: ['prod-evening-dress-03'],
    notes: 'سایز اسمال فیت اندامی - طرفدار پیراهن‌های تابستانه'
  }
];

export class FaceRecognitionService {
  /**
   * Load stored profiles from localStorage with fallback to default profiles
   */
  static getProfiles(): CustomerProfile[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read customer database:', e);
    }
    return INITIAL_PROFILES;
  }

  /**
   * Save customer profiles
   */
  static saveProfiles(profiles: CustomerProfile[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Could not save customer profiles:', e);
    }
  }

  /**
   * Extract real facial landmark geometric descriptor (10-dimensional feature vector)
   * Computed directly on CPU from detected facial landmarks or face mesh points.
   */
  static extractEmbeddingFromLandmarks(landmarks: PoseLandmark[]): number[] {
    const nose = landmarks.find((l) => l.name === 'nose') || { x: 0.5, y: 0.2 };
    const leftEye = landmarks.find((l) => l.name === 'left_eye') || { x: 0.46, y: 0.18 };
    const rightEye = landmarks.find((l) => l.name === 'right_eye') || { x: 0.54, y: 0.18 };
    const leftEar = landmarks.find((l) => l.name === 'left_ear') || { x: 0.42, y: 0.19 };
    const rightEar = landmarks.find((l) => l.name === 'right_ear') || { x: 0.58, y: 0.19 };
    const leftMouth = landmarks.find((l) => l.name === 'mouth_left') || { x: 0.48, y: 0.23 };
    const rightMouth = landmarks.find((l) => l.name === 'mouth_right') || { x: 0.52, y: 0.23 };

    // Geometric distance invariants
    const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
    const jawBreadth = Math.hypot(rightEar.x - leftEar.x, rightEar.y - leftEar.y);
    const noseToMouth = Math.hypot(
      nose.x - (leftMouth.x + rightMouth.x) / 2,
      nose.y - (leftMouth.y + rightMouth.y) / 2
    );
    const eyeToNose = Math.hypot(
      nose.x - (leftEye.x + rightEye.x) / 2,
      nose.y - (leftEye.y + rightEye.y) / 2
    );

    return [
      +leftEye.x.toFixed(4),
      +rightEye.x.toFixed(4),
      +nose.y.toFixed(4),
      +leftMouth.y.toFixed(4),
      +eyeDistance.toFixed(4),
      +jawBreadth.toFixed(4),
      +noseToMouth.toFixed(4),
      +eyeToNose.toFixed(4),
      +(jawBreadth / (eyeDistance || 0.1)).toFixed(4),
      +(eyeToNose / (noseToMouth || 0.1)).toFixed(4),
    ];
  }

  /**
   * Euclidean distance between two face embedding vectors
   */
  static computeDistance(vecA: number[], vecB: number[]): number {
    let sum = 0;
    const len = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < len; i++) {
      const diff = vecA[i] - vecB[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Match given face embedding against registered customer profiles
   * Returns matched profile, similarity confidence (0..1), and distance
   */
  static identifyFace(embedding: number[]): {
    matched: boolean;
    profile: CustomerProfile | null;
    confidence: number;
    distance: number;
  } {
    const profiles = this.getProfiles();
    let bestMatch: CustomerProfile | null = null;
    let minDistance = Infinity;

    for (const profile of profiles) {
      if (!profile.faceEmbedding || profile.faceEmbedding.length === 0) continue;
      const dist = this.computeDistance(embedding, profile.faceEmbedding);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = profile;
      }
    }

    // Threshold for biometric geometric match: < 0.28
    const isMatch = minDistance <= 0.28 && bestMatch !== null;
    const confidence = isMatch
      ? Math.max(0.72, Math.min(0.99, 1.0 - minDistance * 1.8))
      : Math.max(0.1, 1.0 - minDistance * 1.5);

    return {
      matched: isMatch,
      profile: isMatch ? bestMatch : null,
      confidence: +confidence.toFixed(2),
      distance: +minDistance.toFixed(3),
    };
  }

  /**
   * Register a new customer with their current face embedding and body dimensions
   */
  static registerCustomer(newProfile: Omit<CustomerProfile, 'id' | 'registeredAt' | 'visitsCount' | 'lastVisit'>): CustomerProfile {
    const profiles = this.getProfiles();
    const created: CustomerProfile = {
      ...newProfile,
      id: `cust-${Date.now()}`,
      registeredAt: new Intl.DateTimeFormat('fa-IR').format(new Date()),
      lastVisit: 'هم‌اکنون',
      visitsCount: 1,
    };
    profiles.unshift(created);
    this.saveProfiles(profiles);
    return created;
  }

  /**
   * Update existing customer profile (e.g. record liked product or increment visit)
   */
  static recordCustomerVisit(profileId: string, likedProductId?: string): CustomerProfile | null {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === profileId);
    if (index === -1) return null;

    const p = profiles[index];
    p.visitsCount += 1;
    p.lastVisit = 'امروز - ' + new Date().toLocaleTimeString('fa-IR');
    if (likedProductId && !p.likedProductIds.includes(likedProductId)) {
      p.likedProductIds.push(likedProductId);
    }
    profiles[index] = p;
    this.saveProfiles(profiles);
    return p;
  }
}
