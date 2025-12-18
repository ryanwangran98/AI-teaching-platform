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
} as const;