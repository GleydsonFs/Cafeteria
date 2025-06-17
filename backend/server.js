// Backend para sistema de pedidos da cafeteria
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Configuração do servidor
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
// Servir arquivos estáticos da raiz do projeto (onde estão css, js, img)
app.use(express.static(path.join(__dirname, "..")));
// Servir arquivos específicos do backend/templates se necessário (embora atendente.html seja servido por rota)
// app.use("/templates", express.static(path.join(__dirname, "templates")));

// Configurações
const PORT = process.env.PORT || 5000;
const PEDIDOS_FILE = path.join(__dirname, "data", "pedidos.json");

// Garantir que o diretório de dados existe
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
}

// Inicializar arquivo de pedidos se não existir
if (!fs.existsSync(PEDIDOS_FILE)) {
  fs.writeFileSync(PEDIDOS_FILE, JSON.stringify([]));
}

// Funções auxiliares
function loadPedidos() {
  try {
    const data = fs.readFileSync(PEDIDOS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao carregar pedidos:", error);
    return [];
  }
}

function savePedidos(pedidos) {
  try {
    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
    return true;
  } catch (error) {
    console.error("Erro ao salvar pedidos:", error);
    return false;
  }
}

function generateOrderId() {
  // Gera um ID um pouco mais único, embora não garantido globalmente
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Função para converter pedidos para CSV
function convertToCSV(pedidos) {
  if (!pedidos || pedidos.length === 0) {
    return "";
  }

  // Cabeçalho do CSV
  const header = [
    "ID Pedido",
    "Mesa",
    "Data",
    "Status",
    "Itens",
    "Observações",
    "Total",
  ];
  const rows = pedidos.map((pedido) => {
    const itensString = pedido.itens
      .map((item) => `${item.quantidade}x ${item.nome}`)
      .join(", ");
    const dataFormatada = new Date(pedido.data).toLocaleString("pt-BR");
    return [
      `"${pedido.id}"`, // Aspas para garantir que IDs não sejam interpretados como números
      pedido.mesa,
      `"${dataFormatada}"`,
      `"${pedido.status}"`,
      `"${itensString}"`,
      `"${pedido.observacoes || ""}"`,
      pedido.total.toFixed(2),
    ].join(",");
  });

  return [header.join(","), ...rows].join("\n");
}

// Rotas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.get("/cardapio.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "cardapio.html"));
});

// Rota para o painel do atendente
app.get("/atendente", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "atendente.html"));
});

// API para pedidos
app.get("/api/pedidos", (req, res) => {
  const pedidos = loadPedidos();
  res.json(pedidos);
});

// Rota POST /api/pedidos (Mantida para referência, mas o envio principal será via socket)
app.post("/api/pedidos", (req, res) => {
  try {
    const pedidos = loadPedidos();
    const novoPedido = {
      id: generateOrderId(),
      mesa: req.body.mesa,
      itens: req.body.itens,
      observacoes: req.body.observacoes || "",
      status: "pendente",
      data: new Date().toISOString(),
      total: req.body.total,
    };

    pedidos.unshift(novoPedido);
    if (savePedidos(pedidos)) {
      // io.emit("novo_pedido", novoPedido); // Movido para o handler do socket
      res.status(201).json({ success: true, pedido: novoPedido });
    } else {
      throw new Error("Falha ao salvar pedido");
    }
  } catch (error) {
    console.error("Erro ao criar pedido via POST:", error);
    res.status(500).json({ success: false, message: "Erro ao processar pedido" });
  }
});

app.put("/api/pedidos/:id/status", (req, res) => {
  try {
    const pedidos = loadPedidos();
    const { id } = req.params;
    const { status } = req.body;

    const pedidoIndex = pedidos.findIndex((p) => p.id === id);

    if (pedidoIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Pedido não encontrado" });
    }

    pedidos[pedidoIndex].status = status;

    if (savePedidos(pedidos)) {
      io.emit("status_atualizado", {
        id,
        status,
        mesa: pedidos[pedidoIndex].mesa,
      });
      res.json({ success: true, pedido: pedidos[pedidoIndex] });
    } else {
      throw new Error("Falha ao salvar atualização de status");
    }
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    res.status(500).json({ success: false, message: "Erro ao atualizar status" });
  }
});

