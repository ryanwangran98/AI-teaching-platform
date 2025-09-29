import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Dify API配置
const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'http://localhost:5001';
const DIFY_EMAIL = process.env.DIFY_EMAIL || '3325127454@qq.com';
const DIFY_PASSWORD = process.env.DIFY_PASSWORD || 'wangran1998';
const DATASET_API_KEY = process.env.DATASET_API_KEY || 'dataset-UhyDZZAdbDXlOcwlau38qjfg';

interface DifyLoginResponse {
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

interface DifyAppResponse {
  id: string;
  name: string;
  mode: string;
  icon_type: string;
  icon: string;
  icon_background: string;
}

interface DifyDatasetResponse {
  id: string;
  name: string;
  description: string;
  embedding_model: string;
  retrieval_model: {
    search_method: string;
    reranking_enable: boolean;
    top_k: number;
    score_threshold: number;
    score_threshold_enabled: boolean;
  };
}

interface DifyFileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

interface DifyDocumentResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
  indexing_status: string;
  processing_started_at: number;
  parsing_completed_at: number;
  cleaning_completed_at: number;
  splitting_completed_at: number;
  completed_at: number;
  paused_at: number | null;
  error: string | null;
  stopped_at: number | null;
  completed_segments: number;
  total_segments: number;
}

