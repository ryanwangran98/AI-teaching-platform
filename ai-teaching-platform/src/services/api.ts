import axios from 'axios';
import type { User, RegisterData } from '../types/auth';
import type { Course } from '../types/course';
import type { Chapter } from '../types/chapter';
import type { Assignment } from '../types/assignment';
import type { LearningRecord } from '../types/learning-record';

// 使用相对路径，利用Vite的代理配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 增加超时时间到60秒
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'Accept': 'application/json;charset=UTF-8',
  },
});

// 创建专门用于文件上传的API实例，使用更长的超时时间
const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 文件上传使用300秒(5分钟)超时
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'Accept': 'application/json;charset=UTF-8',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { email: username, password });
    return response.data;
  },

  register: async (userData: RegisterData) => {
    const backendData = {
      email: userData.email,
      username: userData.username,
      password: userData.password,
      firstName: userData.realName || userData.username,
      lastName: userData.realName || userData.username,
      role: userData.role?.toUpperCase() || 'STUDENT'
    };
    const response = await api.post('/auth/register', backendData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (userData: Partial<User>) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getTeachers: async () => {
    const response = await api.get('/users/teachers');
    return response.data;
  },

  updateUserStatus: async (id: string, isActive: boolean) => {
    const response = await api.put(`/users/${id}/status`, { isActive });
    return response.data;
  },
};

// 课程相关
export const courseAPI = {
  getCourses: async (params?: { page?: number; limit?: number; subject?: string; grade?: string }) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getMyCourses: async () => {
    const response = await api.get('/courses/teacher/my-courses');
    return response.data;
  },

  getStudentCourses: async () => {
    const response = await api.get('/courses/student/my-courses');
    return response.data;
  },

  getCourse: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  createCourse: async (courseData: any) => {
    console.log('发送创建课程请求:', JSON.stringify(courseData, null, 2));
    const response = await api.post('/courses', courseData);
    console.log('创建课程响应:', response.data);
    return response.data;
  },

  updateCourse: async (id: string, courseData: Partial<Course>) => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  },

  deleteCourse: async (id: string) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  // 发布课程
  publishCourse: async (id: string) => {
    const response = await api.patch(`/courses/${id}/publish`);
    return response.data;
  },

  // 取消发布课程
  unpublishCourse: async (id: string) => {
    const response = await api.patch(`/courses/${id}/unpublish`);
    return response.data;
  },

  // 学生加入课程
  enrollCourse: async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  // 学生退出课程
  unenrollCourse: async (courseId: string) => {
    const response = await api.delete(`/courses/${courseId}/enroll`);
    return response.data;
  },

  // 获取教师最近活动
  getTeacherRecentActivities: async (limit?: number) => {
    const response = await api.get('/courses/teacher/recent-activities', { 
      params: { limit } 
    });
    return response.data;
  },

  // 创建或重新创建课程的Agent应用
  createAgentApp: async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/agent-app`);
    return response.data;
  },

  // 获取课程的Agent应用信息
  getAgentAppInfo: async (courseId: string) => {
    const response = await api.get(`/courses/${courseId}/agent-app`);
    return response.data;
  },

  // 获取课程的AI助手关联信息
  getAssistantAssociations: async (courseId: string) => {
    const response = await api.get(`/courses/${courseId}/assistant-associations`);
    return response.data;
  },

  // 获取课程材料
  getCourseMaterials: async (courseId: string) => {
    const response = await api.get(`/materials?courseId=${courseId}`);
    return response.data;
  },

  // 获取课程详情
  getCourseById: async (courseId: string) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

};

// 章节相关
export const chapterAPI = {
  getChapters: async (courseId?: string, status?: string) => {
    const response = await api.get('/chapters', { params: { courseId, status } });
    return response.data;
  },

  getChapter: async (chapterId: string) => {
    const response = await api.get(`/chapters/${chapterId}`);
    return response.data;
  },

  createChapter: async (courseId: string, chapterData: Partial<Chapter>) => {
    const response = await api.post('/chapters', { ...chapterData, courseId });
    return response.data;
  },

  updateChapter: async (chapterId: string, chapterData: Partial<Chapter>) => {
    const response = await api.put(`/chapters/${chapterId}`, chapterData);
    return response.data;
  },

  deleteChapter: async (chapterId: string) => {
    const response = await api.delete(`/chapters/${chapterId}`);
    return response.data;
  },

  // 上传章节学习视频
  uploadChapterVideo: async (chapterId: string, formData: FormData) => {
    const response = await api.post(`/chapters/${chapterId}/video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// 作业相关
export const assignmentAPI = {
  getAssignments: async (params?: { courseId?: string; status?: string }) => {
    const response = await api.get('/assignments', { params });
    return response.data;
  },

  getMyAssignments: async (params?: { status?: string }) => {
    const response = await api.get('/assignments/teacher/my-assignments', { params });
    return response.data;
  },

  getAssignment: async (id: string) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  createAssignment: async (assignmentData: Partial<Assignment>) => {
    const response = await api.post('/assignments', assignmentData);
    return response.data;
  },

  updateAssignment: async (id: string, assignmentData: Partial<Assignment>) => {
    const response = await api.put(`/assignments/${id}`, assignmentData);
    return response.data;
  },

  deleteAssignment: async (id: string) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },

  submitAssignment: async (id: string, submissionData: { assignmentId: string; answers: any[] }) => {
    console.log('提交的作业数据:', submissionData);
    try {
      // 修复：确保使用正确的端点和数据格式
      const response = await api.post('/submissions', submissionData);
      console.log('提交成功，响应:', response);
      return response.data;
    } catch (error: any) {
      console.error('提交失败，错误详情:', error.response?.data || error.message);
      throw error;
    }
  },

  gradeAssignment: async (id: string, submissionId: string, gradeData: { score: number; feedback: string }) => {
    const response = await api.post(`/assignments/${id}/submissions/${submissionId}/grade`, gradeData);
    return response.data;
  },
};

