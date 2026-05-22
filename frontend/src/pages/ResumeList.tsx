import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Table, Card, Input, Select, Button, Space, Tag, message, Modal, Tabs,
} from 'antd';
import { SearchOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { getResumes, getJDs, batchScoreResumes } from '../api';
import type { PaginatedResumes, SearchParams, ResumeItem, JDItem } from '../api';
import type { ColumnsType } from 'antd/es/table';

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待处理' },
  reviewed: { color: 'blue', label: '已查看' },
  shortlisted: { color: 'green', label: '初步通过' },
  rejected: { color: 'red', label: '已淘汰' },
};

// 标签页配置
const TAB_ALL = 'all';
const TAB_SHORTLIST = 'shortlist';   // >= 60 分
const TAB_REJECTED = 'rejected';     // < 60 分

export default function ResumeList() {
  const navigate = useNavigate();
  const location = useLocation();

  // 从 URL hash 确定当前标签页
  const hashTab = location.hash.replace('#', '') || TAB_ALL;
  const [activeTab, setActiveTab] = useState<string>(hashTab);

  const [data, setData] = useState<PaginatedResumes | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [skillFilter, setSkillFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 多选
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  // 批量评分
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [jdList, setJdList] = useState<JDItem[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<number | undefined>(undefined);
  const [batchScoring, setBatchScoring] = useState(false);
  const [batchResults, setBatchResults] = useState<any[] | null>(null);

  // 构建查询参数
  const buildParams = useCallback((): SearchParams => {
    const params: SearchParams = { page, page_size: pageSize, sort_by: 'created_at', sort_order: 'desc' };
    if (keyword) params.keyword = keyword;
    if (statusFilter) params.status = statusFilter;
    if (skillFilter) params.skill = skillFilter;

    // 按标签页过滤分数
    if (activeTab === TAB_SHORTLIST) {
      params.min_score = 60;
      params.sort_by = 'score';
      params.sort_order = 'desc';
    } else if (activeTab === TAB_REJECTED) {
      params.max_score = 60;
      params.sort_by = 'score';
      params.sort_order = 'asc';
    }
    return params;
  }, [activeTab, keyword, statusFilter, skillFilter, page, pageSize]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getResumes(buildParams());
      setData(res);
    } catch {
      message.error('加载简历列表失败');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 加载 JD 列表（用于批量评分弹窗）
  useEffect(() => {
    getJDs({ active_only: true, page_size: 100 })
      .then((res) => setJdList(res.items))
      .catch(() => {});
  }, []);

  // 切换标签页
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    setSelectedRowKeys([]);
    navigate(`/resumes#${key}`, { replace: true });
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  // 批量评分
  const handleBatchScore = async () => {
    if (!selectedJdId) {
      message.warning('请选择要评分的 JD');
      return;
    }
    setBatchScoring(true);
    setBatchResults(null);
    try {
      const res = await batchScoreResumes(selectedRowKeys, selectedJdId);
      setBatchResults(res.results);
      message.success(`批量评分完成：${res.scored} 份简历`);
      fetchData();
    } catch {
      message.error('批量评分失败');
    } finally {
      setBatchScoring(false);
    }
  };

  const columns: ColumnsType<ResumeItem> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string | null, record) =>
        name ? <a onClick={() => navigate(`/resumes/${record.id}`)}>{name}</a> : <span style={{ color: '#999' }}>未解析</span>,
    },
    {
      title: '技能',
      dataIndex: 'skills',
      key: 'skills',
      ellipsis: true,
      render: (skills: string | null) => {
        if (!skills) return '-';
        try {
          const list = JSON.parse(skills);
          return list.slice(0, 3).map((s: string) => <Tag key={s}>{s}</Tag>);
        } catch { return skills; }
      },
    },
    {
      title: '工作年限',
      dataIndex: 'experience_years',
      key: 'experience_years',
      width: 100,
      render: (v: number | null) => (v != null ? `${v} 年` : '-'),
    },
    {
      title: 'AI 评分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      sorter: true,
      defaultSortOrder: activeTab === TAB_SHORTLIST ? 'descend' : undefined,
      render: (score: number | null) => {
        if (score == null) return <Tag>待评分</Tag>;
        const color = score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red';
        return <Tag color={color}>{score} 分</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = statusMap[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
  ];

  const tabItems = [
    {
      key: TAB_ALL,
      label: `全部简历${data?.total != null ? ` (${data.total})` : ''}`,
      children: null,
    },
    {
      key: TAB_SHORTLIST,
      label: `⭐ 待筛选 (≥60分)`,
      children: null,
    },
    {
      key: TAB_REJECTED,
      label: `🗑️ 淘汰库 (<60分)`,
      children: null,
    },
  ];

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} items={tabItems} onChange={handleTabChange} />

        <Space wrap style={{ marginBottom: 16, marginTop: 8 }}>
          <Input
            placeholder="搜索姓名/技能/关键词"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            allowClear
            style={{ width: 130 }}
            options={[
              { value: 'pending', label: '待处理' },
              { value: 'reviewed', label: '已查看' },
              { value: 'shortlisted', label: '初步通过' },
              { value: 'rejected', label: '已淘汰' },
            ]}
          />
          <Input
            placeholder="技能筛选"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            style={{ width: 150 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setStatusFilter(''); setSkillFilter(''); setPage(1); }}>重置</Button>

          {selectedRowKeys.length > 0 && (
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => setBatchModalOpen(true)}
            >
              对选中的 {selectedRowKeys.length} 份简历 AI 评分
            </Button>
          )}
        </Space>

        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 8, color: '#1677ff' }}>
            已选 {selectedRowKeys.length} 份简历
          </div>
        )}

        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as number[]),
          }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 份简历`,
          }}
          onRow={(record) => ({
            onClick: (e) => {
              // 点击行导航到详情，排除 checkbox 点击
              const target = e.target as HTMLElement;
              if (target.closest('.ant-checkbox')) return;
              navigate(`/resumes/${record.id}`);
            },
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* 批量评分弹窗 */}
      <Modal
        title="📊 批量 AI 评分"
        open={batchModalOpen}
        onCancel={() => { setBatchModalOpen(false); setBatchResults(null); }}
        footer={null}
        width={640}
      >
        {!batchResults ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <p>已选择 <strong>{selectedRowKeys.length}</strong> 份简历，请选择要评分的 JD：</p>
            <Select
              placeholder="选择 JD"
              value={selectedJdId}
              onChange={setSelectedJdId}
              style={{ width: '100%' }}
              size="large"
              options={jdList.map((j) => ({ value: j.id, label: `[${j.department || '通用'}] ${j.title}` }))}
            />
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleBatchScore}
              loading={batchScoring}
              disabled={!selectedJdId}
              size="large"
              block
            >
              {batchScoring ? '评分中...' : '开始批量评分'}
            </Button>
          </Space>
        ) : (
          <div>
            <p>评分完成：</p>
            <Table
              dataSource={batchResults}
              rowKey="resume_id"
              pagination={false}
              size="small"
              columns={[
                { title: '候选人', dataIndex: 'resume_name', key: 'resume_name' },
                {
                  title: '分数', dataIndex: 'score', key: 'score', width: 80,
                  render: (s: number) => <Tag color={s >= 80 ? 'green' : s >= 60 ? 'orange' : 'red'}>{s} 分</Tag>,
                },
                { title: '理由', dataIndex: 'score_reason', key: 'score_reason', ellipsis: true },
                {
                  title: '操作', key: 'action', width: 80,
                  render: (_: any, r: any) => (
                    <Button type="link" onClick={() => navigate(`/resumes/${r.resume_id}`)}>查看</Button>
                  ),
                },
              ]}
            />
            <Button
              type="primary"
              onClick={() => { setBatchModalOpen(false); setBatchResults(null); }}
              style={{ marginTop: 16 }}
            >
              完成
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
