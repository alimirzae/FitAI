import React, { useState, useEffect, useRef } from 'react';
import { 
  Product, 
  ModelSubject, 
  PersonAnalysis, 
  TryOnResult, 
  ClothingCategory, 
  PreferenceSignalBreakdown 
} from '../types';
import { SAMPLE_PRODUCTS, MODEL_SUBJECTS } from '../data/catalog';
import { AIPipelineService } from '../services/aiPipeline';
import { PoseOverlay } from './PoseOverlay';
import { 
  Heart, 
  ThumbsDown, 
  Sparkles, 
  Layers, 
  RotateCcw, 
  ShoppingBag, 
  Columns, 
  SlidersHorizontal, 
  Eye, 
  Activity, 
  Check, 
  Tag, 
  Info,
  Camera
} from 'lucide-react';

interface FittingRoomProps {
  isCameraActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onLogEvent: (event: string, details?: any) => void;
}

export const FittingRoom: React.FC<FittingRoomProps> = ({
  isCameraActive,
  videoRef,
  onLogEvent
}) => {
  // Active person & product selection
  const [selectedModel, setSelectedModel] = useState<ModelSubject>(MODEL_SUBJECTS[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product>(SAMPLE_PRODUCTS[0]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Computer Vision & Pose overlays
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true);
  const [showFaceMesh, setShowFaceMesh] = useState<boolean>(true);

  // Try-On State & Comparison modes
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [tryOnResult, setTryOnResult] = useState<TryOnResult | null>(null);
  const [compareMode, setCompareMode] = useState<'single' | 'split' | 'side-by-side'>('split');
  const [splitPosition, setSplitPosition] = useState<number>(50); // percentage 0..100
  const isDraggingSplit = useRef<boolean>(false);

  // Preference signals & Section 12 metrics
  const [explicitFeedback, setExplicitFeedback] = useState<boolean | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [viewingSeconds, setViewingSeconds] = useState<number>(4);
  const [interactionCount, setInteractionCount] = useState<number>(1);
  const [revisited, setRevisited] = useState<boolean>(false);

  // Person Analysis from AI service
  const [analysis, setAnalysis] = useState<PersonAnalysis>(
    AIPipelineService.analyzePerson(selectedModel.id)
  );

  // Update analysis when model changes
  useEffect(() => {
    const newAnalysis = AIPipelineService.analyzePerson(selectedModel.id);
    setAnalysis(newAnalysis);
    setExplicitFeedback(null);
    setViewingSeconds(2);
    setTryOnResult(null);
    onLogEvent('PERSON_CHANGED', { modelId: selectedModel.id });
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
    onLogEvent('TRYON_STARTED', { productId: product.id, productName: product.name });

    try {
      const result = await AIPipelineService.generateTryOn(
        selectedModel.imageUrl,
        product
      );
      setTryOnResult(result);
      onLogEvent('TRYON_COMPLETED', {
        resultId: result.id,
        confidence: result.confidence,
        latencyMs: result.latencyMs,
      });
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
    if (!isDraggingSplit.current || e.touches.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    setSplitPosition(Math.round((x / rect.width) * 100));
  };

  // Filter products by category
  const filteredProducts = SAMPLE_PRODUCTS.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Person Understanding & Active Subject Selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Subject selector & live indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-slate-400">Subject:</span>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {MODEL_SUBJECTS.map((model) => (
                <button
                  key={model.id}
                  id={`btn-subject-${model.id}`}
                  onClick={() => setSelectedModel(model)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    selectedModel.id === model.id && !isCameraActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {model.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {isCameraActive && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-xs">
              <Camera className="w-3.5 h-3.5 animate-pulse" />
              <span>Webcam Active</span>
            </div>
          )}
        </div>

        {/* Right: Computer Vision Telemetry Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-slate-500">Pose:</span> 33 Keypoints Tracked
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400">
            <span className="text-slate-500">Est. Age:</span> {analysis.ageGroup}
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300">
            <span className="text-slate-500">Presentation:</span> {analysis.presentation.toUpperCase()}
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400">
            <span className="text-slate-500">Confidence:</span> {(analysis.confidence * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main Fitting Room Grid: Left Viewport (Mirror/Camera) & Right Product Wardrobe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Smart Mirror Viewport (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Mirror Stage Container */}
          <div 
            className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none"
            onMouseMove={handleSplitMouseMove}
            onMouseDown={() => { isDraggingSplit.current = true; }}
            onMouseUp={() => { isDraggingSplit.current = false; }}
            onMouseLeave={() => { isDraggingSplit.current = false; }}
            onTouchMove={handleSplitTouchMove}
            onTouchStart={() => { isDraggingSplit.current = true; }}
            onTouchEnd={() => { isDraggingSplit.current = false; }}
          >
            {/* 1. Live Camera Stream (if enabled) */}
            {isCameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
              />
            ) : null}

            {/* 2. Base Person Image (Original) */}
            {!isCameraActive && (
              <img
                src={selectedModel.imageUrl}
                alt={selectedModel.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* 3. Try-On Layer */}
            {tryOnResult && (
              <>
                {compareMode === 'single' && (
                  <div className="absolute inset-0 z-10 transition-opacity duration-300">
                    <img
                      src={tryOnResult.resultImage}
                      alt={tryOnResult.productName}
                      className="w-full h-full object-cover mix-blend-normal"
                    />
                    {/* Visual drape tint / fabric alignment indicator */}
                    <div className="absolute top-4 left-4 bg-indigo-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-700/60 text-xs text-indigo-200 shadow-lg flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{tryOnResult.productName}</span>
                      <span className="text-[10px] bg-indigo-800 px-1.5 py-0.2 rounded font-mono">
                        {(tryOnResult.confidence * 100).toFixed(0)}% MATCH
                      </span>
                    </div>
                  </div>
                )}

                {compareMode === 'split' && (
                  <div 
                    className="absolute inset-0 z-10 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}
                  >
                    <img
                      src={tryOnResult.resultImage}
                      alt={tryOnResult.productName}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Try-on side tag */}
                    <div className="absolute top-4 right-4 bg-indigo-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-700/60 text-xs font-semibold text-indigo-200">
                      TRY-ON: {selectedProduct.name}
                    </div>
                  </div>
                )}

                {/* Split-Divider Line & Handle */}
                {compareMode === 'split' && (
                  <div
                    className="absolute top-0 bottom-0 z-30 cursor-ew-resize flex items-center justify-center pointer-events-none"
                    style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    <div className="absolute w-8 h-8 rounded-full bg-cyan-500 border-2 border-slate-900 shadow-lg flex items-center justify-center text-slate-950 text-xs font-bold pointer-events-auto cursor-ew-resize">
                      ↔
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 4. Pose Keypoints and Skeleton Overlay */}
            <PoseOverlay
              landmarks={analysis.landmarks}
              showSkeleton={showSkeleton}
              showBoundingBox={showBoundingBox}
              showFaceMesh={showFaceMesh}
              detectedAgeRange={analysis.ageGroup}
              detectedPresentation={analysis.presentation}
            />

            {/* Generation Spinner Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-200 tracking-wide animate-pulse">
                  CatVTON TensorRT Synthesizing Garment...
                </p>
                <span className="text-xs text-slate-400 font-mono">
                  Preserving identity & fabric texture
                </span>
              </div>
            )}

            {/* Bottom Floating Viewport Controls */}
            <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-800">
              {/* Overlay Toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  id="toggle-skeleton"
                  onClick={() => setShowSkeleton(!showSkeleton)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    showSkeleton
                      ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                  title="Toggle 33-point MediaPipe skeleton"
                >
                  Skeleton
                </button>
                <button
                  id="toggle-bbox"
                  onClick={() => setShowBoundingBox(!showBoundingBox)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    showBoundingBox
                      ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                  title="Toggle person detection box"
                >
                  Box
                </button>
                <button
                  id="toggle-facemesh"
                  onClick={() => setShowFaceMesh(!showFaceMesh)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    showFaceMesh
                      ? 'bg-purple-950/80 border-purple-800 text-purple-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                  title="Toggle face landmark ring"
                >
                  Face
                </button>
              </div>

              {/* Compare Mode Switcher (Section 35 Before/After) */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  id="btn-compare-split"
                  onClick={() => setCompareMode('split')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    compareMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Slider Split
                </button>
                <button
                  id="btn-compare-single"
                  onClick={() => setCompareMode('single')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    compareMode === 'single' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Full Look
                </button>
              </div>
            </div>
          </div>

          {/* Customer Reaction & Section 12 Preference Feedback Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Customer Reaction:
              </span>
              <div className="flex items-center gap-2">
                <button
                  id="btn-like-garment"
                  onClick={() => {
                    setExplicitFeedback(true);
                    setInteractionCount((c) => c + 1);
                    onLogEvent('LIKE', { productId: selectedProduct.id });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    explicitFeedback === true
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${explicitFeedback === true ? 'fill-white' : ''}`} />
                  <span>Like Look</span>
                </button>

                <button
                  id="btn-dislike-garment"
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
                  <span>Pass</span>
                </button>

                <button
                  id="btn-save-look"
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
                  <span>{isSaved ? 'Saved' : 'Wishlist'}</span>
                </button>
              </div>
            </div>

            {/* Live Preference Confidence Metric (Section 12 formula calculation) */}
            <div className="flex items-center gap-3 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">
                    Preference Confidence (Sec 12)
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{(preference.totalScore * 100).toFixed(0)}%</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({preference.totalScore >= 0.7 ? 'Strong Fit' : preference.totalScore >= 0.45 ? 'Moderate' : 'Low Interest'})
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono text-right pl-2 border-l border-slate-800">
                <div>Time: {viewingSeconds}s</div>
                <div>Events: {interactionCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Wardrobe & Garment Catalog (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Active Product Details Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-indigo-400 font-semibold tracking-wider">
                  Selected Garment • {selectedProduct.category.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
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
                <div className="text-[10px] text-slate-500">In Stock (3)</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Fabric:</span>
                <span className="text-slate-300 font-medium truncate block">{selectedProduct.fabric}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Color:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-3 h-3 rounded-full border border-slate-700"
                    style={{ backgroundColor: selectedProduct.colorHex }}
                  />
                  <span className="text-slate-300 font-medium">{selectedProduct.color}</span>
                </div>
              </div>
            </div>

            {/* Quick Try-On Button & Cart Action */}
            <div className="mt-4 flex items-center gap-2">
              <button
                id="btn-run-tryon"
                onClick={() => handleGenerateTryOn(selectedProduct)}
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>{isGenerating ? 'Synthesizing Look...' : 'Virtually Try On'}</span>
              </button>

              <button
                id="btn-purchase-intent"
                onClick={() => {
                  setHasPurchased(!hasPurchased);
                  setInteractionCount((c) => c + 1);
                  onLogEvent('PURCHASE_INTENT', { productId: selectedProduct.id });
                }}
                className={`p-2.5 rounded-xl border transition-all ${
                  hasPurchased
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Purchase Intent / Request Size from fitting room attendant"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>
            {hasPurchased && (
              <p className="text-[11px] text-emerald-400 mt-2 text-center font-medium">
                ✓ Size M requested! A fitting room attendant has been notified.
              </p>
            )}
          </div>

          {/* Wardrobe Catalog Carousel / Grid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Store Catalog</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {filteredProducts.length} Items Available
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'jackets', label: 'Jackets & Coats' },
                { id: 'dresses', label: 'Dresses' },
                { id: 'upper_body', label: 'Tops & Shirts' },
                { id: 'full_outfit', label: 'Suits & Outfits' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  id={`cat-filter-${cat.id}`}
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

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredProducts.map((product) => {
                const isSelected = selectedProduct.id === product.id;
                return (
                  <div
                    key={product.id}
                    id={`prod-card-${product.id}`}
                    onClick={() => {
                      setSelectedProduct(product);
                      handleGenerateTryOn(product);
                    }}
                    className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all bg-slate-950 ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2.5">
                      <h5 className="text-xs font-semibold text-slate-200 truncate">
                        {product.name}
                      </h5>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          ${product.price}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">
                          {product.genderCategory}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
