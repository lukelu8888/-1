
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'hono@4': 'hono',
        'figma:asset/f3d557c4db1f8e6758ad3b445050bc79712a44d7.png': path.resolve(__dirname, './src/assets/f3d557c4db1f8e6758ad3b445050bc79712a44d7.png'),
        'figma:asset/e3f17a67e02946dc6667a2ab1d9a0e3e4b5c74d4.png': path.resolve(__dirname, './src/assets/e3f17a67e02946dc6667a2ab1d9a0e3e4b5c74d4.png'),
        'figma:asset/d05a768ad03cf9724be73608024eaea836fca1a8.png': path.resolve(__dirname, './src/assets/d05a768ad03cf9724be73608024eaea836fca1a8.png'),
        'figma:asset/b3d077ae61f60718774042148488db58fe0fef8b.png': path.resolve(__dirname, './src/assets/b3d077ae61f60718774042148488db58fe0fef8b.png'),
        'figma:asset/abcf1deabe9a15f0256b8fa939bf83b64999e03e.png': path.resolve(__dirname, './src/assets/abcf1deabe9a15f0256b8fa939bf83b64999e03e.png'),
        'figma:asset/9f6ce029d040cf60e23a103732b61615c3bba3e2.png': path.resolve(__dirname, './src/assets/9f6ce029d040cf60e23a103732b61615c3bba3e2.png'),
        'figma:asset/9a3a6ac3157cb3341dbd6e007c72e203e4dda5ea.png': path.resolve(__dirname, './src/assets/9a3a6ac3157cb3341dbd6e007c72e203e4dda5ea.png'),
        'figma:asset/96ce897684bf626f176c96b9ce387073b6485b82.png': path.resolve(__dirname, './src/assets/96ce897684bf626f176c96b9ce387073b6485b82.png'),
        'figma:asset/8b8f9232f60a2046628bfa02ab68d1e507203f48.png': path.resolve(__dirname, './src/assets/8b8f9232f60a2046628bfa02ab68d1e507203f48.png'),
        'figma:asset/449e8b06677bf9fe72121dddbf7d74e0acb94025.png': path.resolve(__dirname, './src/assets/449e8b06677bf9fe72121dddbf7d74e0acb94025.png'),
        'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png': path.resolve(__dirname, './src/assets/410810351d2b1fef484ded221d682af920f7ac14.png'),
        'figma:asset/3b125683eb3b428987bfb96d06a1a120a650267e.png': path.resolve(__dirname, './src/assets/3b125683eb3b428987bfb96d06a1a120a650267e.png'),
        'figma:asset/26367985c980ce30b777ba7adde790055c901cb7.png': path.resolve(__dirname, './src/assets/26367985c980ce30b777ba7adde790055c901cb7.png'),
        'figma:asset/262d7b2c13569c77ce921a39b3150003bd6f7975.png': path.resolve(__dirname, './src/assets/262d7b2c13569c77ce921a39b3150003bd6f7975.png'),
        'figma:asset/10750d4fe5459959d5f7e17851160e90519488f9.png': path.resolve(__dirname, './src/assets/10750d4fe5459959d5f7e17851160e90519488f9.png'),
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'date-fns@4.1.0': 'date-fns',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
        '@jsr/supabase__supabase-js@2': '@jsr/supabase__supabase-js',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react';
              if (id.includes('recharts')) return 'vendor-recharts';
              if (id.includes('@radix-ui')) return 'vendor-radix';
              if (id.includes('lucide-react')) return 'vendor-lucide';
              if (id.includes('date-fns')) return 'vendor-date-fns';
              return 'vendor';
            }
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        // Local dev: forward frontend `/api/*` to Laravel backend
        '/api': {
          target: 'https://api.cosunchina.com',
          changeOrigin: true,
        },
      },
    },
  });