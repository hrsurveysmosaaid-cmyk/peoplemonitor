export type Theme = 'normal' | 'professional' | 'creative';
export type BackgroundType = 'solid' | 'gradient' | 'image';

export interface Gradient {
  angle: number;  // 0-360
  from: string;   // hex or rgb
  to: string;     // hex or rgb
}

export type AppFont =
  | 'Dubai'
  | 'Tajawal'
  | 'Times New Roman'
  | 'Arial'
  | 'Tahoma'
  | 'Sans Serif'
  | 'Calibri';

export interface SiteColors {
  text: string;
  button: string;
  background: string; // used if backgroundType === 'solid'
}

export interface SiteSettings {
  name: string;
  slug: string;
  colors: SiteColors;
  backgroundType: BackgroundType;
  gradient?: Gradient;
  backgroundImage?: string; // object URL or CDN URL
  font: AppFont;
  theme: Theme;
}