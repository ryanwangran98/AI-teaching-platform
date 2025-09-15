import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建完整的测试数据...');

  // 创建多个教师用户
  const teachersData = [
    {
      email: 'teacher1@example.com',
      username: 'teacher1',
      password: 'teacher123',
      firstName: '张',
      lastName: '老师',
      role: 'TEACHER',
    },
    {
      email: 'teacher2@example.com',
      username: 'teacher2',
      password: 'teacher123',
      firstName: '李',
      lastName: '老师',
      role: 'TEACHER',
    },
    {
      email: 'teacher3@example.com',
      username: 'teacher3',
      password: 'teacher123',
      firstName: '王',
      lastName: '老师',
      role: 'TEACHER',
    }
  ];

  const teachers = [];
  for (const teacherData of teachersData) {
    try {
      const hashedPassword = await bcrypt.hash(teacherData.password, 10);
      const teacher = await prisma.user.create({
        data: {
          email: teacherData.email,
          username: teacherData.username,
          password: hashedPassword,
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          role: teacherData.role,
        },
      });
      console.log('创建教师用户:', teacher.username);
      teachers.push(teacher);
    } catch (error) {
      const teacher = await prisma.user.findUnique({
        where: {
          username: teacherData.username,
        },
      });
      console.log('使用现有教师用户:', teacher.username);
      teachers.push(teacher);
    }
  }

  // 创建多个学生用户
  const studentsData = [
    {
      email: 'student1@example.com',
      username: 'student1',
      password: 'student123',
      firstName: '小明',
      lastName: '王',
      role: 'STUDENT',
    },
    {
      email: 'student2@example.com',
      username: 'student2',
      password: 'student123',
      firstName: '小红',
      lastName: '李',
      role: 'STUDENT',
    },
    {
      email: 'student3@example.com',
      username: 'student3',
      password: 'student123',
      firstName: '小刚',
      lastName: '张',
      role: 'STUDENT',
    },
    {
      email: 'student4@example.com',
      username: 'student4',
      password: 'student123',
      firstName: '小丽',
      lastName: '刘',
      role: 'STUDENT',
    },
    {
      email: 'student5@example.com',
      username: 'student5',
      password: 'student123',
      firstName: '小强',
      lastName: '陈',
      role: 'STUDENT',
    }
  ];

  const students = [];
  for (const studentData of studentsData) {
    try {
      const hashedPassword = await bcrypt.hash(studentData.password, 10);
      const student = await prisma.user.create({
        data: {
          email: studentData.email,
          username: studentData.username,
          password: hashedPassword,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          role: studentData.role,
        },
      });
      console.log('创建学生用户:', student.username);
      students.push(student);
    } catch (error) {
      const student = await prisma.user.findUnique({
        where: {
          username: studentData.username,
        },
      });
      console.log('使用现有学生用户:', student.username);
      students.push(student);
    }
  }

  // 创建多门课程
  const coursesData = [
    {
      code: 'MATH101',
      name: '高等数学',
      description: '高等数学课程，涵盖微积分基础',
      credits: 3,
      department: '数学系',
      category: '基础课程',
      teacherId: teachers[0].id,
    },
    {
      code: 'PHYS101',
      name: '大学物理',
      description: '大学物理课程，涵盖力学、热学、电磁学',
      credits: 4,
      department: '物理系',
      category: '基础课程',
      teacherId: teachers[1].id,
    },
    {
      code: 'CS101',
      name: '计算机科学导论',
      description: '计算机科学入门课程',
      credits: 3,
      department: '计算机系',
      category: '专业课程',
      teacherId: teachers[2].id,
    }
  ];

  const courses = [];
  for (const courseData of coursesData) {
    try {
      const course = await prisma.course.create({
        data: courseData,
      });
      console.log('创建课程:', course.name);
      courses.push(course);
    } catch (error) {
      const course = await prisma.course.findUnique({
        where: {
          code: courseData.code,
        },
      });
      console.log('使用现有课程:', course.name);
      courses.push(course);
    }
  }

  // 创建高等数学章节
  const mathChaptersData = [
    {
      title: '第一章 函数与极限',
      order: 1,
    },
    {
      title: '第二章 导数与微分',
      order: 2,
    },
    {
      title: '第三章 微分中值定理与导数应用',
      order: 3,
    },
    {
      title: '第四章 不定积分',
      order: 4,
    },
    {
      title: '第五章 定积分',
      order: 5,
    }
  ];

  const mathChapters = [];
  for (const chapterData of mathChaptersData) {
    try {
      const chapter = await prisma.chapter.create({
        data: {
          title: chapterData.title,
          order: chapterData.order,
          courseId: courses[0].id,
        },
      });
      console.log('创建章节:', chapter.title);
      mathChapters.push(chapter);
    } catch (error) {
      const chapter = await prisma.chapter.findFirst({
        where: {
          courseId: courses[0].id,
          title: chapterData.title,
        },
      });
      console.log('使用现有章节:', chapter.title);
      mathChapters.push(chapter);
    }
  }

  // 创建大学物理章节
  const physChaptersData = [
    {
      title: '第一章 力学基础',
      order: 1,
    },
    {
      title: '第二章 热学',
      order: 2,
    },
    {
      title: '第三章 电磁学基础',
      order: 3,
    }
  ];

  const physChapters = [];
  for (const chapterData of physChaptersData) {
    try {
      const chapter = await prisma.chapter.create({
        data: {
          title: chapterData.title,
          order: chapterData.order,
          courseId: courses[1].id,
        },
      });
      console.log('创建章节:', chapter.title);
      physChapters.push(chapter);
    } catch (error) {
      const chapter = await prisma.chapter.findFirst({
        where: {
          courseId: courses[1].id,
          title: chapterData.title,
        },
      });
      console.log('使用现有章节:', chapter.title);
      physChapters.push(chapter);
    }
  }

  // 创建计算机科学导论章节
  const csChaptersData = [
    {
      title: '第一章 计算机基础',
      order: 1,
    },
    {
      title: '第二章 编程基础',
      order: 2,
    },
    {
      title: '第三章 数据结构',
      order: 3,
    }
  ];

  const csChapters = [];
  for (const chapterData of csChaptersData) {
    try {
      const chapter = await prisma.chapter.create({
        data: {
          title: chapterData.title,
          order: chapterData.order,
          courseId: courses[2].id,
        },
      });
      console.log('创建章节:', chapter.title);
      csChapters.push(chapter);
    } catch (error) {
      const chapter = await prisma.chapter.findFirst({
        where: {
          courseId: courses[2].id,
          title: chapterData.title,
        },
      });
      console.log('使用现有章节:', chapter.title);
      csChapters.push(chapter);
    }
  }

  // 为高等数学章节创建知识点
  const mathKnowledgePointsData = [
    // 第一章知识点
    [
      { title: '函数的概念与性质', order: 1 },
      { title: '极限的定义与性质', order: 2 },
      { title: '极限的运算法则', order: 3 },
      { title: '两个重要极限', order: 4 }
    ],
    // 第二章知识点
    [
      { title: '导数的概念', order: 1 },
      { title: '导数的几何意义', order: 2 },
      { title: '求导法则', order: 3 },
      { title: '高阶导数', order: 4 }
    ],
    // 第三章知识点
    [
      { title: '微分中值定理', order: 1 },
      { title: '洛必达法则', order: 2 },
      { title: '函数的单调性与极值', order: 3 },
      { title: '函数的凹凸性与拐点', order: 4 }
    ],
    // 第四章知识点
    [
      { title: '不定积分的概念与性质', order: 1 },
      { title: '基本积分公式', order: 2 },
      { title: '换元积分法', order: 3 },
      { title: '分部积分法', order: 4 }
    ],
    // 第五章知识点
    [
      { title: '定积分的概念与性质', order: 1 },
      { title: '微积分基本定理', order: 2 },
      { title: '定积分的换元法', order: 3 },
      { title: '定积分的应用', order: 4 }
    ]
  ];

  const mathKnowledgePoints = [];
  for (let i = 0; i < mathChapters.length; i++) {
    const chapter = mathChapters[i];
    const kpDataList = mathKnowledgePointsData[i];
    const kpList = [];
    
    for (const kpData of kpDataList) {
      try {
        const knowledgePoint = await prisma.knowledgePoint.create({
          data: {
            title: kpData.title,
            order: kpData.order,
            chapterId: chapter.id,
          },
        });
        console.log('创建知识点:', knowledgePoint.title);
        kpList.push(knowledgePoint);
      } catch (error) {
        const knowledgePoint = await prisma.knowledgePoint.findFirst({
          where: {
            chapterId: chapter.id,
            title: kpData.title,
          },
        });
        console.log('使用现有知识点:', knowledgePoint.title);
        kpList.push(knowledgePoint);
      }
    }
    mathKnowledgePoints.push(...kpList);
  }

  // 为大学物理章节创建知识点
  const physKnowledgePointsData = [
    // 第一章知识点
    [
      { title: '力学基本概念', order: 1 },
      { title: '牛顿运动定律', order: 2 },
      { title: '动量守恒定律', order: 3 }
    ],
    // 第二章知识点
    [
      { title: '热力学基本概念', order: 1 },
      { title: '热力学第一定律', order: 2 },
      { title: '热力学第二定律', order: 3 }
    ],
    // 第三章知识点
    [
      { title: '静电场', order: 1 },
      { title: '恒定电流', order: 2 },
      { title: '磁场', order: 3 }
    ]
  ];

  const physKnowledgePoints = [];
  for (let i = 0; i < physChapters.length; i++) {
    const chapter = physChapters[i];
    const kpDataList = physKnowledgePointsData[i];
    const kpList = [];
    
    for (const kpData of kpDataList) {
      try {
        const knowledgePoint = await prisma.knowledgePoint.create({
          data: {
            title: kpData.title,
            order: kpData.order,
            chapterId: chapter.id,
          },
        });
        console.log('创建知识点:', knowledgePoint.title);
        kpList.push(knowledgePoint);
      } catch (error) {
        const knowledgePoint = await prisma.knowledgePoint.findFirst({
          where: {
            chapterId: chapter.id,
            title: kpData.title,
          },
        });
        console.log('使用现有知识点:', knowledgePoint.title);
        kpList.push(knowledgePoint);
      }
    }
    physKnowledgePoints.push(...kpList);
  }

  // 为计算机科学导论章节创建知识点
  const csKnowledgePointsData = [
    // 第一章知识点
    [
      { title: '计算机发展史', order: 1 },
      { title: '计算机组成原理', order: 2 },
      { title: '计算机应用领域', order: 3 }
    ],
    // 第二章知识点
    [
      { title: '编程语言基础', order: 1 },
      { title: '算法与流程图', order: 2 },
      { title: '基本数据类型', order: 3 }
    ],
    // 第三章知识点
    [
      { title: '线性表', order: 1 },
      { title: '栈和队列', order: 2 },
      { title: '树和二叉树', order: 3 }
    ]
  ];

  const csKnowledgePoints = [];
  for (let i = 0; i < csChapters.length; i++) {
    const chapter = csChapters[i];
    const kpDataList = csKnowledgePointsData[i];
    const kpList = [];
    
    for (const kpData of kpDataList) {
      try {
        const knowledgePoint = await prisma.knowledgePoint.create({
          data: {
            title: kpData.title,
            order: kpData.order,
            chapterId: chapter.id,
          },
        });
        console.log('创建知识点:', knowledgePoint.title);
        kpList.push(knowledgePoint);
      } catch (error) {
        const knowledgePoint = await prisma.knowledgePoint.findFirst({
          where: {
            chapterId: chapter.id,
            title: kpData.title,
          },
        });
        console.log('使用现有知识点:', knowledgePoint.title);
        kpList.push(knowledgePoint);
      }
    }
    csKnowledgePoints.push(...kpList);
  }

  // 创建更多题目
  const questionsData = [
    // 高等数学题目
    // 第一章题目
    {
      title: '函数定义域求解',
      content: '求函数 f(x) = √(x-1) + 1/(x-2) 的定义域',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      points: 5,
      correctAnswer: '[1,2)∪(2,+∞)',
      explanation: '根号下非负且分母不为零',
      knowledgePointId: mathKnowledgePoints[0].id,
      teacherId: teachers[0].id,
    },
    {
      title: '极限计算',
      content: '计算 lim(x→1) (x²-1)/(x-1)',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      points: 10,
      correctAnswer: '2',
      explanation: '先因式分解再约分',
      knowledgePointId: mathKnowledgePoints[1].id,
      teacherId: teachers[0].id,
    },
    {
      title: '重要极限应用',
      content: '计算 lim(x→0) (tan x)/x',
      type: 'SHORT_ANSWER',
      difficulty: 'HARD',
      points: 15,
      correctAnswer: '1',
      explanation: '利用重要极限lim(x→0) (sin x)/x = 1',
      knowledgePointId: mathKnowledgePoints[3].id,
      teacherId: teachers[0].id,
    },
    // 第二章题目
    {
      title: '导数定义应用',
      content: '利用导数定义求 f(x) = x³ 在 x=2 处的导数',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      points: 10,
      correctAnswer: '12',
      explanation: '使用导数定义lim(h→0) [f(x+h)-f(x)]/h',
      knowledgePointId: mathKnowledgePoints[4].id,
      teacherId: teachers[0].id,
    },
    {
      title: '复合函数求导',
      content: '求 y = ln(sin x²) 的导数',
      type: 'SHORT_ANSWER',
      difficulty: 'HARD',
      points: 15,
      correctAnswer: '2x cot(x²)',
      explanation: '使用链式法则逐层求导',
      knowledgePointId: mathKnowledgePoints[6].id,
      teacherId: teachers[0].id,
    },
    // 第三章题目
    {
      title: '罗尔定理应用',
      content: '验证函数 f(x) = x³-3x 在区间[-√3, √3]上是否满足罗尔定理条件，并求出相应的ξ值',
      type: 'SHORT_ANSWER',
      difficulty: 'HARD',
      points: 20,
      correctAnswer: '满足条件，ξ = ±1',
      explanation: '验证连续性、可导性和端点函数值相等',
      knowledgePointId: mathKnowledgePoints[8].id,
      teacherId: teachers[0].id,
    },
    // 第四章题目
    {
      title: '不定积分计算',
      content: '计算 ∫ x e^x dx',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      points: 10,
      correctAnswer: 'e^x (x-1) + C',
      explanation: '使用分部积分法',
      knowledgePointId: mathKnowledgePoints[12].id,
      teacherId: teachers[0].id,
    },
    // 第五章题目
    {
      title: '定积分应用',
      content: '计算由曲线 y = x² 和 y = x 围成的平面图形面积',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      points: 15,
      correctAnswer: '1/6',
      explanation: '先求交点，再计算定积分',
      knowledgePointId: mathKnowledgePoints[15].id,
      teacherId: teachers[0].id,
    },
    // 大学物理题目
    {
      title: '牛顿第二定律应用',
      content: '一个质量为2kg的物体受到10N的水平力作用，求物体的加速度',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      points: 5,
      correctAnswer: '5 m/s²',
      explanation: '根据F=ma，a=F/m=10/2=5 m/s²',
      knowledgePointId: physKnowledgePoints[1].id,
      teacherId: teachers[1].id,
    },
    {
      title: '动量守恒定律',
      content: '一个质量为1kg的小球以5m/s的速度与静止的质量为2kg的小球发生完全弹性碰撞，求碰撞后两球的速度',
      type: 'SHORT_ANSWER',
      difficulty: 'HARD',
      points: 20,
      correctAnswer: 'v1=-5/3 m/s, v2=10/3 m/s',
      explanation: '利用动量守恒和动能守恒定律求解',
      knowledgePointId: physKnowledgePoints[2].id,
      teacherId: teachers[1].id,
    },
    // 计算机科学题目
    {
      title: '数据结构选择',
      content: '在需要频繁进行插入和删除操作的场景中，应该选择哪种数据结构？为什么？',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      points: 10,
      correctAnswer: '链表，因为链表的插入和删除操作时间复杂度为O(1)',
      explanation: '链表在插入和删除时不需要移动元素，只需要修改指针',
      knowledgePointId: csKnowledgePoints[4].id,
      teacherId: teachers[2].id,
    }
  ];

  const questions = [];
  for (const questionData of questionsData) {
    try {
      const question = await prisma.question.create({
        data: questionData,
      });
      console.log('创建题目:', question.title);
      questions.push(question);
    } catch (error) {
      const question = await prisma.question.findFirst({
        where: {
          title: questionData.title,
          knowledgePointId: questionData.knowledgePointId,
        },
      });
      console.log('使用现有题目:', question.title);
      questions.push(question);
    }
  }

  // 创建更多作业
  const assignmentsData = [
    // 高等数学作业
    {
      title: '函数与极限练习',
      description: '第一章函数与极限相关题目练习',
      type: 'HOMEWORK',
      totalPoints: 50,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: mathKnowledgePoints[0].id,
      teacherId: teachers[0].id,
    },
    {
      title: '导数计算测验',
      description: '第二章导数计算相关题目测验',
      type: 'QUIZ',
      totalPoints: 30,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: mathKnowledgePoints[4].id,
      teacherId: teachers[0].id,
    },
    {
      title: '期中考试',
      description: '第一至第三章综合测试',
      type: 'EXAM',
      totalPoints: 100,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: mathKnowledgePoints[2].id,
      teacherId: teachers[0].id,
    },
    {
      title: '不定积分练习',
      description: '第四章不定积分相关题目练习',
      type: 'HOMEWORK',
      totalPoints: 40,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: mathKnowledgePoints[12].id,
      teacherId: teachers[0].id,
    },
    {
      title: '定积分项目',
      description: '第五章定积分应用项目',
      type: 'PROJECT',
      totalPoints: 60,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: mathKnowledgePoints[15].id,
      teacherId: teachers[0].id,
    },
    // 大学物理作业
    {
      title: '力学基础练习',
      description: '第一章力学基础相关题目练习',
      type: 'HOMEWORK',
      totalPoints: 40,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: physKnowledgePoints[0].id,
      teacherId: teachers[1].id,
    },
    {
      title: '热学测验',
      description: '第二章热学相关题目测验',
      type: 'QUIZ',
      totalPoints: 30,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: physKnowledgePoints[3].id,
      teacherId: teachers[1].id,
    },
    // 计算机科学作业
    {
      title: '编程基础练习',
      description: '第二章编程基础相关题目练习',
      type: 'HOMEWORK',
      totalPoints: 45,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: csKnowledgePoints[3].id,
      teacherId: teachers[2].id,
    }
  ];

  const assignments = [];
  for (const assignmentData of assignmentsData) {
    try {
      const assignment = await prisma.assignment.create({
        data: assignmentData,
      });
      console.log('创建作业:', assignment.title);
      assignments.push(assignment);
    } catch (error) {
      const assignment = await prisma.assignment.findFirst({
        where: {
          title: assignmentData.title,
          knowledgePointId: assignmentData.knowledgePointId,
        },
      });
      console.log('使用现有作业:', assignment.title);
      assignments.push(assignment);
    }
  }

  // 创建更复杂的题目和作业关联关系
  // 先删除现有的关联关系
  await prisma.questionAssignment.deleteMany({
    where: {
      assignmentId: {
        in: assignments.map(a => a.id)
      }
    },
  });

  // 定义关联关系
  const questionAssignments = [
    // 函数与极限练习作业
    { questionId: questions[0].id, assignmentId: assignments[0].id }, // 函数定义域题目
    { questionId: questions[1].id, assignmentId: assignments[0].id }, // 极限计算题目
    
    // 导数计算测验
    { questionId: questions[3].id, assignmentId: assignments[1].id }, // 导数定义题目
    { questionId: questions[4].id, assignmentId: assignments[1].id }, // 复合函数求导题目
    
    // 期中考试（综合测试）
    { questionId: questions[0].id, assignmentId: assignments[2].id }, // 函数定义域题目
    { questionId: questions[1].id, assignmentId: assignments[2].id }, // 极限计算题目
    { questionId: questions[3].id, assignmentId: assignments[2].id }, // 导数定义题目
    { questionId: questions[2].id, assignmentId: assignments[2].id }, // 重要极限题目
    
    // 不定积分练习
    { questionId: questions[6].id, assignmentId: assignments[3].id }, // 不定积分题目
    
    // 定积分项目
    { questionId: questions[7].id, assignmentId: assignments[4].id }, // 定积分应用题目
    { questionId: questions[1].id, assignmentId: assignments[4].id }, // 极限计算题目（作为前置知识）,
    
    // 力学基础练习
    { questionId: questions[8].id, assignmentId: assignments[5].id }, // 牛顿第二定律题目
    
    // 热学测验
    { questionId: questions[9].id, assignmentId: assignments[6].id }, // 动量守恒题目
    
    // 编程基础练习
    { questionId: questions[10].id, assignmentId: assignments[7].id } // 数据结构题目
  ];

  // 创建关联关系
  for (const qa of questionAssignments) {
    try {
      await prisma.questionAssignment.create({
        data: qa,
      });
      const question = questions.find(q => q.id === qa.questionId);
      const assignment = assignments.find(a => a.id === qa.assignmentId);
      console.log(`关联题目 "${question.title}" 到作业 "${assignment.title}"`);
    } catch (error) {
      console.log('关联关系已存在');
    }
  }

  // 创建学生选课记录
  const enrollmentsData = [
    // 学生1选课
    {
      userId: students[0].id,
      courseId: courses[0].id,
      status: 'ENROLLED',
      progress: 0.6,
    },
    {
      userId: students[0].id,
      courseId: courses[1].id,
      status: 'ENROLLED',
      progress: 0.3,
    },
    // 学生2选课
    {
      userId: students[1].id,
      courseId: courses[0].id,
      status: 'ENROLLED',
      progress: 0.8,
    },
    {
      userId: students[1].id,
      courseId: courses[2].id,
      status: 'ENROLLED',
      progress: 0.5,
    },
    // 学生3选课
    {
      userId: students[2].id,
      courseId: courses[1].id,
      status: 'ENROLLED',
      progress: 0.4,
    },
    {
      userId: students[2].id,
      courseId: courses[2].id,
      status: 'ENROLLED',
      progress: 0.7,
    },
    // 学生4选课
    {
      userId: students[3].id,
      courseId: courses[0].id,
      status: 'ENROLLED',
      progress: 0.9,
    },
    // 学生5选课
    {
      userId: students[4].id,
      courseId: courses[2].id,
      status: 'ENROLLED',
      progress: 0.2,
    }
  ];

  const enrollments = [];
  for (const enrollmentData of enrollmentsData) {
    try {
      const enrollment = await prisma.enrollment.create({
        data: enrollmentData,
      });
      console.log(`学生 ${enrollment.userId} 选课 ${enrollment.courseId}`);
      enrollments.push(enrollment);
    } catch (error) {
      console.log('选课记录已存在');
    }
  }

  // 创建作业提交记录
  const submissionsData = [
    // 学生1提交作业
    {
      content: '这是函数与极限练习的答案',
      score: 45,
      feedback: '做得很好，注意定义域的表示方法',
      status: 'GRADED',
      userId: students[0].id,
      assignmentId: assignments[0].id,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      content: '这是导数计算测验的答案',
      score: 28,
      feedback: '大部分正确，注意复合函数求导法则',
      status: 'GRADED',
      userId: students[0].id,
      assignmentId: assignments[1].id,
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
    },
    // 学生2提交作业
    {
      content: '这是力学基础练习的答案',
      score: 38,
      feedback: '牛顿定律应用正确',
      status: 'GRADED',
      userId: students[1].id,
      assignmentId: assignments[5].id,
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    // 学生3提交作业
    {
      content: '这是编程基础练习的答案',
      score: 42,
      feedback: '数据结构选择合理',
      status: 'GRADED',
      userId: students[2].id,
      assignmentId: assignments[7].id,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    }
  ];

  const submissions = [];
  for (const submissionData of submissionsData) {
    try {
      const submission = await prisma.submission.create({
        data: submissionData,
      });
      console.log(`学生 ${submission.userId} 提交作业 ${submission.assignmentId}`);
      submissions.push(submission);
    } catch (error) {
      console.log('作业提交记录已存在');
    }
  }

  // 不再生成通知测试数据，通知功能通过API接口动态创建

  console.log('\n=== 测试数据创建完成 ===');
  console.log('教师数量:', teachers.length);
  console.log('学生数量:', students.length);
  console.log('课程数量:', courses.length);
  console.log('高等数学章节数量:', mathChapters.length);
  console.log('大学物理章节数量:', physChapters.length);
  console.log('计算机科学章节数量:', csChapters.length);
  console.log('高等数学知识点数量:', mathKnowledgePoints.length);
  console.log('大学物理知识点数量:', physKnowledgePoints.length);
  console.log('计算机科学知识点数量:', csKnowledgePoints.length);
  console.log('题目数量:', questions.length);
  console.log('作业数量:', assignments.length);
  console.log('题目-作业关联数量:', questionAssignments.length);
  console.log('选课记录数量:', enrollments.length);
  console.log('作业提交数量:', submissions.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });