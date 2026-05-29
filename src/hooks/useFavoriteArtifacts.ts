import { useState, useEffect } from 'react';

const STORAGE_KEY = 'favorites_artifacts';

export const useFavoriteArtifacts = () => {
    const [favorites, setFavorites] = useState<string[]>([]);

    // 初期マウント時にlocalStorageからロード
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setFavorites(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load favorites', e);
        }
    }, []);

    // お気に入りの切り替え
    const toggleFavorite = (id: string) => {
        let limitExceeded = false;
        
        setFavorites(prev => {
            let nextFavorites;
            if (prev.includes(id)) {
                nextFavorites = prev.filter(f => f !== id);
            } else {
                // すでに4個登録されている場合はブロック
                if (prev.length >= 4) {
                    limitExceeded = true;
                    return prev;
                }
                nextFavorites = [...prev, id];
            }
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFavorites));
            } catch (e) {
                console.error('Failed to load favorites', e);
            }
            return nextFavorites;
        });

        // 上限に達している場合は警告を表示
        if (limitExceeded) {
            alert('お気に入りは最大4個まで登録可能です。');
        }
    };

    return { favorites, toggleFavorite };
};
