import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'https://demplon.pupuk-kujang.co.id/admin/api/';

export function createApiClient(token?: string): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    config => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        console.error('Unauthorized request - token may be expired');
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
