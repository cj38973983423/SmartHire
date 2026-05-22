import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Upload, message, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { uploadResume } from '../api';

const { Dragger } = Upload;
const { Title, Paragraph } = Typography;

export default function UploadPage() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadResume(file);
      message.success(`「${result.file_name}」上传成功！正在自动解析...`);
      navigate(`/resumes/${result.id}`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || '上传失败';
      message.error(detail);
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <div>
      <Card>
        <Title level={3}>📤 上传简历</Title>
        <Paragraph type="secondary">
          支持 PDF、DOCX 格式，单文件不超过 10MB。上传后系统将自动解析简历信息。
        </Paragraph>

        <Dragger
          multiple={false}
          accept=".pdf,.docx,.doc"
          disabled={uploading}
          showUploadList={false}
          beforeUpload={handleUpload}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {uploading ? '正在上传并解析...' : '点击或拖拽简历文件到此区域上传'}
          </p>
          <p className="ant-upload-hint">
            支持 PDF、DOCX 格式
          </p>
        </Dragger>
      </Card>
    </div>
  );
}
