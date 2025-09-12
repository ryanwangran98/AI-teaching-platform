const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryData() {
  try {
    // 查询课程
    const courses = await prisma.course.findMany();
    console.log('Courses:', courses);
    
    // 查询章节
    const chapters = await prisma.chapter.findMany({
      include: {
        course: true
      }
    });
    console.log('Chapters:', chapters);
    
    // 查询知识点
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      include: {
        chapter: true
      }
    });
    console.log('Knowledge Points:', knowledgePoints);
    
    // 查询作业
    const assignments = await prisma.assignment.findMany({
      include: {
        knowledgePoint: {
          include: {
            chapter: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });
    console.log('Assignments:', assignments);
    
    // 根据特定课程ID查询作业
    const courseId = 'cmff43ald0009cfmdep9e9gw7';
    const assignmentsByCourse = await prisma.assignment.findMany({
      where: {
        knowledgePoint: {
          chapter: {
            courseId: courseId
          }
        }
      },
      include: {
        knowledgePoint: {
          include: {
            chapter: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });
    console.log(`Assignments for course ${courseId}:`, assignmentsByCourse);
  } catch (error) {
    console.error('Error querying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryData();