const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEnrollment() {
  try {
    // 从日志中获取的学生ID和课程ID
    const studentId = 'cmffampjb00023cl23xz25lzi';
    const courseId = 'cmffazvkc0005130cqugfj38r';
    
    console.log(`Checking enrollment for student ${studentId} and course ${courseId}`);
    
    // 简单查询，不包含关系字段，避免字段名错误
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: courseId
        }
      }
    });
    
    console.log('Enrollment record:', enrollment);
    
    // 查询该学生的所有enrollment记录
    const allEnrollments = await prisma.enrollment.findMany({
      where: { userId: studentId }
    });
    
    console.log('\nAll enrollments for this student:', allEnrollments);
    
    // 查询所有active状态的enrollment记录（这是getStudentCourses API使用的条件）
    const activeEnrollments = await prisma.enrollment.findMany({
      where: { 
        userId: studentId,
        status: 'ACTIVE'
      }
    });
    
    console.log('\nActive enrollments for this student:', activeEnrollments);
    
    // 获取课程基本信息
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    console.log('\nCourse information:', course);
    
    // 获取用户基本信息
    const user = await prisma.user.findUnique({
      where: { id: studentId }
    });
    
    console.log('\nUser information:', user);
    
  } catch (error) {
    console.error('Error checking enrollment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnrollment();