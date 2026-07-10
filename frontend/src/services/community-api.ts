import axios from "axios";

// Community / API calls
const API_URL = "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("trustshield-auth");
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed?.state?.accessToken) {
        config.headers.Authorization = `Bearer ${parsed.state.accessToken}`;
      }
    } catch (e) {
      // ignore
    }
  }
  return config;
});

// Posts
export const getPosts = async (page = 1, orgId?: string) => {
  const url = orgId ? `/posts?page=${page}&orgId=${orgId}` : `/posts?page=${page}`;
  const res = await apiClient.get(url);
  return res.data;
};

export const getPostById = async (id: string) => {
  const res = await apiClient.get(`/posts/${id}`);
  return res.data;
};

export const createPost = async (data: { content: string; organizationId?: string }) => {
  const res = await apiClient.post("/posts", data);
  return res.data;
};

export const upvotePost = async (id: string) => {
  const res = await apiClient.post(`/posts/${id}/upvote`);
  return res.data;
};

export const downvotePost = async (id: string) => {
  const res = await apiClient.post(`/posts/${id}/downvote`);
  return res.data;
};

export const getMyPosts = async (page = 1) => {
  const res = await apiClient.get(`/posts/user/my-posts?page=${page}`);
  return res.data;
};

// Comments
export const getCommentsByPost = async (postId: string) => {
  const res = await apiClient.get(`/comments/post/${postId}?threaded=true`);
  return res.data;
};

export const createComment = async (data: { content: string; postId: string; parentCommentId?: string }) => {
  const res = await apiClient.post("/comments", data);
  return res.data;
};

export const likeComment = async (id: string) => {
  const res = await apiClient.post(`/comments/${id}/like`);
  return res.data;
};

// Organizations
export const getOrganizations = async (page = 1) => {
  const res = await apiClient.get(`/organizations?page=${page}`);
  return res.data;
};

export const getOrganizationById = async (id: string) => {
  const res = await apiClient.get(`/organizations/${id}`);
  return res.data;
};

export const joinOrganization = async (id: string) => {
  const res = await apiClient.post(`/organizations/${id}/join`);
  return res.data;
};

export const leaveOrganization = async (id: string) => {
  const res = await apiClient.delete(`/organizations/${id}/leave`);
  return res.data;
};

// Users
export const getMyProfile = async () => {
  const res = await apiClient.get("/users/me");
  return res.data;
};

export const updateProfile = async (data: { bio?: string; avatar?: string; coverImage?: string }) => {
  const res = await apiClient.put("/users/me", data);
  return res.data;
};

export const getPublicProfile = async (id: string) => {
  const res = await apiClient.get(`/users/${id}`);
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
