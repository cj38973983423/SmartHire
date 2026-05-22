import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, message } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { getStats } from '../api';
import type { DashboardStats } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => message.error('加载数据失败'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const cards = [
    { title: '总简历数', value: stats?.total_resumes || 0, icon: <FileTextOutlined />, color: '#1677ff' },
    { title: '待处理', value: stats?.pending_count || 0, icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: '初步通过', value: stats?.shortlisted_count || 0, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '已淘汰', value: stats?.rejected_count || 0, icon: <CloseCircleOutlined />, color: '#ff4d4f' },
    { title: '平均评分', value: stats?.avg_score ?? '-', icon: <StarOutlined />, color: '#722ed1', suffix: stats?.avg_score ? '分' : '' },
  ];

  return (
    <div>
      <h2>📊 数据看板</h2>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {cards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <Card hoverable>
              <Statistic
                title={card.title}
                value={card.value}
                suffix={card.suffix}
                prefix={card.icon}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
