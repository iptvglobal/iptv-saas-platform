import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For production, we use process.cwd() which is /app on Railway
// For development, we use the project root
function getProjectRoot(): string {
  if (process.env.NODE_ENV === "production") {
    return process.cwd();
  }
  // In development, go up from server/_core to project root
  return path.resolve(__dirname, "..", "..");
}

export async function setupVite(app: Express, server: Server) {
  // Dynamic import for vite config to avoid bundling issues
  const projectRoot = getProjectRoot();
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    root: path.resolve(projectRoot, "client"),
    configFile: false,
    server: serverOptions,
    appType: "custom",
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "client", "src"),
        "@shared": path.resolve(projectRoot, "shared"),
        "@assets": path.resolve(projectRoot, "attached_assets"),
      },
    },
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.join(projectRoot, "client", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production on Railway, the dist/public folder is at /app/dist/public
  // The esbuild output goes to /app/dist/index.js and static files to /app/dist/public
  const projectRoot = getProjectRoot();
  const distPath = path.join(projectRoot, "dist", "public");
  
  console.log(`[Static] Serving static files from: ${distPath}`);
  console.log(`[Static] Project root: ${projectRoot}`);
  console.log(`[Static] NODE_ENV: ${process.env.NODE_ENV}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.join(distPath, "index.html");
    console.log(`[Static] Serving index.html from: ${indexPath}`);
    res.sendFile(indexPath);
  });
}
