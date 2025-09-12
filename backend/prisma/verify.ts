import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  // 查询题目1及其关联的作业
  const question1 = await prisma.question.findUnique({
    where: {
      id: '1', // 假设第一个题目ID为1，如果不是，我们需要找到正确的ID
    },
    include: {
      assignments: {
        include: {
          assignment: true,
        },
      },
    },
  });

  if (question1) {
    console.log('题目1信息:');
    console.log('标题:', question1.title);
    console.log('内容:', question1.content);
    console.log('关联的作业数量:', question1.assignments.length);
    console.log('关联的作业:');
    question1.assignments.forEach((qa, index) => {
      console.log(`  ${index + 1}. ${qa.assignment.title}`);
    });
  } else {
    // 如果ID为1的题目不存在，我们查询所有题目
    const questions = await prisma.question.findMany({
      include: {
        assignments: {
          include: {
            assignment: true,
          },
        },
      },
    });
    
    console.log('所有题目:');
    questions.forEach((question, index) => {
      console.log(`${index + 1}. ${question.title}`);
      console.log('   关联的作业数量:', question.assignments.length);
      question.assignments.forEach((qa, idx) => {
        console.log(`     - ${qa.assignment.title}`);
      });
    });
  }
}

verify()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });