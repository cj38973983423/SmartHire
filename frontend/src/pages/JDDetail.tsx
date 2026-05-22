import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Button, Space, Spin, message,
  Input, Form, Modal, Switch,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getJD, updateJD, deleteJD } from '../api';
import type { JDDetail } from '../api';

export default function JDDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jd, setJd] = useState<JDDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchJD = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setJd(await getJD(Number(id)));
    } catch {
      message.error('加载 JD 失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJD(); }, [id]);

  const handleEdit = () => {
    if (!jd) return;
    form.setFieldsValue(jd);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      const updated = await updateJD(Number(id), values);
      setJd(updated);
      message.success('更新成功');
      setEditOpen(false);
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Modal.confirm({
      title: '确认删除',
      content: '删除后关联的评分记录也将被清除，确定删除？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteJD(Number(id));
          message.success('删除成功');
          navigate('/jds');
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const handleToggleActive = async (active: boolean) => {
    if (!id || !jd) return;
    try {
      const updated = await updateJD(Number(id), { is_active: active ? 1 : 0 });
      setJd(updated);
      message.success(active ? '已启用' : '已停用');
    } catch {
      message.error('操作失败');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!jd) return <div>JD 不存在</div>;

  const renderSkills = (skills: string | null) => {
    if (!skills) return '-';
    return skills.split(/[,，]/).map((s) => <Tag key={s.trim()} color="blue">{s.trim()}</Tag>);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/jds')}>返回列表</Button>
        <Button icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
        <Space>
          <span>启用状态：</span>
          <Switch checked={jd.is_active === 1} onChange={handleToggleActive} />
        </Space>
      </Space>

      <Card title={`📋 ${jd.title}`} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="部门">{jd.department || '-'}</Descriptions.Item>
          <Descriptions.Item label="工作地点">{jd.location || '-'}</Descriptions.Item>
          <Descriptions.Item label="经验要求">{jd.experience_required || '-'}</Descriptions.Item>
          <Descriptions.Item label="学历要求">{jd.education_required || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(jd.created_at).toLocaleString('zh-CN')}</Descriptions.Item>
          <Descriptions.Item label="最后更新">{new Date(jd.updated_at).toLocaleString('zh-CN')}</Descriptions.Item>
        </Descriptions>
      </Card>

      {jd.summary && (
        <Card title="职位摘要" style={{ marginBottom: 16 }}>
          <p>{jd.summary}</p>
        </Card>
      )}

      <Card title="必备技能" style={{ marginBottom: 16 }}>
        <p>{renderSkills(jd.required_skills)}</p>
      </Card>

      <Card title="加分技能" style={{ marginBottom: 16 }}>
        <p>{renderSkills(jd.nice_to_have)}</p>
      </Card>

      <Card title="JD 全文">
        <p style={{ whiteSpace: 'pre-wrap' }}>{jd.content}</p>
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑 JD"
        open={editOpen}
        onOk={handleSave}
        onCancel={() => setEditOpen(false)}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="职位名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="department" label="所属部门"><Input /></Form.Item>
          <Form.Item name="location" label="工作地点"><Input /></Form.Item>
          <Form.Item name="summary" label="职位摘要"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="required_skills" label="必备技能"><Input /></Form.Item>
          <Form.Item name="nice_to_have" label="加分技能"><Input /></Form.Item>
          <Form.Item name="experience_required" label="经验要求"><Input /></Form.Item>
          <Form.Item name="education_required" label="学历要求"><Input /></Form.Item>
          <Form.Item name="content" label="JD 全文" rules={[{ required: true }]}>
            <Input.TextArea rows={8} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
