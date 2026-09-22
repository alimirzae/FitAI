import { Product, ModelSubject, StoreCampaign, AIModelRegistryEntry, StoreDevice, GarmentColorOption } from '../types';

export const STANDARD_GARMENT_COLORS: GarmentColorOption[] = [
  { id: 'col-black', nameEn: 'Obsidian Black', nameFa: 'مشکی عمیق', hex: '#0f172a' },
  { id: 'col-navy', nameEn: 'Midnight Navy', nameFa: 'سرمه‌ای تیره', hex: '#1e3a8a' },
  { id: 'col-camel', nameEn: 'Classic Camel', nameFa: 'شتری کلاسیک', hex: '#b45309' },
  { id: 'col-cream', nameEn: 'Ivory Bone', nameFa: 'کرم استخوانی', hex: '#f8fafc' },
  { id: 'col-burgundy', nameEn: 'Burgundy Wine', nameFa: 'زرشکی اناری', hex: '#881337' },
  { id: 'col-emerald', nameEn: 'Forest Green', nameFa: 'یشمی تیره', hex: '#064e3b' },
  { id: 'col-grey', nameEn: 'Slate Grey', nameFa: 'طوسی ملانژ', hex: '#475569' },
  { id: 'col-rose', nameEn: 'Dusty Rose', nameFa: 'گلبهی ملایم', hex: '#be185d' },
];

