import React from 'react';
import { SystemSpecs, getModelTier, getModelCompatibilityBadge } from '../../utils/systemSpecs';
import { Cpu, CupSoda, MonitorSmartphone } from 'lucide-react';

interface SystemSpecsIndicatorProps {
  specs: SystemSpecs;
  selectedModel: string;
}

const SystemSpecsIndicator: React.FC<SystemSpecsIndicatorProps> = ({ specs, selectedModel }) => {
  const tier = getModelTier(selectedModel, specs);
  const badge = getModelCompatibilityBadge(tier);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${badge.color}`} />
        <span className="text-sm font-medium">{badge.label}</span>
        <span className="text-xs text-gray-400">{badge.description}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="w-4 h-4" />
          <span className="text-xs">
            {specs.gpu.name || 'GPU Not Detected'}
            {specs.gpu.memoryMB && ` (${Math.round(specs.gpu.memoryMB / 1024)}GB)`}
            {specs.gpu.isWebGPUEnabled && ' ✓ WebGPU'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span className="text-xs">
            {specs.cpu.cores} Cores 
            {specs.cpu.hardwareConcurrency > 0 && ` (${specs.cpu.hardwareConcurrency} Threads)`}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <CupSoda className="w-4 h-4" />
          <span className="text-xs">{Math.round(specs.memory.totalMB / 1024)}GB RAM</span>
        </div>
      </div>
    </div>
  );
};

export default SystemSpecsIndicator;