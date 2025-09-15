import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 验证测试数据 ===\n');

  // 验证用户
  const teacher = await prisma.user.findUnique({
    where: { username: 'teacher1' },
  });
  const student = await prisma.user.findUnique({
    where: { username: 'student1' },
  });
  console.log('教师用户:', teacher?.username);
  console.log('学生用户:', student?.username);

  // 验证课程
  const course = await prisma.course.findUnique({
    where: { code: 'MATH101' },
    include: {
      chapters: {
        include: {
          knowledgePoints: true,
        },
      },
    },
  });
  console.log('\n课程:', course?.name);
  console.log('章节数量:', course?.chapters.length);

  // 显示章节和知识点详情
  if (course?.chapters) {
    for (const chapter of course.chapters) {
      console.log(`  章节: ${chapter.title}`);
      console.log(`    知识点数量: ${chapter.knowledgePoints.length}`);
      for (const kp of chapter.knowledgePoints) {
        console.log(`      - ${kp.title}`);
      }
    }
  }

  // 验证题目
  const questions = await prisma.question.findMany({
    where: {
      teacherId: teacher?.id,
    },
    include: {
      knowledgePoint: true,
    },
  });
  console.log('\n题目总数:', questions.length);

  // 按知识点分组显示题目
  const questionsByKP = questions.reduce((acc, question) => {
    const kpTitle = question.knowledgePoint?.title || '未知知识点';
    if (!acc[kpTitle]) {
      acc[kpTitle] = [];
    }
    acc[kpTitle].push(question);
    return acc;
  }, {} as Record<string, typeof questions>);

  for (const [kpTitle, kpQuestions] of Object.entries(questionsByKP)) {
    console.log(`  知识点 "${kpTitle}" 的题目:`);
    for (const question of kpQuestions) {
      console.log(`    - ${question.title} (${question.type}, ${question.difficulty})`);
    }
  }

  // 验证作业
  const assignments = await prisma.assignment.findMany({
    where: {
      teacherId: teacher?.id,
    },
    include: {
      knowledgePoint: true,
    },
  });
  console.log('\n作业总数:', assignments.length);

  // 显示作业详情
  for (const assignment of assignments) {
    console.log(`  作业: ${assignment.title} (${assignment.type})`);
    console.log(`    知识点: ${assignment.knowledgePoint?.title}`);
    console.log(`    总分: ${assignment.totalPoints}`);
    console.log(`    截止日期: ${assignment.dueDate.toDateString()}`);
    
    // 获取关联的题目
    const questionAssignments = await prisma.questionAssignment.findMany({
      where: {
        assignmentId: assignment.id,
      },
      include: {
        question: {
          include: {
            knowledgePoint: true,
          },
        },
      },
    });
    
    console.log(`    关联题目数量: ${questionAssignments.length}`);
    for (const qa of questionAssignments) {
      console.log(`      - ${qa.question.title} (${qa.question.knowledgePoint?.title})`);
    }
    console.log('');
  }

  // 验证关联关系
  const totalQuestionAssignments = await prisma.questionAssignment.count({
    where: {
      assignmentId: {
        in: assignments.map(a => a.id),
      },
    },
  });
  console.log('题目-作业关联总数:', totalQuestionAssignments);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });