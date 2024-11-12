// src/components/ModelSearch/ModelRequirementsTooltip.tsx

import React from 'react';
import { ModelRequirements } from '../../utils/systemSpecs';

interface ModelRequirementsTooltipProps {
  requirements: ModelRequirements;
  isVisible: boolean;
  position: { x: number; y: number };
}

const ModelRequirementsTooltip: React.FC<ModelRequirementsTooltipProps> = ({
  requirements,
  isVisible,
  position,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="absolute z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg max-w-xs"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="space-y-2 text-sm">
        <h4 className="font-medium text-gray-200">System Requirements</h4>
        
        <div className="space-y-1 text-gray-400">
          <div className="flex justify-between">
            <span>Minimum Memory:</span>
            <span className="text-gray-300">{requirements.minMemoryMB / 1024}GB</span>
          </div>
          
          <div className="flex justify-between">
            <span>Recommended Memory:</span>
            <span className="text-gray-300">{requirements.recommendedMemoryMB / 1024}GB</span>
          </div>
          
          <div className="flex justify-between">
            <span>Preferred Device:</span>
            <span className="text-gray-300">{requirements.preferredDevice}</span>
          </div>
          
          {requirements.minGPUMemoryMB && (
            <div className="flex justify-between">
              <span>Minimum GPU Memory:</span>
              <span className="text-gray-300">{requirements.minGPUMemoryMB / 1024}GB</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelRequirementsTooltip;