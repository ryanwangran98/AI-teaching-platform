const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const notifications = await prisma.notification.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      content: true,
      userId: true,
      status: true,
    },
    orderBy: {
      userId: 'asc',
    },
  });
  
  console.log('Notifications in database:');
  console.log(JSON.stringify(notifications, null, 2));
  
  // 按用户分类统计
  const userNotifications = {};
  notifications.forEach(notification => {
    if (!userNotifications[notification.userId]) {
      userNotifications[notification.userId] = [];
    }
    userNotifications[notification.userId].push(notification);
  });
  
  console.log('\nNotifications by user:');
  for (const userId in userNotifications) {
    console.log(`User ${userId}: ${userNotifications[userId].length} notifications`);
    userNotifications[userId].forEach(notification => {
      console.log(`  - ${notification.title} (${notification.type})`);
    });
  }
  
  // 统计各类型通知数量
  const typeCounts = {};
  notifications.forEach(notification => {
    typeCounts[notification.type] = (typeCounts[notification.type] || 0) + 1;
  });
  
  console.log('\nNotification type counts:');
  console.log(typeCounts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });