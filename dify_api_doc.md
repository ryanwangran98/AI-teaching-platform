# Dify API 接口文档

## 认证方式
所有API接口都需要使用Bearer Token认证，在请求头中添加：
```
Authorization: Bearer {access_token}
```

## 1. 用户登录
**接口地址**: `POST /console/api/login`
**请求体**:
```json
{
  "email": "3325127454@qq.com",
  "password": "wangran1998"
}
```
**响应**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 2. 创建应用
**接口地址**: `POST /console/api/apps`
**请求体**:
```json
{
  "name": "agent_name",
  "mode": "agent-chat",
  "description": ""
}
```
**响应**:
```json
{
  "id": "e0a0d7b5-1d9f-4a5c-8e7c-3f9a8b7c6d5e",
  "name": "agent_name",
  "mode": "agent-chat",
  "description": "",
  "created_at": 1758775465
}
```

### 参数说明
- **name**: 应用名称（必需）
- **mode**: 应用模式，必须为`agent-chat`（智能助手）
- **description**: 应用描述

### 注意事项
- 创建应用时，agent_mode、model_config和dataset_configs等配置不会被保存，需要在创建后通过更新接口设置
- 创建应用后必须使用更新接口设置模型配置和agent配置才能正常使用

### 创建应用后的必要配置步骤
创建应用后，必须使用以下默认配置更新应用，以确保应用能够正常工作：

```json
{
  "mode": "agent-chat",
  "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接",
  "agent_mode": {
    "max_iteration": 30,
    "enabled": true,
    "strategy": "react",
    "tools": [
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "list_available_templates",
        "tool_label": "list_available_templates",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "set_template",
        "tool_label": "set_template",
        "tool_parameters": {
          "template_name": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "set_layout",
        "tool_label": "set_layout",
        "tool_parameters": {
          "layout": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "set_slide_content",
        "tool_label": "set_slide_content",
        "tool_parameters": {
          "structured_slide_elements": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "generate_slide",
        "tool_label": "generate_slide",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "save_generated_slides",
        "tool_label": "save_generated_slides",
        "tool_parameters": {
          "pptx_path": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "create_download_link",
        "tool_label": "create_download_link",
        "tool_parameters": {
          "file_path": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "list_downloadable_files",
        "tool_label": "list_downloadable_files",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "remove_download_link",
        "tool_label": "remove_download_link",
        "tool_parameters": {
          "token": ""
        },
        "notAuthor": false,
        "enabled": true
      }
    ]
  },
  "model": {
    "provider": "axdlee/sophnet/sophnet",
    "name": "Kimi-K2-0905",
    "mode": "chat",
    "completion_params": {
      "temperature": 0.3,
      "stop": []
    },
    "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接"
  },
  "dataset_configs": {
    "datasets": {
      "strategy": "router",
      "datasets": []
    },
    "retrieval_model": "multiple",
    "top_k": 5,
    "score_threshold": 0.0,
    "score_threshold_enabled": false,
    "reranking_enable": true,
    "reranking_model": {
      "reranking_provider_name": "",
      "reranking_model_name": ""
    },
    "weights": {
      "weight_type": "custom",
      "keyword_setting": {
        "keyword_weight": 0.3
      },
      "vector_setting": {
        "vector_weight": 0.7
      }
    }
  }
}
```

### 配置说明
- **agent_mode**: 启用智能助手模式，使用React策略，包含9个MCP工具用于PPT生成
- **model**: 使用Kimi-K2-0905模型，温度参数设为0.3，预设提示词用于指导AI生成PPT
- **dataset_configs**: 使用多路检索模型，设置top_k为5，启用重排序，权重配置为关键词0.3、向量0.7

### 重要提醒
- 使用其他接口（如关联知识库、上传文档等）时，不会影响应用的这些核心配置
- 如果需要修改应用的agent配置、模型配置或数据集配置，请使用更新应用配置接口
- 确保在创建应用后立即设置这些默认配置，否则应用将无法正常工作

### 关于pre_prompt的重要说明
**注意**：在Agent模式下，`pre_prompt`字段在配置中有两个位置：
1. `model.pre_prompt` - 模型级别的预提示词配置
2. 根级别的`pre_prompt` - 应用级别的预提示词配置

**前端显示逻辑**：前端界面会优先显示根级别的`pre_prompt`字段。如果该字段为空，即使`model.pre_prompt`有值，也不会在前端界面中显示。

**正确配置方式**：要确保预提示词在前端界面正确显示并生效，需要同时设置两个字段：
```json
{
  "pre_prompt": "你的预提示词内容",
  "model": {
    "provider": "axdlee/sophnet/sophnet",
    "name": "Kimi-K2-0905",
    "mode": "chat",
    "completion_params": {
      "temperature": 0.3,
      "stop": []
    },
    "pre_prompt": "你的预提示词内容"
  }
}
```

**后端生效逻辑**：Agent模式下，后端会使用`model.pre_prompt`作为系统提示词的一部分，但前端界面显示依赖于根级别的`pre_prompt`字段。

## 方法二：直接修改数据库配置

如果你需要直接在后端数据库中修改pre_prompt，必须同时更新两个字段才能确保前端正确显示和后端生效。

### 数据库结构说明

应用配置存储在`app_model_configs`表中，主要字段：
- `pre_prompt` - 根级别的预提示词（前端显示用）
- `model_config` - JSON字段，包含模型配置，其中的`model.pre_prompt`是后端生效的预提示词

### 正确的数据库修改方式

```sql
-- 同时更新两个pre_prompt字段
UPDATE app_model_configs 
SET 
    pre_prompt = '你的新预提示词内容',
    model_config = jsonb_set(
        model_config::jsonb,
        '{model,pre_prompt}',
        '"你的新预提示词内容"'::jsonb
    )
WHERE app_id = '你的应用ID'
AND id = (
    SELECT app_model_config_id 
    FROM apps 
    WHERE id = '你的应用ID'
);
```

### 验证修改结果

修改后可以通过API验证：

```bash
curl -X GET "http://localhost:5001/console/api/apps/你的应用ID" \
  -H "Authorization: Bearer 你的token"
```

