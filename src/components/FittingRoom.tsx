import React, { useState, useEffect, useRef } from 'react';
import { 
  Product, 
  ModelSubject, 
  PersonAnalysis, 
  TryOnResult, 
  PreferenceSignalBreakdown,
  FabricType,
  TargetAgeGroup,
  GarmentColorOption,
  CustomerProfile
} from '../types';
import { SAMPLE_PRODUCTS, MODEL_SUBJECTS, STANDARD_GARMENT_COLORS } from '../data/catalog';
import { AIPipelineService } from '../services/aiPipeline';
import { FaceRecognitionService } from '../services/faceRecognitionService';
import { SizeRecommendationService } from '../services/sizeRecommendationService';
import { PoseOverlay } from './PoseOverlay';
import { LiveCameraTryOn } from './LiveCameraTryOn';
import { CustomerRecognitionBanner } from './CustomerRecognitionBanner';
import { InventoryManagerModal } from './InventoryManagerModal';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { 
  Sparkles, 
  ShoppingBag, 
  Heart, 
  ThumbsDown, 
  Layers, 
  Columns, 
  Eye, 
  Activity, 
  Check, 
  Tag, 
  Camera,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  UserCheck,
  Palette,
  Ruler,
  Video
} from 'lucide-react';

interface FittingRoomProps {
  isCameraActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onLogEvent: (event: string, details?: any) => void;
  onToggleCamera: () => void;
  lang: Language;
}

