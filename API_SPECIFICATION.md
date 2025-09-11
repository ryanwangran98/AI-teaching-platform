# API接口设计文档

## 1. API概述

本文档详细描述了AI融合教学平台的RESTful API接口设计规范，包括接口URL、请求参数、响应格式、状态码等信息。平台采用前后端分离架构，前端通过这些API与后端进行数据交互。

## 2. API基础信息

### 2.1 基础URL
```
http://localhost:3001/api
```

### 2.2 认证方式
- JWT (JSON Web Token)认证
- Token通过Authorization头传递，格式：`Bearer {token}`

### 2.3 响应格式
所有API响应均采用JSON格式，包含以下基本结构：
```json
{
  "success": true/false,
  "data": {}, // 响应数据
  "error": "", // 错误信息（当success=false时）
  "message": "" // 提示信息
}
```

### 2.4 HTTP状态码
- `200 OK`: 请求成功
- `201 Created`: 创建资源成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权或Token失效
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 3. API详细文档

### 3.1 认证API (Auth)

#### 3.1.1 用户注册
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Request Body**: 
```json
{
  "email": "string", // 必需
  "password": "string", // 必需
  "firstName": "string", // 必需
  "lastName": "string", // 必需
  "role": "string" // 可选，STUDENT/TEACHER/ADMIN，默认STUDENT
}
```
- **Response**: 
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "string",
      "createdAt": "string"
    },
    "token": "string"
  }
}
```

#### 3.1.2 用户登录
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**: 
```json
{
  "email": "string", // 必需
  "password": "string" // 必需
}
```
- **Response**: 
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "string",
      "avatar": "string"
    },
    "token": "string"
  }
}
```

