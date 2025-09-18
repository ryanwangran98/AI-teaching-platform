import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fullCleanup() {
  console.log('开始全面清理数据库...\n');
  
  // 按正确的顺序删除数据以避免外键约束问题
  // 1. 删除通知
  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`删除了 ${deletedNotifications.count} 条通知`);
  
  // 2. 删除视频片段
  const deletedVideoSegments = await prisma.videoSegment.deleteMany({});
  console.log(`删除了 ${deletedVideoSegments.count} 个视频片段`);
  
  // 3. 删除章节进度
  const deletedChapterProgress = await prisma.chapterProgress.deleteMany({});
  console.log(`删除了 ${deletedChapterProgress.count} 个章节进度记录`);
  
  // 4. 删除题目和作业的关联关系
  const deletedQuestionAssignments = await prisma.questionAssignment.deleteMany({});
  console.log(`删除了 ${deletedQuestionAssignments.count} 个题目作业关联关系`);
  
  // 5. 删除作业提交
  const deletedSubmissions = await prisma.submission.deleteMany({});
  console.log(`删除了 ${deletedSubmissions.count} 个作业提交`);
  
  // 6. 删除选课记录
  const deletedEnrollments = await prisma.enrollment.deleteMany({});
  console.log(`删除了 ${deletedEnrollments.count} 个选课记录`);
  
  // 7. 删除题目
  const deletedQuestions = await prisma.question.deleteMany({});
  console.log(`删除了 ${deletedQuestions.count} 个题目`);
  
  // 8. 删除作业
  const deletedAssignments = await prisma.assignment.deleteMany({});
  console.log(`删除了 ${deletedAssignments.count} 个作业`);
  
  // 9. 删除知识点
  const deletedKnowledgePoints = await prisma.knowledgePoint.deleteMany({});
  console.log(`删除了 ${deletedKnowledgePoints.count} 个知识点`);
  
  // 10. 删除课件
  const deletedCoursewares = await prisma.courseware.deleteMany({});
  console.log(`删除了 ${deletedCoursewares.count} 个课件`);
  
  // 11. 删除材料
  const deletedMaterials = await prisma.material.deleteMany({});
  console.log(`删除了 ${deletedMaterials.count} 个材料`);
  
  // 12. 删除章节
  const deletedChapters = await prisma.chapter.deleteMany({});
  console.log(`删除了 ${deletedChapters.count} 个章节`);
  
  // 13. 删除课程
  const deletedCourses = await prisma.course.deleteMany({});
  console.log(`删除了 ${deletedCourses.count} 个课程`);
  
  // 14. 删除用户（除了保留测试账号）
  // 保留测试账号
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      AND: [
        { email: { not: 'teacher@example.com' } },
        { email: { not: 'student@example.com' } }
      ]
    }
  });
  console.log(`删除了 ${deletedUsers.count} 个用户（保留了测试账号）`);
  
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