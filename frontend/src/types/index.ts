export interface IQuestion {
  id: number;
  type: string; // 'AUDIO_AB', 'AUDIO_SD', 'AUDIO_MUSHRA', 'AGREEMENT', 'FORM', 'TEXT', 'COMMENT', etc.
  title?: string;
  content?: string;
  options?: string;
  metricGroup?: string;
  audioUrlA?: string;
  audioUrlB?: string;
  audioUrlC?: string;
  audioUrlD?: string;
  audioUrlE?: string;
  order: number;
  isRandomized?: boolean;
  uploadedFiles?: string[];
}

export interface IMetric {
  id: number;
  type: string; // 'basic', 'scale_5', 'scale_7_uni', 'semantic_diff', 'semantic_pair', 'mushra_group', 'text'
  title?: string;
  leftLabel?: string;
  centerLabel?: string;
  rightLabel?: string;
  points?: number;
  group?: string;
  order: number;
  payload?: string; // Used for semantic_pair or mushra_group JSON arrays
}

export interface IResponse {
  id: number;
  sessionId: string;
  questionId: number;
  choice: string;
  createdAt: string;
}
