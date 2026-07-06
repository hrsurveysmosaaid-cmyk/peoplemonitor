export type PersonalDetails = {
  prefix?: 'Mr.' | 'Ms.' | 'Miss' | 'Mis.' | '';
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  residencyStatus?: string; // optional residency/permit status
  nationality?: string; // optional nationality
  birthYear?: string; // YYYY only
  birthMonth?: string; // MM only
  profileImageUrl: string;
  website: string;
  linkedin: string;
    github: string;
  behance: string; // Behance profile link
  availability?: '' | 'open' | 'freelance' | 'consulting'; // availability status
};





export type ExperienceBlock = {
  id: string;
  title: string;
  company: string;
  location?: string; // city / country or specific site for the company
  startDate: string;
  endDate: string;
  description: string;
  attachedAssetUrl?: string;
  successStory?: string;
};

export type EducationBlock = {
  id: string;
  institution: string;
  degree: string;
  location?: string; // city or country where the institution is located
  startDate: string;
  endDate: string;
  description: string;
  attachedAssetUrl?: string; // opaque private:<fileId> reference only
};

export type SkillSet = {
  technical: string;
  interpersonal: string;
  workRelated: string;
};

export type DynamicItem = {
  id: string;
  type: 'project' | 'award' | 'volunteer';
  title: string;
  description: string;
  link: string;
};

export type AppFont =
  | 'Dubai'
  | 'Tajawal'
  | 'Times New Roman'
  | 'Arial'
  | 'Tahoma'
  | 'Sans Serif'
  | 'Calibri';

export type BackgroundType = 'solid' | 'gradient' | 'image';
export type ThemePreset = 'normal' | 'professional';

export type PublishGradient = { angle: number; from: string; to: string };

export type PublishSettings = {
  name: string;
  slug: string;
  colors: { text: string; button: string; background: string };
  backgroundType: BackgroundType;
  gradient?: PublishGradient;
  backgroundImage?: string;
  font: AppFont;
  theme: ThemePreset;
};

export type WorkstationData = {
  personal: PersonalDetails & { lang?: 'en' | 'ar'; publishSettings?: PublishSettings };
  summary: string;
  experiences: ExperienceBlock[];
  education: EducationBlock[];
  skills: SkillSet;
  dynamicItems: DynamicItem[];
};
