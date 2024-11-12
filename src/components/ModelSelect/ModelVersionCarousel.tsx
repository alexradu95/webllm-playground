import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, AlertCircle, Loader2, Star } from 'lucide-react';
import { SystemSpecs, getModelTier, getModelCompatibilityBadge } from '../../utils/systemSpecs';

interface ModelVersionCarouselProps {
  isOpen: boolean;
  onClose: () => void;
  versions: string[];
  onSelect: (version: string) => void;
  modelFamily: string;
  loadingProgress: string;
  isLoading: boolean;
  favoriteModels: string[];
  onToggleFavorite: (model: string) => void;
  systemSpecs: SystemSpecs | null;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  modelName: string;
  isLoading: boolean;
  loadingProgress: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  modelName,
  isLoading,
  loadingProgress
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 relative">
        {!isLoading ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-semibold text-white">Load Model</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to load {modelName}? This may take a few moments.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Load Model
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Loading Model</h3>
            <p className="text-gray-400 mb-4">{loadingProgress || 'Initializing...'}</p>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-full w-full animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ModelCard: React.FC<{
  version: string;
  onSelect: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  isActive: boolean;
  systemSpecs: SystemSpecs | null;
}> = ({ version, onSelect, isFavorite, onToggleFavorite, isActive, systemSpecs }) => {
  const modelTier = systemSpecs ? getModelTier(version, systemSpecs) : null;
  const badge = modelTier ? getModelCompatibilityBadge(modelTier) : null;

  const getQuantizationInfo = (version: string) => {
    const match = version.match(/q[2-8]|8bit|4bit/i);
    return match ? match[0].toUpperCase() : 'FP16';
  };

  const getModelSize = (version: string) => {
    const match = version.match(/\d+B/i);
    return match ? match[0] : '';
  };

  return (
    <div
      className={`relative bg-gray-800 rounded-lg p-4 transition-all duration-200 ${
        isActive ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-wrap gap-2">
          <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
            {getQuantizationInfo(version)}
          </span>
          {getModelSize(version) && (
            <span className="inline-block px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
              {getModelSize(version)}
            </span>
          )}
          {badge && (
            <span 
              className={`inline-block px-2 py-1 ${badge.color} text-white text-xs rounded-full`}
              title={badge.description}
            >
              {badge.label}
            </span>
          )}
        </div>
        <button
          onClick={onToggleFavorite}
          className="p-1 rounded-full hover:bg-gray-700 transition-colors"
        >
          <Star
            className={`w-5 h-5 ${
              isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>
      <h3 className="text-sm font-medium text-white mb-3 line-clamp-2">{version}</h3>
      <button
        onClick={onSelect}
        className="w-full mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
      >
        Select Model
      </button>
    </div>
  );
};

const ModelVersionCarousel: React.FC<ModelVersionCarouselProps> = ({
  isOpen,
  onClose,
  versions,
  onSelect,
  modelFamily,
  loadingProgress,
  isLoading,
  favoriteModels,
  onToggleFavorite,
  systemSpecs,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const ITEMS_PER_PAGE = 20; // 4x5 grid
  const TOTAL_PAGES = Math.ceil(versions.length / ITEMS_PER_PAGE);

  // Sort versions to show favorites first
  const sortedVersions = [...versions].sort((a, b) => {
    const aIsFavorite = favoriteModels.includes(a);
    const bIsFavorite = favoriteModels.includes(b);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return a.localeCompare(b);
  });

  const startIdx = currentPage * ITEMS_PER_PAGE;
  const visibleVersions = sortedVersions.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handlePrevious = () => {
    setCurrentPage((prev) => (prev === 0 ? TOTAL_PAGES - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev === TOTAL_PAGES - 1 ? 0 : prev + 1));
  };

  const handleModelClick = (version: string) => {
    setSelectedModel(version);
    setIsConfirmationOpen(true);
  };

  const handleConfirmLoad = async () => {
    if (!selectedModel) return;
    onSelect(selectedModel);
  };

  useEffect(() => {
    if (!isLoading && selectedModel) {
      setIsConfirmationOpen(false);
      setSelectedModel(null);
    }
  }, [isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-7xl p-6 relative max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{modelFamily} Versions</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {TOTAL_PAGES > 1 && (
            <>
              <button
                onClick={handlePrevious}
                disabled={isLoading}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-gray-800 rounded-full p-2 text-gray-400 hover:text-white transition-colors z-10 disabled:opacity-50"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-gray-800 rounded-full p-2 text-gray-400 hover:text-white transition-colors z-10 disabled:opacity-50"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="grid grid-cols-4 gap-4 px-8 overflow-y-auto max-h-[calc(90vh-12rem)]">
            {visibleVersions.map((version) => (
              <ModelCard
                key={version}
                version={version}
                onSelect={() => handleModelClick(version)}
                isFavorite={favoriteModels.includes(version)}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(version);
                }}
                isActive={selectedModel === version}
                systemSpecs={systemSpecs}
              />
            ))}
          </div>
        </div>

        {TOTAL_PAGES > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                disabled={isLoading}
                className={`w-2 h-2 rounded-full transition-colors disabled:opacity-50 ${
                  index === currentPage ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => !isLoading && setIsConfirmationOpen(false)}
        onConfirm={handleConfirmLoad}
        modelName={selectedModel || ''}
        isLoading={isLoading}
        loadingProgress={loadingProgress}
      />
    </div>
  );
};

export default ModelVersionCarousel;