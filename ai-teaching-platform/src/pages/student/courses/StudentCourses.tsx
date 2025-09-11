import React from 'react';
import { Box, Typography } from '@mui/material';

const StudentCourses: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        我的课程
      </Typography>
      <Typography variant="body1" color="textSecondary">
        学生课程学习页面 - 开发中
      </Typography>
    </Box>
  );
};

export default StudentCourses;