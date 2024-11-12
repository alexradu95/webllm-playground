import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { SystemSpecs } from '../utils/systemSpecs';
import ModelVersionCarousel from './ModelVersionCarousel';

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

  const modelFamilies = [
    { id: 'llama', name: 'Llama', color: 'bg-blue-500' },
    { id: 'gemma', name: 'Gemma', color: 'bg-red-500' },
    { id: 'mistral', name: 'Mistral', color: 'bg-orange-500' },
    { id: 'phi', name: 'Phi', color: 'bg-green-500' },
    { id: 'qwen', name: 'Qwen', color: 'bg-purple-500' },
    { id: 'tinyllama', name: 'TinyLlama', color: 'bg-yellow-500' }
  ];

  const getModelVersions = (familyId: string) => {
    return availableModels.filter(model => 
      model.toLowerCase().includes(familyId.toLowerCase())
    ).sort((a, b) => a.localeCompare(b));
  };

  const handleModelFamilyClick = (familyId: string, familyName: string) => {
    setSelectedFamilyName(familyName);
    setSelectedVersions(getModelVersions(familyId));
    setIsCarouselOpen(true);
  };

  const handleModelSelection = async (version: string) => {
    try {
      await onSelectModel(version);
    } catch (error) {
      console.error('Error loading model:', error);
    }
  };

  useEffect(() => {
    if (!isLoading && isCarouselOpen) {
      setIsCarouselOpen(false);
    }
  }, [isLoading]);

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">WebLLM Playground</h1>
        <p className="text-gray-400 text-lg">Select a model to get started with local AI inference</p>
      </div>

      {/* System Specs */}
      {systemSpecs && (
        <div className="max-w-6xl mx-auto mb-8 p-4 bg-gray-800 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400">GPU</p>
              <p className="font-medium">{systemSpecs.gpu.name || 'Not detected'}</p>
              {systemSpecs.gpu.isWebGPUEnabled && (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">WebGPU enabled</span>
              )}
            </div>
            <div>
              <p className="text-gray-400">Memory</p>
              <p className="font-medium">{Math.round(systemSpecs.memory.totalMB / 1024)}GB</p>
            </div>
            <div>
              <p className="text-gray-400">CPU Cores</p>
              <p className="font-medium">{systemSpecs.cpu.cores}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 rounded-lg pl-12 pr-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Model Grid */}
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
                <div className={`w-12 h-12 ${family.color} rounded-lg mb-4 flex items-center justify-center`}>
                  <span className="text-2xl">{family.name[0]}</span>
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
        />
      )}
    </div>
  );
};

export default ModelSelectorFullscreen;