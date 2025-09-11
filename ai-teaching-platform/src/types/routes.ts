export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // 教师端
  TEACHER_DASHBOARD: '/teacher',
  TEACHER_COURSES: '/teacher/courses',
  TEACHER_COURSE_DETAIL: '/teacher/courses/:id',
  
  // 学生端
  STUDENT_DASHBOARD: '/student',
  STUDENT_COURSES: '/student/courses',
  STUDENT_COURSE_DETAIL: '/student/courses/:id',
  
  // 管理员端
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_COURSES: '/admin/courses',
  
  // AI功能
  AI_COURSEWARE_ASSISTANT: '/ai/courseware-assistant',
  AI_CORRECTION_ASSISTANT: '/ai/correction-assistant',
  AI_QUESTION_ASSISTANT: '/ai/question-assistant',
  AI_TEACHING_ASSISTANT: '/ai/teaching-assistant',
  AI_WARNING_SYSTEM: '/ai/warning-system',
  AI_CONTENT_GENERATION: '/ai/content-generation',
  AI_VIDEO_GENERATION: '/ai/video-generation',
  AI_VIDEO_MANAGEMENT: '/ai/video-management',
} as const;