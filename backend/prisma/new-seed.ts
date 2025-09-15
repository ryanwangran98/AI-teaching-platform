import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建新的测试数据...');

  // 创建管理员用户
  const adminData = {
    email: 'admin@example.com',
    username: 'admin',
    password: 'admin123',
    firstName: '系统',
    lastName: '管理员',
    role: 'ADMIN',
  };

  try {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const admin = await prisma.user.create({
      data: {
        email: adminData.email,
        username: adminData.username,
        password: hashedPassword,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: adminData.role,
      },
    });
    console.log('创建管理员用户:', admin.username);
  } catch (error) {
    console.log('管理员用户已存在或创建失败');
  }

  // 创建多个教师用户
  const teachersData = [
    {
      email: 'zhang.laoshi@example.com',
      username: 'zhang_teacher',
      password: 'teacher123',
      firstName: '张',
      lastName: '老师',
      role: 'TEACHER',
    },
    {
      email: 'li.laoshi@example.com',
      username: 'li_teacher',
      password: 'teacher123',
      firstName: '李',
      lastName: '教授',
      role: 'TEACHER',
    },
    {
      email: 'wang.laoshi@example.com',
      username: 'wang_teacher',
      password: 'teacher123',
      firstName: '王',
      lastName: '讲师',
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
      console.log(`教师用户 ${teacherData.username} 创建失败，可能已存在`);
    }
  }

  // 创建多个学生用户
  const studentsData = [
    {
      email: 'xiaoming.wang@example.com',
      username: 'xiaoming',
      password: 'student123',
      firstName: '小明',
      lastName: '王',
      role: 'STUDENT',
    },
    {
      email: 'xiaohong.li@example.com',
      username: 'xiaohong',
      password: 'student123',
      firstName: '小红',
      lastName: '李',
      role: 'STUDENT',
    },
    {
      email: 'xiaogang.zhang@example.com',
      username: 'xiaogang',
      password: 'student123',
      firstName: '小刚',
      lastName: '张',
      role: 'STUDENT',
    },
    {
      email: 'xiaoli.liu@example.com',
      username: 'xiaoli',
      password: 'student123',
      firstName: '小丽',
      lastName: '刘',
      role: 'STUDENT',
    },
    {
      email: 'xiaoqiang.chen@example.com',
      username: 'xiaoqiang',
      password: 'student123',
      firstName: '小强',
      lastName: '陈',
      role: 'STUDENT',
    },
    {
      email: 'meimei.zhao@example.com',
      username: 'meimei',
      password: 'student123',
      firstName: '美美',
      lastName: '赵',
      role: 'STUDENT',
    },
    {
      email: 'dahua.sun@example.com',
      username: 'dahua',
      password: 'student123',
      firstName: '大华',
      lastName: '孙',
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
      console.log(`学生用户 ${studentData.username} 创建失败，可能已存在`);
    }
  }

  // 创建多门课程
  const coursesData = [
    {
      code: 'MATH101',
      name: '高等数学',
      description: '高等数学课程，涵盖微积分、极限、导数、积分等基础数学概念，为后续专业课程打下坚实基础。',
      credits: 4,
      department: '数学系',
      category: '基础课程',
      difficulty: 'MEDIUM',
      teacherId: teachers[0].id,
    },
    {
      code: 'PHYS201',
      name: '大学物理',
      description: '大学物理课程，系统讲解力学、热学、电磁学、光学等物理基础知识，注重理论与实践结合。',
      credits: 3,
      department: '物理系',
      category: '基础课程',
      difficulty: 'MEDIUM',
      teacherId: teachers[1].id,
    },
    {
      code: 'CS101',
      name: '计算机科学导论',
      description: '计算机科学入门课程，介绍计算机发展历史、基本组成原理、编程基础和常用数据结构。',
      credits: 2,
      department: '计算机系',
      category: '专业基础',
      difficulty: 'EASY',
      teacherId: teachers[2].id,
    },
    {
      code: 'ENG102',
      name: '大学英语',
      description: '大学英语课程，提高学生的英语听说读写能力，为国际化学习环境做好准备。',
      credits: 2,
      department: '外语系',
      category: '通识教育',
      difficulty: 'EASY',
      teacherId: teachers[0].id,
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
      console.log(`课程 ${courseData.name} 创建失败，可能已存在`);
    }
  }

  // 创建高等数学章节
  const mathChaptersData = [
    {
      title: '第一章 函数与极限',
      content: '本章介绍函数的基本概念、性质和分类，以及极限的定义、性质和计算方法。',
      order: 1,
      courseId: courses[0].id,
    },
    {
      title: '第二章 导数与微分',
      content: '本章讲解导数的概念、几何意义、求导法则，以及微分的定义和应用。',
      order: 2,
      courseId: courses[0].id,
    },
    {
      title: '第三章 积分学',
      content: '本章介绍不定积分和定积分的概念、性质、计算方法以及在实际问题中的应用。',
      order: 3,
      courseId: courses[0].id,
    },
    {
      title: '第四章 微分方程',
      content: '本章讲解常微分方程的基本概念、分类和求解方法。',
      order: 4,
      courseId: courses[0].id,
    }
  ];

  const mathChapters = [];
  for (const chapterData of mathChaptersData) {
    try {
      const chapter = await prisma.chapter.create({
        data: chapterData,
      });
      console.log('创建章节:', chapter.title);
      mathChapters.push(chapter);
    } catch (error) {
      console.log(`章节 ${chapterData.title} 创建失败`);
    }
  }

  // 创建大学物理章节
  const physChaptersData = [
    {
      title: '第一章 力学基础',
      content: '本章介绍牛顿运动定律、动量守恒、能量守恒等力学基本原理。',
      order: 1,
      courseId: courses[1].id,
    },
    {
      title: '第二章 热学',
      content: '本章讲解热力学基本概念、热力学定律和热力学过程。',
      order: 2,
      courseId: courses[1].id,
    },
    {
      title: '第三章 电磁学',
      content: '本章介绍电场、磁场的基本概念和电磁感应现象。',
      order: 3,
      courseId: courses[1].id,
    }
  ];

  const physChapters = [];
  for (const chapterData of physChaptersData) {
    try {
      const chapter = await prisma.chapter.create({
        data: chapterData,
      });
      console.log('创建章节:', chapter.title);
      physChapters.push(chapter);
    } catch (error) {
      console.log(`章节 ${chapterData.title} 创建失败`);
    }
  }

  // 创建计算机科学导论章节
  const csChaptersData = [
    {
      title: '第一章 计算机基础',
      content: '本章介绍计算机的发展历史、基本组成和工作原理。',
      order: 1,
      courseId: courses[2].id,
    },
    {
      title: '第二章 编程入门',
      content: '本章讲解编程语言基础、算法概念和简单的程序设计。',
      order: 2,
      courseId: courses[2].id,
    },
    {
      title: '第三章 数据结构',
      content: '本章介绍常用的数据结构如数组、链表、栈、队列等。',
      order: 3,
      courseId: courses[2].id,
    }
  ];

  const csChapters = [];
  for (const chapterData of csChaptersData) {
    try {
      const chapter = await prisma.chapter.create({
        data: chapterData,
      });
      console.log('创建章节:', chapter.title);
      csChapters.push(chapter);
    } catch (error) {
      console.log(`章节 ${chapterData.title} 创建失败`);
    }
  }

  // 为高等数学章节创建知识点
  const mathKnowledgePointsData = [
    // 第一章知识点
    [
      { title: '函数的概念与性质', description: '函数的定义、定义域、值域、单调性、奇偶性等基本性质', order: 1 },
      { title: '极限的定义', description: '数列极限和函数极限的严格定义', order: 2 },
      { title: '极限的运算法则', description: '极限的四则运算法则和复合函数极限', order: 3 },
      { title: '两个重要极限', description: 'lim(sin x)/x 和 lim(1+1/x)^x 两个重要极限', order: 4 }
    ],
    // 第二章知识点
    [
      { title: '导数的概念', description: '导数的定义、几何意义和物理意义', order: 1 },
      { title: '求导法则', description: '基本初等函数的导数公式和求导法则', order: 2 },
      { title: '高阶导数', description: '二阶及高阶导数的概念和计算', order: 3 },
      { title: '微分的应用', description: '微分在近似计算和误差估计中的应用', order: 4 }
    ],
    // 第三章知识点
    [
      { title: '不定积分', description: '原函数和不定积分的概念', order: 1 },
      { title: '基本积分公式', description: '基本初等函数的不定积分公式', order: 2 },
      { title: '换元积分法', description: '第一类和第二类换元积分法', order: 3 },
      { title: '分部积分法', description: '分部积分法的原理和应用', order: 4 }
    ],
    // 第四章知识点
    [
      { title: '定积分的概念', description: '定积分的定义和几何意义', order: 1 },
      { title: '微积分基本定理', description: '牛顿-莱布尼茨公式', order: 2 },
      { title: '定积分的应用', description: '定积分在求面积、体积等问题中的应用', order: 3 },
      { title: '反常积分', description: '无穷区间和无界函数的积分', order: 4 }
    ]
  ];

  const mathKnowledgePoints = [];
  for (let i = 0; i < mathChapters.length; i++) {
    const chapter = mathChapters[i];
    const kpDataList = mathKnowledgePointsData[i];
    
    for (const kpData of kpDataList) {
      try {
        const knowledgePoint = await prisma.knowledgePoint.create({
          data: {
            title: kpData.title,
            description: kpData.description,
            order: kpData.order,
            chapterId: chapter.id,
          },
        });
        console.log('创建知识点:', knowledgePoint.title);
        mathKnowledgePoints.push(knowledgePoint);
      } catch (error) {
        console.log(`知识点 ${kpData.title} 创建失败`);
      }
    }
  }

  // 创建题目
  const questionsData = [
    // 高等数学题目
    {
      title: '函数定义域求解',
      content: '求函数 f(x) = √(x-1) + 1/(x-2) 的定义域',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      points: 5,
      correctAnswer: '[1,2)∪(2,+∞)',
      explanation: '根号下要求 x-1 ≥ 0，即 x ≥ 1；分母要求 x-2 ≠ 0，即 x ≠ 2',
      knowledgePointId: mathKnowledgePoints[0].id,
      teacherId: teachers[0].id,
    },
    {
      title: '极限计算',
      content: '计算 lim(x→1) (x²-1)/(x-1)',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      points: 3,
      correctAnswer: '2',
      explanation: '因式分解： (x-1)(x+1)/(x-1) = x+1，当 x→1 时极限为 2',
      knowledgePointId: mathKnowledgePoints[2].id,
      teacherId: teachers[0].id,
    },
    {
      title: '导数计算',
      content: '求函数 f(x) = x³ + 2x² - 5x + 1 的导数',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      points: 4,
      correctAnswer: '3x² + 4x - 5',
      explanation: '使用幂函数求导法则： (x^n)\' = n*x^(n-1)',
      knowledgePointId: mathKnowledgePoints[5].id,
      teacherId: teachers[0].id,
    },
    {
      title: '不定积分',
      content: '计算 ∫ (3x² + 2x - 1) dx',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      points: 4,
      correctAnswer: 'x³ + x² - x + C',
      explanation: '分别对各项积分：∫3x²dx = x³, ∫2xdx = x², ∫-1dx = -x',
      knowledgePointId: mathKnowledgePoints[8].id,
      teacherId: teachers[0].id,
    },
    // 大学物理题目
    {
      title: '牛顿第二定律',
      content: '一个质量为2kg的物体受到10N的水平力作用，求物体的加速度',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      points: 3,
      correctAnswer: '5 m/s²',
      explanation: '根据 F=ma，得 a = F/m = 10/2 = 5 m/s²',
      knowledgePointId: mathKnowledgePoints[0].id, // 这里需要修正为物理知识点ID
      teacherId: teachers[1].id,
    }
  ];

  for (const questionData of questionsData) {
    try {
      const question = await prisma.question.create({
        data: questionData,
      });
      console.log('创建题目:', question.title);
    } catch (error) {
      console.log(`题目 ${questionData.title} 创建失败`);
    }
  }

  // 创建选课记录
  console.log('开始创建选课记录...');
  for (let i = 0; i < students.length; i++) {
    for (let j = 0; j < courses.length; j++) {
      if (Math.random() > 0.3) { // 70%的概率选课
        try {
          const enrollment = await prisma.enrollment.create({
            data: {
              userId: students[i].id,
              courseId: courses[j].id,
              status: 'ENROLLED',
              progress: Math.random() * 100,
            },
          });
          console.log(`学生 ${students[i].username} 选修了课程 ${courses[j].name}`);
        } catch (error) {
          // 选课记录可能已存在
        }
      }
    }
  }

  console.log('测试数据创建完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });