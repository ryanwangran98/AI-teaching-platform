export interface Chapter {
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