验证返回的JSON中：
1. `model_config.pre_prompt` 应该显示你的新预提示词（前端显示）
2. `model_config.model.pre_prompt` 也应该显示相同的内容（后端生效）

### 常见错误

**错误做法**：只修改`model_config.model.pre_prompt`
```sql
-- 错误：这样修改前端不会显示
UPDATE app_model_configs 
SET model_config = jsonb_set(
    model_config::jsonb,
    '{model,pre_prompt}',
    '"你的新预提示词内容"'::jsonb
)
WHERE app_id = '你的应用ID';
```

**错误症状**：
- 通过API查看配置，`model.pre_prompt`有值但`pre_prompt`为空
- 前端界面不显示预提示词内容
- 后端可能生效但前端看不到

### 重要提醒

1. **必须同时修改两个字段**：`pre_prompt`和`model_config.model.pre_prompt`
2. **保持一致性**：两个字段的内容应该相同，避免前后端显示不一致
3. **清除缓存**：修改后建议清除浏览器缓存或重新加载前端页面
4. **测试验证**：修改后通过前端界面重新保存一次配置，确保状态同步

## 3. 更新应用配置
**接口地址**: `POST /console/api/apps/{appId}/model-config`
**功能**: 更新应用的模型配置、agent配置和工具设置

### 请求体
```json
{
  "mode": "agent-chat",
  "agent_mode": {
    "max_iteration": 30,
    "enabled": true,
    "strategy": "react",
    "tools": [
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "list_available_templates",
        "tool_label": "list_available_templates",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "set_template",
        "tool_label": "set_template",
        "tool_parameters": {
          "template_name": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "set_layout",
        "tool_label": "set_layout",
        "tool_parameters": {
          "layout": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "set_slide_content",
        "tool_label": "set_slide_content",
        "tool_parameters": {
          "structured_slide_elements": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "generate_slide",
        "tool_label": "generate_slide",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "save_generated_slides",
        "tool_label": "save_generated_slides",
        "tool_parameters": {
          "pptx_path": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "create_download_link",
        "tool_label": "create_download_link",
        "tool_parameters": {
          "file_path": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "list_downloadable_files",
        "tool_label": "list_downloadable_files",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "remove_download_link",
        "tool_label": "remove_download_link",
        "tool_parameters": {
          "token": ""
        },
        "notAuthor": false,
        "enabled": true
      }
    ]
  },
  "model": {
    "provider": "axdlee/sophnet/sophnet",
    "name": "Kimi-K2-0905",
    "mode": "chat",
    "completion_params": {
      "temperature": 0.3,
      "stop": []
    },
    "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接"
  },
  "dataset_configs": {
    "datasets": {
      "strategy": "router",
      "datasets": []
    },
    "retrieval_model": "multiple",
    "top_k": 5,
    "score_threshold": 0.0,
    "score_threshold_enabled": false,
    "reranking_enable": true,
    "reranking_model": {
      "reranking_provider_name": "",
      "reranking_model_name": ""
    },
    "weights": {
      "weight_type": "custom",
      "keyword_setting": {
        "keyword_weight": 0.3
      },
      "vector_setting": {
        "vector_weight": 0.7
      }
    }
  }
}
```

**响应**:
```json
{
    "result": "success"
}
```

### 重要提醒：验证操作结果
关联或取消关联操作完成后，**建议立即验证操作结果**：

1. **重新获取应用配置**：再次调用`GET /console/api/apps/{appId}`接口，确认知识库列表已正确更新
2. **检查知识库关联状态**：使用`GET /console/api/datasets/{datasetId}/related-apps`接口验证知识库与应用的关联状态
3. **测试应用功能**：确保应用仍能正常工作，知识库检索功能正常

### 参数说明
- **mode**: 应用模式，必须为`agent-chat`（智能助手）
- **agent_mode**: 智能助手模式配置
  - **enabled**: 是否启用智能助手模式，默认为true
  - **strategy**: 策略类型，可选`function_call`（函数调用）、`cot`（思维链）、`react`（React模式），默认为`react`
  - **tools**: 工具列表，可包含各种AI工具如数据集检索、网络搜索等，默认包含9个MCP工具用于PPT生成
    - **provider_id**: 工具提供者ID
    - **provider_type**: 工具提供者类型，如"mcp"
    - **provider_name**: 工具提供者名称
    - **tool_name**: 工具名称
    - **tool_label**: 工具标签
    - **tool_parameters**: 工具参数，根据不同工具有不同参数
    - **notAuthor**: 是否非作者，默认为false
    - **enabled**: 是否启用该工具，默认为true
  - **max_iteration**: 最大迭代次数，默认为30
- **model**: 模型配置
  - **provider**: 模型提供商，如`axdlee/sophnet/sophnet`
  - **name**: 模型名称，如`Kimi-K2-0905`
  - **mode**: 模型模式，如`chat`
  - **completion_params**: 模型参数
    - **temperature**: 温度参数，控制随机性，范围0-1，默认为0.3
    - **stop**: 停止词列表
  - **pre_prompt**: 预设提示词，用于指导AI的行为和回答方式
- **dataset_configs**: 数据集配置
  - **datasets**: 数据集配置对象，包含：
    - **strategy**: 策略，如"router"
    - **datasets**: 数据集列表，每个数据集包含：
      - **dataset**: 数据集信息
        - **enabled**: 是否启用该数据集
        - **id**: 知识库ID
  - **retrieval_model**: 检索模型，可选`single`（单路召回）或`multiple`（多路召回）
  - **top_k**: 返回结果数量，默认5
  - **score_threshold**: 相似度阈值，默认0.0
  - **score_threshold_enabled**: 是否启用相似度阈值
  - **reranking_enable**: 是否启用重排序，默认false
  - **reranking_model**: 重排序模型配置
    - **reranking_provider_name**: 重排序模型提供商名称
    - **reranking_model_name**: 重排序模型名称
  - **weights**: 权重配置
    - **weight_type**: 权重类型，可选`balanced`（平衡）、`custom`（自定义）
    - **keyword_setting**: 关键词设置
      - **keyword_weight**: 关键词权重，范围0-1
    - **vector_setting**: 向量设置
      - **vector_weight**: 向量权重，范围0-1

### 实际示例

