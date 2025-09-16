import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// 页面组件
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TestPage from './pages/TestPage';
import CourseBrowser from './pages/CourseBrowser';

// 教师端页面
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CoursewareManagement from './pages/teacher/CoursewareManagement';
import MaterialManagement from './pages/teacher/MaterialManagement';
import ChapterManagement from './pages/teacher/ChapterManagement';
import NotificationManagement from './pages/teacher/NotificationManagement';
import KnowledgePointManagement from './pages/teacher/KnowledgePointManagement';
import QuestionBankManagement from './pages/teacher/QuestionBankManagement';
import AssignmentManagement from './pages/teacher/AssignmentManagement';
import AssignmentQuestions from './pages/teacher/AssignmentQuestions'; // 添加导入
import AssignmentGrading from './pages/teacher/AssignmentGrading';
import QuestionBank from './pages/teacher/QuestionBank';
import TeacherCourseManagement from './pages/teacher/TeacherCourseManagement';
import CreateCourse from './pages/teacher/CreateCourse';
import ResourceManagement from './pages/teacher/ResourceManagement';

// 教师端布局
import TeacherLayout from './layouts/TeacherLayout';

// 学生端布局
import StudentLayout from './layouts/StudentLayout';

// 学生端页面
import StudentDashboard from './pages/student/StudentDashboard';
import LearningRecords from './pages/student/LearningRecords';
import ChapterLearning from './pages/student/ChapterLearning';
import MyCourses from './pages/student/MyCourses';
import CourseLearning from './pages/student/CourseLearning';
import StudentCourseManagement from './pages/student/StudentCourseManagement';
import Materials from './pages/student/Materials';
import NotificationsPage from './pages/student/Notifications';
import CourseGraph from './pages/student/CourseGraph';
import AssignmentDetail from './pages/student/assignments/AssignmentDetail';

// 管理员端页面
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';

// AI功能页面
import AICoursewareAssistant from './pages/ai/AICoursewareAssistant';

// 路由保护组件
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 将用户角色和允许的角色都转换为小写进行比较
  const userRole = user.role?.toLowerCase();
  const allowedRolesLower = allowedRoles.map(role => role.toLowerCase());

  if (!allowedRolesLower.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* 公共路由 */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/courses" element={<CourseBrowser />} />

      {/* 教师端路由 */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="notifications" element={<NotificationManagement />} />
        <Route path="courses" element={<TeacherCourseManagement />} />
        <Route path="courses/new" element={<CreateCourse />} />
      </Route>

      {/* 资源管理路由 - 独立于TeacherLayout */}
      <Route
        path="/teacher/courses/:courseId"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ResourceManagement />
          </ProtectedRoute>
        }
      >
        <Route index element={<div>课程信息</div>} />
        <Route path="courseware" element={<CoursewareManagement />} />
        <Route path="materials" element={<MaterialManagement />} />
        <Route path="chapters" element={<ChapterManagement />} />
        <Route path="graph" element={<CourseGraph />} />
        <Route path="knowledge-points" element={<KnowledgePointManagement />} />
        <Route path="questions" element={<QuestionBankManagement />} />
        <Route path="assignments" element={<AssignmentManagement />} />
        <Route path="assignments/:assignmentId/questions" element={<AssignmentQuestions />} /> {/* 更新路由 */}
        <Route path="assignments/:assignmentId/grading" element={<AssignmentGrading />} />
      </Route>

      {/* 学生端路由 */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="learning-records" element={<LearningRecords />} />
        <Route path="chapter-learning" element={<ChapterLearning />} />
        <Route path="my-courses" element={<MyCourses />} />
        <Route path="course/:courseId">
          <Route index element={<CourseLearning />} />
          <Route path="assignment/:assignmentId" element={<AssignmentDetail />} />
        </Route>
        <Route path="courses" element={<StudentCourseManagement />} />
        <Route path="courses/explore" element={<StudentCourseManagement />} />
        <Route path="courses/materials" element={<Materials />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* 管理员端路由 */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CourseManagement />
          </ProtectedRoute>
        }
      />

      {/* AI功能路由 */}
      <Route path="/ai/courseware-assistant" element={<AICoursewareAssistant />} />

      {/* 测试页面 */}
      <Route path="/test-page" element={<TestPage />} />

      {/* 404页面 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;