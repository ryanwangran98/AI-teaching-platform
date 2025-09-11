import React from 'react';
import { Box, Typography } from '@mui/material';

const TeacherCourses: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        我的课程
      </Typography>
      <Typography variant="body1" color="textSecondary">
        教师课程管理页面 - 开发中
      </Typography>
    </Box>
  );
};

export default TeacherCourses;