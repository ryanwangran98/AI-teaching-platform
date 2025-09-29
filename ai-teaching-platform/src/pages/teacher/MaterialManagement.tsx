import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Card,
  CardContent,
  Avatar,
  Grid,
  Divider,
  alpha,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Upload,
  Edit,
  Delete,
  Visibility,
  Download,
  Search,
  Add,
  Link,
  ExpandMore,
  ExpandLess,
  ArrowBack,
  Publish,
  Cancel,
  VideoLibrary,
  PictureAsPdf,
  Description,
  Image,
  MusicNote,
  Folder,
  FolderOpen,
  SmartToy,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { materialAPI, chapterAPI, courseAPI } from '../../services/api';
import api from '../../services/api';


interface Material {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'DOC' | 'IMAGE' | 'AUDIO' | 'ZIP' | 'OTHER';
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  downloads: number;
  description: string;
  chapter?: {
    id: string;
    title: string;
    course?: {
      id: string;
      title: string;
    };
  };
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface MaterialFormData {
  title: string;
  description: string;
  type: 'VIDEO' | 'PDF' | 'DOC' | 'IMAGE' | 'AUDIO' | 'ZIP' | 'OTHER';
  chapterId?: string;
  file?: File;
}

const MaterialManagement: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>(); // 从路径参数获取当前课程ID
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // 新增的状态变量
  const [formData, setFormData] = useState<MaterialFormData>({
    title: '',
    description: '',
    type: 'PDF',
    chapterId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentCourse, setCurrentCourse] = useState<{id: string, name: string, agentAppId?: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId(); // 生成唯一ID

  // 知识库和答疑助手相关状态
  const [knowledgeBaseLoading, setKnowledgeBaseLoading] = useState<Record<string, boolean>>({});
  const [associationStatus, setAssociationStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    console.log('MaterialManagement useEffect triggered, courseId:', courseId);
    if (courseId) {
      fetchMaterials();
      fetchChapters();
      fetchCurrentCourse();
    } else {
      console.log('No courseId provided');
      setError('未指定课程ID，请从课程管理页面进入');
      setLoading(false);
    }
  }, [courseId]); // 添加 courseId 作为依赖项

  // 检查所有资料的关联状态
  useEffect(() => {
    if (materials.length > 0 && currentCourse?.agentAppId) {
      materials.forEach(material => {
        if (material.datasetId) {
          isAssociatedToAssistant(material);
        }
      });
    }
  }, [materials, currentCourse?.agentAppId]);

  const fetchMaterials = async () => {
    if (!courseId) return;
    
    try {
      console.log('Fetching materials for courseId:', courseId);
      setLoading(true);
      const response = await materialAPI.getMaterials({ courseId });
      console.log('Materials response:', response);
      const data = response.data || response;
      setMaterials(Array.isArray(data) ? data : data.materials || []);
      setError(null);
    } catch (error: any) {
      console.error('获取资料失败:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('获取资料失败，请稍后重试');
      setMaterials([]); // 确保是数组
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    if (!courseId) return;
    
    try {
      console.log('Fetching chapters for courseId:', courseId);
      const response = await chapterAPI.getChapters(courseId, 'all');
      console.log('Chapters response:', response);
      const data = response.data || response;
      const chaptersData = Array.isArray(data) ? data : data.chapters || [];
      
      const mappedChapters = chaptersData.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title || chapter.name || '未知章节'
      }));
      
      setChapters(mappedChapters);
    } catch (error: any) {
      console.error('获取章节失败:', error);
      console.error('Error details:', error.response?.data || error.message);
      setChapters([]);
    }
  };

  const fetchCurrentCourse = async () => {
    if (!courseId) return;
    
    try {
      console.log('Fetching course info for courseId:', courseId);
      const response = await courseAPI.getCourse(courseId);
      console.log('Course info response:', response);
      const courseData = response.data || response;
      
      setCurrentCourse({
        id: courseData.id,
        name: courseData.name || courseData.title || '未命名课程',
        agentAppId: courseData.agentAppId
      });
    } catch (error: any) {
      console.error('获取课程信息失败:', error);
      console.error('Error details:', error.response?.data || error.message);
      setCurrentCourse({
        id: courseId,
        name: '未知课程'
      });
    }
  };