class DifyService {
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = null;
  }

  /**
   * 用户登录获取访问令牌
   * POST /console/api/login
   */
  async login(): Promise<string> {
    try {
      console.log('尝试登录Dify...');
      const response = await axios.post<DifyLoginResponse>(
        `${DIFY_BASE_URL}/console/api/login`,
        {
          email: DIFY_EMAIL,
          password: DIFY_PASSWORD
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Dify登录响应:', JSON.stringify(response.data));
      this.accessToken = response.data.data.access_token;
      console.log('Dify登录成功，获取到访问令牌');
      return this.accessToken;
    } catch (error) {
      console.error('Dify登录失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('登录错误详情:', error.response?.data);
      }
      throw new Error('Dify登录失败');
    }
  }

  /**
   * 确保已认证
   */
  private async ensureAuthenticated(): Promise<void> {
    try {
      console.log('当前访问令牌状态:', this.accessToken ? '已设置' : '未设置');
      if (!this.accessToken) {
        await this.login();
        console.log('登录后访问令牌状态:', this.accessToken ? '已设置' : '未设置');
      }
      
      // 测试令牌是否有效
      console.log('测试访问令牌是否有效...');
      await axios.get(
        `${DIFY_BASE_URL}/console/api/account`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('访问令牌有效');
    } catch (error) {
      // 如果令牌无效，重新登录
      console.log('访问令牌无效，重新登录...');
      await this.login();
      console.log('重新登录后访问令牌状态:', this.accessToken ? '已设置' : '未设置');
    }
  }

  /**
   * 创建应用
   * POST /console/api/apps
   */
  async createApp(name: string, description: string = '', mode: string = 'chat'): Promise<DifyAppResponse> {
    await this.ensureAuthenticated();

    try {
      console.log('创建应用:', name);
      
      // 按照文档要求，创建应用时只包含name、mode和description字段
      const response = await axios.post<DifyAppResponse>(
        `${DIFY_BASE_URL}/console/api/apps`,
        {
          name: name,
          description: description,
          mode: mode,
          icon_type: 'emoji',
          icon: '🤖',
          icon_background: '#FFEAD5'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('应用创建成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('创建应用失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('创建应用错误详情:', error.response?.data);
      }
      throw new Error('创建应用失败');
    }
  }

  /**
   * 创建Agent应用（兼容旧接口）
   */
  async createAgentApp(name: string, description: string = ''): Promise<{ id: string; name: string }> {
    const app = await this.createApp(name, description, 'agent-chat');
    return {
      id: app.id,
      name: app.name
    };
  }

  /**
   * 更新应用配置为默认配置（根据API文档）
   * POST /console/api/apps/{appId}/model-config
   */
  async updateAppWithDefaultConfig(appId: string): Promise<void> {
    await this.ensureAuthenticated();

    try {
      const prePrompt = "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载数据";
      
      const defaultConfig = {
        mode: "agent-chat",
        pre_prompt: prePrompt, // 根级别pre_prompt需与model.pre_prompt保持一致
        agent_mode: {
          max_iteration: 30,
          enabled: true,
          strategy: "function_call",
          tools: [
            {
              provider_id: "123",
              provider_type: "mcp",
              provider_name: "123",
              tool_name: "list_available_templates",
              tool_label: "list_available_templates",
              tool_parameters: {},
              notAuthor: false,
              enabled: true
            },
            {
              provider_id: "123",
              provider_type: "mcp",
              provider_name: "123",
              tool_name: "set_template",
              tool_label: "set_template",
              tool_parameters: {
                template_name: ""
              },
              notAuthor: false,
              enabled: true
            },
            {
              provider_id: "123",
              provider_type: "mcp",
              provider_name: "123",
              tool_name: "set_layout",
              tool_label: "set_layout",
              tool_parameters: {
                layout: ""
              },
              notAuthor: false,
              enabled: true
            },
            {
              provider_id: "123",
              provider_type: "mcp",
              provider_name: "123",
              tool_name: "set_slide_content",
              tool_label: "set_slide_content",
              tool_parameters: {
                structured_slide_elements: ""
              },
              notAuthor: false,
              enabled: true
            },
            {
              provider_id: "123",
              provider_type: "mcp",
              provider_name: "123",
              tool_name: "generate_slide",
              tool_label: "generate_slide",
              tool_parameters: {},
              notAuthor: false,
              enabled: true
            },
            {
              provider_id: "123",
              provider_type: "mcp",
              provider_name: "123",
              tool_name: "save_generated_slides",
              tool_label: "save_generated_slides",
              tool_parameters: {
                pptx_path: ""
              },
              notAuthor: false,
              enabled: true
            },
            {
              provider_id: "123",
              provider_type: "mcp",
              provider_name: "123",
              tool_name: "create_download_link",
              tool_label: "create_download_link",
              tool_parameters: {
                file_path: ""
              },
              notAuthor: false,
              enabled: true
            },
            {
              provider_id: "123",
              provider_type: "mcp",
              provider_name: "123",
              tool_name: "list_downloadable_files",
              tool_label: "list_downloadable_files",
              tool_parameters: {},
              notAuthor: false,
              enabled: true
            },
            {
              provider_id: "123",
              provider_type: "mcp",
              provider_name: "123",
              tool_name: "remove_download_link",
              tool_label: "remove_download_link",
              tool_parameters: {
                token: ""
              },
              notAuthor: false,
              enabled: true
            }
          ]
        },
        model: {
          provider: "axdlee/sophnet/sophnet",
          name: "GLM-4.5",
          mode: "chat",
          completion_params: {
            temperature: 0.3,
            stop: []
          },
          pre_prompt: prePrompt // 与根级别pre_prompt保持一致
        },
        dataset_configs: {
          datasets: {
            strategy: "router",
            datasets: []
          },
          retrieval_model: "multiple",
          top_k: 5,
          score_threshold: 0.0,
          score_threshold_enabled: false,
          reranking_enable: true,
          reranking_model: {
            reranking_provider_name: "",
            reranking_model_name: ""
          },
          weights: {
            weight_type: "custom",
            keyword_setting: {
              keyword_weight: 0.3
            },
            vector_setting: {
              vector_weight: 0.7
            }
          }
        }
      };

      console.log('正在更新应用配置...');
      const response = await axios.post(
        `${DIFY_BASE_URL}/console/api/apps/${appId}/model-config`,
        defaultConfig,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('应用默认配置设置成功');
    } catch (error) {
      console.error('设置应用默认配置失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('设置默认配置错误详情:', error.response?.data);
      }
      throw new Error('设置应用默认配置失败');
    }
  }

  /**
   * 获取应用访问令牌
   * POST /console/api/apps/{app_id}/site/access-token-reset
   */
  async getAppAccessToken(appId: string): Promise<{ code: string; access_token: string }> {
    await this.ensureAuthenticated();

    try {
      const response = await axios.post(
        `${DIFY_BASE_URL}/console/api/apps/${appId}/site/access-token-reset`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        code: response.data.code,
        access_token: response.data.access_token
      };
    } catch (error) {
      console.error('获取应用访问令牌失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('获取访问令牌错误详情:', error.response?.data);
      }
      throw new Error('获取应用访问令牌失败');
    }
  }

  /**
   * 获取知识库列表
   * GET /console/api/datasets
   */
  async getDatasets(): Promise<any[]> {
    await this.ensureAuthenticated();

    try {
      const response = await axios.get(
        `${DIFY_BASE_URL}/console/api/datasets`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('获取知识库列表成功:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('获取知识库列表错误详情:', error.response?.data);
      }
      throw new Error('获取知识库列表失败');
    }
  }

  /**
   * 创建知识库
   * POST /console/api/datasets
   */
  async createDataset(name: string, description: string = ''): Promise<string> {
    await this.ensureAuthenticated();

    try {
      const response = await axios.post<DifyDatasetResponse>(
        `${DIFY_BASE_URL}/console/api/datasets`,
        {
          name: name,
          description: description,
          embedding_model: {
            provider: 'sophnet',
            model: 'embeddings'
          },
          retrieval_model: {
            search_method: 'hybrid_search',
            reranking_enable: false,
            top_k: 10,
            score_threshold: 0.5,
            score_threshold_enabled: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('知识库创建成功:', response.data);
      return response.data.id;
    } catch (error) {
      console.error('创建知识库失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('创建知识库错误详情:', error.response?.data);
        
        // 检查是否是数据集名称重复错误
        const errorData = error.response?.data;
        if (errorData?.code === 'dataset_name_duplicate' || 
            errorData?.message?.includes('already exists') ||
            errorData?.message?.includes('数据集名称已存在')) {
          // 抛出包含原始错误信息的异常
          const duplicateError = new Error('数据集名称已存在');
          (duplicateError as any).code = 'dataset_name_duplicate';
          (duplicateError as any).status = error.response?.status || 409;
          (duplicateError as any).originalData = errorData;
          throw duplicateError;
        }
        
        // 对于其他错误，也尝试保留原始错误信息
        if (errorData?.message) {
          const customError = new Error(errorData.message);
          (customError as any).code = errorData.code;
          (customError as any).status = error.response?.status;
          throw customError;
        }
      }
      throw new Error('创建知识库失败');
    }
  }

  /**
   * 上传文件到知识库
   * POST /console/api/datasets/{dataset_id}/files
   */
  async uploadFileToDataset(datasetId: string, filePath: string, fileName?: string): Promise<DifyFileUploadResponse> {
    await this.ensureAuthenticated();

    try {
      const formData = new FormData();
      
      // 读取文件
      const fileContent = fs.readFileSync(filePath);
      const fileExtension = filePath.split('.').pop()?.toLowerCase() || '';
      const mimeType = this.getMimeType(fileExtension);
      
      // 设置文件名
      const uploadFileName = fileName || filePath.split('/').pop() || 'uploaded_file';
      
      formData.append('file', fileContent, {
        filename: uploadFileName,
        contentType: mimeType
      });

      console.log('上传文件到知识库:', uploadFileName, 'MIME类型:', mimeType);

      const response = await axios.post<DifyFileUploadResponse>(
        `${DIFY_BASE_URL}/console/api/datasets/${datasetId}/files`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            ...formData.getHeaders()
          }
        }
      );

      console.log('文件上传成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('上传文件失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('上传文件错误详情:', error.response?.data);
      }
      throw new Error('上传文件失败');
    }
  }

  /**
   * 创建文档（将文件添加到知识库）
   * POST /console/api/datasets/{dataset_id}/documents
   */
  async createDocumentInDataset(
    datasetId: string, 
    fileId: string, 
    name: string, 
    processRule?: {
      mode: 'automatic' | 'custom';
      rules?: {
        pre_processing_rules?: Array<{
          id: 'remove_extra_spaces' | 'remove_urls_emails';
          enabled: boolean;
        }>;
        segmentation: {
          separator: string;
          max_tokens: number;
          chunk_overlap: number;
        };
      };
    }
  ): Promise<DifyDocumentResponse> {
    await this.ensureAuthenticated();

    try {
      const requestData = {
        name: name,
        file_id: fileId,
        process_rule: processRule || {
          mode: 'automatic'
        }
      };

      console.log('创建文档请求数据:', JSON.stringify(requestData, null, 2));

      const response = await axios.post<DifyDocumentResponse>(
        `${DIFY_BASE_URL}/console/api/datasets/${datasetId}/documents`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('文档创建成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('创建文档失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('创建文档错误详情:', error.response?.data);
      }
      throw new Error('创建文档失败');
    }
  }

  /**
   * 获取文档状态
   * GET /console/api/datasets/{dataset_id}/documents/{document_id}/indexing-status
   */
  async getDocumentIndexingStatus(datasetId: string, documentId: string): Promise<DifyDocumentResponse> {
    await this.ensureAuthenticated();

    try {
      const response = await axios.get<DifyDocumentResponse>(
        `${DIFY_BASE_URL}/console/api/datasets/${datasetId}/documents/${documentId}/indexing-status`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('获取文档状态失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('获取文档状态错误详情:', error.response?.data);
      }
      throw new Error('获取文档状态失败');
    }
  }

  /**
   * 删除应用
   * DELETE /console/api/apps/{app_id}
   */
  async deleteApp(appId: string): Promise<void> {
    await this.ensureAuthenticated();

    try {
      await axios.delete(
        `${DIFY_BASE_URL}/console/api/apps/${appId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('应用删除成功:', appId);
    } catch (error) {
      console.error('删除应用失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('删除应用错误详情:', error.response?.data);
      }
      throw new Error('删除应用失败');
    }
  }

  /**
   * 删除知识库
   * DELETE /console/api/datasets/{dataset_id}
   */
  async deleteDataset(datasetId: string): Promise<void> {
    await this.ensureAuthenticated();

    try {
      await axios.delete(
        `${DIFY_BASE_URL}/console/api/datasets/${datasetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('知识库删除成功:', datasetId);
    } catch (error) {
      console.error('删除知识库失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('删除知识库错误详情:', error.response?.data);
      }
      throw new Error('删除知识库失败');
    }
  }

  /**
   * 将知识库添加到应用
   * 按照文档要求，使用POST /console/api/apps/{appId}/model-config接口
   */
  async addDatasetToApp(appId: string, datasetId: string): Promise<void> {
    await this.ensureAuthenticated();

    try {
      console.log(`正在获取应用 ${appId} 的当前配置...`);
      
      // 步骤1：获取当前应用的完整配置
      const currentAppResponse = await axios.get(
        `${DIFY_BASE_URL}/console/api/apps/${appId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const currentConfig = currentAppResponse.data;
      console.log('成功获取当前应用配置');

      // 步骤2：在现有知识库列表基础上，只添加新知识库
      const existingDatasets = currentConfig.model_config?.dataset_configs?.datasets?.datasets || [];
      
      // 检查要关联的知识库ID是否已存在
      const datasetExists = existingDatasets.some((dataset: any) => 
        dataset.dataset?.id === datasetId
      );

      if (datasetExists) {
        console.log(`知识库 ${datasetId} 已经关联到应用，无需重复关联`);
        return;
      }

      // 构建新的知识库列表（保持现有知识库，添加新的）
      const updatedDatasets = [
        ...existingDatasets,
        {
          dataset: {
            id: datasetId,
            enabled: true
          }
        }
      ];

      // 步骤3：构建更新配置（保持其他所有配置不变，只修改知识库部分）
      const updateConfig = {
        mode: currentConfig.mode || "agent-chat",
        pre_prompt: currentConfig.pre_prompt || currentConfig.model_config?.pre_prompt || "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载数据",
        agent_mode: currentConfig.model_config?.agent_mode || {
          max_iteration: 30,
          enabled: true,
          strategy: "react",
          tools: currentConfig.model_config?.agent_mode?.tools || []
        },
        model: currentConfig.model_config?.model || {
          provider: "axdlee/sophnet/sophnet",
          name: "Kimi-K2-0905",
          mode: "chat",
          completion_params: {
            temperature: 0.3,
            stop: []
          },
          pre_prompt: currentConfig.pre_prompt || currentConfig.model_config?.pre_prompt || "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载数据"
        },
        dataset_configs: {
          datasets: {
            strategy: currentConfig.model_config?.dataset_configs?.datasets?.strategy || "router",
            datasets: updatedDatasets
          },
          retrieval_model: currentConfig.model_config?.dataset_configs?.retrieval_model || "multiple",
          top_k: currentConfig.model_config?.dataset_configs?.top_k || 5,
          score_threshold: currentConfig.model_config?.dataset_configs?.score_threshold || 0.0,
          score_threshold_enabled: currentConfig.model_config?.dataset_configs?.score_threshold_enabled || false,
          reranking_enable: currentConfig.model_config?.dataset_configs?.reranking_enable || true,
          reranking_model: currentConfig.model_config?.dataset_configs?.reranking_model || {
            reranking_provider_name: "",
            reranking_model_name: ""
          },
          weights: currentConfig.model_config?.dataset_configs?.weights || {
            weight_type: "custom",
            keyword_setting: {
              keyword_weight: 0.3
            },
            vector_setting: {
              vector_weight: 0.7
            }
          }
        }
      };

      console.log('正在更新应用配置，添加知识库...');
      const response = await axios.post(
        `${DIFY_BASE_URL}/console/api/apps/${appId}/model-config`,
        updateConfig,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`知识库 ${datasetId} 成功添加到应用`);
    } catch (error) {
      console.error('将知识库添加到应用失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('添加知识库错误详情:', error.response?.data);
      }
      throw new Error('将知识库添加到应用失败');
    }
  }

  /**
   * 从应用中移除知识库
   * 按照文档要求，使用POST /console/api/apps/{appId}/model-config接口
   */
  async removeDatasetFromApp(appId: string, datasetId: string): Promise<void> {
    await this.ensureAuthenticated();

    try {
      console.log(`正在获取应用 ${appId} 的当前配置...`);
      
      // 步骤1：获取当前应用的完整配置
      const currentAppResponse = await axios.get(
        `${DIFY_BASE_URL}/console/api/apps/${appId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const currentConfig = currentAppResponse.data;
      console.log('成功获取当前应用配置');

      // 步骤2：在现有知识库列表基础上，只移除指定的知识库
      const existingDatasets = currentConfig.model_config?.dataset_configs?.datasets?.datasets || [];
      
      // 过滤掉要取消关联的知识库ID
      const updatedDatasets = existingDatasets.filter((dataset: any) => 
        dataset.dataset?.id !== datasetId
      );

      // 检查是否真的要移除知识库
      if (existingDatasets.length === updatedDatasets.length) {
        console.log(`知识库 ${datasetId} 未关联到应用，无需移除`);
        return;
      }

      // 步骤3：构建更新配置（保持其他所有配置不变，只修改知识库部分）
      const updateConfig = {
        mode: currentConfig.mode || "agent-chat",
        pre_prompt: currentConfig.pre_prompt || currentConfig.model_config?.pre_prompt || "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载数据",
        agent_mode: currentConfig.model_config?.agent_mode || {
          max_iteration: 30,
          enabled: true,
          strategy: "react",
          tools: currentConfig.model_config?.agent_mode?.tools || []
        },
        model: currentConfig.model_config?.model || {
          provider: "axdlee/sophnet/sophnet",
          name: "Kimi-K2-0905",
          mode: "chat",
          completion_params: {
            temperature: 0.3,
            stop: []
          },
          pre_prompt: currentConfig.pre_prompt || currentConfig.model_config?.pre_prompt || "1.当用户要求生成ppt时，先查询知识库有没有和ppt内容相关的部分，当做ppt内容的参考\n2.生成ppt后要保存并提供给用户下载数据"
        },
        dataset_configs: {
          datasets: {
            strategy: currentConfig.model_config?.dataset_configs?.datasets?.strategy || "router",
            datasets: updatedDatasets
          },
          retrieval_model: currentConfig.model_config?.dataset_configs?.retrieval_model || "multiple",
          top_k: currentConfig.model_config?.dataset_configs?.top_k || 5,
          score_threshold: currentConfig.model_config?.dataset_configs?.score_threshold || 0.0,
          score_threshold_enabled: currentConfig.model_config?.dataset_configs?.score_threshold_enabled || false,
          reranking_enable: currentConfig.model_config?.dataset_configs?.reranking_enable || true,
          reranking_model: currentConfig.model_config?.dataset_configs?.reranking_model || {
            reranking_provider_name: "",
            reranking_model_name: ""
          },
          weights: currentConfig.model_config?.dataset_configs?.weights || {
            weight_type: "custom",
            keyword_setting: {
              keyword_weight: 0.3
            },
            vector_setting: {
              vector_weight: 0.7
            }
          }
        }
      };

      console.log('正在更新应用配置，移除知识库...');
      const response = await axios.post(
        `${DIFY_BASE_URL}/console/api/apps/${appId}/model-config`,
        updateConfig,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`知识库 ${datasetId} 从应用移除成功`);
    } catch (error) {
      console.error('从应用移除知识库失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('移除知识库错误详情:', error.response?.data);
      }
      throw new Error('从应用移除知识库失败');
    }
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'txt': 'text/plain',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'md': 'text/markdown',
      'html': 'text/html',
      'json': 'application/json'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * 完整流程：创建Agent应用并获取访问令牌（兼容旧接口）
   */
  async createAgentAppWithToken(name: string, description: string = ''): Promise<{ appId: string; accessToken: string; code: string }> {
    // 创建Agent应用
    const app = await this.createAgentApp(name, description);
    
    // 根据API文档，创建应用后必须使用更新接口设置默认配置
    console.log('正在设置Agent应用默认配置...');
    await this.updateAppWithDefaultConfig(app.id);
    
    // 获取应用访问令牌
    const tokenInfo = await this.getAppAccessToken(app.id);
    
    return {
      appId: app.id,
      accessToken: tokenInfo.access_token,
      code: tokenInfo.code
    };
  }

  /**
   * 生成iframe嵌入代码
   */
  generateIframeCode(code: string): string {
    return `<iframe
    src="${DIFY_BASE_URL}/chatbot/${code}"
    style="width: 100%; height: 100%; min-height: 700px"
    frameborder="0"
    allow="microphone">
</iframe>`;
  }

  /**
   * 完整流程：上传文档到知识库
   */
  async uploadDocumentToDataset(
    datasetId: string, 
    filePath: string, 
    fileName?: string,
    processRule?: {
      mode: 'automatic' | 'custom';
      rules?: {
        pre_processing_rules?: Array<{
          id: 'remove_extra_spaces' | 'remove_urls_emails';
          enabled: boolean;
        }>;
        segmentation: {
          separator: string;
          max_tokens: number;
          chunk_overlap: number;
        };
      };
    }
  ): Promise<DifyDocumentResponse> {
    // 第一步：上传文件
    const uploadedFile = await this.uploadFileToDataset(datasetId, filePath, fileName);
    
    // 第二步：创建文档
    const documentName = fileName || filePath.split('/').pop() || '文档';
    const document = await this.createDocumentInDataset(
      datasetId, 
      uploadedFile.id, 
      documentName,
      processRule
    );

    return document;
  }
}

// 创建DifyService实例的工厂函数
export function createDifyService(): DifyService {
  return new DifyService();
}

// 导出类
export { DifyService };

// 为了向后兼容，仍然导出一个默认实例
export default new DifyService();