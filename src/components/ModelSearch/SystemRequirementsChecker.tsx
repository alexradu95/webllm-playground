// src/components/SystemRequirementsChecker.tsx

import React from 'react';
import { SystemSpecs, ModelRequirements, getModelTier, getModelCompatibilityBadge } from '../utils/systemSpecs';

interface SystemRequirementsCheckerProps {
  systemSpecs: SystemSpecs;
  modelRequirements: ModelRequirements;
  onProceed: () => void;
  onCancel: () => void;
}

const SystemRequirementsChecker: React.FC<SystemRequirementsCheckerProps> = ({
  systemSpecs,
  modelRequirements,
  onProceed,
  onCancel,
}) => {
  const modelTier = getModelTier('default', systemSpecs);
  const compatibilityBadge = getModelCompatibilityBadge(modelTier);

  const renderSpec = (label: string, value: string | number, requirement: string | number) => {
    const isMet = typeof value === 'number' && typeof requirement === 'number' 
      ? value >= requirement 
      : true;

    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-gray-400">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="text-gray-300">{value}</span>
          <span className="text-gray-500">›</span>
          <span className={isMet ? 'text-green-500' : 'text-red-500'}>
            {requirement}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-200">System Requirements Check</h3>
        <span 
          className={`px-2 py-1 ${compatibilityBadge.color} text-white text-xs rounded-full`}
        >
          {compatibilityBadge.label}
        </span>
      </div>

      <div className="space-y-1">
        {renderSpec(
          'System Memory',
          `${Math.round(systemSpecs.memory.totalMB / 1024)}GB`,
          `${Math.round(modelRequirements.minMemoryMB / 1024)}GB`
        )}
        
        {renderSpec(
          'CPU Cores',
          systemSpecs.cpu.cores,
          4
        )}
        
        {modelRequirements.preferredDevice === 'GPU' && (
          <>
            {renderSpec(
              'WebGPU Support',
              systemSpecs.gpu.isWebGPUEnabled ? 'Yes' : 'No',
              'Required'
            )}
            
            {modelRequirements.minGPUMemoryMB && renderSpec(
              'GPU Memory',
              systemSpecs.gpu.memoryMB ? `${Math.round(systemSpecs.gpu.memoryMB / 1024)}GB` : 'Unknown',
              `${Math.round(modelRequirements.minGPUMemoryMB / 1024)}GB`
            )}
          </>
        )}
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onProceed}
          className={`px-4 py-2 rounded-md text-white ${
            modelTier === 'lite' 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {modelTier === 'lite' ? 'Proceed Anyway' : 'Load Model'}
        </button>
      </div>

      {modelTier === 'lite' && (
        <p className="mt-4 text-sm text-red-400">
          Warning: Your system does not meet the recommended requirements. 
          The model may run slowly or experience issues.
        </p>
      )}
    </div>
  );
};

export default SystemRequirementsChecker;