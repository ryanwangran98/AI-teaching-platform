import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Search,
  Download,
  Visibility,
  PictureAsPdf,
  VideoLibrary,
  Description,
  AudioFile,
  Archive,
  Link as LinkIcon,
  Close,
  School,
  CloudUpload,
  SmartToy,
  LinkOff,
} from '@mui/icons-material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { materialAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Material {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'DOC' | 'IMAGE' | 'AUDIO' | 'ZIP' | 'OTHER';
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
  downloads: number;
  description: string;
  datasetId?: string;  // 知识库ID
  documentId?: string; // 文档ID
  associatedToAssistant?: boolean; // 是否已关联到课程答疑助手
  chapter?: {
    id: string;
    title: string;
    course?: {
      id: string;
      title: string;
    };
  };
  course?: {
    id: string;
    title: string;
  };
}

interface MaterialsProps {
  courseId?: string; // 可选的课程ID参数
}

const Materials: React.FC<MaterialsProps> = ({ courseId: propCourseId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId: routeCourseId } = useParams<{ courseId?: string }>();
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [courses, setCourses] = useState<{id: string, title: string, agentAppId?: string}[]>([]);
  const [associationStatus, setAssociationStatus] = useState<Record<string, boolean>>({}); // 跟踪资料的关联状态

  // 确定使用的课程ID
  const effectiveCourseId = propCourseId || routeCourseId || '';

  // 从URL参数获取课程ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const courseId = params.get('courseId');
    if (courseId && !propCourseId && !routeCourseId) {
      setSelectedCourse(courseId);
    } else if (effectiveCourseId) {
      setSelectedCourse(effectiveCourseId);
    }
  }, [location, propCourseId, routeCourseId, effectiveCourseId]);

  useEffect(() => {
    fetchMaterials();
    fetchCourses();
  }, [effectiveCourseId]);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchTerm, selectedType, selectedCourse, showAllCourses]);

  const fetchCourses = async () => {
    try {
      // 调用API获取学生已加入的课程
      const response = await courseAPI.getStudentCourses();
      const coursesData = response.data || response || [];
      
      // 转换课程数据格式
      const convertedCourses = Array.isArray(coursesData) 
        ? coursesData.map(course => ({
            id: course.id,
            title: course.title || course.name || '未命名课程',
            agentAppId: course.agentAppId
          }))
        : [];
      
      setCourses(convertedCourses);
      
      // 如果没有选中课程且有课程数据，默认选择第一个
      if (!selectedCourse && convertedCourses.length > 0 && !effectiveCourseId) {
        setSelectedCourse(convertedCourses[0].id);
      }
    } catch (error) {
      console.error('获取课程列表失败:', error);
      setError('获取课程列表失败，请稍后重试');
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      // 调用API获取资料，根据选中的课程过滤
      const params: any = {};
      
      if (selectedCourse && !showAllCourses) {
        params.courseId = selectedCourse;
      }
      
      const response = await materialAPI.getMaterials(params);
      const data = response.data || response;
      const materialsData = Array.isArray(data) ? data : data.materials || [];
      setMaterials(materialsData);
      
      // 初始化资料的关联状态
      await initializeAssociationStatus(materialsData);
      
      setError(null);
    } catch (error) {
      console.error('获取资料失败:', error);
      setError('获取资料失败，请稍后重试');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始化资料的关联状态
  const initializeAssociationStatus = async (materialsList: Material[]) => {
    const status: Record<string, boolean> = {};
    
    // 获取当前课程信息
    const currentCourse = courses.find(course => course.id === (selectedCourse || effectiveCourseId));
    
    // 如果课程没有助手，则所有资料都未关联
    if (!currentCourse || !currentCourse.agentAppId) {
      setAssociationStatus(status);
      return;
    }
    
    // 检查每个资料的关联状态
    for (const material of materialsList) {
      // 如果资料没有知识库信息，则未关联
      if (!material.datasetId || !material.documentId) {
        status[material.id] = false;
        continue;
      }
      
      // 使用Dify API检查知识库关联状态
      try {
        const checkAssociationUrl = `http://localhost:5001/console/api/datasets/${material.datasetId}/related-apps`;
        
        const checkAssociationResponse = await fetch(checkAssociationUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('difyAccessToken') || ''}`,
          }
        });
        
        if (checkAssociationResponse.ok) {
          const associationData = await checkAssociationResponse.json();
          console.log(`资料 ${material.id} 的关联状态数据:`, associationData);
          
          // 检查当前课程助手是否在关联的应用列表中
          const isAssociated = associationData.data && associationData.data.some((app: any) => app.id === currentCourse.agentAppId);
          status[material.id] = isAssociated;
          
          // 更新materials状态中的关联状态
          if (material.associatedToAssistant !== isAssociated) {
            setMaterials(prevMaterials => 
              prevMaterials.map(m => 
                m.id === material.id 
                  ? { ...m, associatedToAssistant: isAssociated } 
                  : m
              )
            );
          }
        } else {
          console.error(`检查资料 ${material.id} 的关联状态失败:`, checkAssociationResponse.status);
          status[material.id] = false;
        }
      } catch (error) {
        console.error(`检查资料 ${material.id} 的关联状态出错:`, error);
        status[material.id] = false;
      }
    }
    
    setAssociationStatus(status);
  };

  const filterMaterials = () => {
    let result = materials;
    
    if (searchTerm) {
      result = result.filter(material => 
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedType) {
      result = result.filter(material => material.type === selectedType);
    }
    
    // 如果选择了特定课程且不显示所有课程，则过滤
    if (selectedCourse && !showAllCourses) {
      result = result.filter(material => 
        material.course?.id === selectedCourse || 
        material.chapter?.course?.id === selectedCourse
      );
    }
    
    setFilteredMaterials(result);
  };

  const handlePreview = (material: Material) => {
    setSelectedMaterial(material);
    setPreviewOpen(true);
  };

  const handleDownload = (material: Material) => {
    if (!material.fileUrl) {
      setError('文件路径无效，无法下载');
      return;
    }
    
    // 构建完整的文件URL
    const fileUrl = material.fileUrl.startsWith('http') 
      ? material.fileUrl 
      : `http://localhost:3001${material.fileUrl}`;
    
    // 创建一个临时链接进行下载
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = material.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 创建知识库
  const handleCreateKnowledgeBase = async (material: Material) => {
    try {
      // 显示加载状态
      setLoading(true);
      
      // 如果资料已经有知识库信息，提示用户是否重新创建
      if (material.datasetId && material.documentId) {
        if (!confirm(`该资料已经关联到知识库，是否重新创建知识库？\n注意：重新创建将覆盖现有的知识库信息。`)) {
          return;
        }
      }
      
      // 1. 登录获取访问令牌
      console.log('正在登录 Dify...');
      const loginResponse = await fetch('http://localhost:5001/console/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "3325127454@qq.com",
          password: "wangran1998"
        })
      });
      
      console.log('登录响应状态:', loginResponse.status);
      
      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('登录失败:', errorText);
        throw new Error(`登录失败，状态码: ${loginResponse.status}, 错误信息: ${errorText}`);
      }
      
      const loginData = await loginResponse.json();
      console.log('登录响应数据:', loginData);
      
      const accessToken = loginData.access_token || loginData.data?.access_token;
      
      if (!accessToken) {
        console.error('访问令牌未找到，响应数据:', loginData);
        throw new Error('获取访问令牌失败');
      }
      
      console.log('成功获取访问令牌');
      
      // 2. 如果资料已经有知识库信息，先删除原有的知识库
      if (material.datasetId) {
        console.log('删除原有的知识库...');
        console.log('知识库ID:', material.datasetId);
        
        const deleteDatasetResponse = await fetch(`http://localhost:5001/console/api/datasets/${material.datasetId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        });
        
        console.log('删除知识库响应状态:', deleteDatasetResponse.status);
        
        if (!deleteDatasetResponse.ok && deleteDatasetResponse.status !== 204) {
          const errorText = await deleteDatasetResponse.text();
          console.error('删除知识库失败:', errorText);
          // 不抛出错误，继续创建新知识库
        } else {
          console.log('原有知识库删除成功');
          // 等待一秒，确保删除操作完成
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // 3. 创建新的知识库
      console.log('创建新的知识库...');
      const datasetName = `${material.title} - 知识库`;
      console.log('知识库名称:', datasetName);
      
      const datasetResponse = await fetch('http://localhost:5001/console/api/datasets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: datasetName,
          indexing_technique: "high_quality",
          embedding_model: "embeddings",
          embedding_model_provider: "axdlee/sophnet/sophnet"
        })
      });
      
      console.log('创建知识库响应状态:', datasetResponse.status);
      
      if (!datasetResponse.ok) {
        const errorText = await datasetResponse.text();
        console.error('创建知识库失败:', errorText);
        throw new Error(`创建知识库失败，状态码: ${datasetResponse.status}, 错误信息: ${errorText}`);
      }
      
      const datasetData = await datasetResponse.json();
      const datasetId = datasetData.id;
      console.log('知识库创建成功，ID:', datasetId);
      
      if (!datasetId) {
        throw new Error('获取知识库ID失败');
      }
      
      // 4. 上传文件获取文件ID
      console.log('准备上传文件...');
      const fileUrl = material.fileUrl.startsWith('http') 
        ? material.fileUrl 
        : `http://localhost:3001${material.fileUrl}`;
      
      console.log('文件URL:', fileUrl);
      
      // 获取文件内容
      const fileResponse = await fetch(fileUrl);
      console.log('文件响应状态:', fileResponse.status);
      
      if (!fileResponse.ok) {
        throw new Error('获取文件内容失败');
      }
      
      const fileBlob = await fileResponse.blob();
      console.log('文件Blob类型:', fileBlob.type);
      console.log('文件Blob大小:', fileBlob.size);
      
      // 根据文件URL和类型确定正确的文件名和扩展名
      let fileName = material.title;
      let fileType = fileBlob.type;
      
      // 如果material.title中没有扩展名，根据文件类型添加合适的扩展名
      if (!material.title.includes('.')) {
        // 根据MIME类型添加扩展名
        const mimeToExt: Record<string, string> = {
          'text/plain': '.txt',
          'text/markdown': '.md',
          'text/html': '.html',
          'application/xml': '.xml',
          'application/epub+zip': '.epub',
          'application/pdf': '.pdf',
          'application/msword': '.doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
          'application/vnd.ms-excel': '.xls',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
          'text/csv': '.csv',
          'application/vnd.ms-powerpoint': '.ppt',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
          'message/rfc822': '.eml',
          'application/vnd.ms-outlook': '.msg',
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'image/svg+xml': '.svg',
          'audio/mpeg': '.mp3',
          'audio/mp4': '.m4a',
          'audio/wav': '.wav',
          'audio/amr': '.amr',
          'audio/mpeg3': '.mpga',
          'video/mp4': '.mp4',
          'video/quicktime': '.mov',
          'video/mpeg': '.mpeg',
          'video/webm': '.webm'
        };
        
        const ext = mimeToExt[fileBlob.type] || '.txt';
        fileName = `${material.title}${ext}`;
      }
      
      const file = new File([fileBlob], fileName, { type: fileType });
      
      // 上传文件获取文件ID
      console.log('上传文件获取文件ID...');
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('user', '3325127454@qq.com');
      
      const uploadFileResponse = await fetch('http://localhost:5001/console/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: uploadFormData
      });
      
      console.log('上传文件响应状态:', uploadFileResponse.status);
      
      if (!uploadFileResponse.ok) {
        const errorText = await uploadFileResponse.text();
        console.error('上传文件失败:', errorText);
        throw new Error(`上传文件失败，状态码: ${uploadFileResponse.status}, 错误信息: ${errorText}`);
      }
      
      const uploadFileData = await uploadFileResponse.json();
      const fileId = uploadFileData.id;
      
      if (!fileId) {
        throw new Error('获取文件ID失败');
      }
      
      console.log('文件上传成功，文件ID:', fileId);
      
      // 6. 使用文件ID创建知识库文档
      console.log('使用文件ID创建知识库文档...');
      
      // 根据文件类型确定文档格式
      let docForm = "text_model";
      const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
        docForm = "image_model";
      }
      
      const createDocumentData = {
        data_source: {
          type: "upload_file",
          info_list: {
            data_source_type: "upload_file",
            file_info_list: {
              file_ids: [fileId]
            }
          }
        },
        indexing_technique: "high_quality",
        process_rule: {
          mode: "custom",
          rules: {
            pre_processing_rules: [],
            segmentation: {
              separator: "\\n",
              max_tokens: 1000
            }
          }
        },
        doc_form: docForm,
        doc_language: "zh",
        retrieval_model: {
          search_method: "hybrid_search",
          reranking_enable: false,
          reranking_mode: "weighted_score",
          reranking_model: {
            reranking_provider_name: "",
            reranking_model_name: ""
          },
          weights: {
            weight_type: "customized",
            keyword_setting: {
              keyword_weight: 0.3
            },
            vector_setting: {
              vector_weight: 0.7,
              embedding_model_name: "embeddings",
              embedding_provider_name: "axdlee/sophnet/sophnet"
            }
          },
          top_k: 5,
          score_threshold_enabled: false,
          score_threshold: 0.0
        },
        embedding_model: "embeddings",
        embedding_model_provider: "axdlee/sophnet/sophnet"
      };
      
      console.log('创建文档请求数据:', JSON.stringify(createDocumentData, null, 2));
      
      const createDocumentResponse = await fetch(`http://localhost:5001/console/api/datasets/${datasetId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createDocumentData)
      });
      
      console.log('创建文档响应状态:', createDocumentResponse.status);
      
      if (!createDocumentResponse.ok) {
        const errorText = await createDocumentResponse.text();
        console.error('创建文档失败:', errorText);
        throw new Error(`创建文档失败，状态码: ${createDocumentResponse.status}, 错误信息: ${errorText}`);
      }
      
      const createDocumentDataResult = await createDocumentResponse.json();
      console.log('文档创建成功:', createDocumentDataResult);
      
      // 获取文档ID
      const documentId = createDocumentDataResult.documents?.[0]?.id;
      
      if (!documentId) {
        throw new Error('获取文档ID失败');
      }
      
      console.log('文档创建成功，文档ID:', documentId);
      
      // 7. 保存知识库信息到数据库
      try {
        console.log('保存知识库信息到数据库...');
        const updateResponse = await fetch(`http://localhost:3001/api/materials/${material.id}/knowledge-base`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            datasetId: datasetId,
            documentId: documentId
          })
        });
        
        console.log('保存知识库信息响应状态:', updateResponse.status);
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('保存知识库信息失败:', errorText);
          throw new Error(`保存知识库信息失败，状态码: ${updateResponse.status}, 错误信息: ${errorText}`);
        }
        
        const updateData = await updateResponse.json();
        console.log('知识库信息保存成功:', updateData);
        
        // 更新materials状态中的资料对象
        setMaterials(prevMaterials => 
          prevMaterials.map(m => 
            m.id === material.id 
              ? { ...m, datasetId: datasetId, documentId: documentId } 
              : m
          )
        );
      } catch (error) {
        console.error('保存知识库信息到数据库失败:', error);
        throw new Error(`保存知识库信息到数据库失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
      const message = `知识库创建成功！\n知识库ID: ${datasetId}`;
      
      alert(message);
    } catch (error) {
      console.error('创建知识库失败:', error);
      setError(`创建知识库失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 关联到课程答疑助手
  const handleAssociateToAssistant = async (material: Material) => {
    try {
      // 获取当前课程信息
      const currentCourse = courses.find(course => course.id === (selectedCourse || effectiveCourseId));
      
      if (!currentCourse) {
        alert('无法获取当前课程信息');
        return;
      }
      
      // 检查课程是否已经有教师创建的助手
      if (!currentCourse.agentAppId) {
        alert('该课程尚未创建课程答疑助手，请联系教师创建');
        return;
      }
      
      // 从数据库获取该资料的知识库信息
      console.log('从数据库获取资料知识库信息...');
      const materialResponse = await fetch(`http://localhost:3001/api/materials/${material.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('获取资料信息响应状态:', materialResponse.status);
      
      if (!materialResponse.ok) {
        const errorText = await materialResponse.text();
        console.error('获取资料信息失败:', errorText);
        throw new Error(`获取资料信息失败，状态码: ${materialResponse.status}, 错误信息: ${errorText}`);
      }
      
      const materialData = await materialResponse.json();
      const materialInfo = materialData.data || materialData;
      
      if (!materialInfo.datasetId || !materialInfo.documentId) {
        alert('请先为该资料创建知识库');
        return;
      }
      
      const knowledgeBase = {
        datasetId: materialInfo.datasetId,
        documentId: materialInfo.documentId
      };
      
      console.log('获取到知识库信息:', knowledgeBase);
      console.log('使用教师创建的助手应用ID:', currentCourse.agentAppId);
      
      // 获取Dify访问令牌
      console.log('正在登录 Dify...');
      const loginResponse = await fetch('http://localhost:5001/console/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "3325127454@qq.com",
          password: "wangran1998"
        })
      });
      
      console.log('登录响应状态:', loginResponse.status);
      
      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('登录失败:', errorText);
        throw new Error(`登录失败，状态码: ${loginResponse.status}, 错误信息: ${errorText}`);
      }
      
      const loginData = await loginResponse.json();
      console.log('登录响应数据:', loginData);
      
      const accessToken = loginData.access_token || loginData.data?.access_token;
      
      if (!accessToken) {
        console.error('访问令牌未找到，响应数据:', loginData);
        throw new Error('获取访问令牌失败');
      }
      
      console.log('成功获取访问令牌');
      
      // 获取当前应用配置，以便在添加新知识库时保留现有配置
      console.log('获取当前应用配置...');
      const currentAppConfigResponse = await fetch(`http://localhost:5001/console/api/apps/${currentCourse.agentAppId}/model-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('获取当前应用配置响应状态:', currentAppConfigResponse.status);
      
      let currentDatasets = [];
      if (currentAppConfigResponse.ok) {
        const currentConfigData = await currentAppConfigResponse.json();
        console.log('当前应用配置数据:', currentConfigData);
        
        // 保留现有的知识库关联
        if (currentConfigData.dataset_configs && currentConfigData.dataset_configs.datasets && currentConfigData.dataset_configs.datasets.datasets) {
          currentDatasets = currentConfigData.dataset_configs.datasets.datasets;
          console.log('当前已关联的知识库:', currentDatasets);
        }
      }
      
      // 检查知识库是否已经关联
      const isDatasetAlreadyAssociated = currentDatasets.some(
        (dataset: any) => dataset.dataset.id === knowledgeBase.datasetId
      );
      
      if (isDatasetAlreadyAssociated) {
        alert('该知识库已经关联到课程答疑助手');
        return;
      }
      
      // 添加新的知识库到现有配置中
      const updatedDatasets = [
        ...currentDatasets,
        {
          "dataset": {
            "enabled": true,
            "id": knowledgeBase.datasetId
          }
        }
      ];
      
      // 关联知识库到教师创建的应用
      console.log('关联知识库到教师创建的应用...');
      const updateAppUrl = `http://localhost:5001/console/api/apps/${currentCourse.agentAppId}/model-config`;
      
      const updateBody = {
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
            "datasets": updatedDatasets
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
      };
      
      console.log('更新应用配置请求体:', JSON.stringify(updateBody, null, 2));
      
      const updateAppResponse = await fetch(updateAppUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateBody)
      });
      
      console.log('更新应用配置响应状态:', updateAppResponse.status);
      
      if (!updateAppResponse.ok) {
        const errorText = await updateAppResponse.text();
        console.error('更新应用配置失败:', errorText);
        throw new Error(`更新应用配置失败，状态码: ${updateAppResponse.status}, 错误信息: ${errorText}`);
      }
      
      const updateAppData = await updateAppResponse.json();
      console.log('应用配置更新成功:', updateAppData);
      
      alert(`已成功将《${material.title}》的知识库关联到《${currentCourse.title}》的课程答疑助手！`);
      
      // 更新materials状态中的资料对象，标记为已关联到助手
      setMaterials(prevMaterials => 
        prevMaterials.map(m => 
          m.id === material.id 
            ? { ...m, associatedToAssistant: true } 
            : m
        )
      );
      
      // 更新associationStatus状态
      setAssociationStatus(prevStatus => ({
        ...prevStatus,
        [material.id]: true
      }));
    } catch (error) {
      console.error('关联到课程答疑助手失败:', error);
      setError(`关联到课程答疑助手失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 取消关联到课程答疑助手
  const handleDisassociateFromAssistant = async (material: Material) => {
    try {
      // 获取当前课程信息
      const currentCourse = courses.find(course => course.id === (selectedCourse || effectiveCourseId));
      
      if (!currentCourse) {
        alert('无法获取当前课程信息');
        return;
      }
      
      // 检查课程是否已经有教师创建的助手
      if (!currentCourse.agentAppId) {
        alert('该课程尚未创建课程答疑助手');
        return;
      }
      
      // 确认取消关联
      if (!confirm(`确定要取消《${material.title}》与《${currentCourse.title}》课程答疑助手的关联吗？`)) {
        return;
      }
      
      // 从数据库获取该资料的知识库信息
      console.log('从数据库获取资料知识库信息...');
      const materialResponse = await fetch(`http://localhost:3001/api/materials/${material.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('获取资料信息响应状态:', materialResponse.status);
      
      if (!materialResponse.ok) {
        const errorText = await materialResponse.text();
        console.error('获取资料信息失败:', errorText);
        throw new Error(`获取资料信息失败，状态码: ${materialResponse.status}, 错误信息: ${errorText}`);
      }
      
      const materialData = await materialResponse.json();
      const materialInfo = materialData.data || materialData;
      
      if (!materialInfo.datasetId) {
        alert('该资料没有关联知识库');
        return;
      }
      
      const datasetId = materialInfo.datasetId;
      console.log('获取到知识库ID:', datasetId);
      console.log('使用教师创建的助手应用ID:', currentCourse.agentAppId);
      
      // 获取Dify访问令牌
      console.log('正在登录 Dify...');
      const loginResponse = await fetch('http://localhost:5001/console/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "3325127454@qq.com",
          password: "wangran1998"
        })
      });
      
      console.log('登录响应状态:', loginResponse.status);
      
      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('登录失败:', errorText);
        throw new Error(`登录失败，状态码: ${loginResponse.status}, 错误信息: ${errorText}`);
      }
      
      const loginData = await loginResponse.json();
      console.log('登录响应数据:', loginData);
      
      const accessToken = loginData.access_token || loginData.data?.access_token;
      
      if (!accessToken) {
        console.error('访问令牌未找到，响应数据:', loginData);
        throw new Error('获取访问令牌失败');
      }
      
      console.log('成功获取访问令牌');
      
      // 获取当前应用配置
      console.log('获取当前应用配置...');
      const currentAppConfigResponse = await fetch(`http://localhost:5001/console/api/apps/${currentCourse.agentAppId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('获取当前应用配置响应状态:', currentAppConfigResponse.status);
      
      if (!currentAppConfigResponse.ok) {
        const errorText = await currentAppConfigResponse.text();
        console.error('获取当前应用配置失败:', errorText);
        throw new Error(`获取当前应用配置失败，状态码: ${currentAppConfigResponse.status}, 错误信息: ${errorText}`);
      }
      
      const currentConfigData = await currentAppConfigResponse.json();
      console.log('当前应用配置数据:', currentConfigData);
      
      // 使用相关应用接口检查知识库是否已经关联
      console.log('检查知识库关联状态...');
      const relatedAppsResponse = await fetch(`http://localhost:5001/console/api/datasets/${datasetId}/related-apps`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('检查关联状态响应状态:', relatedAppsResponse.status);
      
      if (!relatedAppsResponse.ok) {
        const errorText = await relatedAppsResponse.text();
        console.error('检查关联状态失败:', errorText);
        throw new Error(`检查关联状态失败，状态码: ${relatedAppsResponse.status}, 错误信息: ${errorText}`);
      }
      
      const relatedAppsData = await relatedAppsResponse.json();
      console.log('关联的应用数据:', relatedAppsData);
      
      // 检查当前应用是否在关联的应用列表中
      const isAssociated = relatedAppsData.data && relatedAppsData.data.some(
        (app: any) => app.id === currentCourse.agentAppId
      );
      
      if (!isAssociated) {
        alert(`已成功取消《${material.title}》与《${currentCourse.title}》课程答疑助手的关联！`);
        // 更新associationStatus状态，确保UI显示正确
        setAssociationStatus(prevStatus => ({
          ...prevStatus,
          [material.id]: false
        }));
        return;
      }
      
      // 获取当前模型配置
      console.log('获取模型配置...');
      const modelConfigResponse = await fetch(`http://localhost:5001/console/api/apps/${currentCourse.agentAppId}/model-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        })
      });
      
      console.log('获取模型配置响应状态:', modelConfigResponse.status);
      
      if (!modelConfigResponse.ok) {
        const errorText = await modelConfigResponse.text();
        console.error('获取模型配置失败:', errorText);
        throw new Error(`获取模型配置失败，状态码: ${modelConfigResponse.status}, 错误信息: ${errorText}`);
      }
      
      const modelConfigData = await modelConfigResponse.json();
      console.log('模型配置数据:', modelConfigData);
      
      // 获取当前关联的数据集
      let currentDatasets = [];
      if (modelConfigData.dataset_configs && modelConfigData.dataset_configs.datasets && modelConfigData.dataset_configs.datasets.datasets) {
        currentDatasets = modelConfigData.dataset_configs.datasets.datasets;
      }
      console.log('当前已关联的知识库:', currentDatasets);
      
      // 检查要取消关联的知识库是否存在
      const datasetIndex = currentDatasets.findIndex(
        (dataset: any) => dataset.dataset.id === datasetId
      );
      
      if (datasetIndex === -1) {
        alert(`已成功取消《${material.title}》与《${currentCourse.title}》课程答疑助手的关联！`);
        // 更新associationStatus状态，确保UI显示正确
        setAssociationStatus(prevStatus => ({
          ...prevStatus,
          [material.id]: false
        }));
        return;
      }
      
      // 从配置中移除指定的知识库
      const updatedDatasets = [...currentDatasets];
      updatedDatasets.splice(datasetIndex, 1);
      
      // 更新应用配置
      console.log('更新应用配置，移除知识库关联...');
      const updateAppUrl = `http://localhost:5001/console/api/apps/${currentCourse.agentAppId}/model-config`;
      
      const updateBody = {
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
            "datasets": updatedDatasets
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
      };
      
      console.log('更新应用配置请求体:', JSON.stringify(updateBody, null, 2));
      
      const updateAppResponse = await fetch(updateAppUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateBody)
      });
      
      console.log('更新应用配置响应状态:', updateAppResponse.status);
      
      if (!updateAppResponse.ok) {
        const errorText = await updateAppResponse.text();
        console.error('更新应用配置失败:', errorText);
        throw new Error(`更新应用配置失败，状态码: ${updateAppResponse.status}, 错误信息: ${errorText}`);
      }
      
      const updateAppData = await updateAppResponse.json();
      console.log('应用配置更新成功:', updateAppData);
      
      alert(`已成功取消《${material.title}》与《${currentCourse.title}》课程答疑助手的关联！`);
      
      // 更新materials状态中的资料对象，标记为未关联到助手
      setMaterials(prevMaterials => 
        prevMaterials.map(m => 
          m.id === material.id 
            ? { ...m, associatedToAssistant: false } 
            : m
        )
      );
      
      // 更新associationStatus状态
      setAssociationStatus(prevStatus => ({
        ...prevStatus,
        [material.id]: false
      }));
    } catch (error) {
      console.error('取消关联失败:', error);
      setError(`取消关联失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 检查资料是否已经关联到课程答疑助手
  const isAssociatedToAssistant = async (materialId: string): Promise<boolean> => {
    // 检查当前课程是否已经关联了助手
    const currentCourse = courses.find(course => course.id === (selectedCourse || effectiveCourseId));
    
    // 如果课程没有助手，则返回false
    if (!currentCourse || !currentCourse.agentAppId) {
      return false;
    }
    
    // 查找当前资料，检查是否有知识库信息
    const material = materials.find(m => m.id === materialId);
    
    // 如果资料没有知识库信息，则返回false
    if (!material || !material.datasetId || !material.documentId) {
      return false;
    }
    
    // 检查资料是否已经标记为已关联到助手
    if (material.associatedToAssistant) {
      // 进一步验证知识库是否真的关联到了课程答疑助手
      try {
        // 使用Dify API检查知识库关联状态
        const checkAssociationUrl = `http://localhost:5001/console/api/datasets/${material.datasetId}/related-apps`;
        
        const checkAssociationResponse = await fetch(checkAssociationUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('difyAccessToken') || ''}`,
          }
        });
        
        if (checkAssociationResponse.ok) {
          const associationData = await checkAssociationResponse.json();
          console.log('检查知识库关联状态响应数据:', associationData);
          
          // 检查当前课程助手是否在关联的应用列表中
          const isAssociated = associationData.data && associationData.data.some((app: any) => app.id === currentCourse.agentAppId);
          
          if (!isAssociated) {
            // 如果实际没有关联，更新materials状态
            setMaterials(prevMaterials => 
              prevMaterials.map(m => 
                m.id === materialId 
                  ? { ...m, associatedToAssistant: false } 
                  : m
              )
            );
            return false;
          }
          
          return isAssociated;
        } else {
          console.error('检查知识库关联状态失败:', checkAssociationResponse.status);
          return false;
        }
      } catch (error) {
        console.error('检查知识库关联状态出错:', error);
        return false;
      }
    }
    
    // 如果资料有知识库信息但没有标记为已关联，则返回false
    return false;
  };

  // 构建完整的文件URL用于预览
  const getFullFileUrl = (fileUrl: string): string => {
    if (!fileUrl) return '';
    return fileUrl.startsWith('http') ? fileUrl : `http://localhost:3001${fileUrl}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <VideoLibrary color="primary" />;
      case 'PDF': return <PictureAsPdf color="error" />;
      case 'DOC': return <Description color="primary" />;
      case 'IMAGE': return <PictureAsPdf color="success" />;
      case 'AUDIO': return <AudioFile color="info" />;
      case 'ZIP': return <Archive color="warning" />;
      default: return <Description color="action" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'VIDEO': return '视频';
      case 'PDF': return 'PDF';
      case 'DOC': return '文档';
      case 'IMAGE': return '图片';
      case 'AUDIO': return '音频';
      case 'ZIP': return '压缩包';
      case 'OTHER': return '其他';
      default: return type;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchMaterials}>
          重新加载
        </Button>
      </Box>
    );
  }

  // 获取当前课程的名称
  const currentCourse = courses.find(course => course.id === effectiveCourseId);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">学习资料</Typography>
        {effectiveCourseId && currentCourse && (
          <Chip
            label={currentCourse.title}
            color="primary"
            variant="filled"
          />
        )}
      </Box>

      {/* 课程选择和搜索筛选 - 当在特定课程页面时隐藏课程选择 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {!effectiveCourseId && (
          <>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>选择课程</InputLabel>
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                label="选择课程"
              >
                {courses.map(course => (
                  <MenuItem key={course.id} value={course.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <School sx={{ mr: 1, fontSize: 16 }} />
                      <span>{course.title}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={showAllCourses}
                  onChange={(e) => setShowAllCourses(e.target.checked)}
                />
              }
              label="显示所有课程资料"
            />
          </>
        )}
        
        <TextField
          placeholder="搜索资料..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search />,
          }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>类型</InputLabel>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            label="类型"
          >
            <MenuItem value="">全部类型</MenuItem>
            <MenuItem value="VIDEO">视频</MenuItem>
            <MenuItem value="PDF">PDF</MenuItem>
            <MenuItem value="DOC">文档</MenuItem>
            <MenuItem value="IMAGE">图片</MenuItem>
            <MenuItem value="AUDIO">音频</MenuItem>
            <MenuItem value="ZIP">压缩包</MenuItem>
            <MenuItem value="OTHER">其他</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 资料列表 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress />
        </Box>
      ) : filteredMaterials.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="textSecondary">
            {selectedCourse && !showAllCourses 
              ? "该课程暂无资料" 
              : "暂无资料"}
          </Typography>
          {courses.length === 0 && !effectiveCourseId && (
            <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
              您尚未加入任何课程，请先到"我的课程"页面加入课程
            </Typography>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>资料名称</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>大小</TableCell>
                <TableCell>描述</TableCell>
                {/* 在特定课程页面隐藏关联课程列 */}
                {!effectiveCourseId && <TableCell>关联课程</TableCell>}
                <TableCell>创建时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getTypeIcon(material.type)}
                      <Typography variant="body1" sx={{ ml: 1, fontWeight: 'bold' }}>
                        {material.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTypeLabel(material.type)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatFileSize(material.fileSize)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {material.description || '暂无描述'}
                    </Typography>
                  </TableCell>
                  {/* 在特定课程页面隐藏关联课程列 */}
                  {!effectiveCourseId && (
                    <TableCell>
                      {material.course ? (
                        <Chip
                          label={material.course.title}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : material.chapter?.course ? (
                        <Chip
                          label={material.chapter.course.title}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          未关联
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{formatDate(material.createdAt)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button 
                        color="primary" 
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handlePreview(material)}
                        sx={{ minWidth: 'auto', px: 1, py: 0.5 }}
                      >
                        预览
                      </Button>
                      <Button 
                        color="primary" 
                        size="small"
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleDownload(material)}
                        sx={{ minWidth: 'auto', px: 1, py: 0.5 }}
                      >
                        下载
                      </Button>
                      {/* "创建知识库"按钮一直存在 */}
                      <Button 
                        color="primary" 
                        size="small"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        onClick={() => handleCreateKnowledgeBase(material)}
                        sx={{ minWidth: 'auto', px: 1, py: 0.5 }}
                      >
                        创建知识库
                      </Button>
                      {/* 只有当资料有知识库信息时才显示关联/取消关联按钮 */}
                      {material.datasetId && material.documentId && (
                        <>
                          {associationStatus[material.id] ? (
                            <Button 
                              color="primary" 
                              size="small"
                              variant="outlined"
                              startIcon={<LinkOff />}
                              onClick={() => handleDisassociateFromAssistant(material)}
                              sx={{ minWidth: 'auto', px: 1, py: 0.5 }}
                            >
                              取消关联
                            </Button>
                          ) : (
                            <Button 
                              color="primary" 
                              size="small"
                              variant="outlined"
                              startIcon={<SmartToy />}
                              onClick={() => handleAssociateToAssistant(material)}
                              sx={{ minWidth: 'auto', px: 1, py: 0.5 }}
                            >
                              关联助手
                            </Button>
                          )}
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 预览对话框 */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          资料预览
          <IconButton
            aria-label="close"
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedMaterial && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedMaterial.title}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>类型:</strong> {getTypeLabel(selectedMaterial.type)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>大小:</strong> {formatFileSize(selectedMaterial.fileSize)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>创建时间:</strong> {formatDate(selectedMaterial.createdAt)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>更新时间:</strong> {formatDate(selectedMaterial.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="body1" gutterBottom>
                <strong>描述:</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {selectedMaterial.description || '暂无描述'}
              </Typography>
              \n              \n              <Box sx={{ mt: 2, textAlign: 'center' }}>
                {selectedMaterial.type === 'PDF' && (
                  <Box sx={{ 
                    height: 400, 
                    border: '1px solid #ccc', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    position: 'relative'
                  }}>
                    {selectedMaterial.fileUrl ? (
                      <Box sx={{ textAlign: 'center', padding: 2, width: '100%' }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          PDF文档预览
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          点击下方按钮在新标签页中查看PDF文件
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Visibility />}
                          onClick={() => {
                            const fullUrl = getFullFileUrl(selectedMaterial.fileUrl);
                            window.open(fullUrl, '_blank');
                          }}
                        >
                          在新标签页查看PDF
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="h6" color="textSecondary">
                        PDF文件路径无效
                      </Typography>
                    )}
                  </Box>
                )}
                
                {selectedMaterial.type === 'VIDEO' && (
                  <Box sx={{ 
                    height: 400, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#000',
                    position: 'relative'
                  }}>
                    {selectedMaterial.fileUrl ? (
                      <video
                        controls
                        width="100%"
                        height="100%"
                        style={{ maxHeight: '400px' }}
                      >
                        <source src={getFullFileUrl(selectedMaterial.fileUrl)} type="video/mp4" />
                        <source src={getFullFileUrl(selectedMaterial.fileUrl)} type="video/webm" />
                        <source src={getFullFileUrl(selectedMaterial.fileUrl)} type="video/ogg" />
                        您的浏览器不支持视频播放
                      </video>
                    ) : (
                      <Typography variant="h6" color="textSecondary">
                        视频文件路径无效
                      </Typography>
                    )}
                  </Box>
                )}
                
                {selectedMaterial.type === 'IMAGE' && (
                  <Box sx={{ 
                    height: 400, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    overflow: 'hidden'
                  }}>
                    {selectedMaterial.fileUrl ? (
                      <img
                        src={getFullFileUrl(selectedMaterial.fileUrl)}
                        alt={selectedMaterial.title}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="h6" color="textSecondary">
                        图片文件路径无效
                      </Typography>
                    )}
                  </Box>
                )}
                
                {(selectedMaterial.type === 'DOC' || selectedMaterial.type === 'OTHER') && (
                  <Box sx={{ 
                    height: 400, 
                    border: '1px solid #ccc', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5'
                  }}>
                    {selectedMaterial.fileUrl ? (
                      <Box sx={{ textAlign: 'center', padding: 2 }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          {getTypeLabel(selectedMaterial.type)}文档预览
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          该文件类型可能需要下载后查看
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Download />}
                          onClick={() => handleDownload(selectedMaterial)}
                        >
                          下载文件
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="h6" color="textSecondary">
                        文件路径无效
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>关闭</Button>
          {selectedMaterial && (
            <Button 
              variant="contained" 
              startIcon={<Download />}
              onClick={() => handleDownload(selectedMaterial)}
            >
              下载
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Materials;