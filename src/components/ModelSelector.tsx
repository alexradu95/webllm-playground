import React, { useState, useEffect } from 'react';
import { Search, Star, Filter } from 'lucide-react';
import { SystemSpecs } from '../utils/systemSpecs';
import ModelVersionCarousel from './ModelVersionCarousel';
import { MODEL_SIZES, getModelSize, getFavoriteModels, saveFavoriteModels } from '../constants';

interface ModelSelectorFullscreenProps {
  onSelectModel: (model: string) => Promise<void>;
  availableModels: string[];
  systemSpecs: SystemSpecs | null;
  loadingProgress: string;
  isLoading: boolean;
}

const ModelSelectorFullscreen: React.FC<ModelSelectorFullscreenProps> = ({
  onSelectModel,
  availableModels,
  systemSpecs,
  loadingProgress,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModelFamily, setSelectedModelFamily] = useState<string | null>(null);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [selectedFamilyName, setSelectedFamilyName] = useState('');
  const [showOnlySmall, setShowOnlySmall] = useState(false);
  const [favoriteModels, setFavoriteModels] = useState<string[]>([]);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);

  useEffect(() => {
    setFavoriteModels(getFavoriteModels());
  }, []);

  const modelFamilies = [
    { id: 'llama', name: 'Llama', color: 'bg-blue-500' },
    { id: 'gemma', name: 'Gemma', color: 'bg-red-500' },
    { id: 'mistral', name: 'Mistral', color: 'bg-orange-500' },
    { id: 'phi', name: 'Phi', color: 'bg-green-500' },
    { id: 'qwen', name: 'Qwen', color: 'bg-purple-500' },
    { id: 'tinyllama', name: 'TinyLlama', color: 'bg-yellow-500' }
  ];

  const getModelVersions = (familyId: string) => {
    return availableModels
      .filter(model => 
        model.toLowerCase().includes(familyId.toLowerCase()) &&
        (!showOnlySmall || getModelSize(model) === MODEL_SIZES.SMALL)
      )
      .sort((a, b) => {
        // Sort by favorites first
        const aIsFavorite = favoriteModels.includes(a);
        const bIsFavorite = favoriteModels.includes(b);
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return a.localeCompare(b);
      });
  };

  const toggleFavorite = (modelVersion: string) => {
    const newFavorites = favoriteModels.includes(modelVersion)
      ? favoriteModels.filter(m => m !== modelVersion)
      : [...favoriteModels, modelVersion];
    
    setFavoriteModels(newFavorites);
    saveFavoriteModels(newFavorites);
  };

  const FiltersMenu = () => (
    <div className="absolute right-0 top-12 bg-gray-800 rounded-lg shadow-lg p-4 z-50 min-w-[200px]">
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnlySmall}
            onChange={(e) => setShowOnlySmall(e.target.checked)}
            className="rounded bg-gray-700 border-gray-600"
          />
          Show only small models
        </label>
      </div>
    </div>
  );

  const handleModelFamilyClick = (familyId: string, familyName: string) => {
    setSelectedFamilyName(familyName);
    setSelectedVersions(getModelVersions(familyId));
    setIsCarouselOpen(true);
  };
  
  // Also add helper functions for getting family info from model name
  const getFamilyFromModel = (model: string): string => {
    const lowerModel = model.toLowerCase();
    return modelFamilies.find(family => 
      lowerModel.includes(family.id)
    )?.id || '';
  };
  
  const getFamilyNameFromModel = (model: string): string => {
    const lowerModel = model.toLowerCase();
    return modelFamilies.find(family => 
      lowerModel.includes(family.id)
    )?.name || '';
  };
  
  const handleModelSelection = async (version: string) => {
    try {
      await onSelectModel(version);
    } catch (error) {
      console.error('Error loading model:', error);
    }
  };

  // Favorite models section
  const FavoriteModelsSection = () => {
    if (favoriteModels.length === 0) return null;

    return (
      <div className="max-w-6xl mx-auto mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
          Favorites
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteModels.map(model => (
            <button
              key={model}
              onClick={() => handleModelFamilyClick(getFamilyFromModel(model), getFamilyNameFromModel(model))}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors text-left flex items-center justify-between"
              disabled={isLoading}
            >
              <span className="truncate">{model}</span>
              <Star 
                className="w-5 h-5 flex-shrink-0 fill-yellow-500 text-yellow-500"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(model);
                }}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 p-8">
      {/* Header with search and filters */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 rounded-lg pl-12 pr-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
            {showFiltersMenu && <FiltersMenu />}
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      <FavoriteModelsSection />

      {/* Rest of the component remains the same... */}
      {/* Just add a Star button to each model card in the grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modelFamilies
          .filter(family => {
            const versions = getModelVersions(family.id);
            return versions.length > 0 && 
                   (searchTerm === '' || 
                    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    versions.some(v => v.toLowerCase().includes(searchTerm.toLowerCase())));
          })
          .map(family => {
            const versions = getModelVersions(family.id);
            return (
              <button
                key={family.id}
                onClick={() => handleModelFamilyClick(family.id, family.name)}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 ${family.color} rounded-lg mb-4 flex items-center justify-center`}>
                    <span className="text-2xl">{family.name[0]}</span>
                  </div>
                  {versions.some(v => favoriteModels.includes(v)) && (
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  )}
                </div>
                <h3 className="text-xl font-medium mb-2">{family.name}</h3>
                <p className="text-gray-400">{versions.length} versions available</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {versions.slice(0, 2).map((version, index) => (
                    <span key={index} className="text-xs text-gray-500 truncate">
                      {version.split('-').slice(-2).join('-')}
                    </span>
                  ))}
                  {versions.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{versions.length - 2} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
      </div>

      {/* Model Version Carousel */}
      {isCarouselOpen && (
        <ModelVersionCarousel
          isOpen={isCarouselOpen}
          onClose={() => !isLoading && setIsCarouselOpen(false)}
          versions={selectedVersions}
          onSelect={handleModelSelection}
          modelFamily={selectedFamilyName}
          isLoading={isLoading}
          loadingProgress={loadingProgress}
          favoriteModels={favoriteModels}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
};

export default ModelSelectorFullscreen;