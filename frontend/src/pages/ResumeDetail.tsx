import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Button, Space, Spin, message,
  Select, Input, Divider, Statistic, Row, Col, Modal,
} from 'antd';
import {
  ArrowLeftOutlined, ThunderboltOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { getResume, analyzeResume, updateResumeStatus, deleteResume } from '../api';
import type { ResumeDetail } from '../api';

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待处理' },
  reviewed: { color: 'blue', label: '已查看' },
  shortlisted: { color: 'green', label: '初步通过' },
  rejected: { color: 'red', label: '已淘汰' },
};

export default function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [jobKeywords, setJobKeywords] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  const fetchResume = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getResume(Number(id));
      setResume(data);
      setReviewNote(data.review_note || '');
    } catch {
      message.error('加载简历失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResume(); }, [id]);

  const handleAnalyze = async () => {
    if (!id || !resume) return;
    setAnalyzing(true);
    try {
      const keywords = jobKeywords.split(/[,，\s]+/).filter(Boolean);
      const result = await analyzeResume(Number(id), keywords);
      message.success(`评分完成：${result.score} 分`);
      fetchResume();
    } catch {
      message.error('AI 分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    try {
      await updateResumeStatus(Number(id), status, reviewNote || undefined);
      message.success('状态已更新');
      fetchResume();
    } catch {
      message.error('更新失败');
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这份简历吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteResume(Number(id));
          message.success('删除成功');
          navigate('/resumes');
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!resume) return <div>简历不存在</div>;

  const skillsList: string[] = (() => {
    try { return JSON.parse(resume.skills || '[]'); } catch { return []; }
  })();

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/resumes')}>返回列表</Button>
        <Button type="primary" icon={<ThunderboltOutlined />} loading={analyzing} onClick={handleAnalyze}>
          {resume.score ? '重新 AI 评分' : 'AI 智能评分'}
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
      </Space>

      {/* 评分信息 */}
      {resume.score != null && (
        <Card style={{ marginBottom: 16, background: '#f6ffed' }}>
          <Row gutter={24}>
            <Col span={6}>
              <Statistic title="AI 匹配评分" value={resume.score} suffix="分"
                valueStyle={{ color: resume.score >= 80 ? '#52c41a' : resume.score >= 60 ? '#faad14' : '#ff4d4f' }} />
            </Col>
            <Col span={18}>
              <p><strong>评分理由：</strong>{resume.score_reason || '暂无'}</p>
              <p><strong>简历摘要：</strong>{resume.summary || '暂无'}</p>
            </Col>
          </Row>
        </Card>
      )}

      {/* 简历信息 */}
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="姓名">{resume.name || '待解析'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusMap[resume.status]?.color}>{statusMap[resume.status]?.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="手机号">{resume.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{resume.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="工作年限">{resume.experience_years != null ? `${resume.experience_years} 年` : '-'}</Descriptions.Item>
          <Descriptions.Item label="上传时间">{new Date(resume.created_at).toLocaleString('zh-CN')}</Descriptions.Item>
        </Descriptions>

        <Divider />
        <p><strong>技能：</strong></p>
        <p>
          {skillsList.length > 0
            ? skillsList.map((s) => <Tag key={s} color="blue">{s}</Tag>)
            : <span style={{ color: '#999' }}>暂无</span>}
        </p>

        <Divider />
        <p><strong>教育经历：</strong></p>
        <p>{resume.education || '暂无'}</p>

        <Divider />
        <p><strong>工作经历：</strong></p>
        <p style={{ whiteSpace: 'pre-wrap' }}>{resume.work_experience || '暂无'}</p>

        <Divider />
        <p><strong>原始文件：</strong></p>
        <a
          href={`/uploads/${resume.file_path}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          📄 {resume.file_name}
        </a>
      </Card>

      {/* HR 操作区 */}
      <Card title="HR 操作">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <span>AI 评分关键词：</span>
            <Input
              placeholder="输入职位关键词，逗号分隔（如：Python, FastAPI）"
              value={jobKeywords}
              onChange={(e) => setJobKeywords(e.target.value)}
              style={{ width: 400 }}
            />
          </Space>

          <Space style={{ marginTop: 8 }}>
            <span>HR 备注：</span>
            <Input.TextArea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="添加备注..."
              rows={2}
              style={{ width: 400 }}
            />
          </Space>

          <Space style={{ marginTop: 16 }}>
            <span>标记为：</span>
            <Select
              value={resume.status}
              onChange={handleStatusChange}
              style={{ width: 140 }}
              options={[
                { value: 'pending', label: '待处理' },
                { value: 'reviewed', label: '已查看' },
                { value: 'shortlisted', label: '初步通过 ✓' },
                { value: 'rejected', label: '淘汰 ✗' },
              ]}
            />
          </Space>
        </Space>
      </Card>
    </div>
  );
}
