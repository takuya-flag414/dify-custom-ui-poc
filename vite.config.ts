import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: "./",
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@components': resolve(__dirname, 'src/components'),
            '@hooks': resolve(__dirname, 'src/hooks'),
            '@utils': resolve(__dirname, 'src/utils'),
            '@api': resolve(__dirname, 'src/api'),
            '@services': resolve(__dirname, 'src/services'),
            '@types': resolve(__dirname, 'src/types'),
        },
    },
})