export const FittingRoom: React.FC<FittingRoomProps> = ({
  isCameraActive,
  videoRef,
  onLogEvent,
  onToggleCamera,
  lang
}) => {
  const t = TRANSLATIONS[lang];

  // Catalog products (can be updated via Store Owner Inventory Manager)
  const [productsList, setProductsList] = useState<Product[]>(SAMPLE_PRODUCTS);

  // Active person & product selection
  const [selectedModel, setSelectedModel] = useState<ModelSubject>(MODEL_SUBJECTS[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product>(productsList[0]);
  const [selectedColor, setSelectedColor] = useState<GarmentColorOption>(STANDARD_GARMENT_COLORS[0]);

  // Mode: Studio Photo vs Live Camera Mirror
  const [tryOnDisplayMode, setTryOnDisplayMode] = useState<'studio' | 'live_camera'>('studio');

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeAgeFilter, setActiveAgeFilter] = useState<TargetAgeGroup>('all');
  
  // Fabric technical info banner expander & Store Owner Modal
  const [showFabricTechNote, setShowFabricTechNote] = useState<boolean>(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState<boolean>(false);

  // Computer Vision & Pose overlays
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true);
  const [showFaceMesh, setShowFaceMesh] = useState<boolean>(true);

  // Try-On State & Comparison modes
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [tryOnResult, setTryOnResult] = useState<TryOnResult | null>(null);
  const [compareMode, setCompareMode] = useState<'single' | 'split'>('split');
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const isDraggingSplit = useRef<boolean>(false);

  // Preference signals & Section 12 metrics
  const [explicitFeedback, setExplicitFeedback] = useState<boolean | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [viewingSeconds, setViewingSeconds] = useState<number>(0);
  const [revisited, setRevisited] = useState<boolean>(false);
  const [interactionCount, setInteractionCount] = useState<number>(1);
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);

  // Person Analysis state
  const [analysis, setAnalysis] = useState<PersonAnalysis>(
    AIPipelineService.analyzePerson(selectedModel.imageUrl)
  );

  // Facial Biometric Identification state
  const currentFaceEmbedding = selectedModel.faceEmbedding || FaceRecognitionService.extractEmbeddingFromLandmarks(analysis.landmarks);
  const faceIdentification = FaceRecognitionService.identifyFace(currentFaceEmbedding);
  const [identifiedCustomer, setIdentifiedCustomer] = useState<CustomerProfile | null>(faceIdentification.profile);

  // Real Body Size Recommendation based on landmarks
  const sizeRecommendation = SizeRecommendationService.estimateMeasurementsAndSize(analysis.landmarks);

  // Update analysis & face identification when model changes
  useEffect(() => {
    const updated = AIPipelineService.analyzePerson(selectedModel.imageUrl);
    setAnalysis(updated);
    setTryOnResult(null);
    setViewingSeconds(0);
    setExplicitFeedback(null);

    const embed = selectedModel.faceEmbedding || FaceRecognitionService.extractEmbeddingFromLandmarks(updated.landmarks);
    const idResult = FaceRecognitionService.identifyFace(embed);
    setIdentifiedCustomer(idResult.profile);

    if (idResult.profile) {
      onLogEvent('CUSTOMER_IDENTIFIED', {
        name: idResult.profile.name,
        visits: idResult.profile.visitsCount,
        recommendedSize: idResult.profile.recommendedSize
      });
    }
  }, [selectedModel]);

  // Viewing time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setViewingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedProduct]);

  // Compute live preference confidence score according to Section 12 of README
  const preference: PreferenceSignalBreakdown = AIPipelineService.calculatePreferenceScore({
    explicitLike: explicitFeedback,
    viewingTimeSec: viewingSeconds,
    revisited: revisited,
    interactionCount: interactionCount,
    expressionSignal: explicitFeedback === true ? 'Positive' : explicitFeedback === false ? 'Disengaged' : 'Neutral',
  });

  // Handle Try-On Generation
  const handleGenerateTryOn = async (product: Product) => {
    setSelectedProduct(product);
    setIsGenerating(true);
    setInteractionCount((c) => c + 1);
    onLogEvent('TRYON_STARTED', { 
      productId: product.id, 
      productName: product.name,
      fabric: product.fabricType,
      color: selectedColor.nameEn
    });

    try {
      const result = await AIPipelineService.generateTryOn(
        selectedModel.imageUrl,
        product
      );
      result.appliedColor = selectedColor;
      setTryOnResult(result);
      onLogEvent('TRYON_COMPLETED', {
        resultId: result.id,
        confidence: result.confidence,
        latencyMs: result.latencyMs,
      });

      // If customer is identified, record visit with liked item
      if (identifiedCustomer && explicitFeedback === true) {
        FaceRecognitionService.recordCustomerVisit(identifiedCustomer.id, product.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Split-slider drag handlers
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPosition(Math.round((x / rect.width) * 100));
  };

  const handleSplitTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingSplit.current || !e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    setSplitPosition(Math.round((x / rect.width) * 100));
  };

  // Filtered Products by category and age
  const filteredProducts = productsList.filter((p) => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchAge = activeAgeFilter === 'all' || p.targetAge === activeAgeFilter || p.targetAge === 'all';
    return matchCategory && matchAge;
  });

  // Fabric physics profile in 100% Persian and English (no English words in Persian)
  const fabricPhysicsInfo: Record<FabricType, { nameFa: string; nameEn: string; drapeFa: string; drapeEn: string; sheenFa: string; sheenEn: string; elasticityFa: string; elasticityEn: string }> = {
    wool: {
      nameFa: 'فوتر و پشم اعلا',
      nameEn: 'Premium Merino Wool',
      drapeFa: 'ریزش سنگین، محکم و شق',
      drapeEn: 'Heavy Structured Creases',
      sheenFa: 'مات و عمیق',
      sheenEn: 'Matte Diffuse',
      elasticityFa: 'متوسط با برگشت‌پذیری طبیعی',
      elasticityEn: 'Medium Natural Recovery'
    },
    silk: {
      nameFa: 'ابریشم طبیعی و ساتن',
      nameEn: 'Pure Silk & Satin',
      drapeFa: 'ریزش سیال، آبشاری و لغزنده',
      drapeEn: 'Fluid High Curvature Drape',
      sheenFa: 'براقیت ملایم ساتن',
      sheenEn: 'Soft Specular Sheen',
      elasticityFa: 'کم (تطبیق نرم با انحنای بدن)',
      elasticityEn: 'Low (Follows Body Curve)'
    },
    leather: {
      nameFa: 'چرم طبیعی',
      nameEn: 'Genuine Leather',
      drapeFa: 'فرم زاویه‌دار و محکم بدون ریزش آزاد',
      drapeEn: 'Rigid Molded Form',
      sheenFa: 'بازتاب بازتابشی براق',
      sheenEn: 'Specular Highlights',
      elasticityFa: 'کم (قالب ساختاریافته)',
      elasticityEn: 'Low Form Retention'
    },
    denim: {
      nameFa: 'دنیم و جین سنگین',
      nameEn: 'Heavy 14oz Denim',
      drapeFa: 'شکن‌های درشت و سفت ۱۴ انس',
      drapeEn: 'Heavy Stiff Folds',
      sheenFa: 'مات بافتی',
      sheenEn: 'Textured Matte',
      elasticityFa: 'متوسط تا کم',
      elasticityEn: 'Low-to-Medium'
    },
    velvet: {
      nameFa: 'مخمل فاخر پرزدار',
      nameEn: 'Luxury Velvet',
      drapeFa: 'شکن‌های پرحجم و سنگین',
      drapeEn: 'Deep Rich Pile Folds',
      sheenFa: 'سایه‌روشن مخملی پربازتاب',
      sheenEn: 'Retro-Reflective Lustre',
      elasticityFa: 'متوسط ارتجاعی',
      elasticityEn: 'Medium Elastic'
    },
    linen: {
      nameFa: 'کتان و لینن ارگانیک',
      nameEn: 'Organic Linen',
      drapeFa: 'شکن‌های طبیعی، خنک و تنفس‌پذیر',
      drapeEn: 'Crisp Natural Wrinkles',
      sheenFa: 'مات طبیعی',
      sheenEn: 'Natural Matte',
      elasticityFa: 'بافت ثابت بدون کشسانی',
      elasticityEn: 'Non-Stretch'
    },
    cotton: {
      nameFa: 'نخ‌پنبه طبیعی',
      nameEn: 'Natural Cotton',
      drapeFa: 'ریزش ملایم و نرم روزمره',
      drapeEn: 'Soft Casual Drape',
      sheenFa: 'مات یکنواخت',
      sheenEn: 'Soft Diffuse',
      elasticityFa: 'کشسانی نرم',
      elasticityEn: 'Soft Stretch'
    },
    technical: {
      nameFa: 'پارچه نانو و ضدآب',
      nameEn: 'Technical Shell',
      drapeFa: 'شکن‌های مهندسی ضدباد',
      drapeEn: 'Engineered Windproof Folds',
      sheenFa: 'نیمه‌مات صنعتی',
      sheenEn: 'Semi-Matte Synthetic',
      elasticityFa: 'کشسانی پویا',
      elasticityEn: 'Dynamic Articulation'
    }
  };

  const currentFabricData = fabricPhysicsInfo[selectedProduct.fabricType || 'wool'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* 1. Customer Facial Identification & Recognition Bar */}
      <CustomerRecognitionBanner
        identifiedCustomer={identifiedCustomer}
        identificationConfidence={faceIdentification.confidence}
        currentFaceEmbedding={currentFaceEmbedding}
        sizeRecommendation={sizeRecommendation}
        onCustomerRegistered={(newProfile) => {
          setIdentifiedCustomer(newProfile);
          onLogEvent('NEW_CUSTOMER_SAVED', { name: newProfile.name });
        }}
        onSelectLikedProduct={(productId) => {
          const found = productsList.find((p) => p.id === productId);
          if (found) {
            handleGenerateTryOn(found);
          }
        }}
        lang={lang}
      />

      {/* 2. Fabric Physics Explanation Accordion & Store Owner Inventory Manager Launcher */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div 
          onClick={() => setShowFabricTechNote(!showFabricTechNote)}
          className="flex items-center gap-3 cursor-pointer flex-1"
        >
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              {t.fabricAnswer.question}
            </span>
            <span className="text-[11px] text-cyan-300 font-medium">
              {lang === 'fa' ? currentFabricData.nameFa : currentFabricData.nameEn} • {lang === 'fa' ? currentFabricData.drapeFa : currentFabricData.drapeEn}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsInventoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.fittingRoom.boutiqueInventory}</span>
          </button>
          <button 
            onClick={() => setShowFabricTechNote(!showFabricTechNote)}
            className="text-slate-400 hover:text-white p-1"
          >
            {showFabricTechNote ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showFabricTechNote && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-3 leading-relaxed animate-fade-in">
          <p>{t.fabricAnswer.answer}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-0.5">{lang === 'fa' ? 'فیزیک ریزش و شکن:' : 'Drape Factor:'}</span>
              <span className="text-cyan-400 font-semibold">{lang === 'fa' ? currentFabricData.drapeFa : currentFabricData.drapeEn}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-0.5">{lang === 'fa' ? 'بازتاب نوری و درخشش:' : 'Reflectance / Luster:'}</span>
              <span className="text-indigo-400 font-semibold">{lang === 'fa' ? currentFabricData.sheenFa : currentFabricData.sheenEn}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-0.5">{lang === 'fa' ? 'کشسانی و انعطاف:' : 'Elasticity:'}</span>
              <span className="text-emerald-400 font-semibold">{lang === 'fa' ? currentFabricData.elasticityFa : currentFabricData.elasticityEn}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-0.5">{lang === 'fa' ? 'محاسبه روی پردازنده:' : 'Inference:'}</span>
              <span className="text-amber-400 font-semibold">{lang === 'fa' ? 'فعال در لایه‌های شیدر زنده' : 'Active CPU Shader'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Top Stage Control: Live Camera vs Studio Mode Toggle + Subject Picker */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Toggle between Studio Photo Try-On and Live Camera Try-On */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTryOnDisplayMode('studio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                tryOnDisplayMode === 'studio'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.fittingRoom.studioTryOn}</span>
            </button>

            <button
              onClick={() => {
                setTryOnDisplayMode('live_camera');
                if (!isCameraActive) onToggleCamera();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                tryOnDisplayMode === 'live_camera'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-cyan-300" />
              <span>{t.fittingRoom.liveTryOn}</span>
            </button>
          </div>
        </div>

        {/* Model Subject Selector (Studio Mode) */}
        {tryOnDisplayMode === 'studio' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">
              {t.fittingRoom.subject}
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {MODEL_SUBJECTS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model);
                    onLogEvent('MODEL_CHANGED', { modelId: model.id, name: model.name });
                  }}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    selectedModel.id === model.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {model.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pose CV Overlay Toggles */}
        {tryOnDisplayMode === 'studio' && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                showSkeleton ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.fittingRoom.skeleton}
            </button>
            <button
              onClick={() => setShowBoundingBox(!showBoundingBox)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                showBoundingBox ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.fittingRoom.box}
            </button>
            <button
              onClick={() => setShowFaceMesh(!showFaceMesh)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                showFaceMesh ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.fittingRoom.facemesh}
            </button>
          </div>
        )}

      </div>

      {/* 4. Main Dual-Column Stage: Virtual Mirror / Live Camera (7 Cols) & Wardrobe / Sizing (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Virtual Mirror (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          
          {tryOnDisplayMode === 'live_camera' ? (
            /* Live Camera Stream Try-On with Real-Time CPU Torso Tracking */
            <LiveCameraTryOn
              videoRef={videoRef}
              isCameraActive={isCameraActive}
              onToggleCamera={onToggleCamera}
              selectedProduct={selectedProduct}
              selectedColor={selectedColor}
              landmarks={analysis.landmarks}
              lang={lang}
            />
          ) : (
            /* Studio Photo Try-On with Split Comparison Slider */
            <div
              id="mirror-container"
              className="relative aspect-[3/4] w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl select-none group"
              onMouseMove={handleSplitMouseMove}
              onMouseDown={() => { isDraggingSplit.current = true; }}
              onMouseUp={() => { isDraggingSplit.current = false; }}
              onTouchMove={handleSplitTouchMove}
              onTouchStart={() => { isDraggingSplit.current = true; }}
              onTouchEnd={() => { isDraggingSplit.current = false; }}
            >
              <img
                src={selectedModel.imageUrl}
                alt="Base Subject"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Try-On Synthesized Result with Split Clip */}
              {tryOnResult && compareMode !== 'single' && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none transition-all"
                  style={{
                    clipPath: `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition}% 100%)`
                  }}
                >
                  <img
                    src={tryOnResult.resultImage}
                    alt="Try-On Synthesized Result"
                    className="w-full h-full object-cover"
                  />

                  {/* Dynamic Color Tint Overlay if Custom Color Chosen */}
                  {selectedColor && (
                    <div
                      className="absolute inset-0 mix-blend-color pointer-events-none opacity-40"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                  )}

                  {/* Fabric Physics Simulation Layer */}
                  <div 
                    className={`absolute inset-0 mix-blend-overlay pointer-events-none ${
                      selectedProduct.fabricType === 'leather' ? 'opacity-35 bg-gradient-to-tr from-transparent via-white to-transparent' :
                      selectedProduct.fabricType === 'silk' ? 'opacity-25 bg-gradient-to-b from-white/20 via-transparent to-black/20' :
                      selectedProduct.fabricType === 'velvet' ? 'opacity-30 bg-indigo-950' : 'opacity-0'
                    }`} 
                  />

                  <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-500/40 text-xs font-mono text-white flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.fittingRoom.tryOnLook}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 ml-1">
                      {(tryOnResult.confidence * 100).toFixed(0)}% {t.fittingRoom.matchPct}
                    </span>
                  </div>
                </div>
              )}

              {/* Single Try-On Full Preview */}
              {tryOnResult && compareMode === 'single' && (
                <div className="absolute inset-0">
                  <img
                    src={tryOnResult.resultImage}
                    alt="Full Try-On Preview"
                    className="w-full h-full object-cover"
                  />
                  {selectedColor && (
                    <div
                      className="absolute inset-0 mix-blend-color pointer-events-none opacity-40"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                  )}
                </div>
              )}

              {/* Split Comparison Divider */}
              {tryOnResult && compareMode === 'split' && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 shadow-[0_0_12px_rgba(255,255,255,0.7)]"
                  style={{ left: `${splitPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-white">
                    <Columns className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {/* Computer Vision Skeleton & Pose */}
              <PoseOverlay
                landmarks={analysis.landmarks}
                showSkeleton={showSkeleton}
                showBoundingBox={showBoundingBox}
                showFaceMesh={showFaceMesh}
                detectedPresentation={analysis.presentation}
                detectedAgeRange={analysis.ageGroup}
              />

              {/* Processing Loader */}
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/50 animate-pulse">
                    <Sparkles className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <div className="text-center">
                    <h4 className="text-white font-bold text-sm">
                      {t.fittingRoom.synthesizing}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {lang === 'fa' ? currentFabricData.nameFa : currentFabricData.nameEn} ({lang === 'fa' ? currentFabricData.drapeFa : currentFabricData.drapeEn})
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                {t.fittingRoom.original}
              </div>
            </div>
          )}

          {/* Bottom Bar: Mode Switcher & Real-Time Preference Signals */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center gap-2">
              {tryOnDisplayMode === 'studio' && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setCompareMode('split')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      compareMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>{t.fittingRoom.sliderSplit}</span>
                  </button>
                  <button
                    onClick={() => setCompareMode('single')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      compareMode === 'single' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t.fittingRoom.fullLook}</span>
                  </button>
                </div>
              )}

              {/* Customer Reaction Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setExplicitFeedback(true);
                    setInteractionCount((c) => c + 1);
                    onLogEvent('EXPLICIT_LIKE', { productId: selectedProduct.id });
                    if (identifiedCustomer) {
                      FaceRecognitionService.recordCustomerVisit(identifiedCustomer.id, selectedProduct.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    explicitFeedback === true
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>{t.fittingRoom.like}</span>
                </button>

                <button
                  onClick={() => {
                    setExplicitFeedback(false);
                    setInteractionCount((c) => c + 1);
                    onLogEvent('DISLIKE', { productId: selectedProduct.id });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    explicitFeedback === false
                      ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>{t.fittingRoom.pass}</span>
                </button>

                <button
                  onClick={() => {
                    setIsSaved(!isSaved);
                    setRevisited(true);
                    setInteractionCount((c) => c + 1);
                    onLogEvent('PRODUCT_SAVED', { productId: selectedProduct.id });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isSaved
                      ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{isSaved ? t.fittingRoom.saved : t.fittingRoom.wishlist}</span>
                </button>
              </div>
            </div>

            {/* Live Preference Confidence Metric */}
            <div className="flex items-center gap-3 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">
                    {t.fittingRoom.preferenceScoreSec12}
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{(preference.totalScore * 100).toFixed(0)}%</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({preference.totalScore >= 0.7 ? t.fittingRoom.strongFit : preference.totalScore >= 0.45 ? t.fittingRoom.moderate : t.fittingRoom.lowInterest})
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono text-right pl-2 border-l border-slate-800">
                <div>{t.fittingRoom.time} {viewingSeconds}s</div>
                <div>{t.fittingRoom.events} {interactionCount}</div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Active Garment, Color Variation, Smart Sizing, Wardrobe (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Active Garment & Boutique Fabric Details */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-indigo-400 font-semibold tracking-wider">
                  {t.fittingRoom.selectedGarment} • {selectedProduct.category.replace('_', ' ')}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {selectedProduct.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-emerald-400 font-mono">
                  ${selectedProduct.price}
                </div>
                <div className="text-[10px] text-slate-500">{t.fittingRoom.inStock} (3)</div>
              </div>
            </div>

            {/* Boutique Registered Fabric - 100% Persian (No customer selection needed) */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">
                  {t.fittingRoom.fabric}
                </span>
                <span className="text-cyan-400 font-bold">
                  {lang === 'fa' ? currentFabricData.nameFa : currentFabricData.nameEn}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-850 pt-1">
                <span>{lang === 'fa' ? 'فیزیک ریزش:' : 'Drape:'} {lang === 'fa' ? currentFabricData.drapeFa : currentFabricData.drapeEn}</span>
                <span>•</span>
                <span>{lang === 'fa' ? 'بازتاب:' : 'Sheen:'} {lang === 'fa' ? currentFabricData.sheenFa : currentFabricData.sheenEn}</span>
              </div>
            </div>

            {/* Garment Color Variation Selector (Customer Choice) */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.fittingRoom.chooseColor}</span>
              </span>
              <div className="grid grid-cols-4 gap-2">
                {STANDARD_GARMENT_COLORS.map((col) => {
                  const isSelected = selectedColor.id === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => setSelectedColor(col)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="text-[10px] font-medium truncate w-full">
                        {lang === 'fa' ? col.nameFa : col.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart Size Recommendation Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-950 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">
                    {t.fittingRoom.smartSizeSuggested}
                  </span>
                </div>
                <span className="text-sm font-extrabold font-mono bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-lg border border-cyan-500/40">
                  {sizeRecommendation.recommendedSize}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                {lang === 'fa' ? sizeRecommendation.fitAssessmentFa : sizeRecommendation.fitAssessmentEn}
              </p>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                <div>
                  <span className="block text-slate-500">{lang === 'fa' ? 'عرض شانه:' : 'Shoulder:'}</span>
                  <span className="text-slate-200 font-semibold">{sizeRecommendation.shoulderCm} cm</span>
                </div>
                <div>
                  <span className="block text-slate-500">{lang === 'fa' ? 'دور سینه:' : 'Chest:'}</span>
                  <span className="text-slate-200 font-semibold">{sizeRecommendation.chestCm} cm</span>
                </div>
                <div>
                  <span className="block text-slate-500">{lang === 'fa' ? 'قد تخمینی:' : 'Height:'}</span>
                  <span className="text-slate-200 font-semibold">{sizeRecommendation.heightCm} cm</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerateTryOn(selectedProduct)}
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>{isGenerating ? t.fittingRoom.synthesizing : t.fittingRoom.virtuallyTryOn}</span>
              </button>

              <button
                onClick={() => {
                  setHasPurchased(!hasPurchased);
                  setInteractionCount((c) => c + 1);
                  onLogEvent('PURCHASE_INTENT', { productId: selectedProduct.id, size: sizeRecommendation.recommendedSize });
                }}
                className={`p-2.5 rounded-xl border transition-all ${
                  hasPurchased
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title={lang === 'fa' ? 'درخواست سایز پیشنهادی به اپراتور اتاق پرو' : 'Request size from attendant'}
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>

            {hasPurchased && (
              <p className="text-[11px] text-emerald-400 text-center font-medium">
                {lang === 'fa'
                  ? `✓ درخواست سایز ${sizeRecommendation.recommendedSize} به رگال اتاق پرو ارسال شد!`
                  : `✓ Size ${sizeRecommendation.recommendedSize} requested! A fitting room attendant has been notified.`}
              </p>
            )}
          </div>

          {/* Wardrobe Catalog with Age & Category Filters */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.fittingRoom.storeCatalog}</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {filteredProducts.length} {t.fittingRoom.itemsAvailable}
              </span>
            </div>

            {/* Age Filter Tabs */}
            <div className="mb-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                {t.fittingRoom.filterAge}
              </span>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all' as TargetAgeGroup, label: t.fittingRoom.all },
                  { id: 'teen' as TargetAgeGroup, label: lang === 'fa' ? 'نوجوانان و جوانان (۱۵-۲۴)' : 'Teens (15-24)' },
                  { id: 'young_adult' as TargetAgeGroup, label: lang === 'fa' ? 'بزرگسالان (۲۵-۴۴)' : 'Adults (25-44)' },
                  { id: 'mature' as TargetAgeGroup, label: lang === 'fa' ? 'کلاسیک و مجلسی (۴۵+)' : 'Mature (45+)' },
                ].map((age) => (
                  <button
                    key={age.id}
                    onClick={() => setActiveAgeFilter(age.id)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                      activeAgeFilter === age.id
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {age.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Pills (ژاکت، دامن، پیراهن، ...) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {[
                { id: 'all', label: t.fittingRoom.all },
                { id: 'jackets', label: t.fittingRoom.jackets },
                { id: 'dresses', label: t.fittingRoom.dresses },
                { id: 'upper_body', label: t.fittingRoom.tops },
                { id: 'full_outfit', label: t.fittingRoom.suits },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Wardrobe Items Grid */}
            <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[290px] pr-1 scrollbar-thin">
              {filteredProducts.map((product) => {
                const isSelected = selectedProduct.id === product.id;
                const fabricMeta = fabricPhysicsInfo[product.fabricType || 'wool'];

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      handleGenerateTryOn(product);
                    }}
                    className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all flex flex-col group ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-600/20'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                    }`}
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-2 right-2 text-[10px] font-mono font-bold bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-emerald-400 border border-slate-800">
                        ${product.price}
                      </span>
                      <span className="absolute bottom-2 left-2 text-[9px] font-mono bg-slate-950/90 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-800">
                        {lang === 'fa' ? fabricMeta.nameFa : fabricMeta.nameEn}
                      </span>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-semibold text-white truncate">
                          {product.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>{product.sizes.join(', ')}</span>
                        {isSelected && (
                          <span className="text-cyan-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            {lang === 'fa' ? 'انتخاب‌شده' : 'Selected'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

      {/* Store Owner Inventory & Fabric Manager Modal */}
      <InventoryManagerModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        products={productsList}
        onUpdateProduct={(updated) => {
          setProductsList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          if (selectedProduct.id === updated.id) {
            setSelectedProduct(updated);
          }
          onLogEvent('PRODUCT_FABRIC_UPDATED', { id: updated.id, fabric: updated.fabricType });
        }}
        lang={lang}
      />

    </div>
  );
};
