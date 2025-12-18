export enum UserRole {
  STUDENT = 'STUDENT',   // 書籍購入者・一般
  ADVANCED = 'ADVANCED', // Note購入者・上級者
  ADMIN = 'ADMIN'        // 管理者
}

export type JobTitle = '医師' | '薬剤師' | '医療事務' | '調剤事務' | 'その他';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  jobTitle: JobTitle;
  avatarUrl: string;
  licenseImageUrl?: string; // 薬剤師免許証などの画像URL (Base64 or URL)
  isVerified?: boolean;     // 免許証確認済みフラグ
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
}

export interface ResourceLink {
  title: string;
  url: string;
}

export interface VideoModule {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // YouTube embed ID or placeholder
  duration: string;
  order: number;
  resources?: ResourceLink[]; // 配布資料
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  modules: VideoModule[];
  requiredRole: UserRole; // Access control level
  accessCode?: string;    // Optional: Secret code to unlock this course (for Note purchasers)
  isNoteExclusive?: boolean; // UI flag
}

export interface CourseProgress {
  completedModuleIds: string[];
  currentModuleId: string;
  isUnlocked?: boolean; // For access-code protected courses
  memos?: { [moduleId: string]: string }; // モジュールごとの学習メモ
}

export interface UserProgress {
  [courseId: string]: CourseProgress;
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  timestamp: number;
  tags: string[];
  replies: Comment[];
}

export interface Announcement {
  id: string;
  date: string;
  title: string;
  url: string;
}

export interface ReflectionResponse {
  passed: boolean;
  feedback: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}