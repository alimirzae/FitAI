export type OperatingMode = 'fitting_room' | 'storefront' | 'body_engine' | 'salon' | 'analytics';

export type ClothingCategory = 'upper_body' | 'jackets' | 'dresses' | 'lower_body' | 'full_outfit';

export interface Product {
  id: string;
  name: string;
  category: ClothingCategory;
  genderCategory: 'men' | 'women' | 'unisex';
  price: number;
  color: string;
  colorHex: string;
  sizes: string[];
  imageUrl: string;
  description: string;
  fabric: string;
  tags: string[];
}

export interface ModelSubject {
  id: string;
  name: string;
  gender: 'men' | 'women';
  imageUrl: string;
  poseType: 'standing_front' | 'casual_turn' | 'formal';
  height: string;
  estimatedAgeRange: string;
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
  ageGroup: string; // e.g. "25-34"
  presentation: 'men' | 'women' | 'unisex';
  bodyType: string; // "Athletic", "Slender", "Standard"
  landmarks: PoseLandmark[];
  clothingCategoryDetected: string;
  dominantColor: string;
  faceExpression: 'Positive' | 'Neutral' | 'Engaged' | 'Pensive';
  expressionScore: number; // 0..1
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
}

export interface BodyTransformation {
  slim: number; // 0.0 to 0.10 (0% to 10%)
  fitness: number; // 0.0 to 0.10 (0% to 10%)
  posture: number; // 0.0 to 0.10
  chestTuning: number;
}

export interface SalonConfiguration {
  hairstyleId: string;
  hairColor: string;
  hairColorHex: string;
  hairLength: 'short' | 'medium' | 'long';
  beardStyle: 'none' | 'stubble' | 'sculpted' | 'full';
  makeupIntensity: number; // 0..1
  eyebrowStyle: 'natural' | 'defined' | 'arched';
}

export interface PreferenceSignalBreakdown {
  explicitLike: boolean | null; // true = like, false = dislike, null = none
  viewingTimeSec: number;
  revisited: boolean;
  interactionCount: number;
  expressionSignal: 'Positive' | 'Neutral' | 'Disengaged';
  totalScore: number; // 0..1 calculated based on README section 12 formula
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
