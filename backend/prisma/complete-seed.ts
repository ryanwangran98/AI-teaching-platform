import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建完整的测试数据...');

  // 创建测试用户
  let teacher;
  try {
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    teacher = await prisma.user.create({
      data: {
        email: 'teacher1@example.com',
        username: 'teacher1',
        password: hashedPassword,
        firstName: 'Teacher',
        lastName: 'One',
        role: 'TEACHER',
      },
    });
    console.log('创建教师用户:', teacher.username);
  } catch (error) {
    teacher = await prisma.user.findUnique({
      where: {
        username: 'teacher1',
      },
    });
    console.log('使用现有教师用户:', teacher.username);
  }

  let student;
  try {
    const hashedPassword = await bcrypt.hash('student123', 10);
    student = await prisma.user.create({
      data: {
        email: 'student1@example.com',
        username: 'student1',
        password: hashedPassword,
        firstName: 'Student',
        lastName: 'One',
        role: 'STUDENT',
      },
    });
    console.log('创建学生用户:', student.username);
  } catch (error) {
    student = await prisma.user.findUnique({
      where: {
        username: 'student1',
      },
    });
    console.log('使用现有学生用户:', student.username);
  }

  // 创建课程
  let course;
  try {
    course = await prisma.course.create({
      data: {
        code: 'MATH101',
        name: '高等数学',
        description: '高等数学课程',
        credits: 3,
        department: '数学系',
        category: '基础课程',
        teacherId: teacher.id,
      },
    });
    console.log('创建课程:', course.name);
  } catch (error) {
    course = await prisma.course.findUnique({
      where: {
        code: 'MATH101',
      },
    });
    console.log('使用现有课程:', course.name);
  }

  // 创建多个章节
  const chaptersData = [
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

  const chapters = [];
  for (const chapterData of chaptersData) {
    let chapter;
    try {
      chapter = await prisma.chapter.create({
        data: {
          title: chapterData.title,
          order: chapterData.order,
          courseId: course.id,
        },
      });
      console.log('创建章节:', chapter.title);
    } catch (error) {
      chapter = await prisma.chapter.findFirst({
        where: {
          courseId: course.id,
          title: chapterData.title,
        },
      });
      console.log('使用现有章节:', chapter.title);
    }
    chapters.push(chapter);
  }

  // 为每个章节创建多个知识点
  const knowledgePointsData = [
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

  const knowledgePoints = [];
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const kpDataList = knowledgePointsData[i];
    const kpList = [];
    
    for (const kpData of kpDataList) {
      let knowledgePoint;
      try {
        knowledgePoint = await prisma.knowledgePoint.create({
          data: {
            title: kpData.title,
            order: kpData.order,
            chapterId: chapter.id,
          },
        });
        console.log('创建知识点:', knowledgePoint.title);
      } catch (error) {
        knowledgePoint = await prisma.knowledgePoint.findFirst({
          where: {
            chapterId: chapter.id,
            title: kpData.title,
          },
        });
        console.log('使用现有知识点:', knowledgePoint.title);
      }
      kpList.push(knowledgePoint);
    }
    knowledgePoints.push(...kpList);
  }

  // 创建更多题目
  const questionsData = [
    // 第一章题目
    {
      title: '函数定义域求解',
      content: '求函数 f(x) = √(x-1) + 1/(x-2) 的定义域',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      points: 5,
      correctAnswer: '[1,2)∪(2,+∞)',
      explanation: '根号下非负且分母不为零',
      knowledgePointId: knowledgePoints[0].id,
      teacherId: teacher.id,
    },
    {
      title: '极限计算',
      content: '计算 lim(x→1) (x²-1)/(x-1)',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      points: 10,
      correctAnswer: '2',
      explanation: '先因式分解再约分',
      knowledgePointId: knowledgePoints[1].id,
      teacherId: teacher.id,
    },
    {
      title: '重要极限应用',
      content: '计算 lim(x→0) (tan x)/x',
      type: 'SHORT_ANSWER',
      difficulty: 'HARD',
      points: 15,
      correctAnswer: '1',
      explanation: '利用重要极限lim(x→0) (sin x)/x = 1',
      knowledgePointId: knowledgePoints[3].id,
      teacherId: teacher.id,
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
      knowledgePointId: knowledgePoints[4].id,
      teacherId: teacher.id,
    },
    {
      title: '复合函数求导',
      content: '求 y = ln(sin x²) 的导数',
      type: 'SHORT_ANSWER',
      difficulty: 'HARD',
      points: 15,
      correctAnswer: '2x cot(x²)',
      explanation: '使用链式法则逐层求导',
      knowledgePointId: knowledgePoints[6].id,
      teacherId: teacher.id,
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
      knowledgePointId: knowledgePoints[8].id,
      teacherId: teacher.id,
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
      knowledgePointId: knowledgePoints[12].id,
      teacherId: teacher.id,
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
      knowledgePointId: knowledgePoints[15].id,
      teacherId: teacher.id,
    }
  ];

  const questions = [];
  for (const questionData of questionsData) {
    let question;
    try {
      question = await prisma.question.create({
        data: questionData,
      });
      console.log('创建题目:', question.title);
    } catch (error) {
      question = await prisma.question.findFirst({
        where: {
          title: questionData.title,
          knowledgePointId: questionData.knowledgePointId,
        },
      });
      console.log('使用现有题目:', question.title);
    }
    questions.push(question);
  }

  // 创建更多作业
  const assignmentsData = [
    {
      title: '函数与极限练习',
      description: '第一章函数与极限相关题目练习',
      type: 'HOMEWORK',
      totalPoints: 50,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: knowledgePoints[0].id,
      teacherId: teacher.id,
    },
    {
      title: '导数计算测验',
      description: '第二章导数计算相关题目测验',
      type: 'QUIZ',
      totalPoints: 30,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: knowledgePoints[4].id,
      teacherId: teacher.id,
    },
    {
      title: '期中考试',
      description: '第一至第三章综合测试',
      type: 'EXAM',
      totalPoints: 100,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: knowledgePoints[2].id,
      teacherId: teacher.id,
    },
    {
      title: '不定积分练习',
      description: '第四章不定积分相关题目练习',
      type: 'HOMEWORK',
      totalPoints: 40,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: knowledgePoints[12].id,
      teacherId: teacher.id,
    },
    {
      title: '定积分项目',
      description: '第五章定积分应用项目',
      type: 'PROJECT',
      totalPoints: 60,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: knowledgePoints[15].id,
      teacherId: teacher.id,
    }
  ];

  const assignments = [];
  for (const assignmentData of assignmentsData) {
    let assignment;
    try {
      assignment = await prisma.assignment.create({
        data: assignmentData,
      });
      console.log('创建作业:', assignment.title);
    } catch (error) {
      assignment = await prisma.assignment.findFirst({
        where: {
          title: assignmentData.title,
          knowledgePointId: assignmentData.knowledgePointId,
        },
      });
      console.log('使用现有作业:', assignment.title);
    }
    assignments.push(assignment);
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
    { questionId: questions[1].id, assignmentId: assignments[4].id }, // 极限计算题目（作为前置知识）
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

  console.log('\n=== 测试数据创建完成 ===');
  console.log('教师:', teacher.username);
  console.log('学生:', student.username);
  console.log('课程:', course.name);
  console.log('章节数量:', chapters.length);
  console.log('知识点数量:', knowledgePoints.length);
  console.log('题目数量:', questions.length);
  console.log('作业数量:', assignments.length);
  console.log('题目-作业关联数量:', questionAssignments.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });