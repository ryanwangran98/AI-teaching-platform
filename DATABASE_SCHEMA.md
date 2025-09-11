# 数据库设计文档

## 1. 数据库概述

本系统采用SQLite数据库，通过Prisma ORM进行数据访问。SQLite是一种轻量级的文件数据库，适合开发阶段和小型应用场景。本文档详细描述了系统的数据模型、表结构、字段定义和关系设计。

## 2. 数据模型总览

系统包含12个核心数据模型，它们之间通过外键建立关联，形成完整的数据关系网络：

1. **User** - 用户表（管理员、教师、学生）
2. **Course** - 课程表
3. **Chapter** - 章节表
4. **KnowledgePoint** - 知识点表
5. **Enrollment** - 选课记录表
6. **Assignment** - 作业表
7. **Submission** - 作业提交表
8. **Question** - 题库表
9. **Material** - 学习资料表
10. **Courseware** - 课件表
11. **Notification** - 通知表
12. **LearningRecord** - 学习记录表

## 3. 数据模型详细设计

### 3.1 User (用户表)

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  username      String         @unique
  password      String
  firstName     String
  lastName      String
  avatar        String?
  role          String         @default("STUDENT")
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  assignments   Assignment[]
  courses       Course[]
  courseware    Courseware[]
  enrollments   Enrollment[]
  materials     Material[]
  notifications Notification[]
  questions     Question[]
  submissions   Submission[]

  @@map("users")
}
```

**字段说明：**
- `id`: 用户唯一标识
- `email`: 电子邮箱（登录凭证，唯一）
- `username`: 用户名（唯一）
- `password`: 密码（加密存储）
- `firstName`: 名字
- `lastName`: 姓氏
- `avatar`: 头像URL
- `role`: 用户角色（STUDENT, TEACHER, ADMIN）
- `isActive`: 用户状态
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**关系：**
- 一对多：User -> Assignment
- 一对多：User -> Course
- 一对多：User -> Courseware
- 一对多：User -> Enrollment
- 一对多：User -> Material
- 一对多：User -> Notification
- 一对多：User -> Question
- 一对多：User -> Submission

### 3.2 Course (课程表)

```prisma
model Course {
  id          String       @id @default(cuid())
  code        String       @unique
  name        String
  description String?
  credits     Int          @default(3)
  department  String
  category    String
  difficulty  String       @default("MEDIUM")
  coverImage  String?
  status      String       @default("DRAFT")
  teacherId   String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  chapters    Chapter[]
  teacher     User         @relation(fields: [teacherId], references: [id])
  enrollments Enrollment[]

  @@map("courses")
}
```

**字段说明：**
- `id`: 课程唯一标识
- `code`: 课程代码（唯一）
- `name`: 课程名称
- `description`: 课程描述
- `credits`: 学分
- `department`: 所属院系
- `category`: 课程类别
- `difficulty`: 难度级别（EASY, MEDIUM, HARD）
- `coverImage`: 封面图片URL
- `status`: 课程状态（DRAFT, PUBLISHED）
- `teacherId`: 授课教师ID
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**关系：**
- 多对一：Course -> User (teacher)
- 一对多：Course -> Chapter
- 一对多：Course -> Enrollment

### 3.3 Chapter (章节表)

```prisma
model Chapter {
  id              String           @id @default(cuid())
  title           String
  content         String?
  order           Int
  status          String           @default("draft")
  courseId        String
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  course          Course           @relation(fields: [courseId], references: [id])
  courseware      Courseware[]
  knowledgePoints KnowledgePoint[]
  materials       Material[]

  @@map("chapters")
}
```

**字段说明：**
- `id`: 章节唯一标识
- `title`: 章节标题
- `content`: 章节内容
- `order`: 章节顺序
- `status`: 章节状态（draft, published）
- `courseId`: 所属课程ID
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**关系：**
- 多对一：Chapter -> Course
- 一对多：Chapter -> Courseware
- 一对多：Chapter -> KnowledgePoint
- 一对多：Chapter -> Material

### 3.4 KnowledgePoint (知识点表)

```prisma
model KnowledgePoint {
  id          String       @id @default(cuid())
  title       String
  description String?
  content     String?
  order       Int
  difficulty  String       @default("medium")
  importance  String       @default("medium")
  status      String       @default("draft")
  chapterId   String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  Assignment  Assignment[]
  chapter     Chapter      @relation(fields: [chapterId], references: [id])
  Question    Question[]

  @@map("knowledge_points")
}
```

**字段说明：**
- `id`: 知识点唯一标识
- `title`: 知识点标题
- `description`: 知识点描述
- `content`: 知识点内容
- `order`: 知识点顺序
- `difficulty`: 难度级别（easy, medium, hard）
- `importance`: 重要性（low, medium, high）
- `status`: 状态（draft, published）
- `chapterId`: 所属章节ID
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**关系：**
- 多对一：KnowledgePoint -> Chapter
- 一对多：KnowledgePoint -> Assignment
- 一对多：KnowledgePoint -> Question

### 3.5 Enrollment (选课记录表)

```prisma
model Enrollment {
  id         String   @id @default(cuid())
  userId     String
  courseId   String
  status     String   @default("PENDING")
  progress   Float    @default(0)
  grade      Float?
  enrolledAt DateTime @default(now())
  updatedAt  DateTime @updatedAt
  course     Course   @relation(fields: [courseId], references: [id])
  user       User     @relation(fields: [userId], references: [id])

  @@unique([userId, courseId])
  @@map("enrollments")
}
```

**字段说明：**
- `id`: 选课记录唯一标识
- `userId`: 学生用户ID
- `courseId`: 课程ID
- `status`: 选课状态（PENDING, APPROVED, REJECTED）
- `progress`: 学习进度（0-100）
- `grade`: 课程成绩
- `enrolledAt`: 选课时间
- `updatedAt`: 更新时间

**关系：**
- 多对一：Enrollment -> User
- 多对一：Enrollment -> Course
- 唯一约束：一个学生只能选一门课程一次（userId+courseId唯一）

### 3.6 Assignment (作业表)

```prisma
model Assignment {
  id               String         @id @default(cuid())
  title            String
  description      String?
  type             String         @default("HOMEWORK")
  totalPoints      Int            @default(100)
  dueDate          DateTime
  status           String         @default("DRAFT")
  knowledgePointId String
  teacherId        String
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  knowledgePoint   KnowledgePoint @relation(fields: [knowledgePointId], references: [id])
  teacher          User           @relation(fields: [teacherId], references: [id])
  questions        Question[]
  submissions      Submission[]

  @@map("assignments")
}
```

**字段说明：**
- `id`: 作业唯一标识
- `title`: 作业标题
- `description`: 作业描述
- `type`: 作业类型（HOMEWORK, QUIZ, TEST等）
- `totalPoints`: 总分
- `dueDate`: 截止日期
- `status`: 作业状态（DRAFT, PUBLISHED, CLOSED）
- `knowledgePointId`: 关联知识点ID
- `teacherId`: 创建教师ID
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**关系：**
- 多对一：Assignment -> KnowledgePoint
- 多对一：Assignment -> User (teacher)
- 一对多：Assignment -> Question
- 一对多：Assignment -> Submission

### 3.7 Submission (作业提交表)

```prisma
model Submission {
  id           String     @id @default(cuid())
  content      String?
  fileUrl      String?
  score        Float?
  feedback     String?
  status       String     @default("PENDING")
  userId       String
  assignmentId String
  submittedAt  DateTime   @default(now())
  gradedAt     DateTime?
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  user         User       @relation(fields: [userId], references: [id])

  @@unique([userId, assignmentId])
  @@map("submissions")
}
```

**字段说明：**
- `id`: 提交记录唯一标识
- `content`: 提交内容（文本或JSON）
- `fileUrl`: 提交文件URL
- `score`: 得分
- `feedback`: 教师反馈
- `status`: 提交状态（PENDING, GRADED）
- `userId`: 学生用户ID
- `assignmentId`: 作业ID
- `submittedAt`: 提交时间
- `gradedAt`: 评分时间

**关系：**
- 多对一：Submission -> User
- 多对一：Submission -> Assignment
- 唯一约束：一个学生只能提交一次作业（userId+assignmentId唯一）

### 3.8 Question (题库表)

```prisma
model Question {
  id               String         @id @default(cuid())
  title            String
  content          String
  type             String         @default("SINGLE_CHOICE")
  difficulty       String         @default("MEDIUM")
  points           Int            @default(1)
  options          String?
  correctAnswer    String?
  explanation      String?
  knowledgePointId String
  assignmentId     String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  teacherId        String
  knowledgePoint   KnowledgePoint @relation(fields: [knowledgePointId], references: [id])
  assignment       Assignment?    @relation(fields: [assignmentId], references: [id])
  teacher          User           @relation(fields: [teacherId], references: [id])

  @@map("questions")
}
```

**字段说明：**
- `id`: 题目唯一标识
- `title`: 题目标题
- `content`: 题目内容
- `type`: 题目类型（SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER等）
- `difficulty`: 难度级别（EASY, MEDIUM, HARD）
- `points`: 分值
- `options`: 选项（JSON格式）
- `correctAnswer`: 正确答案
- `explanation`: 答案解析
- `knowledgePointId`: 关联知识点ID
- `assignmentId`: 关联作业ID（可选）
- `teacherId`: 创建教师ID
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**关系：**
- 多对一：Question -> KnowledgePoint
- 多对一：Question -> User (teacher)
- 多对一：Question -> Assignment (可选)

### 3.9 Material (学习资料表)

```prisma
model Material {
  id           String   @id @default(cuid())
  title        String
  description  String?
  type         String   @default("PDF")
  fileUrl      String
  fileSize     Int      @default(0)
  chapterId    String
  uploadedById String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  chapter      Chapter  @relation(fields: [chapterId], references: [id])

  @@map("materials")
}
```

**字段说明：**
- `id`: 学习资料唯一标识
- `title`: 资料标题
- `description`: 资料描述
- `type`: 资料类型（PDF, DOC, PPT等）
- `fileUrl`: 文件URL
- `fileSize`: 文件大小
- `chapterId`: 所属章节ID
- `uploadedById`: 上传用户ID
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**关系：**
- 多对一：Material -> User (uploadedBy)
- 多对一：Material -> Chapter

### 3.10 Courseware (课件表)

```prisma
model Courseware {
  id           String   @id @default(cuid())
  title        String
  description  String?
  type         String   @default("SLIDES")
  fileUrl      String
  fileSize     Int      @default(0)
  chapterId    String?
  uploadedById String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  chapter      Chapter? @relation(fields: [chapterId], references: [id])

  @@map("coursewares")
}
```

**字段说明：**
- `id`: 课件唯一标识
- `title`: 课件标题
- `description`: 课件描述
- `type`: 课件类型（SLIDES, VIDEO, AUDIO等）
- `fileUrl`: 文件URL
- `fileSize`: 文件大小
- `chapterId`: 所属章节ID（可选）
- `uploadedById`: 上传用户ID
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**关系：**
- 多对一：Courseware -> User (uploadedBy)
- 多对一：Courseware -> Chapter (可选)

### 3.11 Notification (通知表)

```prisma
model Notification {
  id          String   @id @default(cuid())
  title       String
  content     String?
  type        String   @default("info")
  isRead      Boolean  @default(false)
  userId      String
  relatedId   String?
  relatedType String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])

  @@map("notifications")
}
```

**字段说明：**
- `id`: 通知唯一标识
- `title`: 通知标题
- `content`: 通知内容
- `type`: 通知类型（info, warning, error等）
- `isRead`: 是否已读
- `userId`: 接收用户ID
- `relatedId`: 关联实体ID（可选）
- `relatedType`: 关联实体类型（可选）
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**关系：**
- 多对一：Notification -> User

### 3.12 LearningRecord (学习记录表)

```prisma
model LearningRecord {
  id           String   @id @default(cuid())
  title        String
  description  String?
  type         String   @default("info")
  isRead       Boolean  @default(false)
  userId       String
  relatedId    String?
  relatedType  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id])

  @@map("learning_records")
}
```

**字段说明：**
- `id`: 学习记录唯一标识
- `title`: 记录标题
- `description`: 记录描述
- `type`: 记录类型（info等）
- `isRead`: 是否已读
- `userId`: 学生用户ID
- `relatedId`: 关联实体ID（可选）
- `relatedType`: 关联实体类型（可选）
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**关系：**
- 多对一：LearningRecord -> User

## 4. 数据关系图

```
User 1───┐
         ├── Many Course (教师教授多门课程)
Course 1─┘

Course 1───┐
           ├── Many Chapter (课程包含多个章节)
Chapter 1─┘

Chapter 1───┐
            ├── Many KnowledgePoint (章节包含多个知识点)
KnowledgePoint 1─┘

Chapter 1───┐
            ├── Many Courseware (章节关联多个课件)
Courseware 1─┘

Chapter 1───┐
            ├── Many Material (章节包含多个学习资料)
Material 1─┘

KnowledgePoint 1───┐
                   ├── Many Assignment (知识点关联多个作业)
Assignment 1─┘

KnowledgePoint 1───┐
                   ├── Many Question (知识点关联多个问题)
Question 1─┘

Assignment 1───┐
               ├── Many Question (作业包含多个问题)
Question 1─┘

User(Student) 1───┐
                  ├── Many Submission (学生提交多个作业)
Submission 1─┘

Assignment 1───┐
               ├── Many Submission (作业有多个学生提交)
Submission 1─┘

User(Student) 1───┐
                  ├── Many Enrollment (学生选多门课程)
Enrollment 1─────┘

Course 1─────────┐
                 ├── Many Enrollment (课程有多个学生)
Enrollment 1────┘

User 1───┐
         ├── Many Notification (用户接收多个通知)
Notification 1─┘

User(Student) 1───┐
                  ├── Many LearningRecord (学生有多条学习记录)
