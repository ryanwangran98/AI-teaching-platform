export interface Course {
  id: string;
  title: string;
  name?: string;
  code: string;
  description: string;
  teacherId: string;
  teacherName: string;
  department?: string;
  category?: string;
  credits: number;
  coverImage?: string;
  status?: string;
  level?: string;
  tags?: string[];
  agentAppId?: string;      // Dify Agent应用ID
  agentAccessToken?: string; // Dify Agent应用访问令牌
  chapters: CourseChapter[];
  materials: CourseMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseChapter {
  id: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
  videoUrl?: string;
  duration?: number;
  isCompleted?: boolean;
  createdAt: string;
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  type: 'pdf' | 'video' | 'image' | 'document' | 'other';
  url: string;
  size: number;
  uploadDate: string;
}