const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSubmissions() {
  try {
    const submissions = await prisma.submission.findMany({
      select: {
        id: true,
        assignmentId: true,
        userId: true,
        status: true,
        score: true
      }
    });
    
    console.log('提交记录:');
    submissions.forEach(sub => {
      console.log(`ID: ${sub.id}`);
      console.log(`作业ID: ${sub.assignmentId}`);
      console.log(`用户ID: ${sub.userId}`);
      console.log(`状态: ${sub.status}`);
      console.log(`分数: ${sub.score}`);
      console.log('---');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkSubmissions();