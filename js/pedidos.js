// Integração do sistema de pedidos com o backend
document.addEventListener("DOMContentLoaded", function () {
  // Verificar se o Socket.IO está disponível
  if (typeof io === "undefined") {
    // Carregar Socket.IO dinamicamente se não estiver disponível
    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.5.0/socket.io.min.js";
    script.onload = inicializarIntegracao;
    document.head.appendChild(script);
  } else {
    inicializarIntegracao();
  }

  // Função para inicializar a integração com o backend
  function inicializarIntegracao() {
    // Configurações
    const config = {
      botaoEstilo: {
        backgroundColor: "#d3ad7f",
        color: "##d3ad7f",
        border: "none",
        borderRadius: "4px",
        padding: "4px 8px",
        fontSize: "14px",
        cursor: "pointer",
        margin: "5px 0",
        display: "block",
        width: "auto",
      },
      carrinhoEstilo: {
  position: "fixed",
  bottom: "100px",
  right: "20px",
  backgroundColor: "transparent",
  color: "#d3ad7f",
  border: "none",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
  boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
  zIndex: "999",
},
       // Adicionado estilo para o contador dentro do botão do carrinho
      contadorEstilo: {
          position: "absolute",
          top: "-5px",
          right: "-5px",
          backgroundColor: "red",
          color: "white",
          borderRadius: "50%",
          width: "22px",
          height: "22px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "12px",
          fontWeight: "bold",
      },
      modalEstilo: {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#13131a",
        border: "1px solid #d3ad7f",
        borderRadius: "8px",
        padding: "20px",
        zIndex: "1000",
        maxWidth: "90%",
        width: "400px",
        maxHeight: "80vh",
        overflowY: "auto",
        color: "#fff",
        boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
      },
      overlayEstilo: {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: "999",
      },
    };

    // Estado da aplicação
    let carrinho = [];
    let mesaAtual = localStorage.getItem("mesaAtual") || "";

    // Conectar ao servidor Socket.IO
    const socket = io();

    // Inicialização
    inicializarBotoesPedido();
    inicializarCarrinho();

    // *** CORREÇÃO: Listeners para confirmação e erro do pedido via Socket ***
    socket.on("pedido_recebido", (data) => {
      console.log("Confirmação de pedido recebida:", data);
      if (data.success) {
        limparCarrinho(); // Limpa o carrinho local
        fecharModalCarrinho(); // Fecha o modal do carrinho
        mostrarConfirmacaoPedido(data.mesa); // Mostra a mensagem de sucesso
      } else {
        // Caso o backend retorne um erro específico na confirmação
        mostrarNotificacao(
          data.message || "Houve um problema ao confirmar seu pedido.",
          "erro"
        );
        // Reabilita o botão de finalizar
        const btnFinalizar = document.getElementById("btn-finalizar");
        if (btnFinalizar) {
          btnFinalizar.disabled = false;
          btnFinalizar.textContent = "Finalizar Pedido";
        }
      }
    });

    socket.on("pedido_erro", (data) => {
      console.error("Erro ao enviar pedido via socket:", data.message);
      mostrarNotificacao(`Erro ao enviar pedido: ${data.message}`, "erro");
      // Reabilita o botão de finalizar
      const btnFinalizar = document.getElementById("btn-finalizar");
      if (btnFinalizar) {
        btnFinalizar.disabled = false;
        btnFinalizar.textContent = "Finalizar Pedido";
      }
    });

    // Função para inicializar botões de pedido (Mantida Original)
    function inicializarBotoesPedido() {
      const elementosPreco = document.querySelectorAll("h9");
      elementosPreco.forEach((elemento) => {
        const linhaPrato = elemento.closest(".linha-prato");
        if (!linhaPrato) return;
        const nomeProduto =
          linhaPrato.querySelector("h4")?.textContent.trim() || "Produto";
        const descricaoProduto =
          linhaPrato.querySelector("h5")?.textContent.trim() || "";
        const textoPreco = elemento.textContent.trim();
        const precoMatch = textoPreco.match(/R\$\s*(\d+[.,]\d+)/);
        const preco = precoMatch ? parseFloat(precoMatch[1].replace(",", ".")) : 0;
        const codigoMatch =
          linhaPrato.querySelector(".codigo_prato")?.textContent.match(/(\d+)/) || [
            "",
            "",
          ];
        const codigoProduto = codigoMatch[1];
        const botaoAdicionar = document.createElement("button");
        botaoAdicionar.textContent = "Adicionar ao pedido";
        botaoAdicionar.className = "btn-adicionar-pedido";
        Object.assign(botaoAdicionar.style, config.botaoEstilo);
        botaoAdicionar.addEventListener("click", function () {
          adicionarAoCarrinho({
            id: codigoProduto,
            nome: nomeProduto,
            descricao: descricaoProduto,
            preco: preco,
          });
        });
        elemento.insertAdjacentElement("afterend", botaoAdicionar);
      });
    }

    // Função para inicializar o carrinho (com contador)
    function inicializarCarrinho() {
  const botaoCarrinho = document.createElement("div");
  botaoCarrinho.id = "botao-carrinho";
  // Ícone SVG do carrinho de compras
  botaoCarrinho.innerHTML = `
    <svg id="carrinho-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3 6H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span id="contador-carrinho">0</span>
  `;
  
  Object.assign(botaoCarrinho.style, config.carrinhoEstilo);

  // Estiliza o contador
  const contadorSpan = botaoCarrinho.querySelector("#contador-carrinho");
  Object.assign(contadorSpan.style, config.contadorEstilo);
  contadorSpan.style.display = "none";

  // Estiliza o ícone SVG para centralizar
  const carrinhoIcon = botaoCarrinho.querySelector("#carrinho-icon");
  carrinhoIcon.style.display = "block";
  carrinhoIcon.style.margin = "0 auto";

  botaoCarrinho.addEventListener("click", abrirModalCarrinho);
  document.body.appendChild(botaoCarrinho);
  
  const carrinhoSalvo = localStorage.getItem("carrinho");
  if (carrinhoSalvo) {
    try {
      carrinho = JSON.parse(carrinhoSalvo);
      atualizarContadorCarrinho();
    } catch (e) {
      console.error("Erro ao carregar carrinho:", e);
      carrinho = [];
    }
  }
}

    // Função para adicionar produto ao carrinho (Mantida)
    function adicionarAoCarrinho(produto) {
      const index = carrinho.findIndex((item) => item.id === produto.id);
      if (index !== -1) {
        carrinho[index].quantidade += 1;
      } else {
        carrinho.push({
          ...produto,
          quantidade: 1,
        });
      }
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      atualizarContadorCarrinho();
      mostrarNotificacao("Produto adicionado ao carrinho!");
    }

    // Função para atualizar contador do carrinho (Ajustada para mostrar/esconder)
    function atualizarContadorCarrinho() {
      const contador = document.getElementById("contador-carrinho");
      if (contador) {
        const total = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
        contador.textContent = total.toString();
        // Mostra o contador apenas se houver itens
        contador.style.display = total > 0 ? "flex" : "none";
      }
    }

    // Função para abrir modal do carrinho (Mantida)
    function abrirModalCarrinho() {
      const overlay = document.createElement("div");
      overlay.id = "overlay-carrinho";
      Object.assign(overlay.style, config.overlayEstilo);
      const modal = document.createElement("div");
      modal.id = "modal-carrinho";
      Object.assign(modal.style, config.modalEstilo);
      modal.innerHTML = `
                <h2 style="color: #d3ad7f; text-align: center; margin-bottom: 20px;">Seu Pedido</h2>
                <div id="itens-carrinho" style="margin-bottom: 20px;">
                    ${renderizarItensCarrinho()}
                </div>
                <div style="margin: 15px 0; padding-top: 15px; border-top: 1px solid #333;">
                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                        <span>Total:</span>
                        <span>R$ ${calcularTotal().toFixed(2)}</span>
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="mesa-numero" style="display: block; margin-bottom: 5px;">Número da Mesa:</label>
                    <input type="number" id="mesa-numero" value="${mesaAtual}" min="1" style="width: 100%; padding: 8px; background-color: #222; color: #fff; border: 1px solid #444; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="observacoes" style="display: block; margin-bottom: 5px;">Observações:</label>
                    <textarea id="observacoes" style="width: 100%; padding: 8px; background-color: #222; color: #fff; border: 1px solid #444; border-radius: 4px; min-height: 80px;"></textarea>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                    <button id="btn-limpar" style="padding: 8px 15px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Limpar</button>
                    <button id="btn-fechar" style="padding: 8px 15px; background-color: #555; color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
                    <button id="btn-finalizar" style="padding: 8px 15px; background-color: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer;" ${carrinho.length === 0 ? "disabled" : ""}>Finalizar Pedido</button>
                </div>
            `;
      document.body.appendChild(overlay);
      document.body.appendChild(modal);
      document.getElementById("btn-limpar").addEventListener("click", limparCarrinho);
      document.getElementById("btn-fechar").addEventListener("click", fecharModalCarrinho);
      document.getElementById("btn-finalizar").addEventListener("click", finalizarPedido);
      document.getElementById("mesa-numero").addEventListener("change", function () {
        mesaAtual = this.value;
        localStorage.setItem("mesaAtual", mesaAtual);
      });
      adicionarEventosBotoesQuantidade();
      overlay.addEventListener("click", fecharModalCarrinho);
    }

    // Função para adicionar eventos aos botões de quantidade e remover (Refatorada para evitar duplicidade)
    function adicionarEventosBotoesQuantidade() {
        document.querySelectorAll(".btn-aumentar").forEach((btn) => {
            const index = parseInt(btn.dataset.index);
            const newBtn = btn.cloneNode(true); // Clona para remover listeners antigos
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener("click", () => {
                carrinho[index].quantidade += 1;
                atualizarCarrinho();
            });
        });

        document.querySelectorAll(".btn-diminuir").forEach((btn) => {
            const index = parseInt(btn.dataset.index);
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener("click", () => {
                if (carrinho[index].quantidade > 1) {
                    carrinho[index].quantidade -= 1;
                    atualizarCarrinho();
                }
            });
        });

        document.querySelectorAll(".btn-remover").forEach((btn) => {
            const index = parseInt(btn.dataset.index);
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener("click", () => {
                carrinho.splice(index, 1);
                atualizarCarrinho();
            });
        });
    }

    // Função para renderizar itens do carrinho (Ajustada para incluir data-index)
    function renderizarItensCarrinho() {
      if (carrinho.length === 0) {
        return '<p style="text-align: center; color: #aaa;">Seu carrinho está vazio</p>';
      }
      return carrinho
        .map(
          (item, index) => `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #333;">
                    <div style="flex-grow: 1;">
                        <div style="font-weight: bold;">${item.nome}</div>
                        <div style="font-size: 14px; color: #aaa;">R$ ${item.preco.toFixed(2)}</div>
                    </div>
                    <div style="display: flex; align-items: center; margin: 0 10px;">
                        <button class="btn-diminuir" data-index="${index}" style="width: 25px; height: 25px; background-color: #333; color: #fff; border: none; border-radius: 50%; cursor: pointer;">-</button>
                        <span style="margin: 0 10px;">${item.quantidade}</span>
                        <button class="btn-aumentar" data-index="${index}" style="width: 25px; height: 25px; background-color: #333; color: #fff; border: none; border-radius: 50%; cursor: pointer;">+</button>
                    </div>
                    <div style="min-width: 70px; text-align: right;">
                        R$ ${(item.preco * item.quantidade).toFixed(2)}
                    </div>
                    <button class="btn-remover" data-index="${index}" style="margin-left: 10px; background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 16px;">×</button>
                </div>
            `
        )
        .join("");
    }

    // Função para calcular total do carrinho (Mantida)
    function calcularTotal() {
      return carrinho.reduce(
        (total, item) => total + item.preco * item.quantidade,
        0
      );
    }

    // Função para atualizar carrinho (chamada após +/-/remover)
    function atualizarCarrinho() {
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      atualizarContadorCarrinho();
      const modal = document.getElementById("modal-carrinho");
      if (modal) {
        const itensCarrinho = document.getElementById("itens-carrinho");
        if (itensCarrinho) {
          itensCarrinho.innerHTML = renderizarItensCarrinho();
        }
        const totalElement = modal.querySelector(
          'div[style*="justify-content: space-between"] span:last-child'
        );
        if (totalElement) {
          totalElement.textContent = `R$ ${calcularTotal().toFixed(2)}`;
        }
        const btnFinalizar = document.getElementById("btn-finalizar");
        if (btnFinalizar) {
          btnFinalizar.disabled = carrinho.length === 0;
        }
        // Readiciona os eventos após renderizar novamente
        adicionarEventosBotoesQuantidade();
      }
    }

    // Função para limpar carrinho (Mantida)
    function limparCarrinho() {
      carrinho = [];
      localStorage.removeItem("carrinho");
      atualizarCarrinho(); // Atualiza a interface (modal e contador)
    }

    // Função para fechar modal do carrinho (Mantida)
    function fecharModalCarrinho() {
      const modal = document.getElementById("modal-carrinho");
      const overlay = document.getElementById("overlay-carrinho");
      if (modal && document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
      if (overlay && document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }

    // *** CORREÇÃO: Função para finalizar pedido usando Socket.IO ***
    function finalizarPedido() {
      const mesaNumeroInput = document.getElementById("mesa-numero");
      const observacoesInput = document.getElementById("observacoes");
      const mesaNumero = mesaNumeroInput ? mesaNumeroInput.value.trim() : "";
      const observacoes = observacoesInput ? observacoesInput.value.trim() : "";

      if (!mesaNumero || isNaN(parseInt(mesaNumero)) || parseInt(mesaNumero) <= 0) {
        mostrarNotificacao("Por favor, informe um número de mesa válido.", "erro");
        return;
      }
      if (carrinho.length === 0) {
        mostrarNotificacao("Seu carrinho está vazio", "erro");
        return;
      }
      const total = calcularTotal();

      // Emitir evento para o servidor via Socket.IO
      socket.emit("enviar_pedido", {
        mesa: parseInt(mesaNumero),
        itens: carrinho,
        observacoes: observacoes,
        total: total,
      });

      // Desabilitar botão e mostrar feedback visual
      const btnFinalizar = document.getElementById("btn-finalizar");
      if (btnFinalizar) {
        btnFinalizar.disabled = true;
        btnFinalizar.textContent = "Enviando...";
      }
      // A confirmação ou erro será tratada pelos listeners socket.on("pedido_recebido") e socket.on("pedido_erro")
    }

    // Função para mostrar notificação (toast) (Mantida)
    function mostrarNotificacao(mensagem, tipo = "sucesso") {
      const notificacao = document.createElement("div");
      notificacao.textContent = mensagem;
      notificacao.style.position = "fixed";
      notificacao.style.bottom = "20px";
      notificacao.style.left = "50%";
      notificacao.style.transform = "translateX(-50%)";
      notificacao.style.padding = "10px 20px";
      notificacao.style.borderRadius = "4px";
      notificacao.style.zIndex = "1001";
      if (tipo === "erro") {
        notificacao.style.backgroundColor = "#e74c3c";
      } else {
        // Cor padrão para sucesso ou informação
        notificacao.style.backgroundColor = "#2ecc71";
      }
      notificacao.style.color = "#fff";
      document.body.appendChild(notificacao);
      setTimeout(() => {
        if (document.body.contains(notificacao)) {
          document.body.removeChild(notificacao);
        }
      }, 3000);
    }

    // *** CORREÇÃO: Função para mostrar confirmação de pedido (modal) ***
    function mostrarConfirmacaoPedido(mesa) {
      // Garante que o modal do carrinho esteja fechado
      fecharModalCarrinho();

      // Cria overlay
      const overlay = document.createElement("div");
      overlay.id = "overlay-confirmacao";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
      overlay.style.zIndex = "1001";

      // Cria modal de confirmação
      const modal = document.createElement("div");
      modal.id = "modal-confirmacao";
      modal.style.position = "fixed";
      modal.style.top = "50%";
      modal.style.left = "50%";
      modal.style.transform = "translate(-50%, -50%)";
      modal.style.backgroundColor = "#13131a";
      modal.style.border = "1px solid #d3ad7f";
      modal.style.borderRadius = "8px";
      modal.style.padding = "20px";
      modal.style.zIndex = "1002";
      modal.style.maxWidth = "90%";
      modal.style.width = "400px";
      modal.style.textAlign = "center";
      modal.style.color = "#fff";

      // Conteúdo do modal com a mensagem solicitada
      modal.innerHTML = `
                <h2 style="color: #d3ad7f; margin-bottom: 20px;">Pedido Realizado!</h2>
                <p>Seu pedido foi enviado com sucesso para a mesa ${mesa}.</p>
                <p>Um atendente virá até você em breve.</p>
                <button id="btn-confirmacao-ok" style="padding: 10px 20px; background-color: #d3ad7f; color: #fff; border: none; border-radius: 4px; margin-top: 20px; cursor: pointer;">OK</button>
            `;

      // Adiciona ao DOM
      document.body.appendChild(overlay);
      document.body.appendChild(modal);

      // Função para fechar o modal de confirmação
      const fecharConfirmacao = () => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      };

      // Adiciona eventos para fechar
      const button = modal.querySelector("#btn-confirmacao-ok");
      button.addEventListener("click", fecharConfirmacao);
      overlay.addEventListener("click", fecharConfirmacao);
    }
  }
});