以下是为ID为`e0a0d7b5-1d9f-4a5c-8e7c-3f9a8b7c6d5e`的应用更新配置的完整curl示例：

```bash
curl -X POST http://localhost:5001/console/api/apps/e0a0d7b5-1d9f-4a5c-8e7c-3f9a8b7c6d5e/model-config \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTJhOTY1MDgtNWNjNS00ZjI4LTg3ZmQtNTI2NTIxZjFlMGI3IiwiZXhwIjoxNzU4Nzg0OTczLCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.TxaWVNyFMTJ5-TrlVIR_OCVW0bn5j4vdvnIpG3OVfTM" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "agent-chat",
    "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接",
    "agent_mode": {
      "max_iteration": 30,
      "enabled": true,
      "strategy": "react",
      "tools": [
        {
          "provider_id": "123",
          "provider_type": "mcp",
          "provider_name": "123",
          "tool_name": "list_available_templates",
          "tool_label": "list_available_templates",
          "tool_parameters": {},
          "notAuthor": false,
          "enabled": true
        },
        {
          "provider_id": "123",
          "provider_type": "mcp",
          "provider_name": "123",
          "tool_name": "set_template",
          "tool_label": "set_template",
          "tool_parameters": {
            "template_name": ""
          },
          "notAuthor": false,
          "enabled": true
        },
        {
          "provider_id": "123",
          "provider_type": "mcp",
          "provider_name": "123",
          "tool_name": "set_layout",
          "tool_label": "set_layout",
          "tool_parameters": {
            "layout": ""
          },
          "notAuthor": false,
          "enabled": true
        },
        {
          "provider_id": "123",
          "provider_type": "mcp",
          "provider_name": "123",
          "tool_name": "set_slide_content",
          "tool_label": "set_slide_content",
          "tool_parameters": {
            "structured_slide_elements": ""
          },
          "notAuthor": false,
          "enabled": true
        },
        {
          "provider_id": "123",
          "provider_type": "mcp",
          "provider_name": "123",
          "tool_name": "generate_slide",
          "tool_label": "generate_slide",
          "tool_parameters": {},
          "notAuthor": false,
          "enabled": true
        },
        {
          "provider_id": "123",
          "provider_type": "mcp",
          "provider_name": "123",
          "tool_name": "save_generated_slides",
          "tool_label": "save_generated_slides",
          "tool_parameters": {
            "pptx_path": ""
          },
          "notAuthor": false,
          "enabled": true
        },
        {
          "provider_id": "123",
          "provider_type": "mcp",
          "provider_name": "123",
          "tool_name": "create_download_link",
          "tool_label": "create_download_link",
          "tool_parameters": {
            "file_path": ""
          },
          "notAuthor": false,
          "enabled": true
        },
        {
          "provider_id": "123",
          "provider_type": "mcp",
          "provider_name": "123",
          "tool_name": "list_downloadable_files",
          "tool_label": "list_downloadable_files",
          "tool_parameters": {},
          "notAuthor": false,
          "enabled": true
        },
        {
          "provider_id": "123",
          "provider_type": "mcp",
          "provider_name": "123",
          "tool_name": "remove_download_link",
          "tool_label": "remove_download_link",
          "tool_parameters": {
            "token": ""
          },
          "notAuthor": false,
          "enabled": true
        }
      ]
    },
    "model": {
      "provider": "axdlee/sophnet/sophnet",
      "name": "Kimi-K2-0905",
      "mode": "chat",
      "completion_params": {
        "temperature": 0.3,
        "stop": []
      },
      "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接"
    },
    "dataset_configs": {
      "datasets": {
        "strategy": "router",
        "datasets": []
      },
      "retrieval_model": "multiple",
      "top_k": 5,
      "score_threshold": 0.0,
      "score_threshold_enabled": false,
      "reranking_enable": true,
      "reranking_model": {
        "reranking_provider_name": "",
        "reranking_model_name": ""
      },
      "weights": {
        "weight_type": "custom",
        "keyword_setting": {
          "keyword_weight": 0.3
        },
        "vector_setting": {
          "vector_weight": 0.7
        }
      }
    }
  }'
```

### 注意事项
- 更新应用配置时，必须包含完整的配置信息，不能只更新部分字段
- 创建应用后，必须使用此接口设置agent_mode、model和dataset_configs等配置才能正常使用
- 工具配置中的tool_parameters需要根据具体工具设置正确的参数
- pre_prompt是指导AI行为的重要参数，应根据应用场景设置合适的提示词

## 4. 创建知识库
**接口地址**: `POST /console/api/datasets`
**请求体**:
```json
{
  "name": "知识库名称",
  "indexing_technique": "high_quality",
  "embedding_model": "embeddings",
  "embedding_model_provider": "axdlee/sophnet/sophnet"
}
```
**响应**:
```json
{
  "id": "ad3c072f-ee6a-449a-89e5-42f52fdddcd0",
  "name": "知识库名称",
  "indexing_technique": "high_quality",
  "embedding_model": "embeddings",
  "embedding_model_provider": "axdlee/sophnet/sophnet",
  "created_at": 1758682552
}
```

### 参数说明
- **name**: 知识库名称（必需）
- **indexing_technique**: 索引技术，可选`high_quality`（高质量）或`economy`（经济）
- **embedding_model**: 嵌入模型名称，如`embeddings`
- **embedding_model_provider**: 嵌入模型提供商，如`axdlee/sophnet/sophnet`

### 注意事项
- 创建知识库时无法设置检索配置（retrieval_model），需要在知识库创建后通过更新接口设置检索配置
- 检索配置包括搜索方法、重排序设置、权重分配等参数

## 4. 上传文档到知识库

### 完整流程说明
上传文档到知识库需要两个步骤：
1. **先上传文件** - 获取文件ID
2. **再创建文档** - 使用文件ID创建知识库文档

### 步骤1：上传文件
**接口地址**: `POST /console/api/files/upload`
**请求方式**: `multipart/form-data`
**请求参数**:
- `file`: 要上传的文件（必需）
- `user`: 用户标识（必需）

**curl示例**:
```bash
curl -X POST "http://localhost:5001/console/api/files/upload" \
  -H "Authorization: Bearer {access_token}" \
  -F "file=@test_document.txt" \
  -F "user=3325127454@qq.com"
```

