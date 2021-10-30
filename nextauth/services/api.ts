import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { SignOut } from '../context/AuthContext';
import { AuthTokenError } from '../errors/AuthTokenErrors';

let isRefreshing = false;
let failedRequestQueue = [{
  onSuccess: (oken: string) => { },
  onFailure: (err: AxiosError) => { }
}];

export function setupAPIClient(ctx: any) {

  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  });

  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (error.response.data?.code === 'token.expired') {
        cookies = parseCookies(ctx);

        const { 'nextauth.refreshToken': refreshToken } = cookies;
        const originalConfig = error.config;

        if (!isRefreshing) {
          isRefreshing = true;
          api.post('refresh', {
            refreshToken,
          }).then(response => {
            const { token } = response.data;

            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, //30 days
              path: '/'
            })
            setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, //30 days
              path: '/'
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            failedRequestQueue.forEach(request => request.onSuccess(token));
            failedRequestQueue = [{
              onSuccess: (oken: string) => { },
              onFailure: (err: AxiosError) => { }
            }];
          }).catch(err => {
            failedRequestQueue.forEach(request => request.onFailure(err));
            failedRequestQueue = [{
              onSuccess: (oken: string) => { },
              onFailure: (err: AxiosError) => { }
            }];

            if (process.browser) {
              SignOut();
            }

          }).finally(() => {
            isRefreshing = false;
          });

        }

        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers['Authorization'] = `Bearer ${token}`
              resolve(api(originalConfig))
            },
            onFailure: (err: AxiosError) => {
              reject(err);
            }
          })
        });
      } else {
        if (process.browser) {
          SignOut();
        }else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }

    return Promise.reject(error);
  });
  return api;
}