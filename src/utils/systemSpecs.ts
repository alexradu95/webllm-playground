// src/utils/systemSpecs.ts

export interface SystemSpecs {
    gpu: {
      name: string | null;
      memoryMB: number | null;
      isWebGPUEnabled: boolean;
    };
    cpu: {
      cores: number;
      hardwareConcurrency: number;
    };
    memory: {
      totalMB: number;
    };
  }
  
  export interface ModelRequirements {
    minMemoryMB: number;
    recommendedMemoryMB: number;
    preferredDevice: 'GPU' | 'CPU';
    minGPUMemoryMB?: number;
  }
  
  export const ModelTiers = {
    LITE: 'lite',
    STANDARD: 'standard',
    PERFORMANCE: 'performance'
  } as const;
  
  export type ModelTier = typeof ModelTiers[keyof typeof ModelTiers];
  
  interface ParsedModelInfo {
    baseModel: string;
    parameterCount: number;
    quantization: string | null;
    isInstruct: boolean;
    isChat: boolean;
  }
  
  const BYTES_PER_PARAMETER = {
    'default': 4,
    'q8': 1,
    'q6': 0.75,
    'q5': 0.625,
    'q4': 0.5,
    'q3': 0.375,
    'q2': 0.25
  } as const;
  
  // Make sure we export getGPUInfo
  export const getGPUInfo = async (): Promise<{ name: string | null; memoryMB: number | null; isWebGPUEnabled: boolean }> => {
    // @ts-expect-error - navigator.gpu is not yet in TypeScript's lib
    const isWebGPUEnabled = !!navigator.gpu;
    
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        return { name: null, memoryMB: null, isWebGPUEnabled };
      }
  
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return { name: null, memoryMB: null, isWebGPUEnabled };
      }
  
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // Estimate GPU memory based on device pixel ratio and screen size
      const pixelRatio = window.devicePixelRatio || 1;
      const screenPixels = window.screen.width * window.screen.height * pixelRatio;
      const estimatedMemoryMB = Math.round((screenPixels * 4) / (1024 * 1024)) * 2;
  
      return {
        name: renderer,
        memoryMB: estimatedMemoryMB,
        isWebGPUEnabled
      };
    } catch (error) {
      console.error('Error getting GPU info:', error);
      return { name: null, memoryMB: null, isWebGPUEnabled };
    }
  };
  
  // Make sure we export getSystemMemory
  export const getSystemMemory = (): number => {
    // @ts-expect-error - navigator.deviceMemory is not yet in TypeScript's lib
    const deviceMemory = navigator.deviceMemory;
    if (deviceMemory) {
      return deviceMemory * 1024; // Convert GB to MB
    }
    return 8 * 1024; // Default assumption: 8GB
  };
  
  // Export the getSystemSpecs function
  export const getSystemSpecs = async (): Promise<SystemSpecs> => {
    const gpu = await getGPUInfo();
    
    return {
      gpu,
      cpu: {
        cores: navigator.hardwareConcurrency || 4,
        hardwareConcurrency: navigator.hardwareConcurrency || 4
      },
      memory: {
        totalMB: getSystemMemory()
      }
    };
  };
  
  const parseModelName = (modelName: string): ParsedModelInfo => {
    const name = modelName.toLowerCase();
    
    const result: ParsedModelInfo = {
      baseModel: '',
      parameterCount: 0,
      quantization: null,
      isInstruct: name.includes('instruct'),
      isChat: name.includes('chat')
    };
  
    const baseModelMatches = {
      'llama': /llama[- ]?(\d+(?:\.\d+)?)/i,
      'mistral': /mistral[- ]?(\d+(?:\.\d+)?)/i,
      'phi': /phi[- ]?(\d+(?:\.\d+)?)?/i,
      'gemma': /gemma[- ]?(\d+(?:\.\d+)?)/i,
      'tinyllama': /tinyllama[- ]?(\d+(?:\.\d+)?)?/i,
      'qwen': /qwen[- ]?(\d+(?:\.\d+)?)?/i,
      'hermes': /hermes[- ]?(\d+(?:\.\d+)?)?/i
    };
  
    for (const [model, regex] of Object.entries(baseModelMatches)) {
      const match = name.match(regex);
      if (match) {
        result.baseModel = model;
        result.parameterCount = match[1] ? parseFloat(match[1]) : 
          model === 'phi' ? 2.7 :
          model === 'tinyllama' ? 1.1 :
          7;
        break;
      }
    }
  
    const quantMatches = name.match(/q(\d+)(?:_|\b|(?=[A-Z]))/i);
    if (quantMatches) {
      result.quantization = `q${quantMatches[1]}`;
    } else if (name.includes('8bit')) {
      result.quantization = 'q8';
    } else if (name.includes('4bit')) {
      result.quantization = 'q4';
    }
  
    return result;
  };
  
  const calculateModelRequirements = (modelInfo: ParsedModelInfo): ModelRequirements => {
    const { parameterCount, quantization } = modelInfo;
    
    const bytesPerParam = BYTES_PER_PARAMETER[quantization ?? 'default'];
    const baseMemoryMB = Math.ceil((parameterCount * 1024 * bytesPerParam));
    
    const overheadMultiplier = modelInfo.isInstruct || modelInfo.isChat ? 1.5 : 1.2;
    const totalMemoryMB = Math.ceil(baseMemoryMB * overheadMultiplier);
  
    const preferGPU = parameterCount >= 2 || modelInfo.isChat || modelInfo.isInstruct;
  
    return {
      minMemoryMB: totalMemoryMB,
      recommendedMemoryMB: Math.ceil(totalMemoryMB * 1.5),
      preferredDevice: preferGPU ? 'GPU' : 'CPU',
      minGPUMemoryMB: preferGPU ? totalMemoryMB : undefined
    };
  };
  
  export const getModelTier = (model: string, specs: SystemSpecs): ModelTier => {
    const modelInfo = parseModelName(model);
    const requirements = calculateModelRequirements(modelInfo);
    
    const { gpu, memory } = specs;
    
    const memoryBuffer = 2048;
    const availableMemory = memory.totalMB - memoryBuffer;
  
    const hasAdequateGPU = requirements.preferredDevice === 'GPU' ? (
      gpu.isWebGPUEnabled && 
      (!requirements.minGPUMemoryMB || (gpu.memoryMB && gpu.memoryMB >= requirements.minGPUMemoryMB))
    ) : true;
  
    if (
      hasAdequateGPU &&
      availableMemory >= requirements.recommendedMemoryMB
    ) {
      return ModelTiers.PERFORMANCE;
    }
  
    if (
      hasAdequateGPU &&
      availableMemory >= requirements.minMemoryMB
    ) {
      return ModelTiers.STANDARD;
    }
  
    if (
      modelInfo.parameterCount <= 3 &&
      modelInfo.quantization &&
      availableMemory >= requirements.minMemoryMB &&
      specs.cpu.cores >= 8
    ) {
      return ModelTiers.STANDARD;
    }
  
    return ModelTiers.LITE;
  };
  
  export const getModelCompatibilityBadge = (tier: ModelTier): {
    label: string;
    color: string;
    description: string;
  } => {
    switch (tier) {
      case ModelTiers.PERFORMANCE:
        return {
          label: 'Optimal',
          color: 'bg-green-500',
          description: 'Recommended for your system'
        };
      case ModelTiers.STANDARD:
        return {
          label: 'Compatible',
          color: 'bg-yellow-500',
          description: 'Meets minimum requirements'
        };
      case ModelTiers.LITE:
        return {
          label: 'Limited',
          color: 'bg-red-500',
          description: 'May experience performance issues'
        };
    }
  };
  
  // Export helper function for debugging
  export const debugModelInfo = (modelName: string): string => {
    const info = parseModelName(modelName);
    const reqs = calculateModelRequirements(info);
    return `
  Model: ${modelName}
  Base: ${info.baseModel}
  Parameters: ${info.parameterCount}B
  Quantization: ${info.quantization || 'none'}
  Type: ${info.isInstruct ? 'Instruct' : ''}${info.isChat ? 'Chat' : ''}${(!info.isInstruct && !info.isChat) ? 'Base' : ''}
  Min Memory: ${(reqs.minMemoryMB / 1024).toFixed(1)}GB
  Recommended: ${(reqs.recommendedMemoryMB / 1024).toFixed(1)}GB
  Preferred: ${reqs.preferredDevice}
  `;
  };