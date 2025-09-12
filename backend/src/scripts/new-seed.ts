import prisma from '../config/database';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🚀 开始填充数据库种子数据...');

  try {
    // 创建管理员用户
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        username: 'admin',
        password: adminPassword,
        firstName: '系统',
        lastName: '管理员',
        role: 'ADMIN',
        isActive: true
      }
    });

    // 创建教师用户
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacher1 = await prisma.user.upsert({
      where: { email: 'teacher1@example.com' },
      update: {},
      create: {
        email: 'teacher1@example.com',
        username: 'teacher1',
        password: teacherPassword,
        firstName: '张',
        lastName: '老师',
        role: 'TEACHER',
        isActive: true
      }
    });

    const teacher2 = await prisma.user.upsert({
      where: { email: 'teacher2@example.com' },
      update: {},
      create: {
        email: 'teacher2@example.com',
        username: 'teacher2',
        password: teacherPassword,
        firstName: '李',
        lastName: '老师',
        role: 'TEACHER',
        isActive: true
      }
    });

    // 创建学生用户
    const studentPassword = await bcrypt.hash('student123', 10);
    const students = [];
    for (let i = 1; i <= 10; i++) {
      const student = await prisma.user.upsert({
        where: { email: `student${i}@example.com` },
        update: {},
        create: {
          email: `student${i}@example.com`,
          username: `student${i}`,
          password: studentPassword,
          firstName: '学生',
          lastName: `${i}`,
          role: 'STUDENT',
          isActive: true
        }
      });
      students.push(student);
    }

    // 创建课程
    const course1 = await prisma.course.create({
      data: {
        code: 'CS101',
        name: '计算机科学导论',
        description: '计算机科学的基础概念和原理',
        credits: 3,
        department: '计算机科学与技术系',
        category: '专业基础课',
        difficulty: 'BEGINNER',
        status: 'PUBLISHED',
        teacherId: teacher1.id
      }
    });

    const course2 = await prisma.course.create({
      data: {
        code: 'MATH201',
        name: '高等数学',
        description: '微积分、线性代数等高等数学内容',
        credits: 4,
        department: '数学系',
        category: '公共基础课',
        difficulty: 'MEDIUM',
        status: 'PUBLISHED',
        teacherId: teacher2.id
      }
    });

    const course3 = await prisma.course.create({
      data: {
        code: 'ENG101',
        name: '大学英语',
        description: '提高学生的英语综合应用能力',
        credits: 2,
        department: '外语系',
        category: '公共基础课',
        difficulty: 'BEGINNER',
        status: 'PUBLISHED',
        teacherId: teacher2.id
      }
    });

    // 创建章节
    const chapter1_1 = await prisma.chapter.create({
      data: {
        title: '计算机发展史',
        content: '介绍计算机的发展历程和重要里程碑',
        order: 1,
        status: 'published',
        courseId: course1.id
      }
    });

    const chapter1_2 = await prisma.chapter.create({
      data: {
        title: '计算机硬件基础',
        content: '讲解计算机硬件组成和工作原理',
        order: 2,
        status: 'published',
        courseId: course1.id
      }
    });

    const chapter1_3 = await prisma.chapter.create({
      data: {
        title: '计算机软件基础',
        content: '介绍操作系统和应用软件的基本概念',
        order: 3,
        status: 'published',
        courseId: course1.id
      }
    });

    const chapter2_1 = await prisma.chapter.create({
      data: {
        title: '函数与极限',
        content: '函数的概念、性质和极限理论',
        order: 1,
        status: 'published',
        courseId: course2.id
      }
    });

    const chapter2_2 = await prisma.chapter.create({
      data: {
        title: '导数与微分',
        content: '导数的定义、计算和应用',
        order: 2,
        status: 'published',
        courseId: course2.id
      }
    });

    // 创建知识点
    const kp1_1 = await prisma.knowledgePoint.create({
      data: {
        title: '计算机的定义',
        description: '理解计算机的基本概念',
        content: '计算机是一种能够按照程序运行，自动、高速处理海量数据的现代化电子设备',
        order: 1,
        difficulty: 'easy',
        importance: 'high',
        status: 'published',
        chapterId: chapter1_1.id
      }
    });

    const kp1_2 = await prisma.knowledgePoint.create({
      data: {
        title: '计算机的分类',
        description: '了解计算机的不同分类方法',
        content: '计算机按照规模可以分为巨型机、大型机、中型机、小型机和微型机',
        order: 2,
        difficulty: 'easy',
        importance: 'medium',
        status: 'published',
        chapterId: chapter1_1.id
      }
    });

    const kp1_3 = await prisma.knowledgePoint.create({
      data: {
        title: '中央处理器',
        description: '了解CPU的结构和功能',
        content: 'CPU是计算机的核心部件，由运算器和控制器组成',
        order: 1,
        difficulty: 'medium',
        importance: 'high',
        status: 'published',
        chapterId: chapter1_2.id
      }
    });

    const kp2_1 = await prisma.knowledgePoint.create({
      data: {
        title: '函数的概念',
        description: '理解函数的数学定义',
        content: '函数是两个非空数集之间的一种对应关系',
        order: 1,
        difficulty: 'medium',
        importance: 'high',
        status: 'published',
        chapterId: chapter2_1.id
      }
    });

    const kp2_2 = await prisma.knowledgePoint.create({
      data: {
        title: '极限的定义',
        description: '掌握极限的数学定义',
        content: '当自变量趋向于某个值时，函数值趋向于某个确定的数',
        order: 2,
        difficulty: 'hard',
        importance: 'high',
        status: 'published',
        chapterId: chapter2_1.id
      }
    });

    // 创建教学资料
    const material1 = await prisma.material.create({
      data: {
        title: '计算机发展史PPT',
        description: '计算机发展史的详细讲解PPT',
        type: 'PPT',
        fileUrl: '/uploads/materials/history.pptx',
        fileSize: 2048000,
        chapterId: chapter1_1.id,
        uploadedById: teacher1.id
      }
    });

    const material2 = await prisma.material.create({
      data: {
        title: '硬件组成图解',
        description: '计算机硬件组成结构图',
        type: 'PDF',
        fileUrl: '/uploads/materials/hardware.pdf',
        fileSize: 1024000,
        chapterId: chapter1_2.id,
        uploadedById: teacher1.id
      }
    });

    // 创建课件
    const courseware1 = await prisma.courseware.create({
      data: {
        title: '计算机发展史课件',
        description: '第一章课件',
        type: 'SLIDES',
        fileUrl: '/uploads/courseware/history_slides.pdf',
        fileSize: 3072000,
        chapterId: chapter1_1.id,
        uploadedById: teacher1.id
      }
    });

    const courseware2 = await prisma.courseware.create({
      data: {
        title: '硬件基础课件',
        description: '第二章课件',
        type: 'SLIDES',
        fileUrl: '/uploads/courseware/hardware_slides.pdf',
        fileSize: 2560000,
        chapterId: chapter1_2.id,
        uploadedById: teacher1.id
      }
    });

    // 创建作业
    const assignment1 = await prisma.assignment.create({
      data: {
        title: '计算机基础概念作业',
        description: '关于计算机基本概念的练习题',
        type: 'HOMEWORK',
        totalPoints: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        knowledgePointId: kp1_1.id,
        teacherId: teacher1.id
      }
    });

    const assignment2 = await prisma.assignment.create({
      data: {
        title: '函数与极限练习',
        description: '函数与极限相关计算题',
        type: 'QUIZ',
        totalPoints: 50,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        knowledgePointId: kp2_2.id,
        teacherId: teacher2.id
      }
    });

    // 创建问题
    const question1 = await prisma.question.create({
      data: {
        title: '什么是计算机？',
        content: '请简述计算机的定义和主要功能。',
        type: 'ESSAY',
        difficulty: 'EASY',
        points: 20,
        explanation: '计算机是一种能够按照程序运行，自动、高速处理海量数据的现代化电子设备',
        status: 'published',
        knowledgePointId: kp1_1.id,
        teacherId: teacher1.id
      }
    });

    const question2 = await prisma.question.create({
      data: {
        title: '计算机的分类',
        content: '计算机按照规模可以分为哪些类型？',
        type: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        points: 10,
        options: JSON.stringify([
          '巨型机、大型机、中型机、小型机、微型机',
          '台式机、笔记本、平板、手机',
          '个人计算机、服务器、超级计算机',
          '以上都对'
        ]),
        correctAnswer: '0',
        explanation: '计算机按照规模可以分为巨型机、大型机、中型机、小型机和微型机',
        status: 'published',
        knowledgePointId: kp1_2.id,
        teacherId: teacher1.id
      }
    });

    const question3 = await prisma.question.create({
      data: {
        title: '极限的定义',
        content: '当x趋向于0时，sin(x)/x的极限是多少？',
        type: 'SINGLE_CHOICE',
        difficulty: 'HARD',
        points: 15,
        options: JSON.stringify(['0', '1', '∞', '不存在']),
        correctAnswer: '1',
        explanation: '这是一个重要的极限，lim(x→0) sin(x)/x = 1',
        status: 'published',
        knowledgePointId: kp2_2.id,
        teacherId: teacher2.id
      }
    });

    // 将问题关联到作业（使用新的多对多关系）
    await prisma.questionAssignment.create({
      data: {
        questionId: question1.id,
        assignmentId: assignment1.id
      }
    });

    await prisma.questionAssignment.create({
      data: {
        questionId: question2.id,
        assignmentId: assignment1.id
      }
    });

    await prisma.questionAssignment.create({
      data: {
        questionId: question3.id,
        assignmentId: assignment2.id
      }
    });

    // 创建选课记录
    // 所有学生选修计算机科学导论
    for (const student of students) {
      await prisma.enrollment.create({
        data: {
          userId: student.id,
          courseId: course1.id,
          status: 'ENROLLED',
          progress: Math.random() * 100,
          grade: Math.random() * 40 + 60 // 60-100分之间
        }
      });
    }

    // 前5名学生选修高等数学
    for (let i = 0; i < 5; i++) {
      await prisma.enrollment.create({
        data: {
          userId: students[i].id,
          courseId: course2.id,
          status: 'ENROLLED',
          progress: Math.random() * 100,
          grade: Math.random() * 40 + 60 // 60-100分之间
        }
      });
    }

    // 创建作业提交
    for (let i = 0; i < 5; i++) {
      const status = i < 3 ? 'GRADED' : i < 4 ? 'SUBMITTED' : 'PENDING';
      const score = i < 3 ? Math.random() * 30 + 70 : null; // 已评分的给分，未评分的为null
      
      await prisma.submission.create({
        data: {
          content: `这是学生${i+1}的作业答案内容...`,
          status: status,
          score: score,
          assignmentId: assignment1.id,
          userId: students[i].id,
          submittedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000)
        }
      });
    }

    // 创建通知
    await prisma.notification.create({
      data: {
        title: '新作业发布',
        content: '《计算机基础概念作业》已发布，请同学们及时完成。',
        type: 'info',
        isRead: false,
        userId: students[0].id,
        relatedId: assignment1.id,
        relatedType: 'ASSIGNMENT'
      }
    });

    await prisma.notification.create({
      data: {
        title: '课程更新提醒',
        content: '《计算机科学导论》第一章课件已更新，请同学们下载学习。',
        type: 'info',
        isRead: false,
        userId: students[1].id,
        relatedId: courseware1.id,
        relatedType: 'COURSEWARE'
      }
    });

    console.log('✅ 数据库种子数据填充完成！');
    console.log('\n--- 生成的测试数据 ---');
    console.log(`👤 管理员用户: ${admin.email} / admin123`);
    console.log(`👨‍🏫 教师用户: ${teacher1.email} / teacher123, ${teacher2.email} / teacher123`);
    console.log(`👨‍🎓 学生用户: ${students.length} 名学生 (student1@example.com 到 student10@example.com) / student123`);
    console.log(`📚 创建了 ${[course1, course2, course3].length} 门课程`);
    console.log(`📖 创建了 5 个章节`);
    console.log(`🎯 创建了 5 个知识点`);
    console.log(`📝 创建了 ${[assignment1, assignment2].length} 个作业`);
    console.log(`❓ 创建了 ${[question1, question2, question3].length} 个问题`);
    console.log(`📁 创建了 ${[material1, material2].length} 个教学资料`);
    console.log(`📖 创建了 ${[courseware1, courseware2].length} 个课件`);
    console.log(`📊 创建了 ${students.length + 5} 条选课记录`);
    console.log(`📤 创建了 5 条作业提交记录`);
    console.log(`🔔 创建了 2 条通知`);
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