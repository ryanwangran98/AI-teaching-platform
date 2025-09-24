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
  "name": "应用名称",
  "mode": "chat",
  "description": "应用描述"
}
```
**响应**:
```json
{
  "id": "app-123456",
  "name": "应用名称",
  "mode": "chat",
  "description": "应用描述",
  "created_at": 1700000000
}
```

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
        "max_tokens": 1000
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

### 关联知识库
**请求体**:
```json
{
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
            "id": "ad3c072f-ee6a-449a-89e5-42f52fdddcd0"
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

## 6. 删除知识库
**接口地址**: `DELETE /console/api/datasets/{datasetId}`
**响应**: 无内容（204）

## 状态码说明
- `200`: 请求成功
- `201`: 创建成功
- `204`: 删除成功
- `400`: 请求参数错误
- `401`: 未授权（Token无效或过期）
- `404`: 资源不存在
- `409`: 资源冲突（如名称重复）