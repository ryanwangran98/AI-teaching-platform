import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('开始清理测试数据...\n');
  
  // 删除所有题目和作业的关联关系
  const deletedQuestionAssignments = await prisma.questionAssignment.deleteMany({
    where: {
      assignment: {
        knowledgePoint: {
          chapter: {
            course: {
              code: 'MATH101'
            }
          }
        }
      }
    }
  });
  console.log(`删除了 ${deletedQuestionAssignments.count} 个题目作业关联关系`);
  
  // 删除所有题目
  const deletedQuestions = await prisma.question.deleteMany({
    where: {
      knowledgePoint: {
        chapter: {
          course: {
            code: 'MATH101'
          }
        }
      }
    }
  });
  console.log(`删除了 ${deletedQuestions.count} 个题目`);
  
  // 删除所有作业
  const deletedAssignments = await prisma.assignment.deleteMany({
    where: {
      knowledgePoint: {
        chapter: {
          course: {
            code: 'MATH101'
          }
        }
      }
    }
  });
  console.log(`删除了 ${deletedAssignments.count} 个作业`);
  
  // 删除所有知识点
  const deletedKnowledgePoints = await prisma.knowledgePoint.deleteMany({
    where: {
      chapter: {
        course: {
          code: 'MATH101'
        }
      }
    }
  });
  console.log(`删除了 ${deletedKnowledgePoints.count} 个知识点`);
  
  // 删除所有章节
  const deletedChapters = await prisma.chapter.deleteMany({
    where: {
      course: {
        code: 'MATH101'
      }
    }
  });
  console.log(`删除了 ${deletedChapters.count} 个章节`);
  
  // 删除课程
  const deletedCourses = await prisma.course.deleteMany({
    where: {
      code: 'MATH101'
    }
  });
  console.log(`删除了 ${deletedCourses.count} 个课程`);
  
  console.log('\n清理完成！');
}

cleanup()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });