import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  UploadOutlined,
  SolutionOutlined,
  StarOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import ResumeList from './pages/ResumeList';
import ResumeDetail from './pages/ResumeDetail';
import UploadPage from './pages/UploadPage';
import JDList from './pages/JDList';
import JDDetail from './pages/JDDetail';
import zhCN from 'antd/locale/zh_CN';

const { Sider, Content } = Layout;

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '数据看板' },
    {
      key: 'resumes-group', icon: <FileTextOutlined />, label: '简历管理',
      children: [
        { key: '/resumes', label: '全部简历' },
        { key: '/resumes#shortlist', icon: <StarOutlined />, label: '待筛选 (≥60分)' },
        { key: '/resumes#rejected', icon: <DeleteOutlined />, label: '淘汰库 (<60分)' },
      ],
    },
    { key: '/jds', icon: <SolutionOutlined />, label: 'JD 管理' },
    { key: '/upload', icon: <UploadOutlined />, label: '批量上传' },
  ];

  // 根据路径 + hash 确定选中项
  const pathBase = '/' + location.pathname.split('/')[1];
  const fullPath = pathBase + location.hash;

  const findSelectedKey = (items: any[]): string => {
    for (const item of items) {
      if (item.key === fullPath) return fullPath;
      if (item.key === pathBase) return item.key;
      if (item.children) {
        const child = findSelectedKey(item.children);
        if (child) return child;
      }
    }
    return '/';
  };

  const selectedKey = findSelectedKey(menuItems);

  const handleMenuClick = ({ key }: { key: string }) => {
    // 处理 hash 路由
    if (key.includes('#')) {
      const [path, hash] = key.split('#');
      navigate(`${path}#${hash}`);
    } else {
      navigate(key);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={0} style={{ background: '#fff' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff' }}>📋 HR 助手</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['resumes-group']}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: 24 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resumes" element={<ResumeList />} />
            <Route path="/resumes/:id" element={<ResumeDetail />} />
            <Route path="/jds" element={<JDList />} />
            <Route path="/jds/:id" element={<JDDetail />} />
            <Route path="/upload" element={<UploadPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#1677ff' } }}
    >
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
