export interface RawNote {
  time: string;   // "HH:mm" 格式
  text: string;   // 口述原始文本
}

export interface Generation {
  gen_at: string;        // ISO 8601 时间戳
  content: string;       // AI 生成的日记正文
  summary: string;       // 一句话摘要（8字内）
  raw_snapshot: RawNote[]; // 生成时 raw_notes 的快照
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  date: string;           // "YYYY-MM-DD" 格式
  raw_notes: RawNote[];
  generations: Generation[];
  pinned_gen_idx: number | null;
  created_at: string;
  updated_at: string;
}