// 题库相关
export const questionAPI = {
  getQuestions: async (params?: { courseId?: string; chapterId?: string; type?: string; difficulty?: string; assignmentId?: string }) => {
    const response = await api.get('/questions', { params });
    return response.data;
  },

  getQuestion: async (id: string) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  createQuestion: async (questionData: any) => {
    const response = await api.post('/questions', questionData);
    return response.data;
  },

  updateQuestion: async (id: string, questionData: any) => {
    const response = await api.put(`/questions/${id}`, questionData);
    return response.data;
  },

  deleteQuestion: async (id: string) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },
};

// 知识点相关
export const knowledgePointAPI = {
  getKnowledgePoints: async (params?: { courseId?: string; chapterId?: string; search?: string }) => {
    const response = await api.get('/knowledge-points', { params });
    return response.data;
  },

  getKnowledgePoint: async (id: string) => {
    const response = await api.get(`/knowledge-points/${id}`);
    return response.data;
  },

  createKnowledgePoint: async (knowledgePointData: any) => {
    const response = await api.post('/knowledge-points', knowledgePointData);
    return response.data;
  },

  updateKnowledgePoint: async (id: string, knowledgePointData: any) => {
    const response = await api.put(`/knowledge-points/${id}`, knowledgePointData);
    return response.data;
  },

  deleteKnowledgePoint: async (id: string) => {
    const response = await api.delete(`/knowledge-points/${id}`);
    return response.data;
  },
};

// 课件相关
export const coursewareAPI = {
  getCoursewares: async (params?: { courseId?: string; chapterId?: string; type?: string }) => {
    const response = await api.get('/coursewares', { params });
    return response.data;
  },

  getCourseware: async (id: string) => {
    const response = await api.get(`/coursewares/${id}`);
    return response.data;
  },

  createCourseware: async (coursewareData: any) => {
    // 检查是否包含文件对象，如果有，需要特殊处理文件上传
    if (coursewareData.file) {
      // 创建FormData对象来处理文件上传
      const formData = new FormData();
      formData.append('title', coursewareData.title);
      formData.append('description', coursewareData.description || '');
      formData.append('type', coursewareData.type);
      if (coursewareData.chapterId) {
        formData.append('chapterId', coursewareData.chapterId);
      }
      formData.append('file', coursewareData.file);
      
      // 不再需要临时的mockUrl，后端会从上传的文件中提取URL和文件大小
      
      // 修改请求头，让axios自动处理Content-Type
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await api.post('/coursewares', formData, config);
      return response.data;
    } else {
      // 如果没有文件，按照原来的方式处理
      const response = await api.post('/coursewares', coursewareData);
      return response.data;
    }
  },

  updateCourseware: async (id: string, coursewareData: any) => {
    const response = await api.put(`/coursewares/${id}`, coursewareData);
    return response.data;
  },

  deleteCourseware: async (id: string) => {
    const response = await api.delete(`/coursewares/${id}`);
    return response.data;
  },
};

