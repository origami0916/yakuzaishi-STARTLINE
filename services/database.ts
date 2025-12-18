import { User, Course, ForumPost, UserProgress, UserRole, Comment, JobTitle, Announcement } from '../types';
import { MOCK_USER, COURSES, INITIAL_FORUM_POSTS, INITIAL_ANNOUNCEMENTS } from '../constants';
import { supabase } from './supabaseClient';

const DEMO_USER_ID = 'u1';

// LocalStorage Keys for fallback
const STORAGE_KEYS = {
  USER: 'lumina_user_v2', // version up
  USERS_DB: 'lumina_users_db_v1', // list of all users for local auth
  PROGRESS: 'lumina_progress_v2', // version up for memos
  POSTS: 'lumina_posts_v1',
  ANNOUNCEMENTS: 'lumina_announcements_v1',
  COURSES: 'lumina_courses_v1',
  INIT_FLAG: 'lumina_initialized_v3'
};

class DatabaseService {
  constructor() {
    // Initialize LocalStorage if Supabase is not available
    if (!supabase) {
      this.initializeLocal();
    }
  }

  private initializeLocal() {
    if (typeof window === 'undefined') return;
    const initialized = localStorage.getItem(STORAGE_KEYS.INIT_FLAG);
    if (!initialized) {
      // 既存のモックユーザーをDBに追加
      const usersDB = [MOCK_USER];
      localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(usersDB));
      
      const initialProgress: UserProgress = {
        'c1': { completedModuleIds: [], currentModuleId: 'c1-m1', memos: {} }
      };
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(initialProgress));
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_FORUM_POSTS));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      
      // Initialize Courses from constants
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(COURSES));
      
      localStorage.setItem(STORAGE_KEYS.INIT_FLAG, 'true');
    }
  }

  // --- Auth ---

  async signUp(email: string, password: string, name: string, jobTitle: JobTitle): Promise<User> {
    if (!supabase) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      const usersDBStr = localStorage.getItem(STORAGE_KEYS.USERS_DB);
      const usersDB: any[] = usersDBStr ? JSON.parse(usersDBStr) : [];
      
      if (usersDB.some((u: any) => u.email === email)) {
        throw new Error('このメールアドレスは既に登録されています。');
      }

      const newUser: User = {
        id: `u${Date.now()}`,
        email,
        name,
        role: UserRole.STUDENT,
        jobTitle,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        isVerified: jobTitle !== '薬剤師' // 薬剤師以外は自動承認（簡易ロジック）
      };

      const userRecord = { ...newUser, password };
      usersDB.push(userRecord);
      localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(usersDB));
      
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      return newUser;
    }
    
    throw new Error('Supabase Auth not implemented in this demo');
  }

  async signIn(email: string, password: string): Promise<User> {
    // Hardcoded Admin Login for Demo
    if (email === 'test' && password === 'test') {
      const adminUser: User = {
        id: 'admin-demo',
        email: 'test',
        name: '管理者デモ',
        role: UserRole.ADMIN,
        jobTitle: 'その他',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        isVerified: true
      };
      
      if (!supabase) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(adminUser));
      }
      return adminUser;
    }

    if (!supabase) {
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate delay
      
      const usersDBStr = localStorage.getItem(STORAGE_KEYS.USERS_DB);
      const usersDB: any[] = usersDBStr ? JSON.parse(usersDBStr) : [];
      
      const userRecord = usersDB.find((u: any) => u.email === email && u.password === password);
      
      if (!userRecord) {
        throw new Error('メールアドレスまたはパスワードが間違っています。');
      }

      const { password: _, ...userWithoutPassword } = userRecord;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithoutPassword));
      return userWithoutPassword;
    }

    throw new Error('Supabase Auth not implemented in this demo');
  }

  async signOut(): Promise<void> {
    if (!supabase) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      return;
    }
    await supabase.auth.signOut();
  }

  // --- User ---
  async getUser(): Promise<User | null> {
    if (!supabase) {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async getAllUsers(): Promise<User[]> {
    if (!supabase) {
      const usersDBStr = localStorage.getItem(STORAGE_KEYS.USERS_DB);
      const usersDB: any[] = usersDBStr ? JSON.parse(usersDBStr) : [];
      // パスワードを除外して返す
      return usersDB.map(({ password, ...user }) => user);
    }
    return [];
  }

  async updateUser(user: User, password?: string): Promise<User> {
    if (!supabase) {
      // 現在のログインユーザー情報を更新
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      // DB内のユーザー情報も更新
      const usersDBStr = localStorage.getItem(STORAGE_KEYS.USERS_DB);
      if (usersDBStr) {
        let usersDB = JSON.parse(usersDBStr);
        usersDB = usersDB.map((u: any) => {
          if (u.id === user.id) {
            const updated = { ...u, ...user };
            if (password) updated.password = password; // パスワード変更があれば更新
            return updated;
          }
          return u;
        });
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(usersDB));
      }
      return user;
    }
    return user;
  }

  // --- Announcements ---
  async getAnnouncements(): Promise<Announcement[]> {
    if (!supabase) {
      const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      return data ? JSON.parse(data) : INITIAL_ANNOUNCEMENTS;
    }
    return INITIAL_ANNOUNCEMENTS;
  }

  async addAnnouncement(announcement: Announcement): Promise<void> {
    if (!supabase) {
      const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      const list = data ? JSON.parse(data) : INITIAL_ANNOUNCEMENTS;
      const newList = [announcement, ...list];
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(newList));
    }
  }

  // --- Courses ---
  async getCourses(): Promise<Course[]> {
    if (!supabase) {
      const data = localStorage.getItem(STORAGE_KEYS.COURSES);
      // Fallback to constants if storage is empty (shouldn't happen due to init)
      return data ? JSON.parse(data) : COURSES;
    }
    return COURSES;
  }

  async saveCourses(courses: Course[]): Promise<void> {
    if (!supabase) {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    }
    // Supabase implementation would go here
  }

  // --- Progress & Memos ---
  async getUserProgress(): Promise<UserProgress> {
    if (!supabase) {
      const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      return data ? JSON.parse(data) : {};
    }

    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', DEMO_USER_ID);

    if (error) {
      console.error('Failed to get progress:', error);
      return {};
    }

    const progressMap: UserProgress = {};
    data.forEach((row: any) => {
      progressMap[row.course_id] = {
        currentModuleId: row.current_module_id,
        completedModuleIds: row.completed_module_ids || [],
        memos: row.memos || {}
      };
    });

    return progressMap;
  }

  async saveUserProgress(progress: UserProgress): Promise<void> {
    if (!supabase) {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
      return;
    }
    // Supabase update logic (simplified)
  }

  async saveMemo(courseId: string, moduleId: string, memo: string): Promise<void> {
     if (!supabase) {
        const progress = await this.getUserProgress();
        const courseProgress = progress[courseId] || { completedModuleIds: [], currentModuleId: moduleId, memos: {} };
        
        const newProgress = {
          ...progress,
          [courseId]: {
            ...courseProgress,
            memos: {
              ...(courseProgress.memos || {}),
              [moduleId]: memo
            }
          }
        };
        
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newProgress));
     }
  }

  // --- Forum ---
  async getPosts(page: number, limit: number, query: string = ''): Promise<{ posts: ForumPost[], total: number }> {
    if (!supabase) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = localStorage.getItem(STORAGE_KEYS.POSTS);
      let allPosts: ForumPost[] = data ? JSON.parse(data) : [];

      if (query) {
        const lowerQuery = query.toLowerCase();
        allPosts = allPosts.filter(p => 
          p.title.toLowerCase().includes(lowerQuery) ||
          p.content.toLowerCase().includes(lowerQuery) ||
          p.tags.some(t => t.toLowerCase().includes(lowerQuery))
        );
      }

      const total = allPosts.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      return { posts: allPosts.slice(start, end), total };
    }
    // Supabase logic omitted for brevity as it is similar to previous
    return { posts: [], total: 0 };
  }

  async createPost(post: ForumPost): Promise<void> {
    if (!supabase) {
      const data = localStorage.getItem(STORAGE_KEYS.POSTS);
      const currentPosts: ForumPost[] = data ? JSON.parse(data) : [];
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([post, ...currentPosts]));
      return;
    }
  }

  async addReply(postId: string, reply: any): Promise<void> {
    if (!supabase) {
      const data = localStorage.getItem(STORAGE_KEYS.POSTS);
      let currentPosts: ForumPost[] = data ? JSON.parse(data) : [];
      currentPosts = currentPosts.map(p => {
        if (p.id === postId) {
          return { ...p, replies: [...p.replies, reply] };
        }
        return p;
      });
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(currentPosts));
      return;
    }
  }
}

export const db = new DatabaseService();