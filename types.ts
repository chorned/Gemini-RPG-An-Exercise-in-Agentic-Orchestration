


export type Stat = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export type Stats = {
  [key in Stat]: number;
};

export interface Character {
  name: string;
  gender: string;
  race: string;
  class: string;
  weapon: string;
  description: string;
  stats: Stats;
}

export type NarrativeBeat = 'CHARACTER_CREATION' | 'HOOK' | 'CONFLICT' | 'RESOLUTION' | 'EPILOGUE';

export interface GameState {
  character: Character;
  artStyle: string;
  inventory: string[];
  storyLog: string[];
  currentBeat: NarrativeBeat;
  visualLore: string;
}

export interface DiceCheck {
    stat: Stat;
    dc: number;
}

export interface DMOption {
    text: string;
    action_id: string;
    check: DiceCheck | null;
}

export interface DMResponse {
    scene_description: string;
    options: DMOption[];
    beat_complete: boolean;
    player_dead: boolean;
    required_check?: DiceCheck;
    visual_lore_updates: string[];
}

export interface Action {
    actionId: string;
    customAction?: string;
}

export type DiceCheckResult = 'success' | 'fail';

export type AppView = 'password' | 'character_creation' | 'game';

export interface CharacterCreationPayload {
    scene: string;
    style_options: string[];
    stat_array: number[];
    races: string[];
    classes: string[];
    weapons: string[];
}

export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface SafetyRating {
  category?: string;
  probability?: string;
}

export interface ApiMetadata {
  usageMetadata?: UsageMetadata;
  finishReason?: string;
  safetyRatings?: SafetyRating[];
  originalPrompt: string;
}