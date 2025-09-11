#!/bin/bash

# 确保这是一个开发环境下的mock服务启动脚本
if [ "$NODE_ENV" != "development" ]; then
  echo "Warning: This script is intended for development environment only"
fi

# 清理node_modules和构建缓存
echo "Cleaning node_modules and build cache..."
rush purge || echo "Skip rush purge"
rm -rf node_modules
rm -rf dist

# 安装依赖
 echo "Installing dependencies..."
npm install

# 启动开发服务器
 echo "Starting development server with mock data..."
npm run dev