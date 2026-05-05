const BASE_URL = 'http://localhost:8000';

const request = async (method, path, body) => {
  try {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) options.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : true;
  } catch (err) {
    console.warn(`[API] ${method} ${path} failed:`, err.message);
    return null;
  }
};

export const apiGet = (path) => request('GET', path);
export const apiPost = (path, body) => request('POST', path, body);
export const apiPatch = (path, body) => request('PATCH', path, body);
export const apiDelete = (path) => request('DELETE', path);
