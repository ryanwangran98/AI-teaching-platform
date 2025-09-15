const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const studentId = 'cmff43akh0002cfmdwqgvwb3v'; // student1@example.com
  
  // 获取学生已加入的所有课程
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: studentId,
      status: 'ENROLLED'
    },
    select: {
      courseId: true
    }
  });
  
  console.log('Student enrollments:');
  console.log(JSON.stringify(enrollments, null, 2));
  
  // 获取这些课程的详细信息和教师ID
  const courseIds = enrollments.map(e => e.courseId);
  const courses = await prisma.course.findMany({
    where: {
      id: {
        in: courseIds
      }
    },
    select: {
      id: true,
      name: true,
      teacherId: true
    }
  });
  
  console.log('\nStudent courses:');
  console.log(JSON.stringify(courses, null, 2));
  
  // 获取所有相关教师ID
  const teacherIds = Array.from(new Set(courses.map(c => c.teacherId)));
  
  console.log('\nTeacher IDs:');
  console.log(JSON.stringify(teacherIds, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });