import os
import mimetypes
from fastmcp import FastMCP
from fastmcp.utilities.logging import get_logger
from starlette.applications import Starlette
from starlette.responses import FileResponse, JSONResponse
from starlette.routing import Route, Mount
from starlette.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import uvicorn

logger = get_logger(__name__)

class FileDownloadServer:
    def __init__(self, mcp_server, host="0.0.0.0", port=8001):
        self.mcp_server = mcp_server
        self.host = host
        self.port = port
        self.app = None
        
    def create_app(self):
        # 创建Starlette应用
        routes = [
            Route("/download/{token}", self.download_file),
            Route("/health", self.health_check),
        ]
        
        self.app = Starlette(routes=routes)
        
        # 添加CORS中间件
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        return self.app
    
    async def health_check(self, request):
        return JSONResponse({"status": "ok", "message": "File download server is running"})
    
    async def download_file(self, request):
        token = request.path_params.get("token")
        
        if not token or token not in self.mcp_server.file_tokens:
            return JSONResponse(
                {"error": "Invalid or expired download token"},
                status_code=404
            )
        
        file_path = self.mcp_server.file_tokens[token]
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            return JSONResponse(
                {"error": "File not found"},
                status_code=404
            )
        
        # 检查文件是否可读
        if not os.access(file_path, os.R_OK):
            return JSONResponse(
                {"error": "File is not readable"},
                status_code=403
            )
        
        # 获取文件名和MIME类型
        file_name = os.path.basename(file_path)
        mime_type, _ = mimetypes.guess_type(file_name)
        if mime_type is None:
            mime_type = "application/octet-stream"
        
        try:
            # 返回文件响应
            return FileResponse(
                file_path,
                filename=file_name,
                media_type=mime_type
            )
        except Exception as e:
            logger.error(f"Error serving file {file_path}: {e}")
            return JSONResponse(
                {"error": "Error serving file"},
                status_code=500
            )
    
    def run(self, **kwargs):
        # 创建应用
        app = self.create_app()
        
        # 启动服务器
        logger.info(f"Starting file download server on {self.host}:{self.port}")
        uvicorn.run(
            app,
            host=self.host,
            port=self.port,
            log_level="info"
        )