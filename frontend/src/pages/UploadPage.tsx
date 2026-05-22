import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Upload, message, Typography, Button, Space, Table } from 'antd';
import { InboxOutlined, UploadOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { batchUploadResumes } from '../api';

const { Dragger } = Upload;
const { Title, Paragraph } = Typography;

export default function UploadPage() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ id: number; file_name: string; status: string }[] | null>(null);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(
      (f) => ['.pdf', '.docx', '.doc'].some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (validFiles.length === 0) {
      message.warning('没有找到支持的简历文件（PDF/DOCX）');
      return;
    }
    if (validFiles.length !== files.length) {
      message.info(`已过滤掉 ${files.length - validFiles.length} 个不支持的文件`);
    }

    setUploading(true);
    setResults(null);
    try {
      const res = await batchUploadResumes(validFiles);
      const items = res.results.map((r) => ({ id: r.id, file_name: r.file_name, status: '✅ 成功' }));
      const failedItems = res.errors.map((e) => ({ id: 0, file_name: e.file, status: `❌ ${e.error}` }));
      setResults([...items, ...failedItems]);
      message.success(`上传完成：${res.success} 成功，${res.failed} 失败`);
    } catch (err: any) {
      message.error('批量上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleFolderSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    input.accept = '.pdf,.docx,.doc';
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      handleFiles(files);
    };
    input.click();
  };

  const columns = [
    { title: '文件名', dataIndex: 'file_name', key: 'file_name' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 120,
      render: (s: string) => <span>{s}</span>,
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: any, r: any) => r.id ? (
        <Button type="link" onClick={() => navigate(`/resumes/${r.id}`)}>查看</Button>
      ) : null,
    },
  ];

  return (
    <div>
      <Card>
        <Title level={3}>📤 批量上传简历</Title>
        <Paragraph type="secondary">
          支持一次选择多个文件，或直接选择整个文件夹。支持 PDF、DOCX 格式。上传后自动解析简历信息。
        </Paragraph>

        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={uploading}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = '.pdf,.docx,.doc';
              input.onchange = (e) => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                handleFiles(files);
              };
              input.click();
            }}
          >
            选择多个文件
          </Button>
          <Button
            icon={<FolderOpenOutlined />}
            loading={uploading}
            onClick={handleFolderSelect}
          >
            选择文件夹
          </Button>
        </Space>

        <Dragger
          multiple
          accept=".pdf,.docx,.doc"
          disabled={uploading}
          showUploadList={false}
          beforeUpload={(_file, fileList) => {
            handleFiles(Array.from(fileList));
            return false;
          }}
          style={{ marginBottom: 16 }}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">
            {uploading ? '正在上传并解析...' : '点击或拖拽文件/文件夹到此区域'}
          </p>
          <p className="ant-upload-hint">支持多文件选择或直接拖入整个文件夹</p>
        </Dragger>

        {results && results.length > 0 && (
          <Table
            columns={columns}
            dataSource={results}
            rowKey={(r) => r.file_name + r.status}
            pagination={false}
            size="small"
            style={{ marginTop: 16 }}
          />
        )}

        {results && (
          <Button type="primary" onClick={() => navigate('/resumes')} style={{ marginTop: 16 }}>
            前往简历列表
          </Button>
        )}
      </Card>
    </div>
  );
}
