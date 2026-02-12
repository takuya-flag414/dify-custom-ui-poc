import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

const CommandCenterContainer = ({
  children,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  hasWarning
}) => {
  return (
    <motion.div
      className={`relative w-full rounded-[24px] border border-white/20 dark:border-white/10 overflow-visible transition-colors duration-300
        ${isDragging ? 'bg-blue-50/90 dark:bg-blue-900/30' : 'bg-white/80 dark:bg-[#1c1c1e]/80'}
        ${hasWarning ? 'ring-2 ring-amber-500/50' : ''}
      `}
      layoutRoot
      initial={false}
      animate={{
        backdropFilter: "blur(20px) saturate(180%)",
        boxShadow: isDragging
          ? "0 12px 40px rgba(0, 122, 255, 0.25)"
          : "0 8px 32px rgba(0, 0, 0, 0.12)",
      }}
      style={{
        backdropFilter: "blur(20px) saturate(180%)",
      }}
      transition={springTransition}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm pointer-events-none rounded-[24px]"
          >
            <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
              ファイルをドロップして追加
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default CommandCenterContainer;