LearningRecord 1─┘
```

## 5. 索引设计

系统中的索引主要通过Prisma ORM自动创建，以下是关键索引：

1. **唯一索引：**
   - `User.email`
   - `User.username`
   - `Course.code`
   - `Enrollment(userId, courseId)`
   - `Submission(userId, assignmentId)`

2. **外键索引：**
   - 所有外键字段（如`Course.teacherId`, `Chapter.courseId`等）都自动创建索引以优化查询性能

## 6. 数据安全考虑

1. **密码存储：**
   - 用户密码通过bcrypt算法加密存储，不可逆

2. **数据验证：**
   - 通过Prisma ORM的类型系统确保数据一致性
   - 所有API请求在处理前进行数据验证

3. **访问控制：**
   - 基于角色的访问控制（RBAC）确保用户只能访问其权限范围内的数据
   - 敏感操作需要适当的权限验证

## 7. 数据库性能优化

1. **查询优化：**
   - 使用Prisma的关联查询特性，避免N+1查询问题
   - 合理使用索引覆盖查询

2. **事务管理：**
   - 关键业务操作使用事务确保数据一致性

3. **数据清理：**
   - 定期清理不再需要的临时数据和日志

## 8. 未来扩展方向

1. **数据库迁移：**
   - 随着用户量和数据量增长，可以考虑迁移到PostgreSQL或MySQL等更强大的关系型数据库

2. **读写分离：**
   - 实现数据库读写分离，提高系统并发处理能力

3. **分库分表：**
   - 对于超大数据量，考虑按业务模块或时间进行分库分表

4. **缓存机制：**
   - 引入Redis等缓存系统，减轻数据库负载，提高查询性能