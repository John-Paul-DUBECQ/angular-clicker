export interface FeatureColorSettings {
  features: Record<string, string>;
  houseTags: Record<string, string>;
}

export interface FeatureColorOption {
  id: string;
  label: string;
  color: string;
}

export const FEATURE_COLOR_OPTIONS: FeatureColorOption[] = [
  { id: 'mobs', label: 'Mobs / aventure', color: '#c44536' },
  { id: 'luck', label: 'Chance', color: '#3d7eff' },
  { id: 'kitchen', label: 'Cuisine', color: '#8a5a2b' },
  { id: 'garden', label: 'Jardin', color: '#2f8f4e' },
  { id: 'breeding', label: 'Œufs / élevage', color: '#8fd18a' },
  { id: 'shop', label: 'Shop', color: '#3e6fb5' },
  { id: 'lottery', label: 'Loterie', color: '#2ec4d6' },
];

export const HOUSE_TAG_COLOR_OPTIONS: FeatureColorOption[] = [
  { id: 'Combat', label: 'Maisons · Combat', color: '#d24a3a' },
  { id: 'Appâts', label: 'Maisons · Appâts', color: '#e08a2c' },
  { id: 'Vaisseaux', label: 'Maisons · Vaisseaux', color: '#7b61ff' },
  { id: 'Soleil', label: 'Maisons · Soleil', color: '#e2b43a' },
  { id: 'Cuisine', label: 'Maisons · Cuisine', color: '#a56b3c' },
  { id: 'Primes', label: 'Maisons · Primes', color: '#d4b15a' },
];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function defaultFeatureColors(): FeatureColorSettings {
  return {
    features: colorMap(FEATURE_COLOR_OPTIONS),
    houseTags: colorMap(HOUSE_TAG_COLOR_OPTIONS),
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
    houseTags: mergeColorMap(defaults.houseTags, saved?.houseTags),
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
