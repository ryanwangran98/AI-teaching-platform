const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function queryUsers() {
  try {
    // 查询所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    console.log('Users:');
    console.log(users);

    // 特别查询student1@example.com用户
    const studentUser = await prisma.user.findUnique({
      where: {
        email: 'student1@example.com',
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    console.log('\nStudent user:');
    console.log(studentUser);

    // 特别查询teacher1@example.com用户
    const teacherUser = await prisma.user.findUnique({
      where: {
        email: 'teacher1@example.com',
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    console.log('\nTeacher user:');
    console.log(teacherUser);

  } catch (error) {
    console.error('Error querying users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryUsers();