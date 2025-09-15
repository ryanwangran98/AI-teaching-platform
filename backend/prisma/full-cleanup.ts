import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fullCleanup() {
  console.log('开始全面清理数据库...\n');
  
  // 按正确的顺序删除数据以避免外键约束问题
  // 1. 删除通知
  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`删除了 ${deletedNotifications.count} 条通知`);
  
  // 2. 删除题目和作业的关联关系
  const deletedQuestionAssignments = await prisma.questionAssignment.deleteMany({});
  console.log(`删除了 ${deletedQuestionAssignments.count} 个题目作业关联关系`);
  
  // 3. 删除作业提交
  const deletedSubmissions = await prisma.submission.deleteMany({});
  console.log(`删除了 ${deletedSubmissions.count} 个作业提交`);
  
  // 4. 删除选课记录
  const deletedEnrollments = await prisma.enrollment.deleteMany({});
  console.log(`删除了 ${deletedEnrollments.count} 个选课记录`);
  
  // 5. 删除题目
  const deletedQuestions = await prisma.question.deleteMany({});
  console.log(`删除了 ${deletedQuestions.count} 个题目`);
  
  // 6. 删除作业
  const deletedAssignments = await prisma.assignment.deleteMany({});
  console.log(`删除了 ${deletedAssignments.count} 个作业`);
  
  // 7. 删除知识点
  const deletedKnowledgePoints = await prisma.knowledgePoint.deleteMany({});
  console.log(`删除了 ${deletedKnowledgePoints.count} 个知识点`);
  
  // 8. 删除章节
  const deletedChapters = await prisma.chapter.deleteMany({});
  console.log(`删除了 ${deletedChapters.count} 个章节`);
  
  // 9. 删除课件
  const deletedCoursewares = await prisma.courseware.deleteMany({});
  console.log(`删除了 ${deletedCoursewares.count} 个课件`);
  
  // 10. 删除材料
  const deletedMaterials = await prisma.material.deleteMany({});
  console.log(`删除了 ${deletedMaterials.count} 个材料`);
  
  // 11. 删除课程
  const deletedCourses = await prisma.course.deleteMany({});
  console.log(`删除了 ${deletedCourses.count} 个课程`);
  
  // 12. 删除用户（除了可能的默认管理员）
  // 注意：这里我们保留所有用户，因为在开发环境中重新创建用户更方便
  // 如果需要删除所有用户，取消下面的注释
  // const deletedUsers = await prisma.user.deleteMany({
  //   where: {
  //     role: {
  //       not: 'ADMIN' // 保留管理员用户
  //     }
  //   }
  // });
  // console.log(`删除了 ${deletedUsers.count} 个用户`);
  
  console.log('\n数据库清理完成！');
}

fullCleanup()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });