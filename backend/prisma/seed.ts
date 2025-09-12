import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 创建测试用户
  let teacher;
  try {
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    teacher = await prisma.user.create({
      data: {
        email: 'teacher1@example.com',
        username: 'teacher1',
        password: hashedPassword, // 加密密码
        firstName: 'Teacher',
        lastName: 'One',
        role: 'TEACHER',
      },
    });
  } catch (error) {
    // 如果用户已存在，获取现有用户
    teacher = await prisma.user.findUnique({
      where: {
        username: 'teacher1',
      },
    });
  }

  let student;
  try {
    const hashedPassword = await bcrypt.hash('student123', 10);
    student = await prisma.user.create({
      data: {
        email: 'student1@example.com',
        username: 'student1',
        password: hashedPassword, // 加密密码
        firstName: 'Student',
        lastName: 'One',
        role: 'STUDENT',
      },
    });
  } catch (error) {
    // 如果用户已存在，获取现有用户
    student = await prisma.user.findUnique({
      where: {
        username: 'student1',
      },
    });
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
  } catch (error) {
    // 如果课程已存在，获取现有课程
    course = await prisma.course.findUnique({
      where: {
        code: 'MATH101',
      },
    });
  }

  // 创建章节
  let chapter;
  try {
    chapter = await prisma.chapter.create({
      data: {
        title: '第一章 函数与极限',
        order: 1,
        courseId: course.id,
      },
    });
  } catch (error) {
    // 如果章节已存在，获取现有章节
    chapter = await prisma.chapter.findFirst({
      where: {
        courseId: course.id,
        title: '第一章 函数与极限',
      },
    });
  }

  // 创建知识点
  let knowledgePoint;
  try {
    knowledgePoint = await prisma.knowledgePoint.create({
      data: {
        title: '极限概念',
        order: 1,
        chapterId: chapter.id,
      },
    });
  } catch (error) {
    // 如果知识点已存在，获取现有知识点
    knowledgePoint = await prisma.knowledgePoint.findFirst({
      where: {
        chapterId: chapter.id,
        title: '极限概念',
      },
    });
  }

  // 创建题目
  let question1;
  try {
    question1 = await prisma.question.create({
      data: {
        title: '求极限',
        content: '求lim(x->0) (sin x)/x的值',
        type: 'SHORT_ANSWER',
        difficulty: 'MEDIUM',
        points: 10,
        correctAnswer: '1',
        explanation: '这是重要的极限公式',
        knowledgePointId: knowledgePoint.id,
        teacherId: teacher.id,
      },
    });
  } catch (error) {
    // 如果题目已存在，获取现有题目
    question1 = await prisma.question.findFirst({
      where: {
        title: '求极限',
        knowledgePointId: knowledgePoint.id,
      },
    });
  }

  let question2;
  try {
    question2 = await prisma.question.create({
      data: {
        title: '导数计算',
        content: '求f(x) = x^2的导数',
        type: 'SHORT_ANSWER',
        difficulty: 'EASY',
        points: 5,
        correctAnswer: '2x',
        explanation: '使用基本导数公式',
        knowledgePointId: knowledgePoint.id,
        teacherId: teacher.id,
      },
    });
  } catch (error) {
    // 如果题目已存在，获取现有题目
    question2 = await prisma.question.findFirst({
      where: {
        title: '导数计算',
        knowledgePointId: knowledgePoint.id,
      },
    });
  }

  // 创建作业
  let assignment1;
  try {
    assignment1 = await prisma.assignment.create({
      data: {
        title: '第一次作业',
        description: '函数与极限练习',
        type: 'HOMEWORK',
        totalPoints: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 一周后到期
        status: 'PUBLISHED',
        knowledgePointId: knowledgePoint.id,
        teacherId: teacher.id,
      },
    });
  } catch (error) {
    // 如果作业已存在，获取现有作业
    assignment1 = await prisma.assignment.findFirst({
      where: {
        title: '第一次作业',
        knowledgePointId: knowledgePoint.id,
      },
    });
  }

  let assignment2;
  try {
    assignment2 = await prisma.assignment.create({
      data: {
        title: '第二次作业',
        description: '导数练习',
        type: 'HOMEWORK',
        totalPoints: 100,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 两周后到期
        status: 'PUBLISHED',
        knowledgePointId: knowledgePoint.id,
        teacherId: teacher.id,
      },
    });
  } catch (error) {
    // 如果作业已存在，获取现有作业
    assignment2 = await prisma.assignment.findFirst({
      where: {
        title: '第二次作业',
        knowledgePointId: knowledgePoint.id,
      },
    });
  }

  // 创建题目和作业的关联关系
  // 先删除现有的关联关系
  await prisma.questionAssignment.deleteMany({
    where: {
      questionId: question1.id,
    },
  });

  await prisma.questionAssignment.deleteMany({
    where: {
      questionId: question2.id,
    },
  });

  // 将question1关联到assignment1和assignment2
  await prisma.questionAssignment.create({
    data: {
      questionId: question1.id,
      assignmentId: assignment1.id,
    },
  });

  await prisma.questionAssignment.create({
    data: {
      questionId: question1.id,
      assignmentId: assignment2.id,
    },
  });

  // 将question2只关联到assignment2
  await prisma.questionAssignment.create({
    data: {
      questionId: question2.id,
      assignmentId: assignment2.id,
    },
  });

  console.log('测试数据创建完成！');
  console.log('教师:', teacher.username);
  console.log('学生:', student.username);
  console.log('课程:', course.name);
  console.log('章节:', chapter.title);
  console.log('知识点:', knowledgePoint.title);
  console.log('题目1:', question1.title);
  console.log('题目2:', question2.title);
  console.log('作业1:', assignment1.title);
  console.log('作业2:', assignment2.title);
  console.log('题目1关联到作业:', [assignment1.title, assignment2.title]);
  console.log('题目2关联到作业:', [assignment2.title]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });