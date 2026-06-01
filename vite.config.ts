import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Validate critical environment variables
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  
  // Warn in development if critical vars are missing
  if (mode === 'development') {
    if (!supabaseUrl) {
      console.warn(
        '⚠️  WARNING: VITE_SUPABASE_URL is not set. Supabase features will not work.'
      );
    }
    if (!supabaseKey) {
      console.warn(
        '⚠️  WARNING: VITE_SUPABASE_ANON_KEY is not set. Supabase features will not work.'
      );
    }
  }

  return {
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
    },
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Map NEXT_PUBLIC_ env vars to VITE_ for compatibility with fallback validation
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey || ''),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || ''),
      'import.meta.env.VITE_ENV': JSON.stringify(mode),
    },
  };
});