// 资料相关
export const materialAPI = {
  getMaterials: async (params?: { courseId?: string; chapterId?: string; type?: string }) => {
    const response = await api.get('/materials', { params });
    return response.data;
  },

  getMaterial: async (id: string) => {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },

  createMaterial: async (materialData: any) => {
    // 检查是否包含文件对象，如果有，需要特殊处理文件上传
    if (materialData.file) {
      // 创建FormData对象来处理文件上传
      const formData = new FormData();
      formData.append('title', materialData.title);
      formData.append('description', materialData.description || '');
      formData.append('type', materialData.type);
      if (materialData.chapterId) {
        formData.append('chapterId', materialData.chapterId);
      }
      formData.append('file', materialData.file);
      
      // 修改请求头，让axios自动处理Content-Type
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await api.post('/materials', formData, config);
      return response.data;
    } else {
      // 如果没有文件，按照原来的方式处理
      const response = await api.post('/materials', materialData);
      return response.data;
    }
  },

  updateMaterial: async (id: string, materialData: any) => {
    const response = await api.put(`/materials/${id}`, materialData);
    return response.data;
  },

  deleteMaterial: async (id: string) => {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  },
};

// 学习记录相关
export const learningRecordAPI = {
  getLearningRecords: async (params?: { courseId?: string; studentId?: string }) => {
    const response = await api.get('/learning-records', { params });
    return response.data;
  },

  createLearningRecord: async (recordData: Partial<LearningRecord>) => {
    const response = await api.post('/learning-records', recordData);
    return response.data;
  },

  updateLearningRecord: async (id: string, recordData: Partial<LearningRecord>) => {
    const response = await api.put(`/learning-records/${id}`, recordData);
    return response.data;
  },

  deleteLearningRecord: async (id: string) => {
    const response = await api.delete(`/learning-records/${id}`);
    return response.data;
  },
};

// 章节进度相关
export const chapterProgressAPI = {
  getChapterProgress: async (params?: { courseId?: string; chapterId?: string }) => {
    const response = await api.get('/chapter-progress', { params });
    return response.data;
  },

  getChapterProgressById: async (chapterId: string) => {
    const response = await api.get(`/chapter-progress/${chapterId}`);
    return response.data;
  },

  updateChapterProgress: async (chapterId: string, progressData: { 
    watchedTime?: number; 
    progress?: number; 
    courseId: string; 
  }) => {
    const response = await api.put(`/chapter-progress/${chapterId}`, progressData);
    return response.data;
  },

  deleteChapterProgress: async (chapterId: string) => {
    const response = await api.delete(`/chapter-progress/${chapterId}`);
    return response.data;
  },

  resetChapterProgress: async (chapterId: string) => {
    const response = await api.post(`/chapter-progress/${chapterId}/reset`);
    return response.data;
  },
};

// 学生统计信息相关
export const studentStatsAPI = {
  getStudentStats: async (courseId: string) => {
    const timestamp = new Date().getTime();
    const response = await api.get(`/student-stats/student-stats/${courseId}`, { 
      params: { t: timestamp } 
    });
    return response.data;
  },

  getWeeklyActiveStudents: async () => {
    const response = await api.get('/student-stats/weekly-active-students');
    return response.data;
  },
};

// 提交相关
export const submissionAPI = {
  getSubmissions: async (params?: { 
    assignmentId?: string; 
    studentId?: string; 
    status?: string; 
    page?: number; 
    limit?: number; 
  }) => {
    const response = await api.get('/submissions', { params });
    return response.data;
  },

  getSubmission: async (id: string) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },

  createSubmission: async (submissionData: any) => {
    const response = await api.post('/submissions', submissionData);
    return response.data;
  },

  updateSubmission: async (id: string, submissionData: any) => {
    const response = await api.put(`/submissions/${id}`, submissionData);
    return response.data;
  },

  deleteSubmission: async (id: string) => {
    const response = await api.delete(`/submissions/${id}`);
    return response.data;
  },
};

// 通知相关
export const notificationAPI = {
  getNotifications: async (params?: { page?: number; limit?: number; isRead?: boolean }) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  createNotification: async (notificationData: any) => {
    const response = await api.post('/notifications', notificationData);
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  publishNotification: async (id: string) => {
    const response = await api.put(`/notifications/${id}/publish`);
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

// 视频播放片段相关
export const videoSegmentAPI = {
  getVideoSegments: async (chapterId: string) => {
    const response = await api.get(`/video-segments/chapter/${chapterId}`);
    return response.data;
  },

  addVideoSegment: async (chapterId: string, segmentData: { startTime: number; endTime: number }) => {
    const response = await api.post(`/video-segments/chapter/${chapterId}`, segmentData);
    return response.data;
  },

  getCourseProgressByVideoSegments: async (courseId: string) => {
    const response = await api.get(`/video-segments/course/${courseId}/progress`);
    return response.data;
  },
};

export default api;