**响应**:
```json
{
  "id": "1edfd663-9acb-4a31-94fd-62e13ff10bb8",
  "name": "test_document.txt",
  "size": 159,
  "extension": "txt",
  "mime_type": "text/plain",
  "created_by": "52a96508-5cc5-4f28-87fd-526521f1e0b7",
  "created_at": 1758620589
}
```

### 步骤2：创建知识库文档
**接口地址**: `POST /console/api/datasets/{datasetId}/documents`
**请求体**:
```json
{
  "data_source": {
    "type": "upload_file",
    "info_list": {
      "data_source_type": "upload_file",
      "file_info_list": {
        "file_ids": ["1edfd663-9acb-4a31-94fd-62e13ff10bb8"]
      }
    }
  },
  "indexing_technique": "high_quality",
  "process_rule": {
    "mode": "custom",
    "rules": {
      "pre_processing_rules": [],
      "segmentation": {
        "separator": "\\n",
        "max_tokens": 1000,
        "chunk_overlap": 50
      }
    }
  },
  "doc_form": "text_model",
  "doc_language": "zh",
  "retrieval_model": {
    "search_method": "hybrid_search",
    "reranking_enable": true,
    "reranking_mode": "weighted_score",
    "reranking_model": {
      "reranking_provider_name": "",
      "reranking_model_name": ""
    },
    "weights": {
      "weight_type": "custom",
      "keyword_setting": {
        "keyword_weight": 0.3
      },
      "vector_setting": {
        "vector_weight": 0.7,
        "embedding_model_name": "embeddings",
        "embedding_provider_name": "axdlee/sophnet/sophnet"
      }
    },
    "top_k": 5,
    "score_threshold_enabled": false,
    "score_threshold": 0.0
  },
  "embedding_model": "embeddings",
  "embedding_model_provider": "axdlee/sophnet/sophnet"
}
```

**响应**:
```json
{
  "dataset": {
    "id": "f532f388-3b4a-4e03-a45d-d2974639e2e7",
    "name": "测试知识库修复版",
    "indexing_technique": "high_quality"
  },
  "documents": [
    {
      "id": "09fba64d-0212-48a9-affa-dcdee643d91d",
      "name": "test_document.txt",
      "indexing_status": "waiting",
      "word_count": 12,
      "tokens": 20,
      "doc_form": "text_model"
    }
  ],
  "batch": "20250923094326509881"
}
```

### 参数说明
- **data_source**: 数据源信息，必须包含已上传文件的ID
- **indexing_technique**: 索引技术，可选`high_quality`（高质量）或`economy`（经济）
- **process_rule**: 文档处理规则，包括分段设置
  - **mode**: 处理模式，可选`custom`（自定义）或`automatic`（自动）
  - **rules**: 处理规则
    - **pre_processing_rules**: 预处理规则列表，如去除多余空格、移除URL和邮箱等
    - **segmentation**: 分段设置
      - **separator**: 分段分隔符，默认为"\\n"（换行符）
      - **max_tokens**: 每个分段的最大token数量，默认为1000
      - **chunk_overlap**: 分段之间的重叠字符数，用于保持上下文连续性，默认为50
- **doc_form**: 文档格式，如`text_model`（文本模式）
- **doc_language**: 文档语言，如`zh`（中文）
- **retrieval_model**: 检索模型配置
  - **search_method**: 搜索方法，可选值：
    - `keyword_search`: 仅关键词搜索
    - `vector_search`: 仅向量搜索
    - `hybrid_search`: 混合搜索（关键词+向量）
  - **reranking_enable**: 是否启用重排序，默认false
  - **reranking_mode**: 重排序模式，如`weighted_score`
  - **reranking_model**: 重排序模型配置
  - **weights**: 权重配置
    - **weight_type**: 权重类型，可选`balanced`（平衡）、`custom`（自定义）
    - **keyword_setting**: 关键词设置
      - **keyword_weight**: 关键词权重，范围0-1
    - **vector_setting**: 向量设置
      - **vector_weight**: 向量权重，范围0-1
      - **embedding_model_name**: 嵌入模型名称
      - **embedding_provider_name**: 嵌入模型提供商名称
  - **top_k**: 返回结果数量，默认5
  - **score_threshold_enabled**: 是否启用相似度阈值，默认false
  - **score_threshold**: 相似度阈值，范围0-1
- **embedding_model**: 嵌入模型名称，如`embeddings`
- **embedding_model_provider**: 嵌入模型提供商，如`axdlee/sophnet/sophnet`

## 5. 测试结果

通过以上测试，我们验证了更新后的文档方法的可行性：

1. **创建应用**：使用简化的请求体（只包含name、mode和description）成功创建应用。
2. **更新应用配置**：通过`POST /console/api/apps/{appId}/model-config`接口成功设置以下配置：
   - agent_mode：启用Agent模式，设置max_iteration为5，strategy为"router"，并添加三个工具（dataset_retriever_tool、web_search和wikipedia）
   - model：设置provider为"axdlee/sophnet/sophnet"，name为"DeepSeek-v3"，mode为"chat"，completion_params中temperature为0.7，top_p为0.9
   - pre_prompt：设置为"1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接"
   - dataset_configs：设置retrieval_model为"multiple"，top_k为3，score_threshold为0.5

3. **验证配置**：获取应用详情确认所有配置都已正确保存。

测试证明，这种先创建应用再更新配置的方法是可行的，能够成功设置所有必要的配置参数。

## 6. 通过更新应用配置关联知识库
**接口地址**: `POST /console/api/apps/{appId}/model-config`
**功能**: 通过更新应用配置来关联或取消关联知识库

### 重要提醒：操作前必须先查询当前应用配置
在关联或取消关联知识库之前，**必须先获取当前应用的完整配置**，确保只修改知识库关联部分，保持其他所有配置不变。

### 步骤1：获取当前应用配置
**接口地址**: `GET /console/api/apps/{appId}`
**功能**: 获取当前应用的完整配置信息

**curl示例**:
```bash
curl -X GET "http://localhost:5001/console/api/apps/369d3518-06bd-4231-9afe-090d5109bbcc" \
  -H "Authorization: Bearer {access_token}"
```

**响应示例**:
```json
{
  "id": "369d3518-06bd-4231-9afe-090d5109bbcc",
  "name": "应用名称",
  "mode": "agent-chat",
  "model_config": {
    "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接",
    "agent_mode": {
      "max_iteration": 30,
      "enabled": true,
      "strategy": "react",
      "tools": [
        {
          "provider_id": "123",
          "provider_type": "mcp",
          "provider_name": "123",
          "tool_name": "list_available_templates",
          "tool_label": "list_available_templates",
          "tool_parameters": {},
          "notAuthor": false,
          "enabled": true
        }
      ]
    },
    "model": {
      "provider": "axdlee/sophnet/sophnet",
      "name": "Kimi-K2-0905",
      "mode": "chat",
      "completion_params": {
        "temperature": 0.3,
        "stop": []
      },
      "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接"
    },
    "dataset_configs": {
      "datasets": {
        "strategy": "router",
        "datasets": [
          {
            "dataset": {
              "enabled": true,
              "id": "已有的知识库ID1"
            }
          },
          {
            "dataset": {
              "enabled": true,
              "id": "已有的知识库ID2"
            }
          }
        ]
      },
      "retrieval_model": "multiple",
      "top_k": 5,
      "score_threshold": 0.0,
      "score_threshold_enabled": false,
      "reranking_enable": true,
      "reranking_model": {
        "reranking_provider_name": "",
        "reranking_model_name": ""
      },
      "weights": {
        "weight_type": "custom",
        "keyword_setting": {
          "keyword_weight": 0.3
        },
        "vector_setting": {
          "vector_weight": 0.7
        }
      }
    }
  }
}
```

### 步骤2：关联知识库
**重要原则**：在现有知识库列表基础上，**只添加**要关联的新知识库，**保持所有已有关联的知识库不变**。

**操作步骤**：
1. 从步骤1的响应中获取`dataset_configs.datasets.datasets`数组
2. 检查要关联的知识库ID是否已存在
3. 如果不存在，将新知识库添加到数组中
4. 使用完整的应用配置进行更新

### 关联知识库的请求格式
**请求体**:
```json
{
  "mode": "agent-chat",
  "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接",
  "agent_mode": {
    "max_iteration": 30,
    "enabled": true,
    "tools": [
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "list_available_templates",
        "tool_label": "list_available_templates",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "set_template",
        "tool_label": "set_template",
        "tool_parameters": {
          "template_name": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "set_layout",
        "tool_label": "set_layout",
        "tool_parameters": {
          "layout": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "add_text_content",
        "tool_label": "add_text_content",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "add_image_content",
        "tool_label": "add_image_content",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "add_chart_content",
        "tool_label": "add_chart_content",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "save_ppt",
        "tool_label": "save_ppt",
        "tool_parameters": {
          "pptx_path": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "download_ppt",
        "tool_label": "download_ppt",
        "tool_parameters": {
          "file_path": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "web_search",
        "tool_label": "web_search",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      }
    ],
    "strategy": "react"
  },
  "model": {
    "provider": "axdlee/sophnet/sophnet",
    "name": "Kimi-K2-0905",
    "mode": "chat",
    "completion_params": {
      "temperature": 0.3,
      "stop": []
    },
    "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接"
  },
  "dataset_configs": {
    "datasets": {
      "strategy": "router",
      "datasets": [
        {
          "dataset": {
            "enabled": true,
            "id": "已有的知识库ID1"
          }
        },
        {
          "dataset": {
            "enabled": true,
            "id": "已有的知识库ID2"
          }
        },
        {
          "dataset": {
            "enabled": true,
            "id": "43ad270c-38a6-4479-bd2f-4b9f9e9e1323"
          }
        }
      ]
    },
    "retrieval_model": "multiple",
    "top_k": 5,
    "score_threshold": 0.0,
    "score_threshold_enabled": false,
    "reranking_enable": true,
    "reranking_model": {
      "reranking_provider_name": "",
      "reranking_model_name": ""
    },
    "weights": {
      "weight_type": "custom",
      "keyword_setting": {
        "keyword_weight": 0.3
      },
      "vector_setting": {
        "vector_weight": 0.7
      }
    }
  }
}
```

### 步骤3：取消关联知识库
**重要原则**：在现有知识库列表基础上，**只移除**要取消关联的知识库，**保持所有其他知识库的关联不变**。

**操作步骤**：
1. 从步骤1的响应中获取`dataset_configs.datasets.datasets`数组
2. 过滤掉要取消关联的知识库ID
3. 使用完整的应用配置进行更新

**请求体**:
```json
{
  "mode": "agent-chat",
  "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接",
  "agent_mode": {
    "max_iteration": 30,
    "enabled": true,
    "strategy": "react",
    "tools": [
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "list_available_templates",
        "tool_label": "list_available_templates",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "set_template",
        "tool_label": "set_template",
        "tool_parameters": {
          "template_name": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "set_layout",
        "tool_label": "set_layout",
        "tool_parameters": {
          "layout": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "add_text_content",
        "tool_label": "add_text_content",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "add_image_content",
        "tool_label": "add_image_content",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "add_chart_content",
        "tool_label": "add_chart_content",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "save_ppt",
        "tool_label": "save_ppt",
        "tool_parameters": {
          "pptx_path": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "download_ppt",
        "tool_label": "download_ppt",
        "tool_parameters": {
          "file_path": ""
        },
        "notAuthor": false,
        "enabled": true
      },
      {
        "provider_id": "123",
        "provider_type": "mcp",
        "provider_name": "123",
        "tool_name": "web_search",
        "tool_label": "web_search",
        "tool_parameters": {},
        "notAuthor": false,
        "enabled": true
      }
    ]
  },
  "model": {
    "provider": "axdlee/sophnet/sophnet",
    "name": "Kimi-K2-0905",
    "mode": "chat",
    "completion_params": {
      "temperature": 0.3,
      "stop": []
    },
    "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接"
  },
  "dataset_configs": {
    "datasets": {
      "strategy": "router",
      "datasets": [
        {
          "dataset": {
            "enabled": true,
            "id": "已有的知识库ID1"
          }
        }
      ]
    },
    "retrieval_model": "multiple",
    "top_k": 5,
    "score_threshold": 0.0,
    "score_threshold_enabled": false,
    "reranking_enable": true,
    "reranking_model": {
      "reranking_provider_name": "",
      "reranking_model_name": ""
    },
    "weights": {
      "weight_type": "custom",
      "keyword_setting": {
        "keyword_weight": 0.3
      },
      "vector_setting": {
        "vector_weight": 0.7
      }
    }
  }
}
```

**响应**:
```json
{
    "result": "success"
}
```

### 参数说明
- **mode**: 应用模式，必须为`agent-chat`（智能助手），确保关联知识库时不修改应用模式
- **pre_prompt**: 根级别预设提示词，用于前端显示，必须与model.pre_prompt保持一致，确保前后端提示词同步显示
- **agent_mode**: 智能助手模式配置，必须与创建应用时的配置保持一致
  - **enabled**: 是否启用智能助手模式，默认为true
  - **strategy**: 策略类型，可选`function_call`（函数调用）、`cot`（思维链）、`react`（React模式），默认为`react`
  - **tools**: 工具列表，可包含各种AI工具如数据集检索、网络搜索等，默认包含9个MCP工具用于PPT生成
  - **max_iteration**: 最大迭代次数，默认为30
- **model**: 模型配置，必须包含provider、name等基本信息
  - **provider**: 模型提供商，如`axdlee/sophnet/sophnet`
  - **name**: 模型名称，如`Kimi-K2-0905`
  - **mode**: 模型模式，如`chat`
  - **completion_params**: 模型参数
    - **temperature**: 温度参数，控制随机性，范围0-1，默认为0.3
    - **stop**: 停止词列表
  - **pre_prompt**: 预设提示词，默认为"1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接"
- **dataset_configs**: 数据集配置，用于关联知识库
  - **datasets**: 数据集配置对象，包含：
    - **strategy**: 策略，如"router"
    - **datasets**: 数据集列表，每个数据集包含：
      - **dataset**: 数据集信息
        - **enabled**: 是否启用该数据集
        - **id**: 知识库ID
  - **retrieval_model**: 检索模型，可选`single`（单路召回）或`multiple`（多路召回）
  - **top_k**: 返回结果数量，默认5
  - **score_threshold**: 相似度阈值，默认0.0
  - **score_threshold_enabled**: 是否启用相似度阈值
  - **reranking_enable**: 是否启用重排序，默认false
  - **reranking_model**: 重排序模型配置
    - **reranking_provider_name**: 重排序模型提供商名称
    - **reranking_model_name**: 重排序模型名称
  - **weights**: 权重配置
    - **weight_type**: 权重类型，可选`balanced`（平衡）、`custom`（自定义）
    - **keyword_setting**: 关键词设置
      - **keyword_weight**: 关键词权重，范围0-1
    - **vector_setting**: 向量设置
      - **vector_weight**: 向量权重，范围0-1

### 验证关联状态
**接口地址**: `GET /console/api/datasets/{datasetId}/related-apps`
**响应**:
```json
{
    "data": [
        {
            "id": "9512d417-210c-4946-9434-74434e95b4fb",
            "name": "应用名称"
        }
    ],
    "total": 1
}
```

### 实际示例

以下是为ID为`369d3518-06bd-4231-9afe-090d5109bbcc`的应用关联ID为`43ad270c-38a6-4479-bd2f-4b9f9e9e1323`的知识库的完整curl示例：

```bash
curl -X POST http://localhost:5001/console/api/apps/369d3518-06bd-4231-9afe-090d5109bbcc/model-config \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTJhOTY1MDgtNWNjNS00ZjI4LTg3ZmQtNTI2NTIxZjFlMGI3IiwiZXhwIjoxNzU4Nzg0OTczLCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.TxaWVNyFMTJ5-TrlVIR_OCVW0bn5j4vdvnIpG3OVfTM" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "agent-chat",
    "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接",
    "agent_mode": {
      "max_iteration": 30,
      "enabled": true,
      "tools": [
        "list_available_templates",
        "set_template",
        "set_layout",
        "add_text_content",
        "add_image_content",
        "add_chart_content",
        "save_ppt",
        "download_ppt",
        "web_search"
      ],
      "strategy": "react"
    },
    "model": {
      "provider": "axdlee/sophnet/sophnet",
      "name": "Kimi-K2-0905",
      "mode": "chat",
      "completion_params": {
        "temperature": 0.3,
        "stop": []
      },
      "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接"
    },
    "dataset_configs": {
      "datasets": {
        "strategy": "router",
        "datasets": [
          {
            "dataset": {
              "enabled": true,
              "id": "43ad270c-38a6-4479-bd2f-4b9f9e9e1323"
            }
          }
        ]
      },
      "retrieval_model": "multiple",
      "top_k": 5,
      "score_threshold": 0.0,
      "score_threshold_enabled": false,
      "reranking_enable": true,
      "reranking_model": {
        "reranking_provider_name": "",
        "reranking_model_name": ""
      },
      "weights": {
        "weight_type": "custom",
        "keyword_setting": {
          "keyword_weight": 0.3
        },
        "vector_setting": {
          "vector_weight": 0.7
        }
      }
    }
  }'
```

## 6. 更新知识库检索设置
**接口地址**: `PATCH /console/api/datasets/{datasetId}`
**功能**: 更新知识库的检索配置，包括搜索方法、重排序设置、权重分配等参数

### 请求体
```json
{
  "retrieval_model": {
    "search_method": "hybrid_search",
    "reranking_enable": true,
    "reranking_mode": "weighted_score",
    "reranking_model": {
      "reranking_provider_name": "",
      "reranking_model_name": ""
    },
    "weights": {
      "weight_type": "custom",
      "keyword_setting": {
        "keyword_weight": 0.3
      },
      "vector_setting": {
        "vector_weight": 0.7,
        "embedding_model_name": "embeddings",
        "embedding_provider_name": "axdlee/sophnet/sophnet"
      }
    },
    "top_k": 5,
    "score_threshold_enabled": false,
    "score_threshold": 0.0
  }
}
```