#### 3.1.3 获取当前用户信息
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string",
    "avatar": "string",
    "createdAt": "string"
  }
}
```

### 3.2 用户API (Users)

#### 3.2.1 获取用户列表
- **URL**: `/api/users`
- **Method**: `GET`
- **Auth**: 必需 (ADMIN)
- **Query Params**: 
  - `page`: 页码
  - `limit`: 每页数量
  - `role`: 用户角色筛选
  - `search`: 搜索关键词
- **Response**: 用户列表分页数据

#### 3.2.2 获取教师列表
- **URL**: `/api/users/teachers`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 教师用户列表

#### 3.2.3 获取用户个人资料
- **URL**: `/api/users/profile`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 当前用户详细资料

#### 3.2.4 更新用户个人资料
- **URL**: `/api/users/profile`
- **Method**: `PUT`
- **Auth**: 必需
- **Request Body**: 用户资料更新字段（部分字段）
- **Response**: 更新后的用户资料

#### 3.2.5 更新用户状态
- **URL**: `/api/users/{id}/status`
- **Method**: `PUT`
- **Auth**: 必需 (ADMIN)
- **Request Body**: 
```json
{
  "isActive": boolean
}
```
- **Response**: 操作结果

### 3.3 课程API (Courses)

#### 3.3.1 获取课程列表
- **URL**: `/api/courses`
- **Method**: `GET`
- **Auth**: 必需
- **Query Params**: 
  - `page`: 页码
  - `limit`: 每页数量
  - `subject`: 学科筛选
  - `grade`: 年级筛选
- **Response**: 课程列表分页数据

#### 3.3.2 获取我的课程（教师）
- **URL**: `/api/courses/teacher/my-courses`
- **Method**: `GET`
- **Auth**: 必需 (TEACHER)
- **Response**: 当前教师创建的课程列表

#### 3.3.3 获取我的课程（学生）
- **URL**: `/api/courses/student/my-courses`
- **Method**: `GET`
- **Auth**: 必需 (STUDENT)
- **Response**: 当前学生已选的课程列表

#### 3.3.4 获取课程详情
- **URL**: `/api/courses/{id}`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 课程详细信息（包含章节、知识点等关联数据）

#### 3.3.5 创建课程
- **URL**: `/api/courses`
- **Method**: `POST`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 
```json
{
  "code": "string", // 必需
  "name": "string", // 必需
  "description": "string",
  "credits": number,
  "department": "string",
  "category": "string",
  "difficulty": "string",
  "coverImage": "string"
}
```
- **Response**: 创建的课程详情

#### 3.3.6 更新课程
- **URL**: `/api/courses/{id}`
- **Method**: `PUT`
- **Auth**: 必需 (TEACHER，且为课程创建者)
- **Request Body**: 课程更新字段（部分字段）
- **Response**: 更新后的课程详情

#### 3.3.7 删除课程
- **URL**: `/api/courses/{id}`
- **Method**: `DELETE`
- **Auth**: 必需 (TEACHER，且为课程创建者)
- **Response**: 操作结果

#### 3.3.8 发布课程
- **URL**: `/api/courses/{id}/publish`
- **Method**: `PATCH`
- **Auth**: 必需 (TEACHER)
- **Response**: 操作结果

#### 3.3.9 取消发布课程
- **URL**: `/api/courses/{id}/unpublish`
- **Method**: `PATCH`
- **Auth**: 必需 (TEACHER)
- **Response**: 操作结果

#### 3.3.10 学生加入课程
- **URL**: `/api/courses/{id}/enroll`
- **Method**: `POST`
- **Auth**: 必需 (STUDENT)
- **Response**: 操作结果

#### 3.3.11 学生退出课程
- **URL**: `/api/courses/{id}/enroll`
- **Method**: `DELETE`
- **Auth**: 必需 (STUDENT)
- **Response**: 操作结果

#### 3.3.12 获取教师最近活动
- **URL**: `/api/courses/teacher/recent-activities`
- **Method**: `GET`
- **Auth**: 必需 (TEACHER)
- **Query Params**: 
  - `limit`: 最大记录数
- **Response**: 教师最近活动记录列表

### 3.4 章节API (Chapters)

#### 3.4.1 获取章节列表
- **URL**: `/api/chapters`
- **Method**: `GET`
- **Auth**: 必需
- **Query Params**: 
  - `courseId`: 课程ID（必需）
  - `status`: 状态筛选
- **Response**: 章节列表

#### 3.4.2 获取章节详情
- **URL**: `/api/chapters/{id}`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 章节详细信息

#### 3.4.3 创建章节
- **URL**: `/api/chapters`
- **Method**: `POST`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 
```json
{
  "title": "string", // 必需
  "content": "string",
  "order": number, // 必需
  "status": "string",
  "courseId": "string" // 必需
}
```
- **Response**: 创建的章节详情

#### 3.4.4 更新章节
- **URL**: `/api/chapters/{id}`
- **Method**: `PUT`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 章节更新字段（部分字段）
- **Response**: 更新后的章节详情

#### 3.4.5 删除章节
- **URL**: `/api/chapters/{id}`
- **Method**: `DELETE`
- **Auth**: 必需 (TEACHER)
- **Response**: 操作结果

### 3.5 作业API (Assignments)

#### 3.5.1 获取作业列表
- **URL**: `/api/assignments`
- **Method**: `GET`
- **Auth**: 必需
- **Query Params**: 
  - `courseId`: 课程ID
  - `status`: 状态筛选
- **Response**: 作业列表

#### 3.5.2 获取我的作业（教师）
- **URL**: `/api/assignments/teacher/my-assignments`
- **Method**: `GET`
- **Auth**: 必需 (TEACHER)
- **Query Params**: 
  - `status`: 状态筛选
- **Response**: 当前教师创建的作业列表

#### 3.5.3 获取作业详情
- **URL**: `/api/assignments/{id}`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 作业详细信息（包含题目、提交记录等关联数据）

#### 3.5.4 创建作业
- **URL**: `/api/assignments`
- **Method**: `POST`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 
```json
{
  "title": "string", // 必需
  "description": "string",
  "type": "string",
  "totalPoints": number,
  "dueDate": "string", // 必需 (ISO日期格式)
  "status": "string",
  "knowledgePointId": "string", // 必需
  "questions": [string] // 题目ID数组
}
```
- **Response**: 创建的作业详情

#### 3.5.5 更新作业
- **URL**: `/api/assignments/{id}`
- **Method**: `PUT`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 作业更新字段（部分字段）
- **Response**: 更新后的作业详情

#### 3.5.6 删除作业
- **URL**: `/api/assignments/{id}`
- **Method**: `DELETE`
- **Auth**: 必需 (TEACHER)
- **Response**: 操作结果

#### 3.5.7 提交作业
- **URL**: `/api/assignments/{id}/submit`
- **Method**: `POST`
- **Auth**: 必需 (STUDENT)
- **Request Body**: 
  - FormData格式，包含：
    - `content`: 答案内容（JSON字符串）
    - `files`: 文件（可选，支持多个文件）
- **Response**: 提交结果（包含得分等信息）

#### 3.5.8 评分作业
- **URL**: `/api/assignments/{id}/submissions/{submissionId}/grade`
- **Method**: `POST`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 
```json
{
  "score": number, // 必需
  "feedback": "string"
}
```
- **Response**: 评分结果

### 3.6 题库API (Questions)

#### 3.6.1 获取题目列表
- **URL**: `/api/questions`
- **Method**: `GET`
- **Auth**: 必需
- **Query Params**: 
  - `courseId`: 课程ID
  - `chapterId`: 章节ID
  - `type`: 题目类型
  - `difficulty`: 难度级别
- **Response**: 题目列表

#### 3.6.2 获取题目详情
- **URL**: `/api/questions/{id}`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 题目详细信息

#### 3.6.3 创建题目
- **URL**: `/api/questions`
- **Method**: `POST`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 
```json
{
  "title": "string", // 必需
  "content": "string", // 必需
  "type": "string",
  "difficulty": "string",
  "points": number,
  "options": "string", // JSON格式的选项
  "correctAnswer": "string",
  "explanation": "string",
  "knowledgePointId": "string", // 必需
  "assignmentId": "string" // 可选
}
```
- **Response**: 创建的题目详情

#### 3.6.4 更新题目
- **URL**: `/api/questions/{id}`
- **Method**: `PUT`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 题目更新字段（部分字段）
- **Response**: 更新后的题目详情

#### 3.6.5 删除题目
- **URL**: `/api/questions/{id}`
- **Method**: `DELETE`
- **Auth**: 必需 (TEACHER)
- **Response**: 操作结果

### 3.7 知识点API (Knowledge-Points)

#### 3.7.1 获取知识点列表
- **URL**: `/api/knowledge-points`
- **Method**: `GET`
- **Auth**: 必需
- **Query Params**: 
  - `courseId`: 课程ID
  - `chapterId`: 章节ID
  - `search`: 搜索关键词
- **Response**: 知识点列表

#### 3.7.2 获取知识点详情
- **URL**: `/api/knowledge-points/{id}`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 知识点详细信息

#### 3.7.3 创建知识点
- **URL**: `/api/knowledge-points`
- **Method**: `POST`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 
```json
{
  "title": "string", // 必需
  "description": "string",
  "content": "string",
  "order": number, // 必需
  "difficulty": "string",
  "importance": "string",
  "status": "string",
  "chapterId": "string" // 必需
}
```
- **Response**: 创建的知识点详情

#### 3.7.4 更新知识点
- **URL**: `/api/knowledge-points/{id}`
- **Method**: `PUT`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 知识点更新字段（部分字段）
- **Response**: 更新后的知识点详情

#### 3.7.5 删除知识点
- **URL**: `/api/knowledge-points/{id}`
- **Method**: `DELETE`
- **Auth**: 必需 (TEACHER)
- **Response**: 操作结果

### 3.8 课件API (Coursewares)

#### 3.8.1 获取课件列表
- **URL**: `/api/coursewares`
- **Method**: `GET`
- **Auth**: 必需
- **Query Params**: 
  - `courseId`: 课程ID
  - `chapterId`: 章节ID
  - `type`: 课件类型
- **Response**: 课件列表

#### 3.8.2 获取课件详情
- **URL**: `/api/coursewares/{id}`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 课件详细信息

#### 3.8.3 创建课件
- **URL**: `/api/coursewares`
- **Method**: `POST`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 
  - FormData格式，包含：
    - `title`: 标题
    - `description`: 描述
    - `type`: 类型
    - `chapterId`: 章节ID（可选）
    - `file`: 文件（必需）
- **Response**: 创建的课件详情

#### 3.8.4 更新课件
- **URL**: `/api/coursewares/{id}`
- **Method**: `PUT`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 课件更新字段（部分字段）
- **Response**: 更新后的课件详情

#### 3.8.5 删除课件
- **URL**: `/api/coursewares/{id}`
- **Method**: `DELETE`
- **Auth**: 必需 (TEACHER)
- **Response**: 操作结果

### 3.9 学习资料API (Materials)

#### 3.9.1 获取学习资料列表
- **URL**: `/api/materials`
- **Method**: `GET`
- **Auth**: 必需
- **Query Params**: 
  - `courseId`: 课程ID
  - `chapterId`: 章节ID
  - `type`: 资料类型
- **Response**: 学习资料列表

#### 3.9.2 获取学习资料详情
- **URL**: `/api/materials/{id}`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 学习资料详细信息

#### 3.9.3 创建学习资料
- **URL**: `/api/materials`
- **Method**: `POST`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 
  - FormData格式，包含：
    - `title`: 标题
    - `description`: 描述
    - `type`: 类型
    - `chapterId`: 章节ID（必需）
    - `file`: 文件（必需）
- **Response**: 创建的学习资料详情

#### 3.9.4 更新学习资料
- **URL**: `/api/materials/{id}`
- **Method**: `PUT`
- **Auth**: 必需 (TEACHER)
- **Request Body**: 学习资料更新字段（部分字段）
- **Response**: 更新后的学习资料详情

#### 3.9.5 删除学习资料
- **URL**: `/api/materials/{id}`
- **Method**: `DELETE`
- **Auth**: 必需 (TEACHER)
- **Response**: 操作结果

### 3.10 提交记录API (Submissions)

#### 3.10.1 获取提交记录列表
- **URL**: `/api/submissions`
- **Method**: `GET`
- **Auth**: 必需
- **Query Params**: 
  - `assignmentId`: 作业ID
  - `status`: 状态筛选
- **Response**: 提交记录列表

#### 3.10.2 获取提交记录详情
- **URL**: `/api/submissions/{id}`
- **Method**: `GET`
- **Auth**: 必需
- **Response**: 提交记录详细信息

### 3.11 学习记录API (Learning-Records)

#### 3.11.1 获取学习记录列表
- **URL**: `/api/learning-records`
- **Method**: `GET`
- **Auth**: 必需
- **Query Params**: 
  - `courseId`: 课程ID
  - `studentId`: 学生ID
- **Response**: 学习记录列表

#### 3.11.2 创建学习记录
- **URL**: `/api/learning-records`
- **Method**: `POST`
- **Auth**: 必需
- **Request Body**: 学习记录数据
- **Response**: 创建的学习记录

#### 3.11.3 更新学习记录
- **URL**: `/api/learning-records/{id}`
- **Method**: `PUT`
- **Auth**: 必需
- **Request Body**: 学习记录更新字段
- **Response**: 更新后的学习记录

#### 3.11.4 删除学习记录
- **URL**: `/api/learning-records/{id}`
- **Method**: `DELETE`
- **Auth**: 必需
- **Response**: 操作结果

### 3.12 通知API (Notifications)

#### 3.12.1 获取通知列表
- **URL**: `/api/notifications`
- **Method**: `GET`
- **Auth**: 必需
- **Query Params**: 
  - `page`: 页码
  - `limit`: 每页数量
  - `isRead`: 是否已读筛选
- **Response**: 通知列表分页数据

#### 3.12.2 创建通知
- **URL**: `/api/notifications`
- **Method**: `POST`
- **Auth**: 必需
- **Request Body**: 通知数据
- **Response**: 创建的通知

#### 3.12.3 标记通知为已读
- **URL**: `/api/notifications/{id}/read`
- **Method**: `PUT`
- **Auth**: 必需
- **Response**: 操作结果

#### 3.12.4 标记所有通知为已读
- **URL**: `/api/notifications/read-all`
- **Method**: `PUT`
- **Auth**: 必需
- **Response**: 操作结果

#### 3.12.5 删除通知
- **URL**: `/api/notifications/{id}`
- **Method**: `DELETE`
- **Auth**: 必需
- **Response**: 操作结果

### 3.13 文件上传API (Upload)

#### 3.13.1 上传文件
- **URL**: `/api/upload`
- **Method**: `POST`
- **Auth**: 必需
- **Request Body**: 
  - FormData格式，包含文件
- **Response**: 
```json
{
  "success": true,
  "data": {
    "fileUrl": "string",
    "fileSize": number,
    "fileName": "string"
  }
}
```

## 4. API安全规范

1. **认证与授权**
   - 所有API接口均需进行身份验证（除登录、注册接口外）
   - 敏感操作需进行权限验证

2. **请求限制**
   - API接口实施请求频率限制，防止恶意请求

3. **数据验证**
   - 所有请求数据均进行严格的格式和业务逻辑验证

4. **错误处理**
   - 统一的错误处理机制，返回明确的错误信息

## 5. API版本控制

当前版本为v1，后续版本升级将通过URL路径进行版本控制，例如：
```
http://localhost:3001/api/v2/...
```

## 6. 最佳实践

1. **请求重试**
   - 对于网络不稳定的环境，建议实现请求重试机制

2. **超时处理**
   - 设置合理的请求超时时间（建议10-30秒）

3. **分页查询**
   - 对于返回大量数据的接口，务必使用分页参数

4. **错误日志**
   - 记录API调用错误，便于问题排查