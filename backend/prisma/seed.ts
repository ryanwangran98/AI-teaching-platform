import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建测试数据...');

  // 创建或获取教师用户
  let teacher;
  try {
    teacher = await prisma.user.create({
      data: {
        email: 'teacher@example.com',
        username: 'teacher',
        password: await bcrypt.hash('teacher123', 10),
        firstName: '张',
        lastName: '老师',
        role: 'TEACHER',
      },
    });
    console.log('创建教师用户:', teacher.username);
  } catch (error) {
    teacher = await prisma.user.findUnique({
      where: {
        username: 'teacher',
      },
    });
    console.log('使用现有教师用户:', teacher.username);
  }

  // 创建或获取学生用户
  let student;
  try {
    student = await prisma.user.create({
      data: {
        email: 'student@example.com',
        username: 'student',
        password: await bcrypt.hash('student123', 10),
        firstName: '小明',
        lastName: '王',
        role: 'STUDENT',
      },
    });
    console.log('创建学生用户:', student.username);
  } catch (error) {
    student = await prisma.user.findUnique({
      where: {
        username: 'student',
      },
    });
    console.log('使用现有学生用户:', student.username);
  }

  // 创建课程
  const course = await prisma.course.create({
    data: {
      code: 'CS101',
      name: '计算机科学导论',
      description: '计算机科学入门课程',
      credits: 3,
      department: '计算机系',
      category: '专业课程',
      teacherId: teacher.id,
    },
  });
  console.log('创建课程:', course.name);

  // 创建章节
  const chapter = await prisma.chapter.create({
    data: {
      title: '第一章 计算机基础',
      order: 1,
      courseId: course.id,
    },
  });
  console.log('创建章节:', chapter.title);

  // 创建知识点
  const knowledgePoint = await prisma.knowledgePoint.create({
    data: {
      title: '计算机发展史',
      order: 1,
      chapterId: chapter.id,
    },
  });
  console.log('创建知识点:', knowledgePoint.title);

  // 创建题目
  const question = await prisma.question.create({
    data: {
      title: '计算机发展史',
      content: '第一台电子计算机是什么时候诞生的？',
      type: 'SHORT_ANSWER',
      difficulty: 'EASY',
      points: 10,
      correctAnswer: '1946年',
      explanation: '第一台电子计算机ENIAC于1946年在美国宾夕法尼亚大学诞生',
      knowledgePointId: knowledgePoint.id,
      teacherId: teacher.id,
    },
  });
  console.log('创建题目:', question.title);

  // 创建作业
  const assignment = await prisma.assignment.create({
    data: {
      title: '计算机基础练习',
      description: '第一章计算机基础相关题目练习',
      type: 'HOMEWORK',
      totalPoints: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      knowledgePointId: knowledgePoint.id,
      teacherId: teacher.id,
    },
  });
  console.log('创建作业:', assignment.title);

  // 关联题目和作业
  const questionAssignment = await prisma.questionAssignment.create({
    data: {
      questionId: question.id,
      assignmentId: assignment.id,
    },
  });
  console.log('关联题目和作业');

  // 创建选课记录
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course.id,
      status: 'ENROLLED',
      progress: 0.0,
    },
  });
  console.log('创建选课记录');

  console.log('\n=== 测试数据创建完成 ===');
  console.log('教师:', teacher.username);
  console.log('学生:', student.username);
  console.log('课程:', course.name);
  console.log('章节:', chapter.title);
  console.log('知识点:', knowledgePoint.title);
  console.log('题目:', question.title);
  console.log('作业:', assignment.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });