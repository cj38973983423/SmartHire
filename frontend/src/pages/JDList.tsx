import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Card, Input, Button, Space, Tag, message, Modal, Form,
} from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getJDs, deleteJD, createJD } from '../api';
import type { PaginatedJDs, JDItem } from '../api';
import type { ColumnsType } from 'antd/es/table';

export default function JDList() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedJDs | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async (p: number, kw?: string) => {
    setLoading(true);
    try {
      const res = await getJDs({ keyword: kw, page: p, page_size: 20 });
      setData(res);
    } catch {
      message.error('加载 JD 列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(page, keyword || undefined); }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchData(1, keyword || undefined);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      const jd = await createJD(values);
      message.success(`「${jd.title}」创建成功`);
      setCreateOpen(false);
      form.resetFields();
      fetchData(1, keyword || undefined);
    } catch (err: any) {
      if (err?.errorFields) return; // 表单校验未通过
      message.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: number, title: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除「${title}」吗？关联的评分记录也将被清除。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteJD(id);
          message.success('删除成功');
          fetchData(page, keyword || undefined);
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const columns: ColumnsType<JDItem> = [
    {
      title: '职位名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <a onClick={() => navigate(`/jds/${record.id}`)}>{title}</a>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (v: string | null) => v || '-',
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      render: (v: string | null) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (v: number) => v ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button type="link" danger onClick={(e) => { e.stopPropagation(); handleDelete(record.id, record.title); }}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="📋 职位管理（JD）"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建 JD</Button>}
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索职位名称/部门"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 280 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setPage(1); fetchData(1); }}>重置</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.total || 0,
            onChange: (p) => setPage(p),
            showTotal: (total) => `共 ${total} 个职位`,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/jds/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal
        title="新建职位描述（JD）"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        confirmLoading={creating}
        okText="创建"
        cancelText="取消"
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="职位名称" rules={[{ required: true, message: '请输入职位名称' }]}>
            <Input placeholder="如：高级前端工程师" />
          </Form.Item>
          <Form.Item name="department" label="所属部门">
            <Input placeholder="如：技术部" />
          </Form.Item>
          <Form.Item name="location" label="工作地点">
            <Input placeholder="如：北京/远程" />
          </Form.Item>
          <Form.Item name="summary" label="职位摘要">
            <Input.TextArea rows={2} placeholder="简要描述该职位（可选）" />
          </Form.Item>
          <Form.Item name="required_skills" label="必备技能（逗号分隔）">
            <Input placeholder="如：Python, FastAPI, React, TypeScript" />
          </Form.Item>
          <Form.Item name="nice_to_have" label="加分技能（逗号分隔）">
            <Input placeholder="如：Docker, Kubernetes, Redis" />
          </Form.Item>
          <Form.Item name="experience_required" label="经验要求">
            <Input placeholder="如：3-5年" />
          </Form.Item>
          <Form.Item name="education_required" label="学历要求">
            <Input placeholder="如：本科及以上" />
          </Form.Item>
          <Form.Item name="content" label="JD 全文" rules={[{ required: true, message: '请输入 JD 全文' }]}>
            <Input.TextArea rows={8} placeholder="详细的职位描述、职责要求、福利待遇等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
