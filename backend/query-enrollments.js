const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // 查询所有课程
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      name: true,
      teacherId: true,
    },
  });
  
  console.log('Courses:');
  console.log(JSON.stringify(courses, null, 2));
  
  // 查询所有注册信息
  const enrollments = await prisma.enrollment.findMany({
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
    },
  });
  
  console.log('\nEnrollments:');
  console.log(JSON.stringify(enrollments, null, 2));
  
  // 查询所有用户
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
    },
  });
  
  console.log('\nUsers:');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });