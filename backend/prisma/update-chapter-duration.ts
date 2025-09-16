import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始更新章节数据...');

  // 获取所有章节
  const chapters = await prisma.chapter.findMany();
  
  for (const chapter of chapters) {
    // 如果章节没有视频时长，设置一个默认值
    if (!chapter.duration) {
      // 设置一个带有小数的视频时长，例如3.55分钟（约3分33秒）
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { duration: 3.55 }
      });
      console.log(`更新章节 ${chapter.title} 的视频时长为 3.55 分钟`);
    }
  }

  console.log('章节数据更新完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });