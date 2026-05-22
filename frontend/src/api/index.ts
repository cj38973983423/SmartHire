/**
 * API 客户端 — 连接 FastAPI 后端
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// ── 类型定义 ──

export interface ResumeItem {
  id: number;
  name: string | null;
  skills: string | null;
  experience_years: number | null;
  score: number | null;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  file_name: string;
  created_at: string;
}

export interface ResumeDetail extends ResumeItem {
  phone: string | null;
  email: string | null;
  education: string | null;
  work_experience: string | null;
  summary: string | null;
  score_reason: string | null;
  review_note: string | null;
  file_type: string;
  file_path: string;
  updated_at: string;
}

export interface PaginatedResumes {
  items: ResumeItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DashboardStats {
  total_resumes: number;
  pending_count: number;
  reviewed_count: number;
  shortlisted_count: number;
  rejected_count: number;
  avg_score: number | null;
}

export interface AnalyzeResponse {
  resume_id: number;
  score: number;
  score_reason: string;
  summary: string;
}

export interface SearchParams {
  keyword?: string;
  skill?: string;
  status?: string;
  min_score?: number;
  max_score?: number;
  min_experience?: number;
  max_experience?: number;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

// ── API 方法 ──

export async function getStats(): Promise<DashboardStats> {
  const res = await api.get('/stats');
  return res.data;
}

export async function getResumes(params: SearchParams): Promise<PaginatedResumes> {
  const res = await api.get('/resumes', { params });
  return res.data;
}

export async function getResume(id: number): Promise<ResumeDetail> {
  const res = await api.get(`/resumes/${id}`);
  return res.data;
}

export async function uploadResume(file: File): Promise<{ id: number; file_name: string; message: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/resumes', form);
  return res.data;
}

export async function updateResumeStatus(id: number, status: string, review_note?: string): Promise<ResumeDetail> {
  const res = await api.patch(`/resumes/${id}/status`, { status, review_note });
  return res.data;
}

export async function deleteResume(id: number): Promise<void> {
  await api.delete(`/resumes/${id}`);
}

export async function analyzeResume(resume_id: number, job_keywords: string[] = []): Promise<AnalyzeResponse> {
  const res = await api.post('/analyze/score', { resume_id, job_keywords });
  return res.data;
}

export default api;
