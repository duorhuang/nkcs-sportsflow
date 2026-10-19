export type SportChannel = "FOOTBALL" | "VOLLEYBALL" | "BASKETBALL";

export type Role = "ADMIN" | "COACH" | "PLAYER";

export type AlumniTier = "HALL_OF_FAME" | "ALUMNI_REGULAR";

export type CardTier = "BRONZE" | "SILVER" | "GOLD" | "ICON";

export type DrillCategory =
  | "WARMUP"
  | "TACTICAL"
  | "TECHNICAL"
  | "CONDITIONING"
  | "COOLDOWN";

export interface UserSummary {
  id: string;
  username: string;
  role: Role;
  nameEn: string;
  nameZh: string;
  avatarUrl?: string | null;
}

export interface PlayerProfileData {
  id: string;
  userId: string;
  sport: SportChannel;
  jerseyNumber: number;
  primaryPosition: string;
  secondaryPositions?: string[] | null;
  positionGroup?: string | null;
  honors?: string | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isRetired: boolean;
  alumniTier?: AlumniTier | null;
  graduationYear?: number | null;
  xpPoints: number;
  cardTier: CardTier;
  photoUrl?: string | null;
  user: UserSummary;
}

export interface TrainingDrillItem {
  id: string;
  sport: SportChannel;
  planId?: string | null;
  titleEn: string;
  titleZh: string;
  category: DrillCategory;
  durationMins?: number | null;
  setsAndReps?: string | null;
  pitchSpecs?: string | null;
  playerCount?: string | null;
  coachingCuesEn?: string | null;
  coachingCuesZh?: string | null;
  diagramUrl?: string | null;
  videoUrl?: string | null;
  sortOrder: number;
}

export interface TrainingPlanData {
  id: string;
  sport: SportChannel;
  trainingDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  titleEn: string;
  titleZh: string;
  contentEn: string;
  contentZh: string;
  tags?: string | null;
  drills: TrainingDrillItem[];
}