  const handleCreate = () => {
    setEditingMaterial(null);
    setFormData({
      title: '',
      description: '',
      type: 'PDF',
      chapterId: '',
    });
    setOpen(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      type: material.type,
      chapterId: material.chapter?.id || '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMaterial(null);
    setFormData({
      title: '',
      description: '',
      type: 'PDF',
      chapterId: '',
    });
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      if (!editingMaterial && !formData.file) {
        setError('请选择要上传的文件');
        setSubmitting(false);
        return;
      }

      if (editingMaterial) {
        // 编辑现有资料 - 只更新元数据，不上传文件
        const materialData = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          chapterId: formData.chapterId && formData.chapterId.trim() ? formData.chapterId : undefined,
        };
        
        await materialAPI.updateMaterial(editingMaterial.id, materialData);
      } else {
        // 创建新资料 - 上传文件和元数据
        if (!formData.file) {
          setError('请选择要上传的文件');
          setSubmitting(false);
          return;
        }
        
        const materialData = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          chapterId: formData.chapterId && formData.chapterId.trim() ? formData.chapterId : undefined,
          file: formData.file,
        };
        
        await materialAPI.createMaterial(materialData);
      }
      
      // 重新获取资料列表
      await fetchMaterials();
      handleClose();
    } catch (error: any) {
      console.error('保存资料失败:', error);
      setError(`保存资料失败: ${error.response?.data?.error || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (window.confirm('确定要删除这个资料吗？')) {
      try {
        await materialAPI.deleteMaterial(materialId);
        await fetchMaterials(); // 重新获取资料列表
      } catch (error: any) {
        console.error('删除资料失败:', error);
        alert(`删除资料失败: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handlePublish = async (materialId: string) => {
    try {
      await materialAPI.updateMaterial(materialId, { status: 'published' });
      await fetchMaterials(); // 重新获取资料列表
    } catch (error: any) {
      console.error('发布资料失败:', error);
      alert(`发布资料失败: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUnpublish = async (materialId: string) => {
    try {
      await materialAPI.updateMaterial(materialId, { status: 'draft' });
      await fetchMaterials(); // 重新获取资料列表
    } catch (error: any) {
      console.error('取消发布资料失败:', error);
      alert(`取消发布资料失败: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.split('.')[0]
      }));
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 创建知识库
  const handleCreateKnowledgeBase = async (material: Material) => {
    try {
      setKnowledgeBaseLoading(prev => ({ ...prev, [material.id]: true }));
      setError(null);

      // 1. 检查课程是否有答疑助手
      if (!currentCourse?.agentAppId) {
        alert('该课程尚未创建课程答疑助手，请先创建答疑助手');
        return;
      }

      // 2. 获取资料详细信息（包含知识库信息）
      console.log('获取资料详细信息...');
      const materialResponse = await materialAPI.getMaterial(material.id);
      const materialInfo = materialResponse.data || materialResponse;

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

      // 2. 如果资料已经有知识库信息，询问用户是否重新创建
      if (materialInfo.datasetId) {
        if (!confirm(`该资料已经创建过知识库，是否重新创建知识库？\n注意：重新创建将覆盖现有的知识库信息。`)) {
          setKnowledgeBaseLoading(prev => ({ ...prev, [material.id]: false }));
          return;
        }
        
        console.log('删除原有的知识库...');
        console.log('知识库ID:', materialInfo.datasetId);
        
        const deleteDatasetResponse = await fetch(`http://localhost:5001/console/api/datasets/${materialInfo.datasetId}`, {
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
      // 直接使用资料名称作为知识库名称，确保不超过40字符限制
      const datasetName = material.title.length > 40 ? material.title.slice(0, 40) : material.title;
      console.log('知识库名称:', datasetName);
      
      const createDatasetResponse = await fetch('http://localhost:5001/console/api/datasets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: datasetName,
          indexing_technique: "high_quality",
          embedding_model: "embeddings",
          embedding_model_provider: "axdlee/sophnet/sophnet"
        })
      });

      if (!createDatasetResponse.ok) {
        const errorText = await createDatasetResponse.text();
        throw new Error(`创建知识库失败: ${errorText}`);
      }

      const datasetData = await createDatasetResponse.json();
      const datasetId = datasetData.id;
      console.log('知识库创建成功，ID:', datasetId);

      // 5. 上传文件获取文件ID
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
      
      // 使用文件ID创建知识库文档
      // 步骤1：创建知识库文档（不包含检索配置）
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
              separator: "\\n\\n\\n",
              max_tokens: 1000,
              chunk_overlap: 100
            }
          }
        },
        doc_form: docForm,
        doc_language: "zh",
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

      if (!createDocumentResponse.ok) {
        const errorText = await createDocumentResponse.text();
        throw new Error(`上传文档失败: ${errorText}`);
      }

      const documentData = await createDocumentResponse.json();
      const documentId = documentData.documents?.[0]?.id;
      
      if (!documentId) {
        throw new Error('获取文档ID失败');
      }

      console.log('文档创建成功，文档ID:', documentId);

      // 步骤2：更新知识库检索设置
      console.log('更新知识库检索设置...');
      const retrievalConfig = {
        retrieval_model: {
          search_method: "hybrid_search",
          reranking_enable: true,
          reranking_mode: "weighted_score",
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
              vector_weight: 0.7,
              embedding_model_name: "embeddings",
              embedding_provider_name: "axdlee/sophnet/sophnet"
            }
          },
          top_k: 5,
          score_threshold_enabled: false,
          score_threshold: 0.0
        }
      };
      
      const updateRetrievalResponse = await fetch(`http://localhost:5001/console/api/datasets/${datasetId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(retrievalConfig)
      });
      
      if (!updateRetrievalResponse.ok) {
        const errorText = await updateRetrievalResponse.text();
        console.warn('更新检索设置失败:', errorText);
        // 不抛出错误，继续执行，因为文档已经创建成功
      } else {
        console.log('知识库检索设置更新成功');
      }

      // 6. 保存知识库信息到数据库
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

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`保存知识库信息失败: ${errorText}`);
      }

      // 7. 更新本地状态
      setMaterials(prevMaterials => 
        prevMaterials.map(m => 
          m.id === material.id 
            ? { ...m, datasetId: datasetId, documentId: documentId } 
            : m
        )
      );

      alert(`知识库创建成功！\n知识库ID: ${datasetId}`);
    } catch (error) {
      console.error('创建知识库失败:', error);
      setError(`创建知识库失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setKnowledgeBaseLoading(prev => ({ ...prev, [material.id]: false }));
    }
  };

  // 关联到课程答疑助手（如果知识库不存在，则先创建知识库）
  const handleAssociateToAssistant = async (material: Material) => {
    try {
      setKnowledgeBaseLoading(prev => ({ ...prev, [material.id]: true }));
      setError(null);

      // 1. 检查课程是否有答疑助手
      if (!currentCourse?.agentAppId) {
        alert('该课程尚未创建课程答疑助手，请先创建答疑助手');
        return;
      }

      // 2. 获取资料详细信息
      console.log('获取资料详细信息...');
      const materialResponse = await materialAPI.getMaterial(material.id);
      const materialInfo = materialResponse.data || materialResponse;

      // 3. 检查是否已经创建知识库，如果没有则创建
      let datasetId = materialInfo.datasetId;
      let documentId = materialInfo.documentId;

      if (!datasetId || !documentId) {
        console.log('知识库不存在，开始创建知识库...');
        
        // 3.1 登录获取访问令牌
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

        // 3.2 创建新的知识库
        console.log('创建新的知识库...');
        // 直接使用资料名称作为知识库名称，确保不超过40字符限制
        const datasetName = material.title.length > 40 ? material.title.slice(0, 40) : material.title;
        console.log('知识库名称:', datasetName);
        
        const createDatasetResponse = await fetch('http://localhost:5001/console/api/datasets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            name: datasetName,
            indexing_technique: "high_quality",
            embedding_model: "embeddings",
            embedding_model_provider: "axdlee/sophnet/sophnet"
          })
        });

        if (!createDatasetResponse.ok) {
          const errorText = await createDatasetResponse.text();
          throw new Error(`创建知识库失败: ${errorText}`);
        }

        const datasetData = await createDatasetResponse.json();
        datasetId = datasetData.id;
        console.log('知识库创建成功，ID:', datasetId);

        // 3.3 上传文件获取文件ID
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
        
        // 3.4 使用文件ID创建知识库文档
        console.log('使用文件ID创建知识库文档...');
        
        // 根据文件类型确定文档格式
        let docForm = "text_model";
        const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
          docForm = "image_model";
        }
        
        // 使用文件ID创建知识库文档
        // 步骤1：创建知识库文档（不包含检索配置）
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
                separator: "\\n\\n\\n",
                max_tokens: 1000,
                chunk_overlap: 100
              }
            }
          },
          doc_form: docForm,
          doc_language: "zh",
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

        if (!createDocumentResponse.ok) {
          const errorText = await createDocumentResponse.text();
          throw new Error(`上传文档失败: ${errorText}`);
        }

        const documentData = await createDocumentResponse.json();
        documentId = documentData.documents?.[0]?.id;
        
        if (!documentId) {
          throw new Error('获取文档ID失败');
        }

        console.log('文档创建成功，文档ID:', documentId);

        // 3.5 更新知识库检索设置
        console.log('更新知识库检索设置...');
        const retrievalConfig = {
          retrieval_model: {
            search_method: "hybrid_search",
            reranking_enable: true,
            reranking_mode: "weighted_score",
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
                vector_weight: 0.7,
                embedding_model_name: "embeddings",
                embedding_provider_name: "axdlee/sophnet/sophnet"
              }
            },
            top_k: 5,
            score_threshold_enabled: false,
            score_threshold: 0.0
          }
        };
        
        const updateRetrievalResponse = await fetch(`http://localhost:5001/console/api/datasets/${datasetId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(retrievalConfig)
        });
        
        if (!updateRetrievalResponse.ok) {
          const errorText = await updateRetrievalResponse.text();
          console.warn('更新检索设置失败:', errorText);
          // 不抛出错误，继续执行，因为文档已经创建成功
        } else {
          console.log('知识库检索设置更新成功');
        }

        // 3.6 保存知识库信息到数据库
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

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`保存知识库信息失败: ${errorText}`);
        }

        // 3.7 更新本地状态
        setMaterials(prevMaterials => 
          prevMaterials.map(m => 
            m.id === material.id 
              ? { ...m, datasetId: datasetId, documentId: documentId } 
              : m
          )
        );

        console.log('知识库创建成功！');
      }

      console.log('获取到知识库信息:', datasetId);
      console.log('使用教师创建的助手应用ID:', currentCourse.agentAppId);

      // 4. 使用后端API关联知识库到课程的Agent应用
      console.log('使用后端API关联知识库到课程的Agent应用...');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到用户认证令牌');
      }

      const associateResponse = await fetch(`http://localhost:3001/api/courses/${currentCourse.id}/agent-app/datasets/${datasetId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!associateResponse.ok) {
        const errorData = await associateResponse.json();
        throw new Error(errorData.message || '关联知识库失败');
      }

      const associateData = await associateResponse.json();
      console.log('知识库关联成功:', associateData);

      alert(`已成功将《${material.title}》的知识库创建并关联到《${currentCourse.name}》的课程答疑助手！`);

      // 5. 更新关联状态
      setAssociationStatus(prevStatus => ({
        ...prevStatus,
        [material.id]: true
      }));

    } catch (error) {
      console.error('创建知识库并关联到课程答疑助手失败:', error);
      setError(`创建知识库并关联到课程答疑助手失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setKnowledgeBaseLoading(prev => ({ ...prev, [material.id]: false }));
    }
  };

  // 取消关联到课程答疑助手
  const handleDisassociateFromAssistant = async (material: Material) => {
    try {
      setKnowledgeBaseLoading(prev => ({ ...prev, [material.id]: true }));
      setError(null);

      // 1. 检查课程是否有答疑助手
      if (!currentCourse?.agentAppId) {
        alert('该课程尚未创建课程答疑助手');
        return;
      }

      // 2. 确认取消关联
      if (!confirm(`确定要取消《${material.title}》与《${currentCourse.name}》课程答疑助手的关联吗？`)) {
        return;
      }

      // 3. 获取资料详细信息
      console.log('从数据库获取资料知识库信息...');
      const materialResponse = await materialAPI.getMaterial(material.id);
      const materialInfo = materialResponse.data || materialResponse;

      if (!materialInfo.datasetId || !materialInfo.documentId) {
        alert('该资料尚未创建知识库');
        return;
      }

      // 4. 使用后端API取消关联知识库
      console.log('使用后端API取消关联知识库...');
      const response = await fetch(`http://localhost:3001/api/courses/${currentCourse.id}/agent-app/datasets/${materialInfo.datasetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`取消关联失败: ${errorText}`);
      }

      const result = await response.json();
      console.log('知识库取消关联成功:', result);

      alert(`已成功取消《${material.title}》与《${currentCourse.name}》课程答疑助手的关联！`);

      // 5. 更新关联状态
      setAssociationStatus(prevStatus => ({
        ...prevStatus,
        [material.id]: false
      }));

    } catch (error) {
      console.error('取消关联失败:', error);
      setError(`取消关联失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setKnowledgeBaseLoading(prev => ({ ...prev, [material.id]: false }));
    }
  };

  // 构建完整的文件URL用于预览
  const getFullFileUrl = (fileUrl: string): string => {
    if (!fileUrl) return '';
    return fileUrl.startsWith('http') ? fileUrl : `http://localhost:3001${fileUrl}`;
  };

  const handlePreview = (fileUrl: string) => {
    const fullUrl = getFullFileUrl(fileUrl);
    window.open(fullUrl, '_blank');
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const fullUrl = getFullFileUrl(fileUrl);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === '' || material.type === selectedType;
    return matchesSearch && matchesType;
  });

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'> = {
      'VIDEO': 'primary',
      'PDF': 'error',
      'DOC': 'info',
      'IMAGE': 'success',
      'AUDIO': 'warning',
      'ZIP': 'secondary',
      'OTHER': 'default'
    };
    return colorMap[type] || 'default';
  };

  const getTypeText = (type: string) => {
    const textMap: Record<string, string> = {
      'VIDEO': '视频',
      'PDF': 'PDF文档',
      'DOC': '文档',
      'IMAGE': '图片',
      'AUDIO': '音频',
      'ZIP': '压缩包',
      'OTHER': '其他'
    };
    return textMap[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': '草稿',
      'published': '已发布',
      'archived': '已归档'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      'draft': 'warning',
      'published': 'success',
      'archived': 'default'
    };
    return colorMap[status] || 'default';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 检查资料是否关联到课程答疑助手
  const isAssociatedToAssistant = async (material: Material) => {
    if (!currentCourse?.agentAppId) {
      return false;
    }

    if (associationStatus[material.id] !== undefined) {
      return associationStatus[material.id];
    }

    try {
      // 1. 获取资料详细信息
      const materialResponse = await materialAPI.getMaterial(material.id);
      const materialInfo = materialResponse.data || materialResponse;

      if (!materialInfo.datasetId || !materialInfo.documentId) {
        setAssociationStatus(prev => ({ ...prev, [material.id]: false }));
        return false;
      }

      // 2. 使用后端API获取课程关联的知识库列表
      const response = await fetch(`http://localhost:3001/api/courses/${currentCourse.id}/agent-app/datasets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        setAssociationStatus(prev => ({ ...prev, [material.id]: false }));
        return false;
      }

      const result = await response.json();
      
      // 3. 检查资料的知识库是否在关联列表中
      const isAssociated = result.datasets?.some((dataset: any) => dataset.id === materialInfo.datasetId);
      
      setAssociationStatus(prev => ({ ...prev, [material.id]: isAssociated }));
      return isAssociated;

    } catch (error) {
      console.error('检查关联状态失败:', error);
      setAssociationStatus(prev => ({ ...prev, [material.id]: false }));
      return false;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            返回
          </Button>
          <Typography variant="h4" component="h1">
            资料管理
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => { fetchMaterials(); fetchChapters(); }}>
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题 */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
              <FolderOpen />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                资料管理
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {currentCourse?.name || '未知课程'}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`${filteredMaterials.length} 个资料`} 
            color="primary" 
            variant="outlined"
            size="small"
          />
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
                sx={{ borderRadius: 1, boxShadow: 'none' }}
              >
                上传资料
              </Button>
            </Grid>
            
            {/* 搜索和筛选 */}
            <Grid item xs={12} sm={6} md={4} sx={{ ml: 'auto' }}>
              <TextField
                placeholder="搜索资料"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>类型</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="类型"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    },
                    minWidth: 120,
                  }}
                >
                  <MenuItem value="">全部类型</MenuItem>
                  <MenuItem value="VIDEO">视频</MenuItem>
                  <MenuItem value="PDF">PDF文档</MenuItem>
                  <MenuItem value="DOC">文档</MenuItem>
                  <MenuItem value="IMAGE">图片</MenuItem>
                  <MenuItem value="AUDIO">音频</MenuItem>
                  <MenuItem value="ZIP">压缩包</MenuItem>
                  <MenuItem value="OTHER">其他</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 资料列表 */}
      <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>资料信息</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>类型</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>状态</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>大小</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>上传时间</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>下载次数</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMaterials.map((material) => (
                <React.Fragment key={material.id}>
                  <TableRow 
                    hover
                    sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                          {material.type === 'VIDEO' && <VideoLibrary color="primary" />}
                          {material.type === 'PDF' && <PictureAsPdf color="error" />}
                          {material.type === 'DOC' && <Description color="primary" />}
                          {material.type === 'IMAGE' && <Image color="success" />}
                          {material.type === 'AUDIO' && <MusicNote color="info" />}
                          {material.type === 'ZIP' && <Folder color="warning" />}
                          {material.type === 'OTHER' && <Folder color="action" />}
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {material.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {material.description}
                          </Typography>
                          {material.chapter && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Folder sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="textSecondary">
                                章节: {material.chapter.title}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          fontWeight: 'bold',
                          color: theme.palette.primary.main,
                          borderColor: theme.palette.primary.main,
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                          } 
                        }}
                      >
                        {getTypeText(material.type)}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          fontWeight: 'bold',
                          color: theme.palette.primary.main,
                          borderColor: theme.palette.primary.main,
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                          } 
                        }}
                      >
                        {getStatusLabel(material.status)}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatFileSize(material.fileSize)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(material.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {material.downloads}
                      </Typography>
                    </TableCell>
                    <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 0.5 }}>
                      <Button 
                        size="small" 
                        onClick={() => handlePreview(material.fileUrl)}
                        variant="outlined"
                        startIcon={<Visibility />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)' 
                          } 
                        }}
                      >
                        预览
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => handleDownload(material.fileUrl, material.title)}
                        variant="outlined"
                        startIcon={<Download />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)' 
                          } 
                        }}
                      >
                        下载
                      </Button>
                      {material.status === 'draft' ? (
                        <Button 
                          size="small" 
                          onClick={() => handlePublish(material.id)}
                          variant="outlined"
                          startIcon={<Publish />}
                          sx={{ 
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            '&:hover': { 
                              bgcolor: 'rgba(0, 0, 0, 0.04)' 
                            } 
                          }}
                        >
                          发布
                        </Button>
                      ) : (
                        <Button 
                          size="small" 
                          onClick={() => handleUnpublish(material.id)}
                          variant="outlined"
                          startIcon={<Cancel />}
                          sx={{ 
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            '&:hover': { 
                              bgcolor: 'rgba(0, 0, 0, 0.04)' 
                            } 
                          }}
                        >
                          取消发布
                        </Button>
                      )}
                      {/* 知识库相关按钮 */}
                      {material.datasetId ? (
                        <>
                          {!associationStatus[material.id] ? (
                            <Button 
                              size="small" 
                              onClick={() => handleAssociateToAssistant(material)}
                              variant="outlined"
                              startIcon={<SmartToy />}
                              disabled={knowledgeBaseLoading[material.id] || !currentCourse?.agentAppId}
                              sx={{ 
                                minWidth: 'auto',
                                px: 1,
                                py: 0.5,
                                '&:hover': { 
                                  bgcolor: 'rgba(0, 0, 0, 0.04)' 
                                } 
                              }}
                            >
                              {knowledgeBaseLoading[material.id] ? '关联中...' : '关联AI助手'}
                            </Button>
                          ) : (
                            <Button 
                              size="small" 
                              onClick={() => handleDisassociateFromAssistant(material)}
                              variant="outlined"
                              disabled={knowledgeBaseLoading[material.id]}
                              sx={{ 
                                minWidth: 'auto',
                                px: 1,
                                py: 0.5,
                                '&:hover': { 
                                  bgcolor: 'rgba(0, 0, 0, 0.04)' 
                                } 
                              }}
                            >
                              {knowledgeBaseLoading[material.id] ? '取消中...' : '取消关联'}
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button 
                          size="small" 
                          onClick={() => handleAssociateToAssistant(material)}
                          variant="outlined"
                          startIcon={<SmartToy />}
                          disabled={knowledgeBaseLoading[material.id] || !currentCourse?.agentAppId}
                          sx={{ 
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            '&:hover': { 
                              bgcolor: 'rgba(0, 0, 0, 0.04)' 
                            } 
                          }}
                        >
                          {knowledgeBaseLoading[material.id] ? '创建中...' : '创建知识库并关联AI助手'}
                        </Button>
                      )}
                      <Button 
                        size="small" 
                        onClick={() => handleEdit(material)}
                        variant="outlined"
                        startIcon={<Edit />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)' 
                          } 
                        }}
                      >
                        编辑
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => handleDelete(material.id)}
                        variant="outlined"
                        startIcon={<Delete />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          '&:hover': { 
                            bgcolor: 'rgba(0, 0, 0, 0.04)' 
                          } 
                        }}
                      >
                        删除
                      </Button>
                    </Box>
                  </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* 上传/编辑对话框 */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
            {editingMaterial ? <Edit /> : <Upload />}
          </Avatar>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {editingMaterial ? '编辑资料' : '上传资料'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <input
            ref={fileInputRef}
            type="file"
            id={fileInputId}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={!!editingMaterial} // 编辑时禁用文件选择
          />
          
          {!editingMaterial && (
            <Box 
              sx={{ 
                mb: 3, 
                p: 2, 
                border: `2px dashed ${theme.palette.primary.main}`,
                borderRadius: 1,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              <Button
                variant="text"
                component="label"
                htmlFor={fileInputId}
                startIcon={<Upload />}
                disabled={uploading}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 'bold',
                  color: theme.palette.primary.main
                }}
              >
                {uploading ? '上传中...' : (formData.file ? formData.file.name : '选择文件')}
              </Button>
              {uploading && (
                <CircularProgress size={20} sx={{ ml: 2 }} />
              )}
            </Box>
          )}
          
          <TextField
            fullWidth
            label="资料标题"
            variant="outlined"
            value={formData.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { borderRadius: 1 }
            }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="资料描述"
            variant="outlined"
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { borderRadius: 1 }
            }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>资料类型</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => handleFormChange('type', e.target.value)}
              label="资料类型"
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="VIDEO">视频</MenuItem>
              <MenuItem value="PDF">PDF文档</MenuItem>
              <MenuItem value="DOC">文档</MenuItem>
              <MenuItem value="IMAGE">图片</MenuItem>
              <MenuItem value="AUDIO">音频</MenuItem>
              <MenuItem value="ZIP">压缩包</MenuItem>
              <MenuItem value="OTHER">其他</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>关联章节</InputLabel>
            <Select
              value={formData.chapterId || ''}
              onChange={(e) => handleFormChange('chapterId', e.target.value)}
              label="关联章节"
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="">无关联章节</MenuItem>
              {chapters.map(chapter => (
                <MenuItem key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            color="primary"
            disabled={submitting || (!editingMaterial && !formData.file)}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 'bold',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              }
            }}
          >
            {submitting ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialManagement;