import { app, connectToDatabase } from "../server.js";

let databaseReady;

export default async function handler(request, response) {
  try {
    databaseReady ||= connectToDatabase();
    await databaseReady;
    return app(request, response);
  } catch (error) {
    databaseReady = null;
    console.error("Falha ao conectar ao MongoDB:", error);
    return response.status(503).json({ erro: "Serviço de dados temporariamente indisponível." });
  }
}
