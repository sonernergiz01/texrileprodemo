import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // API isteklerini logla
  if (path.startsWith("/api")) {
    // Gizli bilgileri (şifreler vb.) içermeyen versiyon için bir kopya oluştur
    const requestBody = req.body ? { ...req.body } : {};
    
    // Potansiyel hassas verileri maske
    if (requestBody.password) requestBody.password = "***";
    if (requestBody.token) requestBody.token = "***";
    
    console.log(`\n📥 API REQUEST: ${req.method} ${path}`);
    if (Object.keys(requestBody).length > 0) {
      console.log(`📦 REQUEST BODY: ${JSON.stringify(requestBody, null, 2)}`);
    }
    if (Object.keys(req.query).length > 0) {
      console.log(`🔍 QUERY PARAMS: ${JSON.stringify(req.query, null, 2)}`);
    }
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Yanıt durumuna göre emoji belirle
      let statusEmoji = "✅";
      if (res.statusCode >= 400) statusEmoji = "❌";
      else if (res.statusCode >= 300) statusEmoji = "⚠️";
      
      let logLine = `${statusEmoji} API RESPONSE: ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Yanıtı kısa şekilde logla
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        if (responseStr.length > 500) {
          logLine += ` :: ${responseStr.slice(0, 500)}...`;
        } else {
          logLine += ` :: ${responseStr}`;
        }
      }

      log(logLine);
      
      // Hata durumlarında tam yanıtı konsola yaz
      if (res.statusCode >= 400 && capturedJsonResponse) {
        console.error(`❌ ERROR RESPONSE (${res.statusCode}): ${JSON.stringify(capturedJsonResponse, null, 2)}`);
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Detaylı hata bilgisi oluştur
    const errorDetail = {
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      status,
      message,
      stack: app.get("env") === "development" ? err.stack : undefined,
    };
    
    // Hataların konsola daha detaylı yazılması
    console.error(`\n❌ SERVER ERROR (${status}): ${message}`);
    console.error(`📌 ${req.method} ${req.path}`);
    if (err.stack && app.get("env") === "development") {
      console.error(`🔍 STACK TRACE:\n${err.stack}`);
    }
    
    // İstemciye daha bilgilendirici hata mesajı gönder
    res.status(status).json({ 
      message,
      error: app.get("env") === "development" ? errorDetail : undefined
    });
    
    // Express 5'te, hatalar içeriden ele alınır, bu nedenle fırlatmamıza gerek yok
    // ve böylece uygulama çökmez 
    // throw err; 
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
