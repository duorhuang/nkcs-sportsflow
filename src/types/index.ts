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

export type TokenType = "PLAYER" | "OPPONENT" | "BALL" | "CONE";

export interface TacticToken {
  id: string;
  type: TokenType;
  label: string;
  jerseyNumber?: number;
  position?: string;
  isCaptain?: boolean;
  isRetired?: boolean;
  alumniTier?: AlumniTier | null;
  photoUrl?: string | null;
  x: number;
  y: number;
  dutyZh?: string;
  dutyEn?: string;
}

export type TrajectoryType = "RUN" | "PASS" | "DRIBBLE" | "ZONE";

export interface TacticTrajectory {
  id: string;
  type: TrajectoryType;
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  endX: number;
  endY: number;
  label?: string;
}

export interface TacticPhaseData {
  id?: string;
  phaseIndex: number;
  titleZh?: string | null;
  titleEn?: string | null;
  notesZh?: string | null;
  notesEn?: string | null;
  tokens: TacticToken[];
  trajectories: TacticTrajectory[];
}

export interface TacticCommentData {
  id: string;
  tacticId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: UserSummary;
}

export interface TacticData {
  id: string;
  sport: SportChannel;
  titleZh: string;
  titleEn: string;
  scenario: string;
  courtFormat: string;
  tags: string[];
  descriptionZh?: string | null;
  descriptionEn?: string | null;
  isFeatured: boolean;
  creatorId: string;
  creator: UserSummary;
  phases: TacticPhaseData[];
  comments?: TacticCommentData[];
  createdAt: string;
  updatedAt: string;
}

