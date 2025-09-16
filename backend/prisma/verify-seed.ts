import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('=== 验证数据库中的数据 ===\n');

  // 检查用户
  const users = await prisma.user.findMany();
  console.log(`用户数量: ${users.length}`);
  users.forEach(user => {
    console.log(`  - ${user.username} (${user.role})`);
  });

  // 检查课程
  const courses = await prisma.course.findMany();
  console.log(`\n课程数量: ${courses.length}`);
  courses.forEach(course => {
    console.log(`  - ${course.name} (${course.code})`);
  });

  // 检查章节
  const chapters = await prisma.chapter.findMany();
  console.log(`\n章节数量: ${chapters.length}`);
  chapters.forEach(chapter => {
    console.log(`  - ${chapter.title}`);
  });

  // 检查知识点
  const knowledgePoints = await prisma.knowledgePoint.findMany();
  console.log(`\n知识点数量: ${knowledgePoints.length}`);
  knowledgePoints.forEach(kp => {
    console.log(`  - ${kp.title}`);
  });

  // 检查题目
  const questions = await prisma.question.findMany();
  console.log(`\n题目数量: ${questions.length}`);
  questions.forEach(question => {
    console.log(`  - ${question.title} (${question.type})`);
  });

  // 检查作业
  const assignments = await prisma.assignment.findMany();
  console.log(`\n作业数量: ${assignments.length}`);
  assignments.forEach(assignment => {
    console.log(`  - ${assignment.title} (${assignment.type})`);
  });

  // 检查选课记录
  const enrollments = await prisma.enrollment.findMany();
  console.log(`\n选课记录数量: ${enrollments.length}`);
  enrollments.forEach(enrollment => {
    console.log(`  - 用户ID ${enrollment.userId} 选课ID ${enrollment.courseId}`);
  });

  console.log('\n=== 验证完成 ===');
}

verify()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });