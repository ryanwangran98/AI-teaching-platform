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
  "description": "",
  "agent_mode": {
    "max_iteration": 10,
    "enabled": true,
    "tools": [],
    "strategy": "function_call"
  },
  "model_config": {
    "provider": "axdlee/sophnet/sophnet",
    "name": "Kimi-K2",
    "mode": "chat",
    "completion_params": {
      "temperature": 0.3,
      "stop": []
    }
  },
  "dataset_configs": {
    "retrieval_model": "single",
    "datasets": {
      "datasets": []
    },
    "top_k": 4,
    "reranking_enable": false
  }
}
```
**响应**:
```json
{
  "id": "e0a0d7b5-1d9f-4a5c-8e7c-3f9a8b7c6d5e",
  "name": "agent_name",
  "mode": "agent-chat",
  "description": "",
  "created_at": 1758775465,
  "agent_mode": {
    "max_iteration": 10,
    "enabled": true,
    "tools": [],
    "strategy": "function_call"
  },
  "model_config": {
    "provider": "axdlee/sophnet/sophnet",
    "name": "Kimi-K2",
    "mode": "chat",
    "completion_params": {
      "temperature": 0.3,
      "stop": []
    }
  },
  "dataset_configs": {
    "retrieval_model": "single",
    "datasets": {
      "datasets": []
    },
    "top_k": 4,
    "reranking_enable": false
  }
}
```

### 参数说明
- **name**: 应用名称（必需）
- **mode**: 应用模式，必须为`agent-chat`（智能助手）
- **description**: 应用描述
- **agent_mode**: 智能助手模式配置（必需）
  - **enabled**: 是否启用智能助手模式
  - **strategy**: 策略类型，可选`function_call`（函数调用）、`cot`（思维链）、`react`（React模式）
  - **tools**: 工具列表，可包含各种AI工具如数据集检索、网络搜索等
  - **max_iteration**: 最大迭代次数，默认为10
- **model_config**: 模型配置
  - **provider**: 模型提供商，如`axdlee/sophnet/sophnet`
  - **name**: 模型名称，如`Kimi-K2`
  - **mode**: 模型模式，如`chat`
  - **completion_params**: 模型参数
    - **temperature**: 温度参数，控制随机性，范围0-1
    - **stop**: 停止词列表
- **dataset_configs**: 数据集配置
  - **retrieval_model**: 检索模型，可选`single`（单路召回）或`multiple`（多路召回）
  - **datasets**: 数据集列表
    - **datasets**: 数据集数组，可包含多个知识库ID
  - **top_k**: 返回结果数量
  - **reranking_enable**: 是否启用重排序

## 3. 创建知识库
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
    "reranking_enable": false,
    "reranking_mode": "weighted_score",
    "reranking_model": {
      "reranking_provider_name": "",
      "reranking_model_name": ""
    },
    "weights": {
      "weight_type": "customized",
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
  - **search_method**: 搜索方法，如`hybrid_search`（混合搜索）
  - **reranking_enable**: 是否启用重排序，默认false
  - **reranking_mode**: 重排序模式，如`weighted_score`
  - **reranking_model**: 重排序模型配置
  - **weights**: 权重配置
    - **weight_type**: 权重类型，如`customized`
    - **keyword_setting**: 关键词设置
      - **keyword_weight**: 关键词权重，如0.3
    - **vector_setting**: 向量设置
      - **vector_weight**: 向量权重，如0.7
      - **embedding_model_name**: 嵌入模型名称，如`embeddings`
      - **embedding_provider_name**: 嵌入模型提供商，如`axdlee/sophnet/sophnet`
  - **top_k**: 返回结果数量，如5
  - **score_threshold_enabled**: 是否启用相似度阈值，默认false
  - **score_threshold**: 相似度阈值，如0.0
- **embedding_model**: 嵌入模型名称，如`embeddings`
- **embedding_model_provider**: 嵌入模型提供商，如`axdlee/sophnet/sophnet`

## 5. 通过更新应用配置关联知识库
**接口地址**: `POST /console/api/apps/{appId}/model-config`
**功能**: 通过更新应用配置来关联或取消关联知识库

### 关联知识库的请求格式
**请求体**:
```json
{
  "mode": "agent-chat",
  "agent_mode": {
    "max_iteration": 10,
    "enabled": true,
    "tools": [],
    "strategy": "function_call"
  },
  "model": {
    "provider": "axdlee/sophnet/sophnet",
    "name": "Kimi-K2",
    "mode": "chat",
    "completion_params": {
      "temperature": 0.3,
      "stop": []
    }
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
    "reranking_enable": false,
    "reranking_model": null,
    "weights": {
      "vector_weight": 0.7,
      "keyword_weight": 0.3
    }
  }
}
```

### 取消关联知识库
**请求体**:
```json
{
  "mode": "agent-chat",
  "agent_mode": {
    "max_iteration": 10,
    "enabled": true,
    "tools": [],
    "strategy": "function_call"
  },
  "model": {
    "provider": "axdlee/sophnet/sophnet",
    "name": "Kimi-K2",
    "mode": "chat",
    "completion_params": {
      "temperature": 0.3,
      "stop": []
    }
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
    "reranking_enable": false,
    "reranking_model": null,
    "weights": {
      "vector_weight": 0.7,
      "keyword_weight": 0.3
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
- **agent_mode**: 智能助手模式配置，必须与创建应用时的配置保持一致
  - **enabled**: 是否启用智能助手模式
  - **strategy**: 策略类型，可选`function_call`（函数调用）、`cot`（思维链）、`react`（React模式）
  - **tools**: 工具列表，可包含各种AI工具如数据集检索、网络搜索等
  - **max_iteration**: 最大迭代次数，默认为10
- **model**: 模型配置，必须包含provider、name等基本信息
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
  - **reranking_model**: 重排序模型（可选）
  - **weights**: 权重配置
    - **vector_weight**: 向量检索权重，默认0.7
    - **keyword_weight**: 关键词检索权重，默认0.3

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
    "agent_mode": {
      "max_iteration": 10,
      "enabled": true,
      "tools": [],
      "strategy": "function_call"
    },
    "model": {
      "provider": "axdlee/sophnet/sophnet",
      "name": "Kimi-K2",
      "mode": "chat",
      "completion_params": {
        "temperature": 0.3,
        "stop": []
      }
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
      "reranking_enable": false,
      "reranking_model": null,
      "weights": {
        "vector_weight": 0.7,
        "keyword_weight": 0.3
      }
    }
  }'
```

## 6. 删除知识库
**接口地址**: `DELETE /console/api/datasets/{datasetId}`
**响应**: 无内容（204）

## 7. 文档分段重叠字符数设置说明

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

## 状态码说明
- `200`: 请求成功
- `201`: 创建成功
- `204`: 删除成功
- `400`: 请求参数错误
- `401`: 未授权（Token无效或过期）
- `404`: 资源不存在
- `409`: 资源冲突（如名称重复）
