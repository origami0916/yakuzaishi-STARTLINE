import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  MessageSquare, 
  LayoutDashboard, 
  PlayCircle, 
  CheckCircle, 
  Lock, 
  Send, 
  User as UserIcon, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Menu,
  X,
  Search,
  Loader2,
  KeyRound,
  Unlock,
  Settings,
  UserCircle,
  Briefcase,
  Mail,
  PlusCircle,
  ExternalLink,
  Trash2,
  Edit,
  Video,
  Bot,
  Sparkles,
  Save,
  MoreVertical,
  Download,
  FileText,
  BadgeCheck,
  AlertTriangle,
  Upload,
  Eye,
  Check
} from 'lucide-react';
import { User, UserRole, UserProgress, ForumPost, Course, VideoModule, CourseProgress, JobTitle, Announcement, ChatMessage } from './types';
import { evaluateReflection, getAIChatResponse } from './services/geminiService';
import { db } from './services/database';
import { JOB_TITLES } from './constants';

type AuthView = 'LOGIN' | 'SIGNUP';
type AppTab = 'dashboard' | 'courses' | 'community' | 'profile' | 'admin';

export default function App() {
  // Application State
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<VideoModule | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth State
  const [authView, setAuthView] = useState<AuthView>('LOGIN');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authJobTitle, setAuthJobTitle] = useState<JobTitle>('調剤事務');
  const [authNoteKey, setAuthNoteKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Access Code State
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [showAccessModal, setShowAccessModal] = useState<string | null>(null); // Course ID to unlock
  const [accessError, setAccessError] = useState('');

  // Forum State
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newReplyContent, setNewReplyContent] = useState('');
  const [forumSearchQuery, setForumSearchQuery] = useState('');
  const [forumPage, setForumPage] = useState(1);
  const [isForumLoading, setIsForumLoading] = useState(false);
  const POSTS_PER_PAGE = 5;

  // Admin State
  const [newAnnounceDate, setNewAnnounceDate] = useState('');
  const [newAnnounceTitle, setNewAnnounceTitle] = useState('');
  const [newAnnounceUrl, setNewAnnounceUrl] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCourseEditorOpen, setIsCourseEditorOpen] = useState(false);
  const [adminUserList, setAdminUserList] = useState<User[]>([]); // User Management
  const [isAdminUsersLoading, setIsAdminUsersLoading] = useState(false);

  // Reflection & Memo State
  const [reflectionText, setReflectionText] = useState('');
  const [memoText, setMemoText] = useState('');
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [reflectionFeedback, setReflectionFeedback] = useState<{passed: boolean, message: string} | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editJobTitle, setEditJobTitle] = useState<JobTitle>('その他');
  const [editPassword, setEditPassword] = useState('');
  const [licenseImageFile, setLicenseImageFile] = useState<string | null>(null);

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const user = await db.getUser();
        if (user) {
          setCurrentUser(user);
          await loadAppData();
        }
      } catch (error) {
        console.error("Failed to load initial user", error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // Load Memo when active module changes
  useEffect(() => {
    if (selectedCourse && activeModule && userProgress[selectedCourse.id]) {
      const savedMemo = userProgress[selectedCourse.id].memos?.[activeModule.id] || '';
      setMemoText(savedMemo);
    } else {
      setMemoText('');
    }
    setReflectionText('');
    setReflectionFeedback(null);
  }, [activeModule, selectedCourse, userProgress]);

  const loadAppData = async () => {
    try {
      const [loadedCourses, progress, loadedAnnouncements] = await Promise.all([
        db.getCourses(),
        db.getUserProgress(),
        db.getAnnouncements()
      ]);
      setCourses(loadedCourses);
      setUserProgress(progress);
      setAnnouncements(loadedAnnouncements);
    } catch (error) {
      console.error("Failed to load app data", error);
    }
  };

  const loadAdminData = async () => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    setIsAdminUsersLoading(true);
    try {
      const users = await db.getAllUsers();
      setAdminUserList(users);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setIsAdminUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      loadAdminData();
    }
  }, [activeTab]);

  // --- Auth Actions ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    try {
      const user = await db.signIn(authEmail, authPassword);
      setCurrentUser(user);
      await loadAppData();
    } catch (err: any) {
      setAuthError(err.message || 'ログインに失敗しました');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    const noteKeyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;
    
    if (!noteKeyRegex.test(authNoteKey)) {
      setAuthError('Note購入者キーが無効です。（大文字・小文字・数字・記号を含む10文字以上である必要があります）');
      setIsAuthLoading(false);
      return;
    }

    try {
      const user = await db.signUp(authEmail, authPassword, authName, authJobTitle);
      setCurrentUser(user);
      await loadAppData();
    } catch (err: any) {
      setAuthError(err.message || 'アカウント作成に失敗しました');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await db.signOut();
    setCurrentUser(null);
    setActiveTab('dashboard');
    setSelectedCourse(null);
  };

  // --- Profile Actions ---

  const handleStartEditProfile = () => {
    if (!currentUser) return;
    setEditName(currentUser.name);
    setEditJobTitle(currentUser.jobTitle);
    setEditPassword('');
    setLicenseImageFile(currentUser.licenseImageUrl || null);
    setIsEditingProfile(true);
  };

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLicenseImageFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      const updatedUser = {
        ...currentUser,
        name: editName,
        jobTitle: editJobTitle,
        licenseImageUrl: licenseImageFile || currentUser.licenseImageUrl,
        // If job changed to Pharmacist and no license, set verified to false.
        // If job was already Pharmacist and verified, keep it.
        isVerified: editJobTitle === '薬剤師' 
          ? (currentUser.jobTitle === '薬剤師' && currentUser.isVerified) 
          : true
      };
      
      // If uploading a new license, reset verification to false to require admin approval
      if (editJobTitle === '薬剤師' && licenseImageFile !== currentUser.licenseImageUrl) {
         updatedUser.isVerified = false;
      }

      await db.updateUser(updatedUser, editPassword || undefined);
      setCurrentUser(updatedUser);
      setIsEditingProfile(false);
      alert('プロフィールを更新しました');
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('プロフィールの更新に失敗しました');
    }
  };

  // --- Admin Actions ---
  
  const handleVerifyUser = async (userToVerify: User) => {
    if (!window.confirm(`${userToVerify.name}さんの免許証を承認しますか？`)) return;
    try {
      const updatedUser = { ...userToVerify, isVerified: true };
      await db.updateUser(updatedUser);
      await loadAdminData(); // Reload list
    } catch (error) {
      console.error("Failed to verify user", error);
    }
  };

  // --- Course & Memo Actions ---

  const handleUnlockCourse = async () => {
    if (!showAccessModal) return;
    
    const courseToUnlock = courses.find(c => c.id === showAccessModal);
    if (!courseToUnlock) return;

    if (courseToUnlock.accessCode === accessCodeInput) {
      const newProgress = {
        ...userProgress,
        [courseToUnlock.id]: {
          completedModuleIds: [],
          currentModuleId: courseToUnlock.modules[0].id,
          isUnlocked: true,
          memos: {}
        }
      };
      setUserProgress(newProgress);
      await db.saveUserProgress(newProgress);
      
      setShowAccessModal(null);
      setAccessCodeInput('');
      setAccessError('');
      alert('認証に成功しました！コースが利用可能です。');
    } else {
      setAccessError('コードが正しくありません。Note記事をご確認ください。');
    }
  };

  const handleSaveMemo = async () => {
    if (!selectedCourse || !activeModule) return;
    setIsSavingMemo(true);
    try {
      await db.saveMemo(selectedCourse.id, activeModule.id, memoText);
      // Update local state for immediate feedback
      const newProgress = { ...userProgress };
      if (!newProgress[selectedCourse.id]) {
        newProgress[selectedCourse.id] = { completedModuleIds: [], currentModuleId: activeModule.id, memos: {} };
      }
      if (!newProgress[selectedCourse.id].memos) {
        newProgress[selectedCourse.id].memos = {};
      }
      newProgress[selectedCourse.id].memos![activeModule.id] = memoText;
      setUserProgress(newProgress);
    } catch (error) {
      console.error("Failed to save memo", error);
    } finally {
      setIsSavingMemo(false);
    }
  };

  const handleSubmitReflection = async () => {
    if (!activeModule || !selectedCourse || !currentUser) return;
    
    setIsSubmittingReflection(true);
    setReflectionFeedback(null);

    try {
      const result = await evaluateReflection(
        activeModule.title,
        activeModule.description,
        reflectionText
      );

      setReflectionFeedback({
        passed: result.passed,
        message: result.feedback
      });

      if (result.passed) {
        const courseProgress = userProgress[selectedCourse.id] || { completedModuleIds: [], currentModuleId: activeModule.id };
        const newCompleted = [...courseProgress.completedModuleIds, activeModule.id];
        
        const nextModule = selectedCourse.modules.find(m => m.order === activeModule.order + 1);
        const nextModuleId = nextModule ? nextModule.id : courseProgress.currentModuleId;

        const newProgress = {
          ...userProgress,
          [selectedCourse.id]: {
            ...courseProgress,
            completedModuleIds: newCompleted,
            currentModuleId: nextModuleId
          }
        };

        setUserProgress(newProgress);
        await db.saveUserProgress(newProgress);
      }
    } catch (error) {
      setReflectionFeedback({
        passed: false,
        message: "エラーが発生しました。もう一度お試しください。"
      });
    } finally {
      setIsSubmittingReflection(false);
    }
  };

  // --- Forum Actions ---

  const fetchPosts = async () => {
    setIsForumLoading(true);
    try {
      const { posts, total } = await db.getPosts(forumPage, POSTS_PER_PAGE, forumSearchQuery);
      setPosts(posts);
      setTotalPosts(total);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setIsForumLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !currentUser || currentUser.role !== UserRole.ADMIN) return;
    setIsForumLoading(true);
    try {
      const newPost: ForumPost = {
        id: `p${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.name,
        title: newPostTitle,
        content: newPostContent,
        timestamp: Date.now(),
        tags: ['お知らせ', '重要'],
        replies: []
      };
      await db.createPost(newPost);
      setNewPostTitle('');
      setNewPostContent('');
      setForumPage(1);
      setForumSearchQuery('');
      await fetchPosts(); 
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setIsForumLoading(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnounceDate || !newAnnounceTitle || !newAnnounceUrl) return;
    const newItem: Announcement = {
      id: `a${Date.now()}`,
      date: newAnnounceDate,
      title: newAnnounceTitle,
      url: newAnnounceUrl
    };
    try {
      await db.addAnnouncement(newItem);
      const updatedList = await db.getAnnouncements();
      setAnnouncements(updatedList);
      setNewAnnounceDate('');
      setNewAnnounceTitle('');
      setNewAnnounceUrl('');
      alert('お知らせを追加しました');
    } catch (error) {
      console.error('Failed to add announcement', error);
    }
  };

  const handleReply = async () => {
    if (!selectedPost || !newReplyContent.trim() || !currentUser) return;
    const reply = {
      id: `r${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: newReplyContent,
      timestamp: Date.now()
    };
    try {
      await db.addReply(selectedPost.id, reply);
      const updatedPost = {
        ...selectedPost,
        replies: [...selectedPost.replies, reply]
      };
      setSelectedPost(updatedPost);
      setNewReplyContent('');
      fetchPosts();
    } catch (error) {
      console.error("Failed to reply", error);
    }
  };

  // --- Course Management Handlers ---
  const handleCreateCourse = () => {
    const newCourse: Course = {
      id: `c${Date.now()}`,
      title: '新しいコース',
      description: 'コースの説明を入力してください',
      thumbnailUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
      modules: [],
      requiredRole: UserRole.STUDENT,
      isNoteExclusive: false
    };
    setEditingCourse(newCourse);
    setIsCourseEditorOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(JSON.parse(JSON.stringify(course))); // Deep copy
    setIsCourseEditorOpen(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('本当にこのコースを削除しますか？')) return;
    const updatedCourses = courses.filter(c => c.id !== courseId);
    setCourses(updatedCourses);
    await db.saveCourses(updatedCourses);
  };

  const handleSaveCourse = async () => {
    if (!editingCourse) return;
    const isNew = !courses.some(c => c.id === editingCourse.id);
    let updatedCourses;
    if (isNew) {
      updatedCourses = [...courses, editingCourse];
    } else {
      updatedCourses = courses.map(c => c.id === editingCourse.id ? editingCourse : c);
    }
    setCourses(updatedCourses);
    await db.saveCourses(updatedCourses);
    setIsCourseEditorOpen(false);
    setEditingCourse(null);
  };

  const handleAddModule = () => {
    if (!editingCourse) return;
    const newModule: VideoModule = {
      id: `${editingCourse.id}-m${Date.now()}`,
      title: '新しいレッスン',
      description: 'レッスンの説明',
      videoUrl: '',
      duration: '10:00',
      order: editingCourse.modules.length + 1
    };
    setEditingCourse({
      ...editingCourse,
      modules: [...editingCourse.modules, newModule]
    });
  };

  const handleDeleteModule = (moduleId: string) => {
    if (!editingCourse) return;
    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.filter(m => m.id !== moduleId)
    });
  };

  const handleModuleChange = (index: number, field: keyof VideoModule, value: any) => {
    if (!editingCourse) return;
    const updatedModules = [...editingCourse.modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    setEditingCourse({ ...editingCourse, modules: updatedModules });
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !activeModule || !selectedCourse || isChatLoading) return;
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: chatInput,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const historyContext = chatMessages.slice(-8);
      const aiResponseText = await getAIChatResponse(
        userMessage.text,
        activeModule.title,
        activeModule.description,
        historyContext
      );
      const aiMessage: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: aiResponseText,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Helpers ---
  const isCourseUnlocked = (course: Course) => {
    if (currentUser?.role === UserRole.ADMIN) return true;
    if (!course.accessCode) return true;
    return userProgress[course.id]?.isUnlocked === true;
  };

  const canAccessCourse = (course: Course) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    
    // 薬剤師の場合、承認(verify)されていないと見られない
    if (currentUser.jobTitle === '薬剤師' && !currentUser.isVerified) {
      return false;
    }

    if (course.requiredRole === UserRole.STUDENT) return true; 
    return currentUser.role === course.requiredRole;
  };

  const isModuleLocked = (courseId: string, module: VideoModule) => {
    const progress = userProgress[courseId];
    if (!progress) return module.order > 1;
    if (progress.completedModuleIds.includes(module.id)) return false;
    if (progress.currentModuleId === module.id) return false;
    return true;
  };

  // --- Renderers ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-teal-600">
          <Loader2 size={48} className="animate-spin mx-auto mb-4" />
          <p className="font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  // --- Auth Screens ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">スタートライン</h1>
            <p className="text-sm opacity-90">調剤報酬・医療事務のための学習コミュニティ</p>
          </div>
          
          <div className="p-8">
            <div className="flex mb-6 border-b border-slate-200">
              <button
                className={`flex-1 pb-2 text-center font-medium transition-colors ${authView === 'LOGIN' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400'}`}
                onClick={() => { setAuthView('LOGIN'); setAuthError(''); }}
              >
                ログイン
              </button>
              <button
                className={`flex-1 pb-2 text-center font-medium transition-colors ${authView === 'SIGNUP' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400'}`}
                onClick={() => { setAuthView('SIGNUP'); setAuthError(''); }}
              >
                新規作成
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                {authError}
              </div>
            )}

            {authView === 'LOGIN' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
                  <input
                    type="password"
                    required
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {isAuthLoading ? <Loader2 className="animate-spin mx-auto" /> : 'ログイン'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">お名前</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">職種</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={authJobTitle}
                    onChange={(e) => setAuthJobTitle(e.target.value as JobTitle)}
                  >
                    {JOB_TITLES.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
                  <input
                    type="email"
                    required
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
                  <input
                    type="password"
                    required
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <KeyRound size={16} />
                    Note購入者キー
                    <span className="text-xs text-slate-500 font-normal">（大文字・小文字・記号・数字を含む10桁以上）</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="購入時のキーを入力"
                    value={authNoteKey}
                    onChange={(e) => setAuthNoteKey(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {isAuthLoading ? <Loader2 className="animate-spin mx-auto" /> : 'アカウント作成'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Main App Views ---

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">スタートライン</h2>
        <p className="opacity-90">調剤報酬・実務スキルの向上を目指すコミュニティへようこそ。</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 text-teal-600 rounded-full">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">学習中の講座</p>
              <p className="text-xl font-bold">{Object.keys(userProgress).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">習得済みスキル</p>
              <p className="text-xl font-bold">
                {Object.values(userProgress).reduce((acc: number, curr: CourseProgress) => acc + curr.completedModuleIds.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
              <UserIcon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">職種</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">{currentUser.jobTitle}</p>
                {currentUser.isVerified && currentUser.jobTitle === '薬剤師' && (
                  <span title="認証済み薬剤師">
                    <BadgeCheck size={20} className="text-teal-500" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert size={20} className="text-teal-600" />
            運営からのお知らせ
          </h3>
        </div>
        <div className="p-6">
          {announcements.length > 0 ? (
            <ul className="space-y-4">
              {announcements.map((item) => (
                <li key={item.id} className="flex gap-4 items-start">
                  <div className="text-sm text-slate-500 min-w-[100px] mt-1 font-mono">{item.date}</div>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 hover:text-teal-600 hover:underline flex items-start gap-1 group"
                  >
                    <span>{item.title}</span>
                    <ExternalLink size={14} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-slate-500 text-sm">現在お知らせはありません。</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">マイページ</h2>
        <button
          onClick={() => isEditingProfile ? setIsEditingProfile(false) : handleStartEditProfile()}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${isEditingProfile ? 'text-slate-600 bg-slate-100' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
        >
          {isEditingProfile ? 'キャンセル' : 'プロフィール編集'}
        </button>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
        <img 
          src={currentUser.avatarUrl} 
          alt={currentUser.name} 
          className="w-32 h-32 rounded-full bg-slate-100 mb-4"
        />
        
        {isEditingProfile ? (
          <div className="w-full max-w-md space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">お名前</label>
               <input
                 type="text"
                 value={editName}
                 onChange={e => setEditName(e.target.value)}
                 className="w-full border border-slate-300 rounded-lg p-2"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">職種</label>
               <select
                 value={editJobTitle}
                 onChange={e => setEditJobTitle(e.target.value as JobTitle)}
                 className="w-full border border-slate-300 rounded-lg p-2"
               >
                 {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">新しいパスワード (変更する場合のみ)</label>
               <input
                 type="password"
                 value={editPassword}
                 onChange={e => setEditPassword(e.target.value)}
                 className="w-full border border-slate-300 rounded-lg p-2"
                 placeholder="********"
               />
             </div>

             {editJobTitle === '薬剤師' && (
               <div className="border border-indigo-100 bg-indigo-50 p-4 rounded-lg">
                 <label className="block text-sm font-medium text-indigo-900 mb-2">薬剤師免許証のアップロード</label>
                 <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                       <Upload size={16} />
                       画像を選択
                       <input type="file" className="hidden" accept="image/*" onChange={handleLicenseUpload} />
                    </label>
                    <span className="text-xs text-indigo-700">
                      {licenseImageFile ? '画像が選択されました' : 'ファイルが選択されていません'}
                    </span>
                 </div>
                 {licenseImageFile && (
                   <img src={licenseImageFile} alt="Preview" className="mt-3 max-h-40 rounded border border-indigo-200" />
                 )}
                 <p className="text-xs text-indigo-600 mt-2">※免許証をアップロード後、承認されるまで学習機能が制限されます。</p>
               </div>
             )}

             <button
               onClick={handleSaveProfile}
               className="w-full bg-teal-600 text-white py-2 rounded-lg font-bold hover:bg-teal-700"
             >
               保存する
             </button>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
              {currentUser.name}
              {currentUser.isVerified && currentUser.jobTitle === '薬剤師' && (
                <span title="認証済み薬剤師">
                  <BadgeCheck size={24} className="text-teal-500" />
                </span>
              )}
            </h3>
            <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-6">
              {currentUser.jobTitle}
            </span>
            
            <div className="w-full border-t border-slate-100 pt-6 grid grid-cols-1 gap-4 text-left">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <Mail className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">メールアドレス</p>
                  <p className="font-medium text-slate-800">{currentUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                 <div className={`p-2 rounded-full ${currentUser.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                    {currentUser.role === UserRole.ADMIN ? <Settings size={20} /> : <UserIcon size={20} />}
                 </div>
                 <div>
                   <p className="text-xs text-slate-500">アカウント権限</p>
                   <p className="font-medium text-slate-800">{currentUser.role === UserRole.ADMIN ? '管理者' : '一般会員'}</p>
                 </div>
              </div>
              {currentUser.jobTitle === '薬剤師' && !currentUser.isVerified && (
                 <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-start gap-3">
                    <AlertTriangle size={20} className="mt-0.5" />
                    <div>
                      <p className="font-bold">承認待ち / 未提出</p>
                      <p className="text-sm">薬剤師免許証の確認が完了するまで、一部の学習コンテンツが利用できません。プロフィール編集から免許証をアップロードしてください。</p>
                    </div>
                 </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Settings size={28} />
        管理者設定
      </h2>

      {/* ユーザー管理セクション */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700">
           <UserCircle size={20} className="text-teal-600" />
           ユーザー管理・免許証承認
        </h3>
        {isAdminUsersLoading ? (
          <div className="text-center py-4"><Loader2 className="animate-spin mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3">名前</th>
                      <th className="p-3">職種</th>
                      <th className="p-3">免許証</th>
                      <th className="p-3">ステータス</th>
                      <th className="p-3">操作</th>
                   </tr>
                </thead>
                <tbody>
                   {adminUserList.map(u => (
                     <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-medium">{u.name}</td>
                        <td className="p-3">{u.jobTitle}</td>
                        <td className="p-3">
                           {u.licenseImageUrl ? (
                             <a href={u.licenseImageUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 flex items-center gap-1 hover:underline">
                                <Eye size={14} /> 画像を確認
                             </a>
                           ) : <span className="text-slate-400">未提出</span>}
                        </td>
                        <td className="p-3">
                           {u.isVerified ? (
                             <span className="text-emerald-600 font-bold flex items-center gap-1"><BadgeCheck size={14}/> 承認済</span>
                           ) : u.jobTitle === '薬剤師' ? (
                             <span className="text-yellow-600 font-bold">未承認</span>
                           ) : (
                             <span className="text-slate-400">-</span>
                           )}
                        </td>
                        <td className="p-3">
                           {u.jobTitle === '薬剤師' && !u.isVerified && u.licenseImageUrl && (
                             <button
                               onClick={() => handleVerifyUser(u)}
                               className="bg-emerald-600 text-white px-3 py-1 rounded text-xs hover:bg-emerald-700"
                             >
                               承認する
                             </button>
                           )}
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* お知らせ管理セクション */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700">
           <ShieldAlert size={20} className="text-teal-600" />
           お知らせの管理
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">日付</label>
              <input 
                type="text" 
                placeholder="2023.11.01" 
                value={newAnnounceDate}
                onChange={e => setNewAnnounceDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">タイトル</label>
              <input 
                type="text" 
                placeholder="お知らせのタイトル" 
                value={newAnnounceTitle}
                onChange={e => setNewAnnounceTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">リンクURL (Notion等)</label>
            <input 
              type="text" 
              placeholder="https://..." 
              value={newAnnounceUrl}
              onChange={e => setNewAnnounceUrl(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddAnnouncement}
              disabled={!newAnnounceDate || !newAnnounceTitle || !newAnnounceUrl}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              追加する
            </button>
          </div>
        </div>
      </div>

      {/* 動画コース管理セクション */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-700">
             <Video size={20} className="text-teal-600" />
             学習コース管理
          </h3>
          <button
            onClick={handleCreateCourse}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            <PlusCircle size={16} />
            新規コース作成
          </button>
        </div>

        <div className="space-y-4">
          {courses.map(course => (
            <div key={course.id} className="border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4 flex-1">
                <img src={course.thumbnailUrl} alt="" className="w-16 h-16 rounded object-cover bg-slate-200" />
                <div>
                  <h4 className="font-bold text-slate-800">{course.title}</h4>
                  <p className="text-xs text-slate-500">{course.modules.length} レッスン • ID: {course.id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditCourse(course)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCourseList = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">学習コース一覧</h2>
      
      {/* 薬剤師未承認アラート */}
      {currentUser.jobTitle === '薬剤師' && !currentUser.isVerified && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3 mb-6">
           <AlertTriangle className="text-yellow-600 mt-1" />
           <div>
             <h3 className="font-bold text-yellow-800">薬剤師免許証の確認が必要です</h3>
             <p className="text-sm text-yellow-700 mt-1">
               現在、アカウントの確認待ちです。マイページから免許証画像をアップロードしてください。<br/>
               承認されるまで、コースの視聴は制限されます。
             </p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          const roleAccessible = canAccessCourse(course);
          const isUnlocked = isCourseUnlocked(course);
          const needsCode = !!course.accessCode && !isUnlocked;
          const isPharmacistRestriction = currentUser.jobTitle === '薬剤師' && !currentUser.isVerified;
          
          return (
            <div key={course.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${!roleAccessible ? 'opacity-75' : ''}`}>
              <div className="relative h-48 bg-slate-200">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                {needsCode && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Lock size={32} />
                      <span className="font-semibold text-lg">Note購入特典</span>
                      <span className="text-xs opacity-80">アクセスコードで解除</span>
                    </div>
                  </div>
                )}
                {!roleAccessible && !needsCode && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white backdrop-blur-sm p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Lock size={20} />
                      <span className="font-semibold">
                        {isPharmacistRestriction ? '免許証承認待ち' : '権限がありません'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4 flex flex-wrap gap-2">
                   {course.isNoteExclusive && (
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-bold">
                      Note特典
                    </span>
                   )}
                   <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700">
                     {course.modules.length} レッスン
                   </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">{course.title}</h3>
                <p className="text-slate-600 text-sm mb-4 flex-1">{course.description}</p>
                
                {needsCode ? (
                  <button
                    onClick={() => setShowAccessModal(course.id)}
                    className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center gap-2"
                  >
                    <KeyRound size={18} />
                    コードを入力して解除
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedCourse(course);
                      setActiveModule(course.modules[0]);
                      setChatMessages([]);
                      setIsChatOpen(false);
                    }}
                    disabled={!roleAccessible}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      roleAccessible 
                        ? 'bg-teal-600 text-white hover:bg-teal-700' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {roleAccessible ? '学習を始める' : isPharmacistRestriction ? '承認待ち' : 'アクセス権限なし'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderVideoPlayer = () => {
    if (!selectedCourse || !activeModule) return null;
    const isCompleted = userProgress[selectedCourse.id]?.completedModuleIds.includes(activeModule.id);

    return (
      <div className="space-y-6 relative">
        <button 
          onClick={() => setSelectedCourse(null)}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-2"
        >
          <ChevronRight className="rotate-180" size={20} />
          コース一覧に戻る
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
              {/* YouTube Embed Player */}
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeModule.videoUrl}?rel=0&modestbranding=1`}
                title={activeModule.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            <div>
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold mb-2 text-slate-800 flex-1">{activeModule.title}</h2>
                {activeModule.resources && activeModule.resources.length > 0 && (
                  <div className="flex gap-2">
                    {activeModule.resources.map((res, i) => (
                      <a 
                        key={i} 
                        href={res.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-1 text-sm bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 transition"
                      >
                        <Download size={16} />
                        {res.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-slate-600">{activeModule.description}</p>
            </div>
            
            {/* 学習メモエリア (新機能) */}
            <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm">
               <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-900 mb-3">
                 <FileText size={20} />
                 学習メモ
               </h3>
               <textarea
                 value={memoText}
                 onChange={(e) => setMemoText(e.target.value)}
                 className="w-full border border-amber-200 rounded-lg p-3 h-32 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-400"
                 placeholder="動画を見ながら気になったことや、後で調べたいことをメモしましょう（自動保存されません）"
               />
               <div className="flex justify-end mt-2">
                 <button
                   onClick={handleSaveMemo}
                   disabled={isSavingMemo}
                   className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center gap-2"
                 >
                   {isSavingMemo ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                   メモを保存
                 </button>
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-teal-800">
                <MessageSquare size={20} />
                学習レポート提出
              </h3>
              
              {isCompleted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-emerald-800 flex items-center gap-3">
                  <CheckCircle size={24} />
                  <div>
                    <p className="font-bold">完了済み</p>
                    <p className="text-sm">このセクションの学習は完了しています。次の動画に進んでください。</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600">
                    動画を見て重要だと思った点や、自局で活かせそうな点を記入してください。<br/>
                    アウトプットすることで知識が定着します。
                  </p>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="例：ハイリスク薬加算算定時は、特に副作用の確認と手帳への記載が必須であることが再確認できた..."
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                  />
                  
                  {reflectionFeedback && (
                    <div className={`p-4 rounded-lg ${reflectionFeedback.passed ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="font-bold">{reflectionFeedback.passed ? '確認完了！' : 'もう少し詳しく書きましょう'}</p>
                      <p className="text-sm">{reflectionFeedback.message}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitReflection}
                    disabled={isSubmittingReflection || reflectionText.length === 0}
                    className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmittingReflection ? '送信中...' : 'レポートを提出して次へ'}
                    <Send size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-700">カリキュラム</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {selectedCourse.modules.map((module, index) => {
                const locked = isModuleLocked(selectedCourse.id, module);
                const active = activeModule.id === module.id;
                const completed = userProgress[selectedCourse.id]?.completedModuleIds.includes(module.id);

                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      if (!locked) {
                        setActiveModule(module);
                        setChatMessages([]); // Reset chat context for new module
                      }
                    }}
                    disabled={locked}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                      active ? 'bg-teal-50' : 'hover:bg-slate-50'
                    } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="mt-1">
                      {locked ? <Lock size={16} /> : completed ? <CheckCircle size={16} className="text-emerald-600" /> : <PlayCircle size={16} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">
                        {index + 1}. {module.title}
                      </div>
                      <div className="text-xs text-slate-500">{module.duration}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Chat Floating Button & Window */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
          {isChatOpen && (
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 md:w-96 flex flex-col overflow-hidden h-[500px] mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot size={20} />
                  <span className="font-bold">AI学習アシスタント</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 rounded p-1 transition">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatMessages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm mt-8 px-4">
                    <Sparkles className="mx-auto mb-2 text-indigo-400" size={32} />
                    <p>この動画について質問があれば何でも聞いてください。</p>
                    <p className="text-xs mt-2 opacity-70">例：算定要件のポイントは？ 関連する加算は？</p>
                  </div>
                )}
                
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3 text-sm whitespace-pre-wrap ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm">
                      <Loader2 size={16} className="animate-spin text-indigo-600" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="質問を入力..."
                  className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isChatLoading}
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 group"
          >
            {isChatOpen ? <X size={24} /> : <Bot size={24} className="group-hover:animate-bounce" />}
          </button>
        </div>
      </div>
    );
  };

  const renderCommunity = () => {
    if (selectedPost) {
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedPost(null)}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-2"
          >
            <ChevronRight className="rotate-180" size={20} />
            掲示板一覧に戻る
          </button>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-slate-800">{selectedPost.title}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{selectedPost.authorName}</span>
                  <span>•</span>
                  <span>{new Date(selectedPost.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedPost.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="prose max-w-none text-slate-800 mb-8 whitespace-pre-wrap leading-relaxed">
              {selectedPost.content}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700">
                <MessageSquare size={18} />
                回答・コメント ({selectedPost.replies.length})
              </h3>
              
              <div className="space-y-6 mb-8">
                {selectedPost.replies.map(reply => (
                  <div key={reply.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <span className="font-bold text-slate-700">{reply.authorName}</span>
                      <span className="text-slate-400 text-xs">{new Date(reply.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    value={newReplyContent}
                    onChange={(e) => setNewReplyContent(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="回答や応援コメントを書く..."
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleReply}
                  disabled={!newReplyContent.trim()}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 h-fit"
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">スタートライン掲示板</h2>
            <p className="text-slate-500 text-sm">調剤報酬、レセプト請求、薬局業務の悩みを共有しよう</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="キーワード検索..."
              value={forumSearchQuery}
              onChange={(e) => setForumSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* New Post Form - Only for Admins */}
        {currentUser?.role === UserRole.ADMIN && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-teal-800">
              <MessageSquare size={20} />
              新しい相談・トピックを作成
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="タイトル（例：今週の重要なお知らせ）"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
              <textarea
                placeholder="詳細な内容"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                rows={3}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostTitle.trim() || !newPostContent.trim() || isForumLoading}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isForumLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  投稿する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post List */}
        <div className="space-y-4">
          {isForumLoading ? (
            <div className="text-center py-12 text-slate-500">
              <Loader2 className="animate-spin mx-auto mb-2" size={24} />
              読み込み中...
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <div 
                key={post.id} 
                onClick={() => setSelectedPost(post)}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-teal-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-800">{post.title}</h3>
                  <div className="flex gap-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 mb-4 line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <UserIcon size={14} />
                    {post.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    {post.replies.length}件のコメント
                  </span>
                  <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              投稿が見つかりませんでした。
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setForumPage(p => Math.max(1, p - 1))}
              disabled={forumPage === 1 || isForumLoading}
              className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-slate-600 font-medium">
              {forumPage} / {totalPages}
            </span>
            <button
              onClick={() => setForumPage(p => Math.min(totalPages, p + 1))}
              disabled={forumPage === totalPages || isForumLoading}
              className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Course Editor Modal */}
      {isCourseEditorOpen && editingCourse && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">
                 {courses.some(c => c.id === editingCourse.id) ? 'コースを編集' : '新規コース作成'}
               </h3>
               <button onClick={() => setIsCourseEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={24} />
               </button>
             </div>
             
             <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">コースタイトル</label>
                  <input
                    type="text"
                    value={editingCourse.title}
                    onChange={e => setEditingCourse({...editingCourse, title: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">概要</label>
                  <textarea
                    value={editingCourse.description}
                    onChange={e => setEditingCourse({...editingCourse, description: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">サムネイルURL</label>
                  <input
                    type="text"
                    value={editingCourse.thumbnailUrl}
                    onChange={e => setEditingCourse({...editingCourse, thumbnailUrl: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">アクセス権限</label>
                      <select
                        value={editingCourse.requiredRole}
                        onChange={e => setEditingCourse({...editingCourse, requiredRole: e.target.value as UserRole})}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      >
                         <option value={UserRole.STUDENT}>誰でも (STUDENT)</option>
                         <option value={UserRole.ADMIN}>管理者のみ (ADMIN)</option>
                      </select>
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">アクセスコード (任意)</label>
                      <input
                        type="text"
                        value={editingCourse.accessCode || ''}
                        onChange={e => setEditingCourse({...editingCourse, accessCode: e.target.value})}
                        placeholder="入力でNote限定化"
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                   </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-700">モジュール (動画レッスン)</h4>
                    <button onClick={handleAddModule} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                      <PlusCircle size={14} /> 追加
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {editingCourse.modules.map((module, idx) => (
                      <div key={module.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                        <button 
                          onClick={() => handleDeleteModule(module.id)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="md:col-span-2">
                             <input
                               type="text"
                               value={module.title}
                               onChange={e => handleModuleChange(idx, 'title', e.target.value)}
                               placeholder="レッスンタイトル"
                               className="w-full bg-transparent border-b border-slate-300 focus:border-indigo-500 focus:outline-none py-1 font-medium"
                             />
                           </div>
                           <div>
                             <label className="text-xs text-slate-500 block">YouTube ID</label>
                             <input
                               type="text"
                               value={module.videoUrl}
                               onChange={e => handleModuleChange(idx, 'videoUrl', e.target.value)}
                               className="w-full border border-slate-300 rounded p-1 text-sm"
                               placeholder="例: M7lc1UVf-VE"
                             />
                           </div>
                           <div>
                             <label className="text-xs text-slate-500 block">再生時間</label>
                             <input
                               type="text"
                               value={module.duration}
                               onChange={e => handleModuleChange(idx, 'duration', e.target.value)}
                               className="w-full border border-slate-300 rounded p-1 text-sm"
                             />
                           </div>
                           <div className="md:col-span-2">
                             <input
                               type="text"
                               value={module.description}
                               onChange={e => handleModuleChange(idx, 'description', e.target.value)}
                               placeholder="レッスンの説明"
                               className="w-full border border-slate-300 rounded p-1 text-sm"
                             />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 gap-3">
                  <button
                    onClick={() => setIsCourseEditorOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveCourse}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
                  >
                    <Save size={18} />
                    保存する
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Access Code Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <Unlock size={24} className="text-orange-500"/>
                 Note購入者認証
               </h3>
               <button onClick={() => { setShowAccessModal(null); setAccessCodeInput(''); setAccessError(''); }} className="text-slate-400 hover:text-slate-600">
                 <X size={24} />
               </button>
             </div>
             <p className="text-slate-600 mb-4">
               Note記事「在宅医療完全攻略」の末尾に記載されている<br/>
               <span className="font-bold text-orange-600">特典アクセスコード</span>を入力してください。
             </p>
             <input
               type="text"
               value={accessCodeInput}
               onChange={(e) => setAccessCodeInput(e.target.value)}
               placeholder="コードを入力"
               className="w-full border border-slate-300 rounded-lg p-3 mb-2 text-center text-lg tracking-widest uppercase focus:ring-2 focus:ring-orange-500 focus:outline-none"
             />
             {accessError && <p className="text-red-500 text-sm mb-4 text-center">{accessError}</p>}
             <button
               onClick={handleUnlockCourse}
               className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-md"
             >
               認証してロック解除
             </button>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <h1 className="font-bold text-xl text-teal-700">スタートライン</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out md:w-64 bg-slate-900 text-white flex flex-col z-20`}>
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <h1 className="font-bold text-2xl tracking-tight text-teal-400">スタートライン</h1>
          <p className="text-xs text-slate-400 mt-1">調剤報酬コミュニティ</p>
        </div>

        <div className="flex-1 py-6 px-3 space-y-2">
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedCourse(null); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' && !selectedCourse ? 'bg-teal-700' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            ホーム
          </button>
          <button
            onClick={() => { setActiveTab('courses'); setSelectedCourse(null); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'courses' || selectedCourse ? 'bg-teal-700' : 'hover:bg-slate-800'}`}
          >
            <BookOpen size={20} />
            学習コース
          </button>
          <button
            onClick={() => { setActiveTab('community'); setSelectedCourse(null); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'community' ? 'bg-teal-700' : 'hover:bg-slate-800'}`}
          >
            <MessageSquare size={20} />
            質問掲示板
          </button>
          <button
            onClick={() => { setActiveTab('profile'); setSelectedCourse(null); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-teal-700' : 'hover:bg-slate-800'}`}
          >
            <UserCircle size={20} />
            マイページ
          </button>
          
          {currentUser.role === UserRole.ADMIN && (
             <button
              onClick={() => { setActiveTab('admin'); setSelectedCourse(null); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'admin' ? 'bg-teal-700' : 'hover:bg-slate-800'}`}
            >
              <Settings size={20} />
              管理者設定
            </button>
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-3">
            <img src={currentUser.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-700" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser.jobTitle}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-white mt-2 px-2"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-5xl mx-auto">
          {selectedCourse ? renderVideoPlayer() : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'courses' && renderCourseList()}
              {activeTab === 'community' && renderCommunity()}
              {activeTab === 'profile' && renderProfile()}
              {activeTab === 'admin' && renderAdmin()}
            </>
          )}
        </div>
      </main>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}