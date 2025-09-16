import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyEmpty() {
  console.log('验证数据库是否已清空...\n');
  
  // 检查各个表中的数据数量
  const userCount = await prisma.user.count();
  console.log(`用户数量: ${userCount}`);
  
  const courseCount = await prisma.course.count();
  console.log(`课程数量: ${courseCount}`);
  
  const chapterCount = await prisma.chapter.count();
  console.log(`章节数量: ${chapterCount}`);
  
  const knowledgePointCount = await prisma.knowledgePoint.count();
  console.log(`知识点数量: ${knowledgePointCount}`);
  
  const questionCount = await prisma.question.count();
  console.log(`题目数量: ${questionCount}`);
  
  const assignmentCount = await prisma.assignment.count();
  console.log(`作业数量: ${assignmentCount}`);
  
  const enrollmentCount = await prisma.enrollment.count();
  console.log(`选课记录数量: ${enrollmentCount}`);
  
  const submissionCount = await prisma.submission.count();
  console.log(`作业提交数量: ${submissionCount}`);
  
  const questionAssignmentCount = await prisma.questionAssignment.count();
  console.log(`题目作业关联数量: ${questionAssignmentCount}`);
  
  const notificationCount = await prisma.notification.count();
  console.log(`通知数量: ${notificationCount}`);
  
  const materialCount = await prisma.material.count();
  console.log(`材料数量: ${materialCount}`);
  
  const coursewareCount = await prisma.courseware.count();
  console.log(`课件数量: ${coursewareCount}`);
  
  console.log('\n=== 数据库验证完成 ===');
  
  // 检查是否所有表都为空
  const allCounts = [
    userCount, courseCount, chapterCount, knowledgePointCount, 
    questionCount, assignmentCount, enrollmentCount, submissionCount,
    questionAssignmentCount, notificationCount, materialCount, coursewareCount
  ];
  
  const totalData = allCounts.reduce((sum, count) => sum + count, 0);
  
  if (totalData === 0) {
    console.log('✅ 数据库已完全清空');
  } else {
    console.log('❌ 数据库中仍有数据');
  }
}

verifyEmpty()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });