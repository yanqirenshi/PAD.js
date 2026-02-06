import React, { useState, useEffect } from 'react';
import { fetchRepoContents, fetchFileContent, fetchUserRepos } from '../utils/github';
import type { GitHubFile, GitHubRepo } from '../utils/github';

import { Box, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, CircularProgress } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

interface GitHubPanelProps {
    onFileSelect: (content: string, language: 'rust' | 'javascript') => void;
}

const STORAGE_KEY_TOKEN = 'pad_github_token';
const STORAGE_KEY_REPO = 'pad_github_repo'; // Stores full_name

export function GitHubPanel({ onFileSelect }: GitHubPanelProps) {
    const [token, setToken] = useState('');
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>(''); // full_name e.g. "owner/repo"

    const [path, setPath] = useState('');
    const [files, setFiles] = useState<GitHubFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
        const savedRepo = localStorage.getItem(STORAGE_KEY_REPO);

        // Prioritize env var -> localStorage
        const envToken = import.meta.env.VITE_GITHUB_TOKEN;

        let activeToken = '';
        if (envToken) {
            activeToken = envToken;
            setToken(envToken);
        } else if (savedToken) {
            activeToken = savedToken;
            setToken(savedToken);
        }

        if (savedRepo) {
            setSelectedRepo(savedRepo);
        }

        if (activeToken) {
            loadRepos(activeToken);
        }
    }, []);

    const loadRepos = async (authToken: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchUserRepos(authToken);
            setRepos(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // When repo or token changes (and we have both), fetch files
    useEffect(() => {
        if (selectedRepo && token) {
            loadFiles();
            localStorage.setItem(STORAGE_KEY_REPO, selectedRepo);
        }
    }, [selectedRepo, token]);

    const loadFiles = async (currentPath: string = '') => {
        if (!selectedRepo || !token) return;

        setLoading(true);
        setError(null);
        try {
            const [owner, repo] = selectedRepo.split('/');
            const data = await fetchRepoContents(owner, repo, currentPath, token);
            setFiles(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRepoChange = (e: SelectChangeEvent) => {
        const newVal = e.target.value;
        setSelectedRepo(newVal);
        setPath(''); // Reset path on repo change
    };

    const handleNavigate = async (file: GitHubFile) => {
        if (file.type === 'dir') {
            setPath(file.path);
            loadFiles(file.path);
        } else {
            setLoading(true);
            try {
                const content = await fetchFileContent(file.url, token);
                let lang: 'rust' | 'javascript' = 'rust';
                if (file.name.endsWith('.js') || file.name.endsWith('.jsx') || file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
                    lang = 'javascript';
                }
                onFileSelect(content, lang);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleGoUp = async () => {
        if (!path) return;
        const parts = path.split('/');
        parts.pop();
        const newPath = parts.join('/');
        setPath(newPath);
        loadFiles(newPath);
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 2, mt: 1 }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="repo-select-label">リポジトリ</InputLabel>
                    <Select
                        labelId="repo-select-label"
                        value={selectedRepo}
                        label="リポジトリ"
                        onChange={handleRepoChange}
                        disabled={loading && repos.length === 0}
                    >
                        {repos.length === 0 && !loading && <MenuItem value="">No Repos Found</MenuItem>}
                        {repos.map(repo => (
                            <MenuItem key={repo.id} value={repo.full_name}>
                                {repo.full_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {!token && (
                    <Typography variant="caption" color="text.secondary">
                        Token not found. Please set VITE_GITHUB_TOKEN in .env.local
                    </Typography>
                )}
            </Box>

            {error && <Typography color="error" variant="body2" sx={{ mb: 1 }}>{error}</Typography>}

            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
            }}>
                {loading && files.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <List dense>
                        {path && (
                            <ListItem disablePadding>
                                <ListItemButton onClick={handleGoUp}>
                                    <ListItemIcon>
                                        <ArrowUpwardIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary=".." />
                                </ListItemButton>
                            </ListItem>
                        )}

                        {files.map(file => (
                            <ListItem key={file.sha} disablePadding>
                                <ListItemButton onClick={() => handleNavigate(file)}>
                                    <ListItemIcon>
                                        {file.type === 'dir' ? <FolderIcon fontSize="small" color="primary" /> : <InsertDriveFileIcon fontSize="small" />}
                                    </ListItemIcon>
                                    <ListItemText primary={file.name} />
                                </ListItemButton>
                            </ListItem>
                        ))}

                        {files.length === 0 && !loading && selectedRepo && (
                            <ListItem>
                                <ListItemText primary="No files found" sx={{ textAlign: 'center', color: 'text.secondary' }} />
                            </ListItem>
                        )}
                        {!selectedRepo && (
                            <ListItem>
                                <ListItemText primary="Please select a repository" sx={{ textAlign: 'center', color: 'text.secondary' }} />
                            </ListItem>
                        )}
                    </List>
                )}
            </Box>
        </Box>
    );
}
