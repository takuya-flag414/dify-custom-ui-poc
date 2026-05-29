import React from 'react';
import { motion } from 'framer-motion';

interface FavoriteButtonProps {
    isFavorite: boolean;
    onClick: (e: React.MouseEvent) => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ isFavorite, onClick }) => {
    return (
        <motion.button
            className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
            onClick={onClick}
            whileTap={{ scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            title={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
        >
            {isFavorite ? '★' : '☆'}
        </motion.button>
    );
};

export default FavoriteButton;
