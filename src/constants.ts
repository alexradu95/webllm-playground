// constants.ts
export const MODEL_SIZES = {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large'
  } as const;
  
  export const getModelSize = (modelName: string): typeof MODEL_SIZES[keyof typeof MODEL_SIZES] => {
    const name = modelName.toLowerCase();
    
    // Check for explicit size indicators
    if (name.includes('1.1b') || name.includes('1.5b') || name.includes('2b') || 
        name.includes('3b') || name.includes('tiny') || name.includes('small')) {
      return MODEL_SIZES.SMALL;
    }
    
    if (name.includes('7b') || name.includes('8b')) {
      return MODEL_SIZES.MEDIUM;
    }
    
    return MODEL_SIZES.LARGE;
  };
  
  export const FAVORITES_KEY = 'webllm-favorite-models';
  
  export const getFavoriteModels = (): string[] => {
    try {
      const favorites = localStorage.getItem(FAVORITES_KEY);
      return favorites ? JSON.parse(favorites) : [];
    } catch {
      return [];
    }
  };
  
  export const saveFavoriteModels = (models: string[]) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(models));
  };