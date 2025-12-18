const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// 登录获取token
async function login() {
  const response = await axios.post('http://localhost:3001/api/auth/login', {
    email: 'teacher@example.com',
    password: 'teacher123'
  });
  return response.data.data.token;
}

// 上传教师原始视频文件
async function uploadTeacherVideo(token, chapterId, videoFilePath) {
  try {
    console.log('🔑 获取token...');
    const authToken = token || await login();
    console.log('✅ 登录成功');

    // 检查视频文件是否存在
    if (!fs.existsSync(videoFilePath)) {
      throw new Error(`视频文件不存在: ${videoFilePath}`);
    }

    const videoFile = fs.createReadStream(videoFilePath);
    const videoFileName = path.basename(videoFilePath);
    const videoFileSize = fs.statSync(videoFilePath).size;

    console.log(`📹 使用教师原始视频文件: ${videoFileName}`);
    console.log(`📊 视频文件大小: ${videoFileSize} 字节`);

    const formData = new FormData();
    formData.append('video', videoFile, videoFileName);

    const uploadResponse = await axios.post(
      `http://localhost:3001/api/chapters/${chapterId}/video`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000, // 5分钟超时
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('✅ 教师原始视频上传成功');
    console.log('📋 上传结果:', JSON.stringify(uploadResponse.data, null, 2));

    return uploadResponse.data;
  } catch (error) {
    console.error('❌ 上传教师视频失败:', error.message);
    throw error;
  }
}

// 验证章节视频URL
async function verifyChapterVideo(token, chapterId) {
  try {
    const authToken = token || await login();
    const response = await axios.get(`http://localhost:3001/api/chapters/${chapterId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('📋 当前章节信息:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ 验证章节信息失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    const chapterId = 'cmfz28tir0006zachtwn50zct';
    
    // 使用教师原始上传的视频文件（选择第一个64MB的视频文件）
    const teacherVideoPath = path.join(__dirname, 'uploads/video/2025916-329059-1758007139309-596449099.mp4');
    
    console.log('🎬 开始恢复教师原始视频...');
    console.log(`📖 章节ID: ${chapterId}`);
    console.log(`📹 原始视频文件: ${teacherVideoPath}`);
    
    // 验证章节当前状态
    console.log('\n1️⃣ 验证章节当前状态...');
    await verifyChapterVideo(null, chapterId);
    
    // 上传教师原始视频
    console.log('\n2️⃣ 上传教师原始视频...');
    await uploadTeacherVideo(null, chapterId, teacherVideoPath);
    
    // 验证更新结果
    console.log('\n3️⃣ 验证章节更新...');
    const updatedChapter = await verifyChapterVideo(null, chapterId);
    
    if (updatedChapter.data && updatedChapter.data.videoUrl) {
      console.log('✅ 章节视频URL已恢复:', updatedChapter.data.videoUrl);
      
      // 测试视频URL访问
      console.log('\n4️⃣ 测试视频URL访问...');
      const videoUrl = `http://localhost:3001${updatedChapter.data.videoUrl}`;
      try {
        const headResponse = await axios.head(videoUrl);
        console.log('✅ 视频URL访问成功:', videoUrl);
        console.log('📊 状态码:', headResponse.status);
        console.log('📝 Content-Type:', headResponse.headers['content-type']);
        console.log('📏 Content-Length:', headResponse.headers['content-length']);
      } catch (urlError) {
        console.log('⚠️ 视频URL访问失败:', urlError.message);
      }
    }
    
    console.log('\n🎉 教师原始视频恢复完成！');
  } catch (error) {
    console.error('❌ 恢复失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}