export interface LearningRecord {
  id: string;
  studentId: string;
  courseId: string;
  chapterId: string;
  progress: number;
  duration: number;
  lastStudyTime: string;
  completedAt?: string;
}