export const SAMPLE_PRODUCTS: Product[] = [
  // 1. Formal / Wool / Adult
  {
    id: 'prod-101',
    name: 'کت و بلیزر پشمی فرمال',
    category: 'jackets',
    genderCategory: 'unisex',
    price: 249,
    color: 'Charcoal Black',
    colorHex: '#1e293b',
    colorOptions: STANDARD_GARMENT_COLORS,
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
    description: 'کت خوش‌دوخت با یقه ناچ و پارچه فوتر مرینوس دست‌بافت با ریزش خطی و شق.',
    fabric: 'فوتر و پشم اعلا',
    fabricType: 'wool',
    targetAge: 'young_adult',
    style: 'formal',
    tags: ['formal', 'modern', 'bestseller', 'wool']
  },
  // 2. Leather / Streetwear / Youth & Adult
  {
    id: 'prod-102',
    name: 'کاپشن چرم ناپا ایتالیایی',
    category: 'jackets',
    genderCategory: 'men',
    price: 380,
    color: 'Espresso Brown',
    colorHex: '#3e2723',
    colorOptions: STANDARD_GARMENT_COLORS,
    sizes: ['M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
    description: 'چرم طبیعی با زیپ‌های فلزی کروم و آستر ژاکارد با فرم محکم و بازتاب براق.',
    fabric: 'چرم طبیعی اصل',
    fabricType: 'leather',
    targetAge: 'young_adult',
    style: 'streetwear',
    tags: ['streetwear', 'leather', 'iconic']
  },
  // 3. Cashmere / Mature & Luxury / Women
  {
    id: 'prod-103',
    name: 'پالتو کمربنددار شتری اعلا',
    category: 'jackets',
    genderCategory: 'women',
    price: 420,
    color: 'Camel Sand',
    colorHex: '#c29b7f',
    colorOptions: STANDARD_GARMENT_COLORS,
    sizes: ['XS', 'S', 'M', 'L'],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80',
    description: 'پالتوی کلاسیک دولایه پاییزه با کمربند پارچه‌ای و آستین‌های رگلان شیک.',
    fabric: 'فوتر و پشم کشمیر',
    fabricType: 'wool',
    targetAge: 'mature',
    style: 'luxury',
    tags: ['autumn', 'luxury', 'trench']
  },
  // 4. Silk / Women / Evening & Formal
  {
    id: 'prod-104',
    name: 'پیراهن ماکسی شب ابریشم ساتن',
    category: 'dresses',
    genderCategory: 'women',
    price: 310,
    color: 'Emerald Jewel',
    colorHex: '#047857',
    colorOptions: STANDARD_GARMENT_COLORS,
    sizes: ['XS', 'S', 'M'],
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
    description: 'پیراهن بلند با درزهای ارگونومیک، ریزش لغزنده و درخشش فوق‌العاده ساتن زیر نور.',
    fabric: 'ابریشم طبیعی و ساتن',
    fabricType: 'silk',
    targetAge: 'young_adult',
    style: 'evening',
    tags: ['evening', 'silk', 'gown']
  },
  // 5. Velvet / Formal Suit / Unisex
  {
    id: 'prod-105',
    name: 'کت مخمل فاخر سورمه‌ای',
    category: 'jackets',
    genderCategory: 'unisex',
    price: 340,
    color: 'Royal Navy Velvet',
    colorHex: '#172554',
    colorOptions: STANDARD_GARMENT_COLORS,
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    description: 'کت تک شیک و شب‌تاب با پرزهای لطیف مخمل و بازی چشم‌نواز نور و سایه.',
    fabric: 'مخمل فاخر پرزدار',
    fabricType: 'velvet',
    targetAge: 'mature',
    style: 'black_tie',
    tags: ['velvet', 'luxury', 'formal']
  },
  // 6. Denim / Casual / Youth & Teens
  {
    id: 'prod-106',
    name: 'کت جین وینتیج کلاسیک ۱۴ اونس',
    category: 'jackets',
    genderCategory: 'unisex',
    price: 135,
    color: 'Vintage Indigo',
    colorHex: '#2563eb',
    colorOptions: STANDARD_GARMENT_COLORS,
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=600&q=80',
    description: 'کت جین اسیدواش سبک دهه ۹۰ با شکن‌های سنگین و دوخت‌های محکم نارنجی.',
    fabric: 'دنیم و جین سنگین',
    fabricType: 'denim',
    targetAge: 'teen',
    style: 'casual',
    tags: ['denim', 'youth', 'casual']
  },
  // 7. Linen / Summer / Mature & Adults
  {
    id: 'prod-107',
    name: 'پیراهن لینن و کتان ارگانیک',
    category: 'upper_body',
    genderCategory: 'men',
    price: 110,
    color: 'Ivory Natural',
    colorHex: '#fef3c7',
    colorOptions: STANDARD_GARMENT_COLORS,
    sizes: ['M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    description: 'پیراهن خنک و تابستانی بدون یقه با پارچه صددرصد ارگانیک و تنفس‌پذیر.',
    fabric: 'کتان و لینن ارگانیک',
    fabricType: 'linen',
    targetAge: 'mature',
    style: 'casual',
    tags: ['linen', 'summer', 'breathable']
  },
  // 8. Technical / Outdoor / Youth
  {
    id: 'prod-108',
    name: 'بارانی نانو ضدآب کلاه‌دار',
    category: 'jackets',
    genderCategory: 'unisex',
    price: 195,
    color: 'Forest Olive',
    colorHex: '#365314',
    colorOptions: STANDARD_GARMENT_COLORS,
    sizes: ['S', 'M', 'L'],
    imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80',
    description: 'پارچه نانو آب‌گریز با زیپ‌های عایق و طراحی آیرودینامیک شهری.',
    fabric: 'پارچه نانو و ضدآب',
    fabricType: 'technical',
    targetAge: 'young_adult',
    style: 'streetwear',
    tags: ['technical', 'waterproof', 'utility']
  }
];

export const MODEL_SUBJECTS: ModelSubject[] = [
  {
    id: 'model-sophia',
    name: 'Sophia (مریم رضایی - مشتری شناسایی‌شده)',
    gender: 'women',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    poseType: 'standing_front',
    height: '176 cm',
    estimatedAgeRange: '25–34',
    faceEmbedding: [0.48, 0.52, 0.18, 0.23, 0.19, 0.42, 0.58, 0.12, 0.25, 0.44]
  },
  {
    id: 'model-marcus',
    name: 'Marcus (علی میرزایی - مشتری شناسایی‌شده)',
    gender: 'men',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    poseType: 'standing_front',
    height: '184 cm',
    estimatedAgeRange: '25–34',
    faceEmbedding: [0.46, 0.54, 0.20, 0.25, 0.22, 0.40, 0.60, 0.14, 0.28, 0.48]
  },
  {
    id: 'model-elena',
    name: 'Elena (سارا احمدی - مشتری شناسایی‌شده)',
    gender: 'women',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    poseType: 'casual_turn',
    height: '172 cm',
    estimatedAgeRange: '18–24',
    faceEmbedding: [0.49, 0.51, 0.17, 0.22, 0.18, 0.43, 0.57, 0.11, 0.23, 0.41]
  },
  {
    id: 'model-david',
    name: 'David (مشتری جدید / بدون سابقه)',
    gender: 'men',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    poseType: 'formal',
    height: '181 cm',
    estimatedAgeRange: '45–54',
    faceEmbedding: [0.35, 0.65, 0.15, 0.30, 0.25, 0.35, 0.65, 0.18, 0.32, 0.52]
  }
];

export const STORE_CAMPAIGNS: StoreCampaign[] = [
  {
    id: 'camp-autumn-26',
    title: 'Autumn Outerwear & Tailoring',
    description: 'Automated storefront showcase highlighting seasonal coats, trenches and wool blazers.',
    location: 'Flagship Storefront Display #1',
    active: true,
    productIds: ['prod-101', 'prod-102', 'prod-103'],
    recommendedAgeGroups: ['25-34', '35-44']
  },
  {
    id: 'camp-urban-luxe',
    title: 'Youth Denim & Streetwear',
    description: 'High-energy evening display highlighting vintage denim jackets and technical hoodies.',
    location: 'Mall Corridor Display #3',
    active: true,
    productIds: ['prod-106', 'prod-108', 'prod-105'],
    recommendedAgeGroups: ['18-24', '25-34']
  },
  {
    id: 'camp-gala-elegance',
    title: 'Evening Gala & Silk Kaftans',
    description: 'Curated premium dresses, velvet suits, and modest formal wear for special occasions.',
    location: 'VIP Fitting Room Display #4',
    active: true,
    productIds: ['prod-104', 'prod-105', 'prod-103'],
    recommendedAgeGroups: ['25-34', '35-54']
  }
];

export const AI_MODEL_REGISTRY: AIModelRegistryEntry[] = [
  {
    id: 'model-blazepose',
    name: 'MediaPipe BlazePose 33-Keypoints',
    task: 'Anatomical Pose & Skeleton Estimation',
    version: 'v0.10.14',
    framework: 'TensorFlow Lite / ONNX WebAssembly',
    license: 'Apache-2.0',
    commercialUse: true,
    latencyMs: 14,
    accuracy: '98.4% mAP',
    status: 'ACTIVE'
  },
  {
    id: 'model-catvton',
    name: 'CatVTON Latent Warp & Drape Diffusion',
    task: 'Garment Inpainting & Texture Transfer',
    version: 'v1.2-fp16',
    framework: 'PyTorch / TensorRT Edge',
    license: 'Apache-2.0',
    commercialUse: true,
    latencyMs: 142,
    accuracy: 'SSIM 0.942',
    status: 'ACTIVE'
  },
  {
    id: 'model-facenet',
    name: 'FaceBiometrics Geometric Descriptor',
    task: 'Facial Identification & Customer Recall',
    version: 'v2.1',
    framework: 'ONNX / CPU Vector Sim',
    license: 'Apache-2.0',
    commercialUse: true,
    latencyMs: 12,
    accuracy: '99.2% Top-1',
    status: 'ACTIVE'
  },
  {
    id: 'model-body-opt',
    name: 'Proportional Body Mesh Transformer',
    task: 'Non-Deforming Aesthetic Contour (0-10%)',
    version: 'v0.9.3',
    framework: 'WebGL 2.0 / CPU Canvas',
    license: 'MIT',
    commercialUse: true,
    latencyMs: 8,
    accuracy: '100% Boundary Preservation',
    status: 'ACTIVE'
  }
];

export const REGISTERED_DEVICES: StoreDevice[] = [
  {
    id: 'dev-001',
    name: 'Main Mirror Terminal (Boutique Room 1)',
    type: 'SMART_MIRROR',
    store: 'FitAI Tehran Central Flagship',
    gpu: 'Intel Core i7-13700 / RTX 4070 (Fallback CPU)',
    softwareVersion: 'v0.9.4-release',
    status: 'ONLINE',
    lastSeen: 'Live Now'
  },
  {
    id: 'dev-002',
    name: 'Storefront Window Kiosk #2',
    type: 'STOREFRONT',
    store: 'FitAI Tehran Central Flagship',
    gpu: 'Embedded Edge CPU / ONNX WebAssembly',
    softwareVersion: 'v0.9.4-release',
    status: 'ONLINE',
    lastSeen: 'Live Now'
  }
];
