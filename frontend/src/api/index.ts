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
  jd_id: number | null;
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
  total_jds?: number;
}

export interface AnalyzeResponse {
  resume_id: number;
  jd_id: number | null;
  jd_title: string | null;
  score: number;
  score_reason: string;
  summary: string;
  score_detail: string | null;
}

export interface ResumeScoreItem {
  id: number;
  resume_id: number;
  jd_id: number;
  score: number;
  score_reason: string | null;
  summary: string | null;
  score_detail: string | null;
  created_at: string;
  jd_title: string | null;
}

export interface SearchParams {
  keyword?: string;
  skill?: string;
  status?: string;
  min_score?: number;
  max_score?: number;
  min_experience?: number;
  max_experience?: number;
  jd_id?: number;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

// ── JD 类型 ──

export interface JDItem {
  id: number;
  title: string;
  department: string | null;
  location: string | null;
  is_active: number;
  created_at: string;
}

export interface JDDetail extends JDItem {
  content: string;
  required_skills: string | null;
  nice_to_have: string | null;
  experience_required: string | null;
  education_required: string | null;
  summary: string | null;
  updated_at: string;
}

export interface JDCreate {
  title: string;
  department?: string;
  location?: string;
  content: string;
  required_skills?: string;
  nice_to_have?: string;
  experience_required?: string;
  education_required?: string;
  summary?: string;
}

export interface PaginatedJDs {
  items: JDItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ── API 方法：统计 ──

export async function getStats(): Promise<DashboardStats> {
  const res = await api.get('/stats');
  return res.data;
}

// ── API 方法：简历 ──

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

// ── API 方法：批量上传 ──

export async function batchUploadResumes(files: File[]): Promise<{
  total: number; success: number; failed: number;
  results: { id: number; file_name: string }[];
  errors: { file: string; error: string }[];
}> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  const res = await api.post('/resumes/batch', form);
  return res.data;
}

// ── API 方法：AI 分析 ──

export async function analyzeResume(resume_id: number, job_keywords: string[] = [], jd_id?: number): Promise<AnalyzeResponse> {
  const res = await api.post('/analyze/score', { resume_id, job_keywords, jd_id });
  return res.data;
}

export async function getResumeScores(resume_id: number): Promise<ResumeScoreItem[]> {
  const res = await api.get(`/analyze/scores/${resume_id}`);
  return res.data;
}

export async function batchScoreResumes(resume_ids: number[], jd_id: number): Promise<{
  jd_title: string; total: number; scored: number;
  results: { resume_id: number; resume_name: string; score: number; score_reason: string }[];
}> {
  const res = await api.post('/analyze/score-batch', { resume_ids, jd_id });
  return res.data;
}

// ── API 方法：JD 职位 ──

export async function getJDs(params?: { keyword?: string; active_only?: boolean; page?: number; page_size?: number }): Promise<PaginatedJDs> {
  const res = await api.get('/jds', { params });
  return res.data;
}

export async function getJD(id: number): Promise<JDDetail> {
  const res = await api.get(`/jds/${id}`);
  return res.data;
}

export async function createJD(data: JDCreate): Promise<JDDetail> {
  const res = await api.post('/jds', data);
  return res.data;
}

export async function updateJD(id: number, data: Partial<JDCreate & { is_active: number }>): Promise<JDDetail> {
  const res = await api.put(`/jds/${id}`, data);
  return res.data;
}

export async function deleteJD(id: number): Promise<void> {
  await api.delete(`/jds/${id}`);
}

export default api;
