import axios from "axios";

// Community / API calls
const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : "/api/v1";

import { api as apiClient } from "./api";

// Posts
export const getPosts = async (page = 1, orgId?: string) => {
  const url = orgId ? `/api/v1/posts?page=${page}&orgId=${orgId}` : `/api/v1/posts?page=${page}`;
  const res = await apiClient.get(url);
  return res.data;
};

export const getFeed = async (page = 1, sort = 'hot', orgId?: string, topic?: string) => {
  let url = `/api/v1/posts/feed?page=${page}&sort=${sort}`;
  if (orgId) url += `&orgId=${orgId}`;
  if (topic) url += `&topic=${encodeURIComponent(topic)}`;
  const res = await apiClient.get(url);
  return res.data;
};

export const getTrendingTopics = async () => {
  const res = await apiClient.get('/api/v1/posts/trending-topics');
  return res.data;
};

export const getPostById = async (id: string) => {
  const res = await apiClient.get(`/api/v1/posts/${id}`);
  return res.data;
};

export const createPost = async (data: { content: string; organizationId?: string }) => {
  const res = await apiClient.post("/api/v1/posts", data);
  return res.data;
};

export const toggleVotePost = async (id: string, type: 'up' | 'down') => {
  const res = await apiClient.post(`/api/v1/posts/${id}/vote`, { type });
  return res.data;
};

export const getMyPosts = async (page = 1, orgId?: string) => {
  let url = `/api/v1/posts/user/my-posts?page=${page}`;
  if (orgId) url += `&orgId=${orgId}`;
  const res = await apiClient.get(url);
  return res.data;
};

// Comments
export const getCommentsByPost = async (postId: string) => {
  const res = await apiClient.get(`/api/v1/comments/post/${postId}?threaded=true`);
  return res.data;
};

export const createComment = async (data: { content: string; postId: string; parentCommentId?: string }) => {
  const res = await apiClient.post("/api/v1/comments", data);
  return res.data;
};

export const toggleVoteComment = async (id: string, type: 'up' | 'down') => {
  const res = await apiClient.post(`/api/v1/comments/${id}/vote`, { type });
  return res.data;
};

// Organizations
export const getOrganizations = async (page = 1) => {
  const res = await apiClient.get(`/api/v1/organizations?page=${page}`);
  return res.data;
};

export const getOrganizationById = async (id: string) => {
  const res = await apiClient.get(`/api/v1/organizations/${id}`);
  return res.data;
};

export const joinOrganization = async (id: string) => {
  const res = await apiClient.post(`/api/v1/organizations/${id}/join`);
  return res.data;
};

export const leaveOrganization = async (id: string) => {
  const res = await apiClient.post(`/api/v1/organizations/${id}/leave`);
  return res.data;
};

// Users
export const getMyProfile = async () => {
  const res = await apiClient.get("/api/v1/users/me");
  return res.data;
};

export const updateProfile = async (data: { bio?: string; avatar?: string; coverImage?: string }) => {
  const res = await apiClient.put("/api/v1/users/me", data);
  return res.data;
};

export const getPublicProfile = async (id: string) => {
  const res = await apiClient.get(`/api/v1/users/${id}`);
  return res.data;
};

export const registerUser = async (data: { email: string; password: string; name: string }) => {
  // Use public auth endpoint for registration
  const res = await axios.post(`${API_URL}/auth/register`, data);
  return res.data;
};

export const loginUser = async (data: { email: string; password: string }) => {
  // Use public auth endpoint for login
  const res = await axios.post(`${API_URL}/auth/login`, data);
  return res.data;
};

export const uploadMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('media', file);
  const res = await apiClient.post("/api/v1/posts/upload", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const reportPost = async (postId: string, reason: string) => {
  const res = await apiClient.post(`/api/v1/posts/${postId}/report`, { reason });
  return res.data;
};