### 响应
```json
{
  "id": "ad3c072f-ee6a-449a-89e5-42f52fdddcd0",
  "name": "知识库名称",
  "indexing_technique": "high_quality",
  "embedding_model": "embeddings",
  "embedding_model_provider": "axdlee/sophnet/sophnet",
  "retrieval_model": {
    "search_method": "hybrid_search",
    "reranking_enable": true,
    "reranking_mode": "weighted_score",
    "reranking_model": {
      "reranking_provider_name": "",
      "reranking_model_name": ""
    },
    "weights": {
      "weight_type": "custom",
      "keyword_setting": {
        "keyword_weight": 0.3
      },
      "vector_setting": {
        "vector_weight": 0.7,
        "embedding_model_name": "embeddings",
        "embedding_provider_name": "axdlee/sophnet/sophnet"
      }
    },
    "top_k": 5,
    "score_threshold_enabled": false,
    "score_threshold": 0.0
  },
  "created_at": 1758682552,
  "updated_at": 1758683000
}
```

### 参数说明
- **retrieval_model**: 检索模型配置
  - **search_method**: 搜索方法，可选值：
    - `keyword_search`: 仅关键词搜索
    - `vector_search`: 仅向量搜索
    - `hybrid_search`: 混合搜索（关键词+向量）
  - **reranking_enable**: 是否启用重排序，默认false
  - **reranking_mode**: 重排序模式，如`weighted_score`
  - **reranking_model**: 重排序模型配置
    - **reranking_provider_name**: 重排序模型提供商名称
    - **reranking_model_name**: 重排序模型名称
  - **weights**: 权重配置
    - **weight_type**: 权重类型，可选`balanced`（平衡）、`custom`（自定义）
    - **keyword_setting**: 关键词设置
      - **keyword_weight**: 关键词权重，范围0-1
    - **vector_setting**: 向量设置
      - **vector_weight**: 向量权重，范围0-1
      - **embedding_model_name**: 嵌入模型名称
      - **embedding_provider_name**: 嵌入模型提供商名称
  - **top_k**: 返回结果数量，默认5
  - **score_threshold_enabled**: 是否启用相似度阈值，默认false
  - **score_threshold**: 相似度阈值，范围0-1

### 检索设置配置示例

#### 1. 混合搜索 + 重排序 + 自定义权重
```json
{
  "retrieval_model": {
    "search_method": "hybrid_search",
    "reranking_enable": true,
    "weights": {
      "weight_type": "custom",
      "keyword_setting": {
        "keyword_weight": 0.3
      },
      "vector_setting": {
        "vector_weight": 0.7
      }
    },
    "top_k": 5,
    "score_threshold_enabled": false
  }
}
```

#### 2. 仅向量搜索
```json
{
  "retrieval_model": {
    "search_method": "vector_search",
    "reranking_enable": false,
    "top_k": 3,
    "score_threshold_enabled": true,
    "score_threshold": 0.5
  }
}
```

#### 3. 仅关键词搜索
```json
{
  "retrieval_model": {
    "search_method": "keyword_search",
    "reranking_enable": false,
    "top_k": 10
  }
}
```

### 实际示例

以下是为ID为`ad3c072f-ee6a-449a-89e5-42f52fdddcd0`的知识库更新检索设置的完整curl示例：

```bash
curl -X PATCH http://localhost:5001/console/api/datasets/ad3c072f-ee6a-449a-89e5-42f52fdddcd0 \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "retrieval_model": {
      "search_method": "hybrid_search",
      "reranking_enable": true,
      "weights": {
        "weight_type": "custom",
        "keyword_setting": {
          "keyword_weight": 0.3
        },
        "vector_setting": {
          "vector_weight": 0.7
        }
      },
      "top_k": 5,
      "score_threshold_enabled": false
    }
  }'
```

### 注意事项
- 权重设置中，keyword_weight和vector_weight的和应该为1.0
- 启用重排序可以提高检索结果的相关性，但会增加响应时间
- score_threshold可以根据实际需求调整，值越高结果越精确但可能越少
- 检索设置更新后，需要等待索引重新构建才能生效

## 7. 删除知识库
**接口地址**: `DELETE /console/api/datasets/{datasetId}`
**响应**: 无内容（204）

## 8. 文档分段重叠字符数设置说明

### 概述
文档分段重叠字符数（chunk_overlap）是文档处理过程中的一个重要参数，它控制相邻分段之间的重叠字符数量。适当的重叠设置可以保持上下文连续性，提高检索和问答质量。

### 参数位置
在创建知识库文档时，`chunk_overlap`参数位于`process_rule.rules.segmentation`对象中：

```json
{
  "process_rule": {
    "mode": "custom",
    "rules": {
      "segmentation": {
        "separator": "\\n",
        "max_tokens": 1000,
        "chunk_overlap": 50
      }
    }
  }
}
```

### 参数说明
- **参数名**: `chunk_overlap`
- **类型**: 整数
- **默认值**: 50
- **取值范围**: 大于等于0的整数，建议不超过max_tokens的20%

### 使用建议
1. **小值设置（10-30）**:
   - 适用于：结构化文档、技术文档、FAQ等
   - 优点：减少冗余信息，提高检索精确度
   - 缺点：可能丢失部分上下文信息

2. **中等值设置（30-80）**:
   - 适用于：一般性文档、文章、报告等
   - 优点：平衡上下文连续性和信息冗余
   - 缺点：可能包含一些重复信息

3. **大值设置（80-200）**:
   - 适用于：长篇文档、小说、连续性强的内容
   - 优点：保持更好的上下文连续性
   - 缺点：增加冗余信息，可能影响检索效率

### 注意事项
1. `chunk_overlap`值不应大于`max_tokens`，否则会导致分段逻辑错误
2. 过大的重叠值会增加存储和计算成本
3. 不同的文档类型可能需要不同的重叠设置，建议根据实际应用场景调整
4. 在父子分段模式（hierarchical）下，子分段也可以设置独立的重叠参数

### 示例场景
1. **技术文档处理**:
   ```json
   {
     "process_rule": {
       "mode": "custom",
       "rules": {
         "segmentation": {
           "separator": "\\n",
           "max_tokens": 500,
           "chunk_overlap": 20
         }
       }
     }
   }
   ```