// --- Rota para Exportar Histórico --- 
app.get("/api/historico/exportar", (req, res) => {
  try {
    const pedidos = loadPedidos();
    const { periodo } = req.query; // "dia", "semana", "mes"
    const agora = new Date();
    let pedidosFiltrados = [];

    // Filtrar pedidos com base no período
    pedidosFiltrados = pedidos.filter((pedido) => {
      const dataPedido = new Date(pedido.data);
      // Considerar apenas pedidos "entregue" ou todos para o histórico?
      // Vamos considerar todos por enquanto, pode ser ajustado.
      // if (pedido.status !== "entregue") return false;

      if (periodo === "dia") {
        return dataPedido.toDateString() === agora.toDateString();
      } else if (periodo === "semana") {
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay()); // Vai para o último domingo
        inicioSemana.setHours(0, 0, 0, 0);
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 7);
        return dataPedido >= inicioSemana && dataPedido < fimSemana;
      } else if (periodo === "mes") {
        return (
          dataPedido.getFullYear() === agora.getFullYear() &&
          dataPedido.getMonth() === agora.getMonth()
        );
      } else {
        // Se nenhum período válido for fornecido, exporta tudo
        return true;
      }
    });

    // Ordenar por data (mais recentes primeiro)
    pedidosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

    // Converter para CSV
    const csvData = convertToCSV(pedidosFiltrados);

    // Definir nome do arquivo
    const filename = `historico_pedidos_${periodo || "completo"}_${agora.toISOString().split("T")[0]}.csv`;

    // Configurar headers para download
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Enviar dados CSV
    res.status(200).send(Buffer.from(csvData, "utf-8")); // Garante UTF-8
  } catch (error) {
    console.error("Erro ao exportar histórico:", error);
    res.status(500).json({ success: false, message: "Erro ao exportar histórico" });
  }
});

// Socket.IO para comunicação em tempo real
io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);

  // Enviar pedidos existentes (apenas não entregues para o painel principal)
  const pedidosAtuais = loadPedidos().filter((p) => p.status !== "entregue");
  socket.emit("pedidos_iniciais", pedidosAtuais);

  // *** CORREÇÃO: Listener para receber pedidos do cliente via socket ***
  socket.on("enviar_pedido", (data) => {
    console.log("Pedido recebido via socket:", data);
    try {
      const pedidos = loadPedidos();
      const novoPedido = {
        id: generateOrderId(),
        mesa: data.mesa,
        itens: data.itens,
        observacoes: data.observacoes || "",
        status: "pendente",
        data: new Date().toISOString(),
        total: data.total,
      };

      pedidos.unshift(novoPedido);

      if (savePedidos(pedidos)) {
        // Notificar TODOS os clientes (incluindo painel) sobre o novo pedido
        io.emit("novo_pedido", novoPedido);
        console.log(
          `Novo pedido ${novoPedido.id} da mesa ${novoPedido.mesa} enviado para todos.`
        );

        // Enviar confirmação APENAS para o cliente que enviou o pedido
        socket.emit("pedido_recebido", {
          success: true,
          mesa: novoPedido.mesa,
          pedidoId: novoPedido.id,
        });
        console.log(`Confirmação enviada para o cliente ${socket.id}`);
      } else {
        throw new Error("Falha ao salvar pedido recebido via socket");
      }
    } catch (error) {
      console.error("Erro ao processar pedido via socket:", error);
      // Enviar erro de volta para o cliente que enviou
      socket.emit("pedido_erro", {
        success: false,
        message: "Erro interno ao processar seu pedido.",
      });
    }
  });

  // Lógica de atualização de status via socket (já existente)
  socket.on("atualizar_status", (data) => {
    try {
      const pedidos = loadPedidos();
      const pedidoIndex = pedidos.findIndex((p) => p.id === data.id);

      if (pedidoIndex !== -1) {
        pedidos[pedidoIndex].status = data.status;
        if (savePedidos(pedidos)) {
          // Notificar todos os clientes sobre a atualização
          io.emit("status_atualizado", {
            id: data.id,
            status: data.status,
            mesa: pedidos[pedidoIndex].mesa,
          });
          console.log(
            `Status do pedido ${data.id} atualizado para ${data.status}`
          );
        } else {
          console.error("Falha ao salvar atualização de status via socket");
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar status via socket:", error);
    }
  });

  // Cliente desconectado
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Iniciar servidor
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

