const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedQuestions() {
  console.log('🌱 Starting questions seeding...');

  try {
    // 获取已存在的课程和教师
    const course = await prisma.course.findFirst();
    const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
    
    if (!course || !teacher) {
      console.error('❌ 课程或教师不存在，请先运行基础seed');
      return;
    }

    // 获取现有的作业或创建新作业
    let assignment = await prisma.assignment.findFirst();
    if (!assignment) {
      assignment = await prisma.assignment.create({
        data: {
          title: '第一章函数极限练习题',
          description: '高等数学第一章函数极限相关练习题',
          type: 'HOMEWORK',
          totalPoints: 100,
          dueDate: new Date('2024-12-31'),
          courseId: course.id,
          teacherId: teacher.id
        }
      });
    }

    // 创建测试题目
    const questions = [
      {
        title: '函数极限的定义',
        content: '请用ε-δ语言给出函数f(x)在x→a时极限为L的定义。',
        type: 'SHORT_ANSWER',
        difficulty: 'MEDIUM',
        points: 10,
        options: JSON.stringify([]),
        correctAnswer: '对于任意ε>0，存在δ>0，使得当0<|x-a|<δ时，有|f(x)-L|<ε。',
        explanation: '这是函数极限的精确定义，称为ε-δ定义，是微积分的基础概念。',
        courseId: course.id,
        assignmentId: assignment.id,
        teacherId: teacher.id
      },
      {
        title: '计算极限：lim(x→2)(x²-4)/(x-2)',
        content: '计算函数(x²-4)/(x-2)当x趋近于2时的极限值。',
        type: 'SINGLE_CHOICE',
        difficulty: 'EASY',
        points: 5,
        options: JSON.stringify(['0', '2', '4', '不存在']),
        correctAnswer: '4',
        explanation: '通过因式分解化简：(x²-4)/(x-2) = (x+2)(x-2)/(x-2) = x+2 (x≠2)，所以极限为2+2=4。',
        courseId: course.id,
        assignmentId: assignment.id,
        teacherId: teacher.id
      },
      {
        title: '判断题：函数在某点连续则在该点必有极限',
        content: '判断这个陈述是否正确。',
        type: 'TRUE_FALSE',
        difficulty: 'EASY',
        points: 3,
        options: JSON.stringify(['正确', '错误']),
        correctAnswer: '正确',
        explanation: '函数在某点连续的定义就是函数在该点的极限存在且等于函数值。',
        courseId: course.id,
        assignmentId: assignment.id,
        teacherId: teacher.id
      },
      {
        title: '无穷小量的性质',
        content: '当x→0时，下列哪个函数不是无穷小量？',
        type: 'SINGLE_CHOICE',
        difficulty: 'MEDIUM',
        points: 8,
        options: JSON.stringify(['sin(x)', 'x²', '1/x', 'tan(x)']),
        correctAnswer: '1/x',
        explanation: '无穷小量是极限为0的函数。1/x当x→0时极限为∞，不是无穷小量。',
        courseId: course.id,
        assignmentId: assignment.id,
        teacherId: teacher.id
      },
      {
        title: '极限运算规则',
        content: '已知lim(x→a)f(x)=3，lim(x→a)g(x)=2，求lim(x→a)[f(x)+g(x)]的值。',
        type: 'SHORT_ANSWER',
        difficulty: 'EASY',
        points: 5,
        options: JSON.stringify([]),
        correctAnswer: '5',
        explanation: '根据极限的加法法则，和的极限等于极限的和：3+2=5。',
        courseId: course.id,
        assignmentId: assignment.id,
        teacherId: teacher.id
      },
      {
        title: '两个重要极限',
        content: '计算极限：lim(x→0)sin(3x)/x',
        type: 'SINGLE_CHOICE',
        difficulty: 'MEDIUM',
        points: 6,
        options: JSON.stringify(['0', '1', '3', '不存在']),
        correctAnswer: '3',
        explanation: '利用重要极限lim(x→0)sin(x)/x=1，可得lim(x→0)sin(3x)/x = 3×lim(x→0)sin(3x)/(3x) = 3×1 = 3。',
        courseId: course.id,
        assignmentId: assignment.id,
        teacherId: teacher.id
      },
      {
        title: '洛必达法则应用',
        content: '用洛必达法则计算极限：lim(x→0)(e^x-1)/x',
        type: 'SINGLE_CHOICE',
        difficulty: 'HARD',
        points: 10,
        options: JSON.stringify(['0', '1', 'e', '不存在']),
        correctAnswer: '1',
        explanation: '这是0/0型不定式，应用洛必达法则：分子导数为e^x，分母导数为1，所以极限为e^0/1=1。',
        courseId: course.id,
        assignmentId: assignment.id,
        teacherId: teacher.id
      },
      {
        title: '函数连续性判断',
        content: '函数f(x)=|x|在x=0处是否连续？请说明理由。',
        type: 'SHORT_ANSWER',
        difficulty: 'MEDIUM',
        points: 8,
        options: JSON.stringify([]),
        correctAnswer: '连续。因为lim(x→0)|x|=0=|0|，满足连续性的定义。',
        explanation: '绝对值函数在x=0处左极限、右极限和函数值都等于0，因此连续。',
        courseId: course.id,
        assignmentId: assignment.id,
        teacherId: teacher.id
      }
    ];

    // 检查并创建题目
    for (const question of questions) {
      const existing = await prisma.question.findFirst({
        where: { title: question.title }
      });

      if (!existing) {
        await prisma.question.create({ data: question });
        console.log(`✅ 创建题目: ${question.title}`);
      } else {
        console.log(`⏭️  跳过已存在题目: ${question.title}`);
      }
    }

    const count = await prisma.question.count();
    console.log(`✅ Questions seeding completed! 总题目数: ${count}`);

  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedQuestions()
  .catch(e => {
    console.error('❌ Error seeding questions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });