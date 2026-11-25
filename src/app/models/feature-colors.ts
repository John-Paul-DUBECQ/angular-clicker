export interface FeatureColorSettings {
  features: Record<string, string>;
}

export interface FeatureColorOption {
  id: string;
  label: string;
  color: string;
}

export const FEATURE_COLOR_OPTIONS: FeatureColorOption[] = [
  { id: 'mobs', label: 'Mobs / aventure', color: '#c44536' },
  { id: 'luck', label: 'Chance', color: '#3d7eff' },
  { id: 'kitchen', label: 'Cuisine', color: '#ff8066' },
  { id: 'garden', label: 'Jardin', color: '#2f8f4e' },
  { id: 'breeding', label: 'Œufs / élevage', color: '#8fd18a' },
  { id: 'shop', label: 'Shop', color: '#3e6fb5' },
  { id: 'lottery', label: 'Loterie', color: '#2ec4d6' },
  { id: 'missions', label: 'Missions', color: '#0081cf' },
  { id: 'traders', label: 'Marchands', color: '#008f7a' },
  { id: 'essences', label: 'Essences', color: '#a6ff00' },
  { id: 'houses', label: 'Maisons', color: '#47e88f' },
];
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function defaultFeatureColors(): FeatureColorSettings {
  return {
    features: colorMap(FEATURE_COLOR_OPTIONS),
  };
}

function colorMap(options: FeatureColorOption[]): Record<string, string> {
  return options.reduce((colors, option) => {
    colors[option.id] = option.color;
    return colors;
  }, {} as Record<string, string>);
}

export function mergeFeatureColors(saved?: Partial<FeatureColorSettings> | null): FeatureColorSettings {
  const defaults = defaultFeatureColors();
  return {
    features: mergeColorMap(defaults.features, saved?.features),
  };
}

function mergeColorMap(defaults: Record<string, string>, saved?: Record<string, string>): Record<string, string> {
  const next = { ...defaults };
  if (!saved) return next;
  Object.entries(saved).forEach(([id, color]) => {
    if (typeof color === 'string' && HEX_COLOR.test(color) && id in defaults) {
      next[id] = color;
    }
  });
  return next;
}
