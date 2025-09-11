// 知识点数据配置 - 为AI功能提供基础数据支持
export interface KnowledgePoint {
  id: string;
  title: string;
  description: string;
  courseId: string;
  chapterId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  importance: 1 | 2 | 3 | 4 | 5;
  estimatedTime: number;
  prerequisites: string[];
  relatedPoints: string[];
  tags: string[];
  status: 'active' | 'draft';
  // AI相关字段
  aiKeywords?: string[];
  aiEmbedding?: number[];
  aiCategory?: string;
}

export const courses = [
  { id: '1', name: '高等数学', subject: '数学', grade: '大学' },
  { id: '2', name: '线性代数', subject: '数学', grade: '大学' },
  { id: '3', name: '概率论', subject: '数学', grade: '大学' },
];

export const chapters = [
  { id: '1', title: '第一章 函数与极限', courseId: '1', order: 1 },
  { id: '2', title: '第二章 导数与微分', courseId: '1', order: 2 },
  { id: '3', title: '第三章 积分学', courseId: '1', order: 3 },
  { id: '4', title: '第一章 行列式', courseId: '2', order: 1 },
  { id: '5', title: '第二章 矩阵', courseId: '2', order: 2 },
];

// 预定义的知识点库 - 为AI推荐功能提供基础数据
export const knowledgePoints: KnowledgePoint[] = [
  {
    id: '1',
    title: '极限概念',
    description: '理解数列极限和函数极限的基本概念，掌握极限的精确定义',
    courseId: '1',
    chapterId: '1',
    difficulty: 'medium',
    importance: 5,
    estimatedTime: 45,
    prerequisites: [],
    relatedPoints: ['2', '3'],
    tags: ['基础', '核心概念', '极限'],
    status: 'active',
    aiKeywords: ['极限', '数列', '函数', '收敛', '发散', '无穷小'],
    aiCategory: '数学基础'
  },
  {
    id: '2',
    title: '极限运算规则',
    description: '掌握极限的四则运算规则和复合函数极限的求法',
    courseId: '1',
    chapterId: '1',
    difficulty: 'easy',
    importance: 4,
    estimatedTime: 30,
    prerequisites: ['1'],
    relatedPoints: ['3'],
    tags: ['运算', '技巧', '四则运算'],
    status: 'active',
    aiKeywords: ['四则运算', '复合函数', '极限法则', '运算技巧'],
    aiCategory: '数学运算'
  },
  {
    id: '3',
    title: '导数概念',
    description: '理解导数的定义和几何意义，掌握导数的计算方法',
    courseId: '1',
    chapterId: '2',
    difficulty: 'medium',
    importance: 5,
    estimatedTime: 50,
    prerequisites: ['1', '2'],
    relatedPoints: ['4'],
    tags: ['导数', '微分', '变化率', '切线'],
    status: 'active',
    aiKeywords: ['导数', '微分', '变化率', '切线斜率', '导函数'],
    aiCategory: '微积分基础'
  },
  {
    id: '4',
    title: '微分中值定理',
    description: '掌握罗尔定理、拉格朗日中值定理和柯西中值定理',
    courseId: '1',
    chapterId: '2',
    difficulty: 'hard',
    importance: 4,
    estimatedTime: 60,
    prerequisites: ['3'],
    relatedPoints: ['5'],
    tags: ['中值定理', '罗尔', '拉格朗日', '柯西'],
    status: 'active',
    aiKeywords: ['中值定理', '罗尔定理', '拉格朗日', '柯西', '微分'],
    aiCategory: '微积分定理'
  },
  {
    id: '5',
    title: '行列式计算',
    description: '掌握二阶、三阶行列式的计算方法，了解n阶行列式',
    courseId: '2',
    chapterId: '4',
    difficulty: 'medium',
    importance: 5,
    estimatedTime: 40,
    prerequisites: [],
    relatedPoints: ['6'],
    tags: ['行列式', '线性代数', '计算'],
    status: 'active',
    aiKeywords: ['行列式', '线性代数', '矩阵', '计算', '展开'],
    aiCategory: '线性代数基础'
  }
];

// 资源类型定义 - 为AI分类功能提供支持
export const resourceTypes = {
  courseware: [
    { value: 'ppt', label: 'PPT课件', aiCategory: '演示文稿' },
    { value: 'pdf', label: 'PDF文档', aiCategory: '文档' },
    { value: 'video', label: '视频', aiCategory: '多媒体' },
    { value: 'interactive', label: '互动课件', aiCategory: '交互式' }
  ],
  material: [
    { value: 'textbook', label: '教材', aiCategory: '教材' },
    { value: 'reference', label: '参考书', aiCategory: '参考资料' },
    { value: 'exercise', label: '习题集', aiCategory: '练习' },
    { value: 'exam', label: '试卷', aiCategory: '评估' },
    { value: 'other', label: '其他', aiCategory: '其他' }
  ]
};

// AI功能相关的工具函数
export const aiUtils = {
  // 根据资源内容推荐知识点
  recommendKnowledgePoints: (content: string, courseId: string): string[] => {
    // 这里可以集成AI算法，目前返回预定义的推荐
    const keywords = content.toLowerCase().split(/\s+/);
    const recommended: string[] = [];
    
    knowledgePoints.forEach(point => {
      if (point.courseId === courseId && 
          point.aiKeywords?.some(keyword => 
            keywords.some(k => k.includes(keyword))
          )) {
        recommended.push(point.id);
      }
    });
    
    return recommended.length > 0 ? recommended : ['1', '2', '3'];
  },

  // 智能资源分类
  classifyResource: (content: string, type: 'courseware' | 'material') => {
    const keywords = content.toLowerCase();
    
    if (keywords.includes('练习') || keywords.includes('习题')) {
      return 'exercise';
    }
    if (keywords.includes('考试') || keywords.includes('试卷')) {
      return 'exam';
    }
    if (keywords.includes('教材') || keywords.includes('教科书')) {
      return 'textbook';
    }
    if (keywords.includes('参考') || keywords.includes('资料')) {
      return 'reference';
    }
    
    return type === 'courseware' ? 'ppt' : 'other';
  },

  // 生成资源摘要
  generateSummary: (content: string, maxLength: number = 150): string => {
    // 简单的摘要生成逻辑，实际可以集成AI模型
    const sentences = content.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return content.slice(0, maxLength) + '...';
    
    return sentences[0].slice(0, maxLength) + 
           (sentences[0].length > maxLength ? '...' : '');
  }
};