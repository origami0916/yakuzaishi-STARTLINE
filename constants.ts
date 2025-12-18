import { Course, UserRole, ForumPost, User, Announcement, JobTitle } from './types';

export const JOB_TITLES: JobTitle[] = ['医師', '薬剤師', '医療事務', '調剤事務', 'その他'];

export const MOCK_USER: User = {
  id: 'u1',
  email: 'demo@example.com',
  name: '新人 事務子',
  role: UserRole.STUDENT,
  jobTitle: '調剤事務',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  isVerified: true // デモユーザーは承認済みとする
};

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    date: '2023.11.01',
    title: '【重要】書籍「調剤報酬の教科書」発売記念キャンペーンについて',
    url: 'https://www.notion.so/product/startline-campaign' 
  },
  {
    id: 'a2',
    date: '2023.10.28',
    title: '有料Note「在宅医療完全攻略」の更新情報',
    url: 'https://www.notion.so/product/zaitaku-update'
  }
];

// NOTE: videoUrlにはYouTubeの動画ID（"v="の後ろの11桁の文字列）を指定してください。
// ここではサンプルとして実在する動画IDを設定しています。
export const COURSES: Course[] = [
  {
    id: 'c1',
    title: '【書籍特典】調剤報酬の基礎と算定ルール',
    description: '書籍「調剤報酬の教科書」購入者向け。受付からレセプト請求までの流れ、基本料の仕組みを解説します。',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=800',
    requiredRole: UserRole.STUDENT,
    modules: [
      {
        id: 'c1-m1',
        title: '調剤基本料の区分と要件',
        description: '地域支援体制加算や後発医薬品使用体制加算の基礎知識。',
        videoUrl: 'M7lc1UVf-VE', // Sample: YouTube Developers Intro
        duration: '15:00',
        order: 1,
        resources: [
          { title: '講義スライド (PDF)', url: '#' },
          { title: '施設基準届出チェックリスト', url: '#' }
        ]
      },
      {
        id: 'c1-m2',
        title: '薬剤服用歴管理指導料のポイント',
        description: 'SOAPの書き方と、ハイリスク薬加算算定時の注意点。',
        videoUrl: 'g__N0m5_b_s', // Sample: Google I/O Keynote Highlight
        duration: '20:30',
        order: 2,
        resources: [
          { title: '薬歴記載テンプレート', url: '#' }
        ]
      }
    ]
  },
  {
    id: 'c2',
    title: '【Note購入者限定】在宅医療完全攻略コース',
    description: '有料Note「在宅医療の始め方」購入者特典。無菌調剤から介護保険請求まで、現場のリアルなノウハウを動画で。',
    thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
    requiredRole: UserRole.STUDENT, // RoleはStudentでも閲覧可だが、コードが必要
    accessCode: 'zaitaku2024', // このコードを知っている人だけが見れる
    isNoteExclusive: true,
    modules: [
      {
        id: 'c2-m1',
        title: '在宅患者訪問薬剤管理指導料の算定要件',
        description: '医師の指示から報告書の作成までのフローチャート。',
        videoUrl: 'jfKpM7r3l74', // Sample: Supabase Tutorial
        duration: '25:00',
        order: 1,
        resources: [
          { title: '報告書様式例', url: '#' }
        ]
      },
      {
        id: 'c2-m2',
        title: '無菌製剤処理加算の実技',
        description: 'クリーンベンチでの実際の操作手技動画。',
        videoUrl: 'ysz5S6PUM-U', // Sample: Next.js Conf
        duration: '30:00',
        order: 2
      }
    ]
  },
  {
    id: 'c3',
    title: '【管理者向け】個別指導対策と返戻防止',
    description: '厚生局の個別指導で指摘されやすいポイントと、正しい帳票管理について。',
    thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
    requiredRole: UserRole.ADMIN,
    modules: [
      {
        id: 'c3-m1',
        title: '自主返還にならないための薬歴記載',
        description: '算定要件の「指導内容」の具体的記載例。',
        videoUrl: 'CoT__M4V1aA', // Sample: Vercel Keynote
        duration: '45:00',
        order: 1
      }
    ]
  }
];

export const INITIAL_FORUM_POSTS: ForumPost[] = [
  {
    id: 'p1',
    authorId: 'u2',
    authorName: 'ベテラン薬剤師A',
    title: '自家製剤加算の予製について',
    content: '軟膏の混合ですが、予製剤として作り置きしている場合の算定可否について、最新の解釈通知をご存知の方いらっしゃいますか？',
    timestamp: Date.now() - 10000000,
    tags: ['調剤技術料', '自家製剤加算', '質問'],
    replies: [
      {
        id: 'r1',
        authorId: 'u3',
        authorName: '管理薬剤師B',
        content: '予製剤としての算定は原則不可ですが、医師の指示に基づき、かつ治療上の必要性があれば認められるケースもあります。都道府県によって解釈が異なる場合があるので、厚生局に確認するのが確実です。',
        timestamp: Date.now() - 5000000
      }
    ]
  },
  {
    id: 'p2',
    authorId: 'u4',
    authorName: '新人事務C',
    title: '【共有】今月のレセプト返戻事例',
    content: '資格喪失後の受診で返戻が多発しています。皆さんの薬局では保険証確認をどのような頻度で行っていますか？',
    timestamp: Date.now() - 2000000,
    tags: ['レセプト', '返戻対策', '共有'],
    replies: []
  }
];