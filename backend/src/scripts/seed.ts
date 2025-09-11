import prisma from '../config/database';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🚀 开始填充数据库种子数据...');

  try {
    // 创建管理员用户
    const adminPassword = await bcrypt.hash('password123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin1@example.com' },
      update: {},
      create: {
        email: 'admin1@example.com',
        username: 'admin1',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      }
    });

    // 创建教师用户
    const teacherPassword = await bcrypt.hash('password123', 10);
    const teacher = await prisma.user.upsert({
      where: { email: 'teacher1@example.com' },
      update: {},
      create: {
        email: 'teacher1@example.com',
        username: 'teacher1',
        password: teacherPassword,
        firstName: 'Teacher',
        lastName: 'User',
        role: 'TEACHER'
      }
    });

    // 创建学生用户
    const studentPassword = await bcrypt.hash('password123', 10);
    const student = await prisma.user.upsert({
      where: { email: 'student1@example.com' },
      update: {},
      create: {
        email: 'student1@example.com',
        username: 'student1',
        password: studentPassword,
        firstName: 'Student',
        lastName: 'One',
        role: 'STUDENT'
      }
    });

    // 创建第二个学生用户
    const student2 = await prisma.user.upsert({
      where: { email: 'student2@example.com' },
      update: {},
      create: {
        email: 'student2@example.com',
        username: 'student2',
        password: studentPassword,
        firstName: 'Student',
        lastName: 'Two',
        role: 'STUDENT'
      }
    });

    // 创建课程
    const course1 = await prisma.course.upsert({
      where: { code: 'MATH101' },
      update: {},
      create: {
        code: 'MATH101',
        name: '高等数学',
        description: '微积分的基础理论和应用',
        credits: 4,
        department: '数学系',
        category: '基础课',
        difficulty: 'MEDIUM',
        status: 'PUBLISHED',
        teacherId: teacher.id
      }
    });

    const course2 = await prisma.course.upsert({
      where: { code: 'MATH102' },
      update: {},
      create: {
        code: 'MATH102',
        name: '线性代数',
        description: '矩阵理论和线性方程组解法',
        credits: 3,
        department: '数学系',
        category: '基础课',
        difficulty: 'MEDIUM',
        status: 'PUBLISHED',
        teacherId: teacher.id
      }
    });

    const course3 = await prisma.course.upsert({
      where: { code: 'CS201' },
      update: {},
      create: {
        code: 'CS201',
        name: 'Python程序设计',
        description: 'Python编程语言的基础和应用',
        credits: 3,
        department: '计算机系',
        category: '专业课',
        difficulty: 'BEGINNER',
        status: 'PUBLISHED',
        teacherId: teacher.id
      }
    });

    // 创建章节
    const chapter1 = await prisma.chapter.upsert({
      where: { id: 'chapter1' },
      update: {},
      create: {
        id: 'chapter1',
        title: '函数与极限',
        content: '介绍函数的基本概念和极限理论',
        order: 1,
        status: 'published',
        courseId: course1.id
      }
    });

    const chapter2 = await prisma.chapter.upsert({
      where: { id: 'chapter2' },
      update: {},
      create: {
        id: 'chapter2',
        title: '导数与微分',
        content: '介绍导数的定义和微分的应用',
        order: 2,
        status: 'published',
        courseId: course1.id
      }
    });

    const chapter3 = await prisma.chapter.upsert({
      where: { id: 'chapter3' },
      update: {},
      create: {
        id: 'chapter3',
        title: 'Python基础语法',
        content: '介绍Python的基本语法和编程概念',
        order: 1,
        status: 'published',
        courseId: course3.id
      }
    });

    // 创建知识点
    const knowledgePoint1 = await prisma.knowledgePoint.upsert({
      where: { id: 'kp1' },
      update: {},
      create: {
        id: 'kp1',
        title: '极限的概念',
        description: '了解函数极限的数学定义',
        content: '函数在某一点的极限是指当自变量趋近于该点时，函数值趋近于的确定数值',
        order: 1,
        difficulty: 'medium',
        importance: 'high',
        status: 'published',
        chapterId: chapter1.id
      }
    });

    const knowledgePoint2 = await prisma.knowledgePoint.upsert({
      where: { id: 'kp2' },
      update: {},
      create: {
        id: 'kp2',
        title: '极限的运算规则',
        description: '学习极限的四则运算法则',
        content: '极限的四则运算法则包括加法法则、乘法法则、除法法则等',
        order: 2,
        difficulty: 'medium',
        importance: 'high',
        status: 'published',
        chapterId: chapter1.id
      }
    });

    const knowledgePoint3 = await prisma.knowledgePoint.upsert({
      where: { id: 'kp3' },
      update: {},
      create: {
        id: 'kp3',
        title: 'Python变量与数据类型',
        description: '了解Python的基本数据类型和变量定义方法',
        content: 'Python支持多种数据类型，包括整数、浮点数、字符串、列表、元组等',
        order: 1,
        difficulty: 'easy',
        importance: 'high',
        status: 'published',
        chapterId: chapter3.id
      }
    });

    // 创建教学资料
    const material1 = await prisma.material.upsert({
      where: { id: 'material1' },
      update: {},
      create: {
        id: 'material1',
        title: '极限概念讲解PPT',
        description: '详细讲解极限的数学定义和几何意义',
        type: 'PDF',
        fileUrl: '/uploads/materials/limit_ppt.pptx',
        fileSize: 1024 * 1024 * 5, // 5MB
        chapterId: chapter1.id,
        uploadedById: teacher.id
      }
    });

    const material2 = await prisma.material.upsert({
      where: { id: 'material2' },
      update: {},
      create: {
        id: 'material2',
        title: '极限习题集',
        description: '包含各种极限计算的练习题和解答',
        type: 'PDF',
        fileUrl: '/uploads/materials/limit_exercises.pdf',
        fileSize: 1024 * 1024 * 2, // 2MB
        chapterId: chapter1.id,
        uploadedById: teacher.id
      }
    });

    // 创建课件
    const courseware1 = await prisma.courseware.upsert({
      where: { id: 'courseware1' },
      update: {},
      create: {
        id: 'courseware1',
        title: '第一章 函数与极限课件',
        description: '高等数学第一章的完整课件',
        type: 'SLIDES',
        fileUrl: '/uploads/courseware/math_chapter1.pdf',
        fileSize: 1024 * 1024 * 8, // 8MB
        chapterId: chapter1.id,
        uploadedById: teacher.id
      }
    });

    // 创建作业
    const assignment1 = await prisma.assignment.upsert({
      where: { id: 'assignment1' },
      update: {},
      create: {
        id: 'assignment1',
        title: '极限运算习题',
        description: '完成指定的极限计算题目',
        type: 'HOMEWORK',
        totalPoints: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后到期
        status: 'PUBLISHED',
        knowledgePointId: knowledgePoint2.id,
        teacherId: teacher.id
      }
    });

    // 创建问题
    const question1 = await prisma.question.upsert({
      where: { id: 'question1' },
      update: {},
      create: {
        id: 'question1',
        title: '极限的定义',
        content: '什么是函数的极限？请给出数学定义。',
        type: 'essay',
        points: 20,
        difficulty: 'MEDIUM',
        knowledgePointId: knowledgePoint1.id,
        teacherId: teacher.id
      }
    });

    // 创建作业提交
    await prisma.submission.upsert({
      where: { id: 'submission1' },
      update: {},
      create: {
        id: 'submission1',
        content: '1. 1\n2. e\n3. 2',
        status: 'SUBMITTED',
        score: null,
        assignmentId: assignment1.id,
        userId: student.id,
        submittedAt: new Date()
      }
    });

    // 创建选课记录
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: course1.id } },
      update: {},
      create: {
        courseId: course1.id,
        userId: student.id,
        status: 'ENROLLED',
        enrolledAt: new Date()
      }
    });

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: course3.id } },
      update: {},
      create: {
        courseId: course3.id,
        userId: student.id,
        status: 'ENROLLED',
        enrolledAt: new Date()
      }
    });

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student2.id, courseId: course1.id } },
      update: {},
      create: {
        courseId: course1.id,
        userId: student2.id,
        status: 'ENROLLED',
        enrolledAt: new Date()
      }
    });

    // 创建通知
    await prisma.notification.upsert({
      where: { id: 'notification1' },
      update: {},
      create: {
        id: 'notification1',
        title: '新作业发布',
        content: '教师发布了新的极限运算习题作业，请及时完成。',
        type: 'info',
        isRead: false,
        userId: student.id,
        relatedId: assignment1.id,
        relatedType: 'ASSIGNMENT',
        createdAt: new Date()
      }
    });

    console.log('✅ 数据库种子数据填充完成！');
    console.log('\n--- 生成的测试数据 ---');
    console.log(`👤 管理员用户: ${admin.email} / password123`);
    console.log(`👨‍🏫 教师用户: ${teacher.email} / password123`);
    console.log(`👨‍🎓 学生用户: ${student.email} / password123`);
    console.log(`📚 创建了 ${[course1, course2, course3].length} 门课程`);
    console.log(`📝 创建了 ${[assignment1].length} 个作业`);
    console.log(`🎯 创建了 ${[question1].length} 个问题`);
    console.log(`📁 创建了 ${[material1, material2].length} 个教学资料`);
    console.log(`📖 创建了 ${[courseware1].length} 个课件`);
    console.log(`📊 创建了 ${3} 条选课记录`);
    console.log(`🔔 创建了 ${1} 条通知`);
  } catch (error) {
    console.error('❌ 数据库种子数据填充失败:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });