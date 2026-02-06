export interface GitHubFile {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string | null;
    type: 'file' | 'dir';
    _links: {
        self: string;
        git: string;
        html: string;
    };
}

const BASE_URL = 'https://api.github.com';

export async function fetchRepoContents(
    owner: string,
    repo: string,
    path: string = '',
    token?: string
): Promise<GitHubFile[]> {
    const url = `${BASE_URL}/repos/${owner}/${repo}/contents/${path}`;
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
    };

    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Repository or path not found');
        } else if (response.status === 403) {
            throw new Error('Rate limit exceeded or invalid token');
        }
        throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        // It might be a file if the path points directly to a file
        if (data.type === 'file') {
            return [data];
        }
        throw new Error('Unexpected response format');
    }

    // Sort: directories first, then files
    return data.sort((a: GitHubFile, b: GitHubFile) => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        }
        return a.type === 'dir' ? -1 : 1;
    });
}

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    owner: {
        login: string;
    };
}

export async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
    const url = `${BASE_URL}/user/repos?sort=updated&per_page=100`;
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`Failed to fetch user repos: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}

export async function fetchFileContent(url: string, token?: string): Promise<string> {
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3.raw', // Request raw content
    };

    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }

    return await response.text();
}
