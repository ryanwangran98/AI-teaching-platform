export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId?: string;
  courseName?: string;
  dueDate?: string;
  maxScore?: number;
  totalScore?: number;
  passingScore?: number;
  timeLimit?: number;
  startTime?: string;
  endTime?: string;
  type: 'homework' | 'quiz' | 'project' | 'exam';
  status: 'draft' | 'published' | 'grading' | 'completed';
  createdAt: string;
  updatedAt: string;
  questions?: Question[]; // 添加题目列表
  knowledgePoint?: {
    id: string;
    title: string;
  };
  chapter?: {
    id: string;
    title: string;
  };
  course?: {
    id: string;
    title: string;
  };
  statistics?: {
    totalSubmissions: number;
    averageScore: number;
    passRate: number;
  };
}

// 题目接口
export interface Question {
  id: string;
  title: string;
  content: string;
  type: string;
  difficulty: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  knowledgePointId: string;
  assignmentId?: string;
  createdAt: string;
  updatedAt: string;
  selected?: boolean; // 用于标记是否选中
}