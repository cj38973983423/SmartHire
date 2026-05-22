import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Card, Input, Select, Button, Space, Tag, message,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getResumes } from '../api';
import type { PaginatedResumes, SearchParams, ResumeItem } from '../api';
import type { ColumnsType } from 'antd/es/table';

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待处理' },
  reviewed: { color: 'blue', label: '已查看' },
  shortlisted: { color: 'green', label: '初步通过' },
  rejected: { color: 'red', label: '已淘汰' },
};

export default function ResumeList() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResumes | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [skillFilter, setSkillFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchData = useCallback(async (params: SearchParams) => {
    setLoading(true);
    try {
      const res = await getResumes(params);
      setData(res);
    } catch {
      message.error('加载简历列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData({ page, page_size: pageSize, keyword: keyword || undefined, status: statusFilter || undefined, skill: skillFilter || undefined, sort_by: 'created_at', sort_order: 'desc' });
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData({ page: 1, page_size: pageSize, keyword: keyword || undefined, status: statusFilter || undefined, skill: skillFilter || undefined });
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
          return list.slice(0, 4).map((s: string) => <Tag key={s}>{s}</Tag>);
        } catch {
          return skills;
        }
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
      render: (score: number | null) => {
        if (score == null) return '-';
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
      width: 170,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div>
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索姓名/技能/关键词"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            allowClear
            style={{ width: 140 }}
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
            style={{ width: 160 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setStatusFilter(''); setSkillFilter(''); setPage(1); fetchData({ page: 1, page_size: pageSize }); }}>
            重置
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 份简历`,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/resumes/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
}
