@echo off

REM 确保这是一个开发环境下的mock服务启动脚本
if not "%NODE_ENV%"=="development" (
  echo Warning: This script is intended for development environment only
)

REM 清理node_modules和构建缓存
echo Cleaning node_modules and build cache...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist

REM 安装依赖
echo Installing dependencies...
npm install

REM 启动开发服务器
echo Starting development server with mock data...
npm run dev