2. **长篇文章处理**:
   ```json
   {
     "process_rule": {
       "mode": "custom",
       "rules": {
         "segmentation": {
           "separator": "\\n\\n",
           "max_tokens": 1000,
           "chunk_overlap": 100
         }
       }
     }
   }
   ```

3. **父子分段模式**:
   ```json
   {
     "process_rule": {
       "mode": "hierarchical",
       "rules": {
         "parent_mode": "paragraph",
         "segmentation": {
           "separator": "\\n\\n",
           "max_tokens": 2000,
           "chunk_overlap": 100
         },
         "subchunk_segmentation": {
           "separator": "\\n",
           "max_tokens": 500,
           "chunk_overlap": 30
         }
       }
     }
   }
   ```

## 9. 状态码说明
- `200`: 请求成功
- `201`: 创建成功
- `204`: 删除成功
- `400`: 请求参数错误
- `401`: 未授权（Token无效或过期）
- `404`: 资源不存在
- `409`: 资源冲突（如名称重复）

## 10. 检索设置修改指南

### 检索设置修改流程

在Dify系统中，检索设置的修改需要遵循以下流程：

#### 1. 创建知识库
- 使用`POST /console/api/datasets`接口创建知识库
- **注意**: 创建知识库时无法设置检索配置，只能在创建后通过更新接口设置

#### 2. 更新知识库检索设置
- 使用`PATCH /console/api/datasets/{datasetId}`接口更新检索配置
- 可以设置搜索方法、重排序、权重分配等参数

#### 3. 上传文档（可选）
- 使用`POST /console/api/files/upload`上传文件
- 使用`POST /console/api/datasets/{datasetId}/documents`创建文档
- 在创建文档时也可以指定检索配置，但会覆盖知识库级别的设置

#### 4. 关联应用到知识库（可选）
- 使用`POST /console/api/apps/{appId}/model-config`接口关联应用到知识库
- 在应用级别也可以设置检索配置，但会覆盖知识库级别的设置

### 检索设置优先级

检索设置的优先级从高到低为：
1. **应用级别设置**: 在应用配置中设置的检索参数
2. **文档级别设置**: 在创建文档时指定的检索参数
3. **知识库级别设置**: 在知识库更新接口中设置的检索参数

### 检索设置最佳实践

#### 1. 知识库级别设置
```bash
curl -X PATCH http://localhost:5001/console/api/datasets/{datasetId} \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "retrieval_model": {
      "search_method": "hybrid_search",
      "reranking_enable": true,
      "weights": {
        "weight_type": "custom",
        "keyword_setting": {
          "keyword_weight": 0.3
        },
        "vector_setting": {
          "vector_weight": 0.7
        }
      },
      "top_k": 5,
      "score_threshold_enabled": false
    }
  }'
```

#### 2. 应用级别设置
```bash
curl -X POST http://localhost:5001/console/api/apps/{appId}/model-config \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "agent-chat",
    "agent_mode": {
      "max_iteration": 30,
      "enabled": true,
      "tools": [
        "list_available_templates",
        "set_template",
        "set_layout",
        "add_text_content",
        "add_image_c没有这个the品牌型号ontent",
        "add_chart_content",
        "save_ppt",
        "download_ppt",
        "web_search"
      ],
      "strategy": "react"
    },
    "model": {
      "provider": "axdlee/sophnet/sophnet",
      "name": "Kimi-K2-0905",
      "mode": "chat",
      "completion_params": {
        "temperature": 0.3,
        "stop": []
      },
      "pre_prompt": "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载链接"
    },
    "dataset_configs": {
      "datasets": {
        "strategy": "router",
        "datasets": [
          {
            "dataset": {
              "enabled": true,
              "id": "{datasetId}"
            }
          }
        ]
      },
      "retrieval_model": "multiple",
      "top_k": 5,
      "score_threshold": 0.0,
      "score_threshold_enabled": false,
      "reranking_enable": true,
      "reranking_model": {
        "reranking_provider_name": "",
        "reranking_model_name": ""
      },
      "weights": {
        "weight_type": "custom",
        "keyword_setting": {
          "keyword_weight": 0.3
        },
        "vector_setting": {
          "vector_weight": 0.7
        }
      }
    }
  }'
```

### 检索设置测试

使用以下接口测试检索设置是否生效：

```bash
curl -X POST http://localhost:5001/console/api/datasets/{datasetId}/hit-testing \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "测试查询",
    "retrieval_model": {
      "search_method": "hybrid_search",
      "reranking_enable": true,
      "weights": {
        "weight_type": "custom",
        "keyword_setting": {
          "keyword_weight": 0.3
        },
        "vector_setting": {
          "vector_weight": 0.7
        }
      },
      "top_k": 5,
      "score_threshold_enabled": false
    }
  }'
```

### 常见问题与解决方案

#### 1. 检索设置不生效
- **原因**: 检索设置优先级问题，可能被应用级别或文档级别设置覆盖
- **解决方案**: 检查各级别的检索设置，确保没有冲突

#### 2. 权重设置错误
- **原因**: keyword_weight和vector_weight之和不等于1.0
- **解决方案**: 确保权重总和为1.0

#### 3. 重排序不生效
- **原因**: reranking_enable设置为false或重排序模型配置错误
- **解决方案**: 确保reranking_enable设置为true，并正确配置重排序模型

#### 4. 检索结果为空
- **原因**: score_threshold设置过高或知识库未正确索引
- **解决方案**: 降低score_threshold值或检查知识库索引状态

### 检索设置优化建议

#### 1. 根据文档类型选择搜索方法
- **结构化文档**: 优先使用keyword_search
- **非结构化文档**: 优先使用vector_search
- **混合类型文档**: 使用hybrid_search

#### 2. 权重分配建议
- **技术文档**: keyword_weight: 0.6, vector_weight: 0.4
- **一般文档**: keyword_weight: 0.3, vector_weight: 0.7
- **对话记录**: keyword_weight: 0.2, vector_weight: 0.8

#### 3. top_k设置建议
- **精确检索**: top_k: 3-5
- **广泛检索**: top_k: 10-20
- **摘要生成**: top_k: 5-10

#### 4. 重排序使用场景
- **混合搜索**: 建议启用重排序
- **大量结果**: 建议启用重排序
- **高精度要求**: 建议启用重排序
