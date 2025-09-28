from math import ceil
import os
from pathlib import Path
from random import shuffle
import uuid
import mimetypes
from pptagent.pptgen import PPTAgent
from pptagent.llms import AsyncLLM
from pptagent.presentation.layout import Layout
from pptagent.response.pptgen import (
    EditorOutput,
    SlideElement,
)
from pptagent.multimodal import ImageLabler
from pptagent.utils import Config, Language, package_join
from pptagent.presentation import Presentation
from glob import glob
from os.path import join, exists
import json
from fastmcp import FastMCP
from pptagent.utils import get_logger
from pptagent.pptgen import get_length_factor

logger = get_logger(__name__)


def mcp_slide_validate(editor_output: EditorOutput, layout: Layout, prs_lang: Language):
    warnings = []
    errors = []
    length_factor = get_length_factor(prs_lang, Language.english())
    layout_elements = {el.name for el in layout.elements}
    editor_elements = {el.name for el in editor_output.elements}
    for el in layout_elements - editor_elements:
        errors.append(f"Element {el} not found in editor output")
    for el in editor_elements - layout_elements:
        errors.append(f"Element {el} not found in layout")
    for el in layout.elements:
        if layout[el.name].type == "image":
            for i in range(len(editor_output[el.name].data)):
                if not exists(editor_output[el.name].data[i]):
                    errors.append(f"Image {editor_output[el.name].data[i]} not found")
        else:
            charater_counts = max([len(i) for i in editor_output[el.name].data])
            expected_length = ceil(layout[el.name].suggested_characters * length_factor)
            if charater_counts - expected_length > 5:
                warnings.append(
                    f"Element {el.name} has {charater_counts} characters, but the expected length is {expected_length}"
                )
    return warnings, errors


class PPTAgentServer(PPTAgent):
    roles = [
        "coder",
    ]

    def __init__(self, file_server_port=8001):
        self.source_doc = None
        self.mcp = FastMCP("PPTAgent")
        self.slides = []
        self.layout: Layout | None = None
        self.editor_output: EditorOutput | None = None
        self.file_server_port = file_server_port  # 文件服务器端口
        self.file_tokens = {}  # 存储文件下载令牌映射
        model = AsyncLLM(
            os.getenv("PPTAGENT_MODEL"),
            os.getenv("PPTAGENT_API_BASE"),
            os.getenv("PPTAGENT_API_KEY"),
        )
        if not model.to_sync().test_connection():
            msg = "Unable to connect to the model, please set the PPTAGENT_MODEL, PPTAGENT_API_BASE, and PPTAGENT_API_KEY environment variables correctly"
            logger.error(msg)
            raise Exception(msg)
        super().__init__(language_model=model, vision_model=model)
        # load templates, a directory containing pptx, json, and description for each template
        templates = glob(package_join("templates", "*/"))
        self.template_description = {}
        for template in templates:
            self.template_description[Path(template).name] = open(
                join(template, "description.txt")
            ).read()

        logger.info(
            f"{len(templates)} templates loaded:"
            + ", ".join(self.template_description.keys())
        )

    def register_tools(self):
        @self.mcp.tool()
        def list_available_templates() -> list[dict]:
            """List all available templates."""
            return {
                "message": "Available templates:",
                "templates": [
                    {
                        "name": template_name,
                        "description": self.template_description[template_name],
                    }
                    for template_name in self.template_description.keys()
                ],
            }

        @self.mcp.tool()
        def set_template(template_name: str = "default"):
            """Select a PowerPoint template by name.

            Args:
                template_name: The name of the template to select

            Returns:
                dict: Success message and list of available layouts
            """
            template_folder = package_join("templates", template_name)
            assert template_name in self.template_description, (
                f"Template {template_name} not available, please choose from {list(self.template_description.keys())}"
            )
            prs_config = Config(template_folder)
            prs = Presentation.from_file(
                join(template_folder, "source.pptx"), prs_config
            )
            image_labler = ImageLabler(prs, prs_config)
            image_labler.apply_stats(
                json.load(open(join(template_folder, "image_stats.json"), encoding='utf-8'))
            )
            self.set_reference(
                slide_induction=json.load(
                    open(join(template_folder, "slide_induction.json"), encoding='utf-8')
                ),
                presentation=prs,
            )

            return {
                "message": "Template set successfully, please select layout from given layouts later",
                "template_description": self.template_description[template_name],
                "available_layouts": list(self.layouts.keys()),
            }

        @self.mcp.tool()
        async def set_layout(layout: str):
            """Select a layout for generating slides.

            Args:
                layout: Name of the layout to use. Must be one of the available layouts from set_template.

            Returns:
                dict: Success message, instructions, and content schema for the selected layout.
            """
            assert self._initialized, (
                "PPTAgent not initialized, please call `set_template` first"
            )
            assert layout in self.layouts, (
                "Given layout was not in available layouts: " + ", ".join(self.layouts)
            )
            if self.layout is not None:
                message = "Layout update from " + self.layout.title + " to " + layout
                message += "\nDid you forget to call `generate_slide` after setting slide content?"
            else:
                message = "Layout " + layout + " selected successfully"
            self.layout = self.layouts[layout]
            return {
                "message": message,
                "instructions": "Generate slide content strictly following the schema below",
                "schema": self.layout.content_schema,
            }

        @self.mcp.tool()
        async def set_slide_content(structured_slide_elements: list[dict]):
            """Set the slide elements for generating a PowerPoint slide.
            Note that this function will not generate a slide, you should call `generate_slide`.

            Args:
                structured_slide_elements: List of slide elements with their content
                should follow the content schema and adhere to
                [
                    {
                        "name": "element_name",
                        "data": ["content1", "content2", "..."]
                        // Array of strings for text elements
                        // OR array of image paths for image elements: ["/path/to/image1.jpg", "/path/to/image2.png"]
                    }
                ]
            Returns:
                dict: Success message, warnings, and errors
            """
            self.structured_slide_elements = structured_slide_elements
            assert self.layout is not None, (
                "Layout is not selected, please call `select_layout` before generating slide"
            )
            editor_output = EditorOutput(
                elements=[SlideElement(**e) for e in structured_slide_elements]
            )
            warnings, errors = mcp_slide_validate(
                editor_output, self.layout, self.reference_lang
            )
            if errors:
                raise ValueError("Errors:\n" + "\n".join(errors))

            self.editor_output = editor_output
            if warnings:
                return {
                    "message": "Slide elements set with warnings. Review warnings, consider resetting slide content, or proceed if acceptable.",
                    "warnings": warnings,
                }
            return {
                "message": "Slide elements set successfully. Ready to generate slide."
            }

        @self.mcp.tool()
        async def generate_slide():
            """Generate a PowerPoint slide after layout and slide elements are set.

            Returns:
                dict: Success message with slide number and next steps
            """
            if self.editor_output is None:
                raise ValueError(
                    "Slide elements are not set, please call `set_slide_content` before generating slide"
                )

            command_list, template_id = self._generate_commands(
                self.editor_output, self.layout
            )
            slide, _ = await self._edit_slide(command_list, template_id)

            # Reset state after successful generation
            self.layout = None
            self.editor_output = None
            self.slides.append(slide)

            slide_number = len(self.slides)
            available_layouts = list(self.layouts.keys())
            shuffle(available_layouts)

            return {
                "message": f"Slide {slide_number:02d} generated successfully",
                "next_steps": "You can now save the slides or continue generating more slides",
                "available_layouts": available_layouts,
            }

        @self.mcp.tool()
        async def save_generated_slides(pptx_path: str):
            """Save the generated slides to a PowerPoint file.

            Args:
                pptx_path: The path to save the PowerPoint file
            """
            assert len(self.slides), (
                "No slides generated, please call `generate_slide` first"
            )
            os.makedirs(os.path.dirname(pptx_path), exist_ok=True)
            self.empty_prs.slides = self.slides
            self.empty_prs.save(pptx_path)
            self.slides = []
            self._initialized = False
            return f"total {len(self.empty_prs.slides)} slides saved to {pptx_path}"

        @self.mcp.tool()
        def create_download_link(file_path: str) -> dict:
            """Create a download link for a local file.

            Args:
                file_path: The path to the local file

            Returns:
                dict: Download link information
            """
            # 检查文件是否存在
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"File not found: {file_path}"
                }
            
            # 检查文件是否可读
            if not os.access(file_path, os.R_OK):
                return {
                    "success": False,
                    "error": f"File is not readable: {file_path}"
                }
            
            # 生成唯一的下载令牌
            token = str(uuid.uuid4())
            
            # 存储文件路径和令牌的映射
            self.file_tokens[token] = file_path
            
            # 获取文件名和MIME类型
            file_name = os.path.basename(file_path)
            mime_type, _ = mimetypes.guess_type(file_name)
            if mime_type is None:
                mime_type = "application/octet-stream"
            
            # 获取文件大小
            file_size = os.path.getsize(file_path)
            
            # 构建下载URL（使用文件服务器端口）
            download_url = f"http://localhost:{self.file_server_port}/download/{token}"
            
            return {
                "success": True,
                "download_url": download_url,
                "file_name": file_name,
                "file_size": file_size,
                "mime_type": mime_type,
                "token": token
            }

        @self.mcp.tool()
        def list_downloadable_files() -> dict:
            """List all files that have been made downloadable.

            Returns:
                dict: List of downloadable files
            """
            files = []
            for token, file_path in self.file_tokens.items():
                if os.path.exists(file_path):
                    file_name = os.path.basename(file_path)
                    file_size = os.path.getsize(file_path)
                    mime_type, _ = mimetypes.guess_type(file_name)
                    if mime_type is None:
                        mime_type = "application/octet-stream"
                    
                    files.append({
                        "token": token,
                        "file_path": file_path,
                        "file_name": file_name,
                        "file_size": file_size,
                        "mime_type": mime_type,
                        "download_url": f"http://localhost:{self.file_server_port}/download/{token}"
                    })
            
            return {
                "success": True,
                "files": files,
                "count": len(files)
            }

        @self.mcp.tool()
        def remove_download_link(token: str) -> dict:
            """Remove a download link by token.

            Args:
                token: The download token to remove

            Returns:
                dict: Result of the operation
            """
            if token in self.file_tokens:
                file_path = self.file_tokens[token]
                del self.file_tokens[token]
                return {
                    "success": True,
                    "message": f"Download link for file {file_path} has been removed"
                }
            else:
                return {
                    "success": False,
                    "error": f"Invalid token: {token}"
                }


def main(file_server_port=8001):
    server = PPTAgentServer(file_server_port=file_server_port)
    server.register_tools()
    server.mcp.run(show_banner=False)


if __name__ == "__main__":
    main()
