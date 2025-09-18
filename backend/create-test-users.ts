import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // 创建教师用户
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacher = await prisma.user.upsert({
      where: { email: 'teacher@example.com' },
      update: {},
      create: {
        email: 'teacher@example.com',
        username: 'teacher',
        password: teacherPassword,
        firstName: 'Teacher',
        lastName: 'User',
        role: 'TEACHER',
        isActive: true,
      },
    });

    // 创建学生用户
    const studentPassword = await bcrypt.hash('student123', 10);
    const student = await prisma.user.upsert({
      where: { email: 'student@example.com' },
      update: {},
      create: {
        email: 'student@example.com',
        username: 'student',
        password: studentPassword,
        firstName: 'Student',
        lastName: 'User',
        role: 'STUDENT',
        isActive: true,
      },
    });

    // 创建管理员用户
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        username: 'admin',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('Test users created successfully:');
    console.log('Teacher:', teacher);
    console.log('Student:', student);
    console.log('Admin:', admin);
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();