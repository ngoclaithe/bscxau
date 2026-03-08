export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// console.log('Current API_URL:', API_URL);

export const api = {
    baseUrl: API_URL,

    async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        let url = `${API_URL}${endpoint}`;
        if (params) {
            const query = new URLSearchParams(params).toString();
            if (query) url += `?${query}`;
        }

        const res = await fetch(url, {
            headers,
            credentials: 'include'
        });

        if (!res.ok) {
            const text = await res.text();
            try {
                const json = JSON.parse(text);
                throw new Error(json.message || 'API Error');
            } catch (e) {
                if (e instanceof Error && e.message !== 'API Error') throw e;
                throw new Error(text || `Error ${res.status}`);
            }
        }
        return res.json();
    },

    async post<T>(endpoint: string, data: unknown): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!res.ok) {
            const text = await res.text();
            try {
                const json = JSON.parse(text);
                throw new Error(json.message || 'API Error');
            } catch (e) {
                if (e instanceof Error && e.message !== 'API Error') throw e;
                throw new Error(text || `Error ${res.status}`);
            }
        }
        return res.json();
    },

    async put<T>(endpoint: string, data: unknown): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
            credentials: 'include'
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async patch<T>(endpoint: string, data: unknown): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
            credentials: 'include'
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async delete<T>(endpoint: string): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
            credentials: 'include'
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
};
