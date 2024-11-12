// src/components/ModelSearch/ModelSearch.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Cpu } from 'lucide-react';
import SearchInput from './SearchInput';
import FamilyFilter from './FamilyFilter';
import ModelList from './ModelList';
import ModelRow from './ModelRow';
import { modelDetailsList } from '../../utils/llm';
import { SystemSpecs, getSystemSpecs, getModelTier, ModelTier } from '../../utils/systemSpecs';

export interface ModelSearchProps {
  isOpen: boolean;
  onClose: () => void;
  availableModels: string[];
  onSelectModel: (model: string) => void;
}

const modelFamilies: { [key: string]: { name: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> } } = {};

for (const modelDetail of modelDetailsList) {
  modelFamilies[modelDetail.name] = {
    name: modelDetail.name.charAt(0).toUpperCase() + modelDetail.name.slice(1),
    icon: modelDetail.icon
  };
}

const ModelSearch: React.FC<ModelSearchProps> = ({
  isOpen,
  onClose,
  availableModels,
  onSelectModel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModels, setFilteredModels] = useState<[string, string[]][]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [systemSpecs, setSystemSpecs] = useState<SystemSpecs | null>(null);
  const [modelTiers, setModelTiers] = useState<Record<string, ModelTier>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const determineModelIcon = useCallback((model: string) => {
    const modelDetail = modelDetailsList.find(md => model.toLowerCase().includes(md.name));
    return modelDetail ? <modelDetail.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                     : <Cpu className="w-5 h-5 text-gray-400 flex-shrink-0" />;
  }, []);

  const identifyModelFamily = useCallback((model: string): string | null => {
    return modelDetailsList.find(md => model.toLowerCase().includes(md.name))?.name || null;
  }, []);

  const extractModelDetails = useCallback((model: string) => {
    const parts = model.split('-');
    const displayName: string[] = [];
    const quantBadges: string[] = [];
    let isBadge = false;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (isBadge || part.startsWith('q') || part.startsWith('b')) {
        isBadge = true;
        if (part !== 'MLC') {
          quantBadges.push(part);
        }
      } else {
        displayName.push(part);
      }
    }

    return {
      displayName: displayName.join(' '),
      quantBadge: quantBadges.length > 0 ? quantBadges.join('-') : null,
    };
  }, []);

  const sortAndGroupModels = useCallback((models: string[]): [string, string[]][] => {
    const groupedModels: { [key: string]: string[] } = {};

    for (const model of models) {
      const { displayName } = extractModelDetails(model);
      const family = identifyModelFamily(model);

      if (family) {
        if (!groupedModels[displayName]) {
          groupedModels[displayName] = [];
        }
        groupedModels[displayName].push(model);
      }
    }

    for (const key in groupedModels) {
      groupedModels[key].sort((a, b) => a.localeCompare(b));
    }

    return Object.entries(groupedModels).sort(([, aVariants], [, bVariants]) => {
      const familyA = identifyModelFamily(aVariants[0]) || '';
      const familyB = identifyModelFamily(bVariants[0]) || '';
      return familyA.localeCompare(familyB);
    });
  }, [extractModelDetails, identifyModelFamily]);

  const handleToggleExpand = useCallback((modelName: string) => {
    setExpandedModels(prev => {
      const updatedSet = new Set(prev);
      if (updatedSet.has(modelName)) {
        updatedSet.delete(modelName);
      } else {
        updatedSet.add(modelName);
      }
      return updatedSet;
    });
  }, []);

  const handleToggleFamilyFilter = useCallback((family: string) => {
    setSelectedFamilies(prev =>
      prev.includes(family)
        ? prev.filter(f => f !== family)
        : [...prev, family]
    );
  }, []);

  // Fetch system specs when component mounts
  useEffect(() => {
    if (isOpen) {
      const fetchSpecs = async () => {
        const specs = await getSystemSpecs();
        setSystemSpecs(specs);
        
        // Calculate tiers for all models
        const tiers: Record<string, ModelTier> = {};
        availableModels.forEach(model => {
          tiers[model] = getModelTier(model, specs);
        });
        setModelTiers(tiers);
      };

      fetchSpecs();
    }
  }, [isOpen, availableModels]);

  useEffect(() => {
    const sortedModels = sortAndGroupModels(availableModels);

    let filtered = sortedModels;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = sortedModels.filter(([baseModel, variants]) =>
        baseModel.toLowerCase().includes(lowerSearchTerm) ||
        variants.some(v => v.toLowerCase().includes(lowerSearchTerm))
      );
    }

    if (selectedFamilies.length > 0) {
      filtered = filtered.filter(([, variants]) => {
        const family = identifyModelFamily(variants[0]);
        return family && selectedFamilies.includes(family);
      });
    }

    setFilteredModels(filtered);
  }, [searchTerm, availableModels, selectedFamilies, sortAndGroupModels, identifyModelFamily]);

  const getModelTierForBaseModel = useCallback((variants: string[]): ModelTier => {
    if (!systemSpecs) return 'standard';
    
    return variants.reduce((highestTier, variant) => {
      const variantTier = modelTiers[variant] || 'standard';
      const tierValues = { lite: 0, standard: 1, performance: 2 };
      return tierValues[variantTier] > tierValues[highestTier] ? variantTier : highestTier;
    }, 'lite' as ModelTier);
  }, [systemSpecs, modelTiers]);

  if (!isOpen) return null;

  const modelCounts = availableModels.reduce((counts: Record<string, number>, model) => {
    const family = identifyModelFamily(model);
    if (family) {
      counts[family] = (counts[family] || 0) + 1;
    }
    return counts;
  }, {});

  const sortedModelFamilies = Object.entries(modelFamilies)
    .sort(([a], [b]) => (modelCounts[b] || 0) - (modelCounts[a] || 0));

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden"
      onClick={handleOverlayClick}
    >
      <div className="bg-[var(--bg-color)] rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-semibold text-gray-100">Select Model</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {systemSpecs && (
          <div className="px-4 py-2 border-b border-[var(--border-color)] text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span>
                GPU: {systemSpecs.gpu.name || 'Unknown'} 
                {systemSpecs.gpu.isWebGPUEnabled && ' (WebGPU enabled)'}
              </span>
              <span>Memory: {Math.round(systemSpecs.memory.totalMB / 1024)}GB</span>
              <span>CPU Cores: {systemSpecs.cpu.cores}</span>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-[var(--border-color)]">
          <SearchInput 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            inputRef={searchInputRef}
          />
          <FamilyFilter
            sortedModelFamilies={sortedModelFamilies}
            selectedFamilies={selectedFamilies}
            onToggleFamilyFilter={handleToggleFamilyFilter}
          />
        </div>

        <ModelList
          filteredModels={filteredModels}
          renderModelRow={(model) => (
            <ModelRow
              key={model[0]}
              baseModel={model[0]}
              variants={model[1]}
              isExpanded={expandedModels.has(model[0])}
              hasSingleVariant={model[1].length === 1}
              determineModelIcon={determineModelIcon}
              extractModelDetails={extractModelDetails}
              onSelectModel={onSelectModel}
              onClose={onClose}
              handleToggleExpand={handleToggleExpand}
              modelTier={getModelTierForBaseModel(model[1])}
            />
          )}
        />

        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-color)]">
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-400">Performance Tiers:</span>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                Optimal
              </span>
              <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded-full">
                Compatible
              </span>
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                Limited
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSearch;