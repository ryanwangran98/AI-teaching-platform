import { test, expect } from '@playwright/test';

test('学生端加入课程功能测试', async ({ page }) => {
  // 登录学生账号
  await page.goto('http://localhost:5174/login');
  await page.fill('input[name="email"]', 'student1@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 等待登录成功并跳转到仪表盘
  await page.waitForNavigation({ url: 'http://localhost:5174/student/dashboard' });
  
  // 测试左侧导航栏中是否显示'加入课程'选项
  const joinCourseMenuItem = page.locator('a[href="/student/courses/explore"]');
  await expect(joinCourseMenuItem).toBeVisible();
  await expect(joinCourseMenuItem).toContainText('加入课程');
  
  // 点击'加入课程'进入课程浏览页面
  await joinCourseMenuItem.click();
  await page.waitForNavigation({ url: 'http://localhost:5174/student/courses/explore' });
  
  // 验证页面标题是否为'加入课程'
  await expect(page.locator('h1')).toContainText('加入课程');
  
  // 验证页面中是否显示课程列表
  const courseCards = page.locator('.MuiCard-root');
  await expect(courseCards).toBeVisible();
  
  // 返回'我的课程'页面
  await page.locator('a[href="/student/courses"]').click();
  await page.waitForNavigation({ url: 'http://localhost:5174/student/courses' });
  
  // 验证页面标题是否为'我的课程'
  await expect(page.locator('h1')).toContainText('我的课程');
  
  console.log('学生端课程功能测试完成！');
});