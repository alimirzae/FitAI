export type OperatingMode = 'fitting_room' | 'storefront' | 'body_engine' | 'salon' | 'analytics';

export type ClothingCategory = 'upper_body' | 'jackets' | 'dresses' | 'lower_body' | 'full_outfit';

export type FabricType = 'wool' | 'silk' | 'leather' | 'denim' | 'velvet' | 'linen' | 'cotton' | 'technical';

export type TargetAgeGroup = 'all' | 'teen' | 'young_adult' | 'mature' | 'kids';

export type StoreType = 'clothing_boutique' | 'beauty_salon' | 'storefront_kiosk' | 'multi_department';

export interface AppSettings {
  defaultMode: OperatingMode;
  storeType: StoreType;
  language: 'en' | 'fa';
  storeName: string;
  enableFabricPhysics: boolean;
  autoRotateSeconds: number;
}

export interface GarmentColorOption {
  id: string;
  nameEn: string;
  nameFa: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  category: ClothingCategory;
  genderCategory: 'men' | 'women' | 'unisex';
  price: number;
  color: string;
  colorHex: string;
  colorOptions?: GarmentColorOption[];
  sizes: string[];
  imageUrl: string;
  description: string;
  fabric: string;
  fabricType: FabricType;
  targetAge: TargetAgeGroup;
  style: string;
  tags: string[];
}

export interface CustomerProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  registeredAt: string;
  lastVisit: string;
  visitsCount: number;
  gender: 'men' | 'women' | 'unisex';
  estimatedAgeRange: string;
  recommendedSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  faceEmbedding: number[]; // 8-12 dimensional facial geometry vector
  bodyMeasurements: {
    heightCm: number;
    shoulderCm: number;
    chestCm: number;
    waistCm: number;
  };
  preferredStyles: string[];
  favoriteCategories: ClothingCategory[];
  likedProductIds: string[];
  notes?: string;
}

export interface SizeRecommendation {
  recommendedSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  confidencePct: number;
  shoulderCm: number;
  chestCm: number;
  waistCm: number;
  heightCm: number;
  fitAssessment: 'tight' | 'regular' | 'relaxed';
  fitAssessmentFa: string;
  fitAssessmentEn: string;
}

export interface ModelSubject {
  id: string;
  name: string;
  gender: 'men' | 'women';
  imageUrl: string;
  poseType: 'standing_front' | 'casual_turn' | 'formal';
  height: string;
  estimatedAgeRange: string;
  faceEmbedding: number[];
}

export interface PoseLandmark {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  z?: number;
  visibility: number;
  name: string;
}

export interface PersonAnalysis {
  detected: boolean;
  confidence: number;
  ageGroup: string;
  presentation: 'men' | 'women' | 'unisex';
  bodyType: string;
  landmarks: PoseLandmark[];
  clothingCategoryDetected: string;
  dominantColor: string;
  faceExpression: 'Positive' | 'Neutral' | 'Engaged' | 'Pensive';
  expressionScore: number;
}

export interface TryOnResult {
  id: string;
  productId: string;
  productName: string;
  personImage: string;
  resultImage: string;
  confidence: number;
  latencyMs: number;
  clothingCategory: ClothingCategory;
  generatedAt: string;
  appliedColor?: GarmentColorOption;
}

export interface BodyTransformation {
  slim: number;
  fitness: number;
  posture: number;
  chestTuning: number;
}

export interface SalonConfiguration {
  hairstyleId: string;
  hairColor: string;
  hairColorHex: string;
  hairLength: 'short' | 'medium' | 'long';
  beardStyle: 'none' | 'stubble' | 'sculpted' | 'full';
  makeupIntensity: number;
  eyebrowStyle: 'natural' | 'defined' | 'arched';
}

export interface PreferenceSignalBreakdown {
  explicitLike: boolean | null;
  viewingTimeSec: number;
  revisited: boolean;
  interactionCount: number;
  expressionSignal: 'Positive' | 'Neutral' | 'Disengaged';
  totalScore: number;
}

export interface StoreCampaign {
  id: string;
  title: string;
  description: string;
  location: string;
  active: boolean;
  productIds: string[];
  recommendedAgeGroups: string[];
}

export interface AIModelRegistryEntry {
  id: string;
  name: string;
  task: string;
  version: string;
  framework: string;
  license: string;
  commercialUse: boolean;
  latencyMs: number;
  accuracy: string;
  status: 'ACTIVE' | 'STANDBY' | 'BENCHMARK_ONLY';
}

export interface StoreDevice {
  id: string;
  name: string;
  type: 'SMART_MIRROR' | 'FITTING_ROOM' | 'STOREFRONT' | 'SALON_MIRROR' | 'KIOSK';
  store: string;
  gpu: string;
  softwareVersion: string;
  status: 'ONLINE' | 'OFFLINE' | 'PROCESSING';
  lastSeen: string;
}
