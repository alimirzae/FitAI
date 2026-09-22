import { Product, ModelSubject, StoreCampaign, AIModelRegistryEntry, StoreDevice } from '../types';

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-101',
    name: 'Tailored Wool Minimalist Blazer',
    category: 'jackets',
    genderCategory: 'unisex',
    price: 249,
    color: 'Charcoal Black',
    colorHex: '#1e293b',
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
    description: 'Structured silhouette blazer with notched lapels and sustainable virgin wool blend.',
    fabric: '70% Wool, 30% Recycled Poly',
    tags: ['formal', 'modern', 'bestseller']
  },
  {
    id: 'prod-102',
    name: 'Italian Leather Moto Jacket',
    category: 'jackets',
    genderCategory: 'men',
    price: 380,
    color: 'Espresso Brown',
    colorHex: '#3e2723',
    sizes: ['M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
    description: 'Handcrafted full-grain leather jacket with asymmetrical chrome zip and quilted lining.',
    fabric: '100% Genuine Nappa Leather',
    tags: ['streetwear', 'leather', 'iconic']
  },
  {
    id: 'prod-103',
    name: 'Oversized Cashmere Trench Coat',
    category: 'jackets',
    genderCategory: 'women',
    price: 420,
    color: 'Camel Sand',
    colorHex: '#c29b7f',
    sizes: ['XS', 'S', 'M', 'L'],
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80',
    description: 'Double-breasted longline trench with storm flaps, raglan sleeves, and horn buttons.',
    fabric: '90% Wool, 10% Cashmere',
    tags: ['autumn', 'luxury', 'trench']
  },
  {
    id: 'prod-104',
    name: 'Silk Blend Midi Wrap Dress',
    category: 'dresses',
    genderCategory: 'women',
    price: 195,
    color: 'Emerald Green',
    colorHex: '#065f46',
    sizes: ['XS', 'S', 'M'],
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
    description: 'Flowing A-line wrap dress crafted from mulberry silk with subtle pleated cuffs.',
    fabric: '100% Mulberry Silk',
    tags: ['cocktail', 'evening', 'silk']
  },
  {
    id: 'prod-105',
    name: 'Japanese Oxford Cotton Overshirt',
    category: 'upper_body',
    genderCategory: 'men',
    price: 130,
    color: 'Slate Blue',
    colorHex: '#3b82f6',
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    description: 'Heavyweight organic cotton overshirt with double flap pockets and reinforced stitching.',
    fabric: '100% Organic Selvedge Cotton',
    tags: ['casual', 'workwear', 'layering']
  },
  {
    id: 'prod-106',
    name: 'Urban Cyberpunk Bomber Jacket',
    category: 'jackets',
    genderCategory: 'unisex',
    price: 210,
    color: 'Matte Obsidian',
    colorHex: '#18181b',
    sizes: ['M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80',
    description: 'Weather-resistant technical shell bomber with waterproof taped zippers.',
    fabric: 'GORE-TEX 3-Layer Laminate',
    tags: ['techwear', 'waterproof', 'streetwear']
  },
  {
    id: 'prod-107',
    name: 'Textured Knit Merino Sweater',
    category: 'upper_body',
    genderCategory: 'unisex',
    price: 165,
    color: 'Alabaster Cream',
    colorHex: '#fef3c7',
    sizes: ['S', 'M', 'L'],
    imageUrl: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=600&q=80',
    description: 'Ribbed crewneck sweater spun from superfine Australian merino wool.',
    fabric: '100% Superfine Merino Wool',
    tags: ['knitwear', 'warmth', 'winter']
  },
  {
    id: 'prod-108',
    name: 'Pleated Velvet Evening Tuxedo',
    category: 'full_outfit',
    genderCategory: 'men',
    price: 540,
    color: 'Midnight Navy',
    colorHex: '#0f172a',
    sizes: ['M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    description: 'Deep midnight blue velvet dinner jacket paired with satin-trimmed tuxedo trousers.',
    fabric: 'Italian Cotton Velvet',
    tags: ['gala', 'formal', 'black-tie']
  }
];

export const MODEL_SUBJECTS: ModelSubject[] = [
  {
    id: 'model-sophia',
    name: 'Sophia (Studio Portrait)',
    gender: 'women',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    poseType: 'standing_front',
    height: '176 cm',
    estimatedAgeRange: '25–34'
  },
  {
    id: 'model-marcus',
    name: 'Marcus (Athletic Frame)',
    gender: 'men',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    poseType: 'standing_front',
    height: '184 cm',
    estimatedAgeRange: '25–34'
  },
  {
    id: 'model-elena',
    name: 'Elena (Fashion Casual)',
    gender: 'women',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    poseType: 'casual_turn',
    height: '172 cm',
    estimatedAgeRange: '18–24'
  },
  {
    id: 'model-david',
    name: 'David (Executive)',
    gender: 'men',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    poseType: 'formal',
    height: '181 cm',
    estimatedAgeRange: '35–44'
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
    title: 'Urban Luxe & Techwear',
    description: 'High-energy evening display highlighting technical bombers, leather jackets and denim.',
    location: 'Mall Corridor Display #3',
    active: true,
    productIds: ['prod-102', 'prod-106', 'prod-105'],
    recommendedAgeGroups: ['18-24', '25-34']
  },
  {
    id: 'camp-gala-elegance',
    title: 'Evening Gala & Cocktail',
    description: 'Curated premium dresses and tailored velvet suits for special occasions.',
    location: 'VIP Fitting Room Display #4',
    active: true,
    productIds: ['prod-104', 'prod-108', 'prod-107'],
    recommendedAgeGroups: ['25-34', '35-44', '45-54']
  }
];

export const AI_MODEL_REGISTRY: AIModelRegistryEntry[] = [
  {
    id: 'cat-vton-trt',
    name: 'CatVTON Engine (ONNX/TensorRT)',
    task: 'Virtual Try-On (VTON)',
    version: '2.1.0',
    framework: 'ONNX Runtime / CUDA',
    license: 'Apache-2.0',
    commercialUse: true,
    latencyMs: 142,
    accuracy: '97.4% Texture Alignment',
    status: 'ACTIVE'
  },
  {
    id: 'mediapipe-pose-v2',
    name: 'MediaPipe BlazePose 33-Point',
    task: 'Pose Estimation & Skeletal Tracking',
    version: '0.10.14',
    framework: 'TFLite / WebAssembly',
    license: 'Apache-2.0',
    commercialUse: true,
    latencyMs: 24,
    accuracy: '99.1% Landmark Detection',
    status: 'ACTIVE'
  },
  {
    id: 'bisenet-human-seg',
    name: 'BiSeNet-V2 Human Segmentation',
    task: 'Garment & Body Matting',
    version: '1.4.0',
    framework: 'PyTorch / ONNX',
    license: 'MIT',
    commercialUse: true,
    latencyMs: 38,
    accuracy: '95.8% mIoU',
    status: 'ACTIVE'
  },
  {
    id: 'face-demographics-onnx',
    name: 'InsightFace Lightweight Estimator',
    task: 'Probabilistic Demographic & Expression',
    version: '0.7.3',
    framework: 'ONNX Runtime',
    license: 'MIT',
    commercialUse: true,
    latencyMs: 18,
    accuracy: '93.2% Expression Index',
    status: 'ACTIVE'
  },
  {
    id: 'hairfast-gan-beauty',
    name: 'HairFast-GAN & Colorizer',
    task: 'Hairstyle & Tint Synthesis',
    version: '1.2.0',
    framework: 'PyTorch / TensorRT',
    license: 'Apache-2.0',
    commercialUse: true,
    latencyMs: 185,
    accuracy: '96.2% Edge Preservation',
    status: 'ACTIVE'
  },
  {
    id: 'idm-vton-benchmark',
    name: 'IDM-VTON Diffusion (Research)',
    task: 'High-Fidelity Diffusion VTON',
    version: '0.9.5-rc',
    framework: 'Diffusers / PyTorch',
    license: 'Research-Only (CC BY-NC 4.0)',
    commercialUse: false,
    latencyMs: 1240,
    accuracy: '98.5% Photorealism',
    status: 'BENCHMARK_ONLY'
  }
];

export const REGISTERED_DEVICES: StoreDevice[] = [
  {
    id: 'DEV-SM-001',
    name: 'Fitting Room Smart Mirror #1',
    type: 'SMART_MIRROR',
    store: 'SoHo Flagship Store, New York',
    gpu: 'NVIDIA RTX 4080 (16GB VRAM)',
    softwareVersion: 'FitAI v0.9.4',
    status: 'ONLINE',
    lastSeen: 'Just now'
  },
  {
    id: 'DEV-SF-002',
    name: 'Storefront Window Display #1',
    type: 'STOREFRONT',
    store: 'SoHo Flagship Store, New York',
    gpu: 'NVIDIA RTX 4070 Ti (12GB VRAM)',
    softwareVersion: 'FitAI v0.9.4',
    status: 'ONLINE',
    lastSeen: 'Just now'
  },
  {
    id: 'DEV-SL-003',
    name: 'Salon Styling Mirror #2',
    type: 'SALON_MIRROR',
    store: 'Atelier Hair Studio, Beverly Hills',
    gpu: 'NVIDIA RTX 4060 Ti (8GB VRAM)',
    softwareVersion: 'FitAI v0.9.4',
    status: 'ONLINE',
    lastSeen: '2 min ago'
  },
  {
    id: 'DEV-FR-004',
    name: 'Fitting Room Kiosk #3',
    type: 'FITTING_ROOM',
    store: 'Covent Garden Boutique, London',
    gpu: 'Jetson AGX Orin (Edge)',
    softwareVersion: 'FitAI v0.9.3',
    status: 'PROCESSING',
    lastSeen: 'Just now'
  }
];
