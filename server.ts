import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import productRoutes from "./server/routes/productRoutes";
import { logger } from "./server/utils/logger";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares globais
  app.use(express.json({ limit: '50mb' })); // Aumentado para suportar imagens em base64
  app.use(cors());

  // Rotas da nossa API (Backend Seguro)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Servidor Construshop rodando com segurança!" });
  });

  // Rota de exemplo para o futuro pagamento
  app.post("/api/pagamento", (req, res) => {
    // Aqui no futuro vamos colocar o código do Mercado Pago ou Stripe
    // As chaves secretas ficarão aqui no servidor, protegidas!
    logger.info("Recebendo pedido de pagamento", req.body);
    res.json({ status: "pendente", message: "Integração de pagamento em breve!" });
  });

  // Rotas de Produtos
  app.use("/api/products", productRoutes);

  // Tratamento de Erros Global
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Erro não tratado', err);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  });

  // Vite middleware para o Frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();
