import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  AccountTree,
  School,
  TrendingUp,
  Description,
  Assignment,
  Lightbulb,
  Timeline,
  Psychology,
  Speed,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  FilterList,
  NetworkCheck,

} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { courseAPI, chapterAPI, knowledgePointAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// 接口定义
interface Course {
  id: string;
  name: string;
  title?: string;
  description: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    name?: string;
  };
  instructor?: string;
  enrollment?: {
    progress: number;
    completedChapters: number;
  };
  progress?: number;
  totalChapters: number;
  completedChapters: number;
  category: string;
  level: string;
  coverImage?: string;
  thumbnail?: string;
  _count?: {
    chapters: number;
  };
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'draft' | 'published' | 'archived';
  knowledgePointsCount: number;
  courseId: string;
  courseName: string;
  course?: {
    id: string;
    name: string;
  };
  _count?: {
    knowledgePoints: number;
  };
}

interface KnowledgePoint {
  id: string;
  title: string;
  description: string;
  content?: string;
  chapterId: string;
  chapterName?: string;
  chapter?: {
    id: string;
    title: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  importance: 'low' | 'medium' | 'high';
  status: 'draft' | 'published' | 'archived';
  estimatedTime: number;
  studentProgress?: {
    progress: number;
    completed: boolean;
  };
  progress?: number;
  isCompleted?: boolean;
  _count?: {
    materials?: number;
    courseware?: number;
    assignments?: number;
    questions?: number;
  };
  materialsCount?: number;
  coursewareCount?: number;
  assignmentsCount?: number;
  questionsCount?: number;
}

interface CourseGraphProps {
  courseId?: string;
  hideTitle?: boolean; // 新增：是否隐藏标题
  hideLegend?: boolean; // 新增：是否隐藏图例
}

const CourseGraph: React.FC<CourseGraphProps> = ({ courseId: propCourseId, hideTitle = false, hideLegend = false }) => {
  const navigate = useNavigate();
  const { courseId: routeCourseId } = useParams<{ courseId?: string }>();
  const { user } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [groupedKnowledgePoints, setGroupedKnowledgePoints] = useState<Record<string, KnowledgePoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // 网状图谱状态
  const [zoomLevel, setZoomLevel] = useState(1);
  const [centerPosition, setCenterPosition] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string[]>(['easy', 'medium', 'hard']);
  const [filterImportance, setFilterImportance] = useState<string[]>(['low', 'medium', 'high']);
  const [showConnections, setShowConnections] = useState(true);
  const [graphData, setGraphData] = useState<any>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  // 渲染网状图谱
  const renderGraph = useCallback(() => {
    if (!graphData || !svgRef.current) return;
    
    const svg = svgRef.current;
    const container = graphContainerRef.current;
    if (!container) return;
    
    const width = container.clientWidth;
    const height = Math.max(600, container.clientHeight);
    
    // 清空SVG
    svg.innerHTML = '';
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    
    // 应用缩放和平移
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${width/2 + centerPosition.x}, ${height/2 + centerPosition.y}) scale(${zoomLevel})`);
    svg.appendChild(g);
    
    // 更新连接线的辅助函数
    const updateConnectedLinks = (nodeId: string, newX: number, newY: number) => {
      const links = g.querySelectorAll('.graph-link');
      links.forEach((link: any) => {
        const x1 = parseFloat(link.getAttribute('x1'));
        const y1 = parseFloat(link.getAttribute('y1'));
        const x2 = parseFloat(link.getAttribute('x2'));
        const y2 = parseFloat(link.getAttribute('y2'));
        
        // 检查这条线是否与当前节点相连
        const filteredNodes = graphData.nodes.filter((node: any) => {
          if (node.type === 'knowledge') {
            return filterDifficulty.includes(node.difficulty) && filterImportance.includes(node.importance);
          }
          return true;
        });
        
        const filteredLinks = showConnections ? graphData.links.filter((link: any) => {
          const sourceExists = filteredNodes.some((n: any) => n.id === link.source);
          const targetExists = filteredNodes.some((n: any) => n.id === link.target);
          return sourceExists && targetExists;
        }) : [];
        
        // 找到对应的连接线数据
        const linkData = filteredLinks.find((l: any) => {
          const sourceNode = filteredNodes.find((n: any) => n.id === l.source);
          const targetNode = filteredNodes.find((n: any) => n.id === l.target);
          if (!sourceNode || !targetNode) return false;
          
          return (Math.abs(x1 - sourceNode.x) < 1 && Math.abs(y1 - sourceNode.y) < 1 && 
                  Math.abs(x2 - targetNode.x) < 1 && Math.abs(y2 - targetNode.y) < 1) ||
                 (Math.abs(x1 - targetNode.x) < 1 && Math.abs(y1 - targetNode.y) < 1 && 
                  Math.abs(x2 - sourceNode.x) < 1 && Math.abs(y2 - sourceNode.y) < 1);
        });
        
        if (linkData) {
          const sourceNode = filteredNodes.find((n: any) => n.id === linkData.source);
          const targetNode = filteredNodes.find((n: any) => n.id === linkData.target);
          
          if (sourceNode && targetNode) {
            if (sourceNode.id === nodeId) {
              link.setAttribute('x1', newX);
              link.setAttribute('y1', newY);
            } else if (targetNode.id === nodeId) {
              link.setAttribute('x2', newX);
              link.setAttribute('y2', newY);
            }
          }
        }
      });
    };
    
    // 过滤节点
    const filteredNodes = graphData.nodes.filter((node: any) => {
      if (node.type === 'knowledge') {
        return filterDifficulty.includes(node.difficulty) && filterImportance.includes(node.importance);
      }
      return true;
    });
    
    // 过滤连接
    const filteredLinks = showConnections ? graphData.links.filter((link: any) => {
      const sourceExists = filteredNodes.some((n: any) => n.id === link.source);
      const targetExists = filteredNodes.some((n: any) => n.id === link.target);
      return sourceExists && targetExists;
    }) : [];
    
    // 绘制连接线
    filteredLinks.forEach((link: any) => {
      const sourceNode = filteredNodes.find((n: any) => n.id === link.source);
      const targetNode = filteredNodes.find((n: any) => n.id === link.target);
      if (sourceNode && targetNode) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourceNode.x);
        line.setAttribute('y1', sourceNode.y);
        line.setAttribute('x2', targetNode.x);
        line.setAttribute('y2', targetNode.y);
        line.setAttribute('stroke', link.type === 'course-chapter' ? '#1976d2' : 
                                     link.type === 'chapter-knowledge' ? '#388e3c' : '#9e9e9e');
        line.setAttribute('stroke-width', (link.strength * 2).toString());
        line.setAttribute('stroke-opacity', '0.6');
        line.setAttribute('class', 'graph-link');
        g.appendChild(line);
      }
    });
    
    // 绘制节点
    filteredNodes.forEach((node: any) => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'graph-node');
      group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      group.style.cursor = 'move'; // 改为移动光标表示可拖拽
      
      // 节点圆圈
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', node.size.toString());
      circle.setAttribute('fill', selectedNode === node.id ? '#ff9800' : node.color);
      circle.setAttribute('stroke', selectedNode === node.id ? '#ff5722' : '#fff');
      circle.setAttribute('stroke-width', selectedNode === node.id ? '3' : '2');
      circle.setAttribute('opacity', selectedNode && selectedNode !== node.id ? '0.7' : '1');
      
      // 添加拖拽功能
      let isDragging = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let nodeStartX = node.x;
      let nodeStartY = node.y;
      
      const handleNodeMouseDown = (e: MouseEvent) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        nodeStartX = node.x;
        nodeStartY = node.y;
        
        // 阻止事件冒泡，避免触发图谱平移
        e.stopPropagation();
        
        // 添加拖拽样式
        group.style.cursor = 'grabbing';
        circle.setAttribute('stroke-width', '4');
      };
      
      const handleNodeMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        
        const deltaX = (e.clientX - dragStartX) / zoomLevel; // 考虑缩放级别
        const deltaY = (e.clientY - dragStartY) / zoomLevel;
        
        const newX = nodeStartX + deltaX;
        const newY = nodeStartY + deltaY;
        
        // 更新节点位置
        group.setAttribute('transform', `translate(${newX}, ${newY})`);
        
        // 更新连接线
        updateConnectedLinks(node.id, newX, newY);
        
        // 更新节点数据
        node.x = newX;
        node.y = newY;
      };
      
      const handleNodeMouseUp = () => {
        if (!isDragging) return;
        
        isDragging = false;
        group.style.cursor = 'move';
        circle.setAttribute('stroke-width', selectedNode === node.id ? '3' : '2');
        
        // 更新graphData状态
        setGraphData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            nodes: prev.nodes.map((n: any) => 
              n.id === node.id ? { ...n, x: node.x, y: node.y } : n
            )
          };
        });
      };
      
      // 添加拖拽事件监听
      group.addEventListener('mousedown', handleNodeMouseDown);
      document.addEventListener('mousemove', handleNodeMouseMove);
      document.addEventListener('mouseup', handleNodeMouseUp);
      
      // 添加悬停效果
      circle.addEventListener('mouseenter', () => {
        if (!isDragging) {
          circle.setAttribute('r', (node.size * 1.1).toString());
          circle.setAttribute('stroke-width', '3');
        }
      });
      
      circle.addEventListener('mouseleave', () => {
        if (!isDragging) {
          circle.setAttribute('r', node.size.toString());
          circle.setAttribute('stroke-width', selectedNode === node.id ? '3' : '2');
        }
      });
      
      // 点击事件（与拖拽区分）
      circle.addEventListener('click', (e: MouseEvent) => {
        // 如果是拖拽状态，不触发点击事件
        if (Math.abs(node.x - nodeStartX) > 5 || Math.abs(node.y - nodeStartY) > 5) {
          return;
        }
        setSelectedNode(selectedNode === node.id ? null : node.id);
      });
      
      group.appendChild(circle);
      
      // 节点名称（放在节点中心，替代图标）
      const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameText.setAttribute('text-anchor', 'middle');
      nameText.setAttribute('dy', '0.35em');
      nameText.setAttribute('font-size', Math.min(node.size * 0.3, 14).toString()); // 根据节点大小调整字体大小
      nameText.setAttribute('fill', '#fff'); // 白色文字，与节点颜色形成对比
      nameText.setAttribute('font-weight', 'bold');
      nameText.setAttribute('pointer-events', 'none'); // 文字不拦截鼠标事件
      
      // 处理节点名称，根据长度进行截断或换行
      const maxCharsPerLine = Math.floor(node.size / 8); // 根据节点大小计算每行最大字符数
      const maxLines = 2; // 最多显示两行
      
      if (node.label.length <= maxCharsPerLine) {
        // 短名称直接显示
        nameText.textContent = node.label;
      } else if (node.label.length <= maxCharsPerLine * 2) {
        // 中等长度名称分两行显示
        const tspan1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan1.setAttribute('x', '0');
        tspan1.setAttribute('dy', '-0.6em');
        tspan1.textContent = node.label.substring(0, maxCharsPerLine);
        
        const tspan2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan2.setAttribute('x', '0');
        tspan2.setAttribute('dy', '1.2em');
        tspan2.textContent = node.label.substring(maxCharsPerLine);
        
        nameText.appendChild(tspan1);
        nameText.appendChild(tspan2);
      } else {
        // 长名称截断显示
        const displayText = node.label.substring(0, maxCharsPerLine * 2 - 1) + '...';
        const tspan1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan1.setAttribute('x', '0');
        tspan1.setAttribute('dy', '-0.6em');
        tspan1.textContent = node.label.substring(0, maxCharsPerLine);
        
        const tspan2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan2.setAttribute('x', '0');
        tspan2.setAttribute('dy', '1.2em');
        tspan2.textContent = displayText.substring(maxCharsPerLine);
        
        nameText.appendChild(tspan1);
        nameText.appendChild(tspan2);
      }
      
      group.appendChild(nameText);
      
      // 节点类型标签（放在节点下方）
      const typeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      typeLabel.setAttribute('text-anchor', 'middle');
      typeLabel.setAttribute('dy', (node.size + 15).toString());
      typeLabel.setAttribute('font-size', '10');
      typeLabel.setAttribute('fill', '#666');
      typeLabel.setAttribute('font-weight', 'normal');
      typeLabel.setAttribute('pointer-events', 'none');
      
      // 根据节点类型显示不同的标签
      let typeText = '';
      if (node.type === 'course') {
        typeText = '课程';
      } else if (node.type === 'chapter') {
        typeText = '章节';
      } else if (node.type === 'knowledge') {
        typeText = `知识点 (${node.difficulty})`;
      }
      
      typeLabel.textContent = typeText;
      group.appendChild(typeLabel);
      
      g.appendChild(group);
    });
    
  }, [graphData, zoomLevel, centerPosition, selectedNode, filterDifficulty, filterImportance, showConnections]);

  // 确定使用的课程ID
  const effectiveCourseId = propCourseId || routeCourseId || '';

  // 获取学生课程列表
  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (effectiveCourseId) {
      setSelectedCourse(effectiveCourseId);
      fetchCourseStructure(effectiveCourseId);
    }
  }, [effectiveCourseId]);

  useEffect(() => {
    if (selectedCourse && !effectiveCourseId) {
      fetchCourseStructure(selectedCourse);
    }
  }, [selectedCourse]);

  // 渲染图谱
  useEffect(() => {
    if (graphData && svgRef.current) {
      renderGraph();
    }
  }, [graphData, renderGraph]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('正在从数据库获取学生课程...');
      
      const response = await courseAPI.getStudentCourses();
      
      // 处理真实API响应格式 - 根据后端实际返回格式
      let coursesData = [];
      
      if (response.data && Array.isArray(response.data)) {
        // 后端返回格式: { success: true, data: [...] }
        coursesData = response.data;
      } else if (response && Array.isArray(response)) {
        // 直接返回数组
        coursesData = response;
      } else if (response && typeof response === 'object' && response.success && response.data) {
        // 标准响应格式
        coursesData = response.data;
      } else {
        console.warn('未识别的响应格式:', response);
        coursesData = [];
      }

      console.log('获取到的课程数据:', coursesData);

      const convertedCourses = Array.isArray(coursesData) 
        ? coursesData.map(course => {
            // 根据真实数据库结构映射字段
            const courseName = course.name || course.title || '未命名课程';
            const instructor = course.teacher 
              ? `${course.teacher.firstName || ''}${course.teacher.lastName || ''}`
              : course.instructor || '未知教师';
            
            return {
              id: course.id,
              title: courseName,
              name: courseName, // 兼容后端字段
              description: course.description || '暂无描述',
              instructor: instructor,
              progress: course.progress || 0, // 直接从enrollment获取
              totalChapters: course.chapters?.length || course._count?.chapters || 0,
              completedChapters: Math.round((course.progress || 0) / 100 * (course.chapters?.length || 0)),
              category: course.department || course.category || '未分类',
              level: course.difficulty || course.level || '未知',
              thumbnail: course.coverImage || course.thumbnail || '/api/placeholder/400/200',
              credits: course.credits || 0,
              status: course.status || 'ACTIVE',
              teacher: course.teacher,
              chapters: course.chapters || [],
              _count: course._count || {}
            };
          })
        : [];
      
      console.log('转换后的课程列表:', convertedCourses);
      setCourses(convertedCourses);
      
      if (!selectedCourse && convertedCourses.length > 0) {
        setSelectedCourse(convertedCourses[0].id);
      }
      
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('获取课程失败:', error);
      setError('获取课程失败，请稍后重试');
      setLoading(false);
    }
  };

  const fetchCourseStructure = async (courseId: string) => {
    try {
      setLoading(true);
      console.log('开始获取课程结构，课程ID:', courseId);
      
      const [chaptersResponse, knowledgePointsResponse] = await Promise.all([
        chapterAPI.getChapters(courseId),
        knowledgePointAPI.getKnowledgePoints({ courseId })
      ]);

      console.log('章节API响应:', chaptersResponse);
      console.log('知识点API响应:', knowledgePointsResponse);

      // 处理真实API响应格式
      let chaptersData = chaptersResponse.data || chaptersResponse;
      let knowledgePointsData = knowledgePointsResponse.data || knowledgePointsResponse;

      // 处理章节数据 - 可能是包装对象
      if (chaptersData.success && chaptersData.data) {
        chaptersData = chaptersData.data;
      }
      
      // 处理知识点数据 - 可能是包装对象
      if (knowledgePointsData.success && knowledgePointsData.data) {
        knowledgePointsData = knowledgePointsData.data.knowledgePoints || knowledgePointsData.data;
      }
      
      console.log('最终处理后的知识点数据:', knowledgePointsData);
      console.log('知识点数据是否为数组:', Array.isArray(knowledgePointsData));
      if (knowledgePointsData && typeof knowledgePointsData === 'object') {
        console.log('知识点数据对象键:', Object.keys(knowledgePointsData));
        if (knowledgePointsData.knowledgePoints) {
          console.log('knowledgePoints字段:', knowledgePointsData.knowledgePoints);
          console.log('knowledgePoints是否为数组:', Array.isArray(knowledgePointsData.knowledgePoints));
        }
      }

      console.log('处理后的章节数据:', chaptersData);
      console.log('处理后的知识点数据:', knowledgePointsData);

          console.log('转换前的章节数据:', chaptersData);
      console.log('转换前的知识点数据:', knowledgePointsData);

      // 转换数据结构 - 根据真实API响应
      const convertedChapters = Array.isArray(chaptersData) ? chaptersData.map(chapter => ({
        id: chapter.id,
        title: chapter.title || '未命名章节',
        description: chapter.description || chapter.content || '暂无描述',
        order: chapter.order || 0,
        status: chapter.status || 'published',
        knowledgePointsCount: chapter.knowledgePointsCount || chapter._count?.knowledgePoints || 0,
        courseId: chapter.courseId || courseId,
        courseName: chapter.course?.name || '未知课程',
        _count: chapter._count || {}
      })) : [];

      // 按order排序
      convertedChapters.sort((a, b) => a.order - b.order);
      console.log('转换后的章节数据:', convertedChapters);
      setChapters(convertedChapters);
      
      // 提取知识点数组 - 处理不同的响应格式
      let knowledgePointsArray = [];
      if (Array.isArray(knowledgePointsData)) {
        knowledgePointsArray = knowledgePointsData;
      } else if (knowledgePointsData && typeof knowledgePointsData === 'object') {
        // 处理 {knowledgePoints: [...], pagination: {...}} 格式
        knowledgePointsArray = knowledgePointsData.knowledgePoints || knowledgePointsData.data || [];
      }
      
      console.log('提取的知识点数组:', knowledgePointsArray);
      
      const convertedKnowledgePoints = Array.isArray(knowledgePointsArray) ? knowledgePointsArray.map(kp => ({
        id: kp.id,
        title: kp.title || '未命名知识点',
        description: kp.description || '暂无描述',
        content: kp.content || '',
        chapterId: kp.chapterId || '',
        chapterName: kp.chapter?.title || '未知章节',
        chapter: kp.chapter,
        difficulty: kp.difficulty || 'medium',
        importance: kp.importance || 'medium',
        status: kp.status || 'published',
        estimatedTime: kp.estimatedTime || 30,
        progress: kp.studentProgress?.progress || 0,
        isCompleted: kp.studentProgress?.completed || false,
        materialsCount: kp.materialsCount || kp._count?.materials || 0,
        coursewareCount: kp.coursewareCount || kp._count?.courseware || 0,
        assignmentsCount: kp.assignmentsCount || kp._count?.assignments || kp._count?.Assignment || 0,
        questionsCount: kp.questionsCount || kp._count?.questions || kp._count?.Question || 0,
        _count: kp._count || {}
      })) : [];

      setKnowledgePoints(convertedKnowledgePoints);
      
      // 按章节分组知识点
      const grouped = convertedKnowledgePoints.reduce((acc, kp) => {
        const chapterId = kp.chapterId;
        if (!acc[chapterId]) {
          acc[chapterId] = [];
        }
        acc[chapterId].push(kp);
        return acc;
      }, {} as Record<string, KnowledgePoint[]>);
      
      setGroupedKnowledgePoints(grouped);
      
      // 计算当前学习进度
      const currentChapterIndex = convertedChapters.findIndex(
        chapter => grouped[chapter.id]?.some(kp => kp.progress > 0 && kp.progress < 100)
      );
      setActiveStep(currentChapterIndex >= 0 ? currentChapterIndex : 0);
      
      setError(null);
      setLoading(false);
      
      // 生成网状图谱数据
      generateGraphData(convertedChapters, convertedKnowledgePoints);
      
    } catch (error) {
      console.error('获取课程结构失败:', error);
      setError('获取课程结构失败，请稍后重试');
      setLoading(false);
    }
  };

  // 生成网状图谱数据
  const generateGraphData = (chapters: Chapter[], knowledgePoints: KnowledgePoint[]) => {
    console.log('开始生成图谱数据，章节数量:', chapters.length, '知识点数量:', knowledgePoints.length);
    const nodes: any[] = [];
    const links: any[] = [];
    
    // 添加课程中心节点
    // 当作为标签页使用时，使用propCourseId，否则使用selectedCourse
    const effectiveCourseId = propCourseId || selectedCourse;
    console.log('有效课程ID:', effectiveCourseId);
    const course = courses.find(c => c.id === effectiveCourseId);
    console.log('找到的课程:', course);
    
    if (course) {
      nodes.push({
        id: course.id,
        type: 'course',
        label: course.name || course.title || '课程',
        title: course.name || course.title || '课程',
        description: course.description || '',
        x: 0,
        y: 0,
        size: 60,
        color: '#1976d2',
        icon: '📚',
        level: 0,
        progress: course.progress || 0,
        totalChapters: course.totalChapters,
        completedChapters: course.completedChapters
      });
    } else if (effectiveCourseId) {
      // 如果courses数组中没有找到课程，但effectiveCourseId存在，创建一个基本的课程节点
      // 尝试从章节数据中获取课程名称
      const courseName = chapters.length > 0 ? chapters[0].courseName || '课程' : '课程';
      nodes.push({
        id: effectiveCourseId,
        type: 'course',
        label: courseName,
        title: courseName,
        description: '',
        x: 0,
        y: 0,
        size: 60,
        color: '#1976d2',
        icon: '📚',
        level: 0,
        progress: 0,
        totalChapters: chapters.length,
        completedChapters: 0
      });
    }
    
    // 添加章节节点
    chapters.forEach((chapter, index) => {
      const angle = (index / chapters.length) * 2 * Math.PI;
      const radius = 200;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      nodes.push({
        id: chapter.id,
        type: 'chapter',
        label: chapter.title,
        title: chapter.title,
        description: chapter.description || '',
        x,
        y,
        size: 40,
        color: '#388e3c',
        icon: '📖',
        level: 1,
        order: chapter.order,
        knowledgePointsCount: chapter.knowledgePointsCount || 0
      });
      
      // 连接课程到章节
      if (effectiveCourseId) {
        links.push({
          source: effectiveCourseId,
          target: chapter.id,
          type: 'course-chapter',
          strength: 1
        });
      }
    });
    
    // 添加知识点节点
    knowledgePoints.forEach(kp => {
      const chapter = chapters.find(c => c.id === kp.chapterId);
      if (chapter) {
        // 在章节周围随机分布知识点
        const chapterNode = nodes.find(n => n.id === chapter.id);
        if (chapterNode) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = 100 + Math.random() * 50;
          const x = chapterNode.x + Math.cos(angle) * radius;
          const y = chapterNode.y + Math.sin(angle) * radius;
          
          nodes.push({
            id: kp.id,
            type: 'knowledge',
            label: kp.title,
            title: kp.title,
            description: kp.description || '',
            x,
            y,
            size: 25,
            color: getKnowledgePointColor(kp.difficulty, kp.importance),
            icon: getKnowledgePointIcon(kp.difficulty),
            level: 2,
            chapterId: kp.chapterId,
            difficulty: kp.difficulty,
            importance: kp.importance,
            progress: kp.progress || 0,
            isCompleted: kp.isCompleted || false,
            estimatedTime: kp.estimatedTime,
            assignmentsCount: kp.assignmentsCount || 0,
            questionsCount: kp.questionsCount || 0
          });
          
          // 连接章节到知识点
          links.push({
            source: chapter.id,
            target: kp.id,
            type: 'chapter-knowledge',
            strength: 0.8
          });
        }
      }
    });
    
    // 添加知识点之间的关联（基于章节）
    const chapterKnowledgeMap = new Map<string, string[]>();
    knowledgePoints.forEach(kp => {
      if (!chapterKnowledgeMap.has(kp.chapterId)) {
        chapterKnowledgeMap.set(kp.chapterId, []);
      }
      chapterKnowledgeMap.get(kp.chapterId)?.push(kp.id);
    });
    
    // 同一章节内的知识点之间添加弱连接
    chapterKnowledgeMap.forEach(knowledgeIds => {
      for (let i = 0; i < knowledgeIds.length; i++) {
        for (let j = i + 1; j < knowledgeIds.length; j++) {
          links.push({
            source: knowledgeIds[i],
            target: knowledgeIds[j],
            type: 'knowledge-knowledge',
            strength: 0.3
          });
        }
      }
    });
    
    setGraphData({ nodes, links });
    console.log('图谱数据生成完成，节点数量:', nodes.length, '连接数量:', links.length);
  };

  const getKnowledgePointColor = (difficulty: string, importance: string) => {
    const colorMap = {
      easy: { low: '#4caf50', medium: '#66bb6a', high: '#81c784' },
      medium: { low: '#ff9800', medium: '#ffa726', high: '#ffb74d' },
      hard: { low: '#f44336', medium: '#ef5350', high: '#e57373' }
    };
    return colorMap[difficulty as keyof typeof colorMap]?.[importance as keyof typeof colorMap.easy] || '#9e9e9e';
  };

  const getKnowledgePointIcon = (difficulty: string) => {
    const iconMap = {
      easy: '🟢',
      medium: '🟡',
      hard: '🔴'
    };
    return iconMap[difficulty as keyof typeof iconMap] || '⚪';
  };

  // 缩放和平移控制
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleCenter = () => {
    setCenterPosition({ x: 0, y: 0 });
    setZoomLevel(1);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startCenter = { ...centerPosition };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setCenterPosition({
        x: startCenter.x + deltaX,
        y: startCenter.y + deltaY
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'low': return 'default';
      case 'medium': return 'info';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getImportanceLabel = (importance: string) => {
    switch (importance) {
      case 'low': return '一般';
      case 'medium': return '重要';
      case 'high': return '核心';
      default: return '未知';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'success';
    if (progress >= 50) return 'primary';
    return 'warning';
  };





  const handleStartLearning = (chapterId: string) => {
    navigate(`/student/courses/${selectedCourse}/learning?chapter=${chapterId}`);
  };



  if (loading && courses.length === 0) {
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
        <Button variant="contained" onClick={() => selectedCourse ? fetchCourseStructure(selectedCourse) : fetchCourses()}>
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* 网状图谱控制工具栏 - 只保留图谱控制 */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'nowrap' }}>
        <Tooltip title="放大">
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="缩小">
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Tooltip title="居中">
          <IconButton onClick={handleCenter} size="small">
            <CenterFocusStrong />
          </IconButton>
        </Tooltip>

        <FormControlLabel
          control={
            <Switch
              checked={showConnections}
              onChange={(e) => setShowConnections(e.target.checked)}
              size="small"
            />
          }
          label="显示连接"
        />

        {/* 过滤条件 */}
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>难度</InputLabel>
          <Select
            multiple
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as string[])}
            renderValue={(selected) => selected.join(', ')}
            label="难度"
            size="small"
          >
            <MenuItem value="easy">简单</MenuItem>
            <MenuItem value="medium">中等</MenuItem>
            <MenuItem value="hard">困难</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>重要性</InputLabel>
          <Select
            multiple
            value={filterImportance}
            onChange={(e) => setFilterImportance(e.target.value as string[])}
            renderValue={(selected) => selected.join(', ')}
            label="重要性"
            size="small"
          >
            <MenuItem value="low">低</MenuItem>
            <MenuItem value="medium">中</MenuItem>
            <MenuItem value="high">高</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {!hideTitle && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            课程图谱
          </Typography>
        </Box>
      )}

      {/* 课程选择 - 当作为标签页使用时隐藏 */}
      {!propCourseId && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <School color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">课程选择</Typography>
                </Box>
                <FormControl fullWidth>
                  <InputLabel>选择课程</InputLabel>
                  <Select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    label="选择课程"
                  >
                    {courses.map(course => (
                      <MenuItem key={course.id} value={course.id}>
                        <Box>
                          <Typography variant="body1">{course.title}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {course.instructor} | {course.category}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress />
        </Box>
      ) : selectedCourse ? (
        <Box>
          {/* 课程结构标题已隐藏 */}
          {/* 学习路径步骤条已隐藏 */}

          {/* 网状图谱视图 */}
          <Box sx={{
            border: '1px solid #ddd',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative'
          }}>
              <Box
                ref={graphContainerRef}
                sx={{
                  width: '100%',
                  height: 600,
                  backgroundColor: '#fafafa',
                  cursor: 'grab',
                  '&:active': { cursor: 'grabbing' }
                }}
                onMouseDown={handleDragStart}
              >
                <svg
                  ref={svgRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                  }}
                />
              </Box>

              {/* 图例 */}
              {!hideLegend && (
                <Box sx={{ 
                  position: 'absolute', 
                  top: 16, 
                  right: 16, 
                  backgroundColor: 'white', 
                  p: 2, 
                  borderRadius: 1, 
                  boxShadow: 1,
                  border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="subtitle2" gutterBottom>图例</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#1976d2', mr: 1 }} />
                      <Typography variant="caption">课程</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#388e3c', mr: 1 }} />
                      <Typography variant="caption">章节</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#f57c00', mr: 1 }} />
                      <Typography variant="caption">知识点（简单）</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#d32f2f', mr: 1 }} />
                      <Typography variant="caption">知识点（中等）</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#7b1fa2', mr: 1 }} />
                      <Typography variant="caption">知识点（困难）</Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* 选中节点详情 */}
              {selectedNode && (
                <Box sx={{ p: 2, borderTop: '1px solid #ddd', backgroundColor: '#fff' }}>
                  <Typography variant="h6" gutterBottom>节点详情</Typography>
                  {(() => {
                    const node = graphData?.nodes.find((n: any) => n.id === selectedNode);
                    if (!node) return null;

                    return (
                      <Box>
                        <Typography variant="body2"><strong>类型:</strong> {node.type}</Typography>
                        <Typography variant="body2"><strong>标题:</strong> {node.title}</Typography>
                        <Typography variant="body2"><strong>描述:</strong> {node.description || '暂无描述'}</Typography>
                        {node.type === 'knowledge' && (
                          <>
                            <Typography variant="body2"><strong>难度:</strong> {node.difficulty}</Typography>
                            <Typography variant="body2"><strong>重要性:</strong> {node.importance}</Typography>
                            <Typography variant="body2"><strong>预计时长:</strong> {node.estimatedTime}分钟</Typography>
                            <Typography variant="body2"><strong>进度:</strong> {isNaN(Number(node.progress)) ? '0.0' : Math.max(0, Math.min(100, node.progress || 0)).toFixed(1)}%</Typography>
                          </>
                        )}
                        {node.type === 'chapter' && (
                          <Typography variant="body2"><strong>知识点数量:</strong> {node.knowledgePointsCount}</Typography>
                        )}
                        {node.type === 'course' && (
                          <>
                            <Typography variant="body2"><strong>总章节:</strong> {node.totalChapters}</Typography>
                            <Typography variant="body2"><strong>已完成:</strong> {node.completedChapters}</Typography>
                            <Typography variant="body2"><strong>进度:</strong> {isNaN(Number(node.progress)) ? '0.0' : Math.max(0, Math.min(100, node.progress || 0)).toFixed(1)}%</Typography>
                          </>
                        )}
                      </Box>
                    );
                  })()}
                </Box>
              )}
            </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AccountTree sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            请选择一门课程查看知识图谱
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CourseGraph;