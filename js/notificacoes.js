// Sistema de notificações em tempo real para cafeteria
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o Socket.IO está disponível
    if (typeof io === 'undefined') {
        // Carregar Socket.IO dinamicamente se não estiver disponível
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.5.0/socket.io.min.js';
        script.onload = inicializarNotificacoes;
        document.head.appendChild(script);
    } else {
        inicializarNotificacoes();
    }

    // Função para inicializar o sistema de notificações
    function inicializarNotificacoes() {
        // Configurações
        const config = {
            soundEnabled: true,
            notificacoes: [],
            maxNotificacoes: 5,
            somNotificacao: new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
        };

        // Conectar ao servidor Socket.IO
        const socket = io();

        // Eventos Socket.IO
        socket.on('connect', () => {
            console.log('Cliente conectado ao servidor de notificações');
        });

        // Receber confirmação de pedido
        socket.on('pedido_confirmado', (data) => {
            if (data.success) {
                // Mostrar confirmação de pedido
                mostrarConfirmacaoPedido(data.pedido.mesa);
                
                // Limpar carrinho
                if (window.limparCarrinho) {
                    window.limparCarrinho();
                }
                
                // Fechar modal do carrinho
                if (window.fecharModalCarrinho) {
                    window.fecharModalCarrinho();
                }
            } else {
                // Mostrar erro
                if (window.mostrarNotificacao) {
                    window.mostrarNotificacao(data.message || 'Erro ao processar pedido', 'erro');
                } else {
                    alert(data.message || 'Erro ao processar pedido');
                }
            }
        });

        // Receber atualizações de status de pedido
        socket.on('status_atualizado', (data) => {
            // Verificar se a atualização é para a mesa atual
            const mesaAtual = localStorage.getItem('mesaAtual');
            if (mesaAtual && mesaAtual === data.mesa) {
                // Mostrar notificação de atualização de status
                const statusTexto = {
                    'pendente': 'Pedido recebido',
                    'preparando': 'Seu pedido está sendo preparado',
                    'pronto': 'Seu pedido está pronto',
                    'entregue': 'Pedido entregue'
                };
                
                if (window.mostrarNotificacao) {
                    window.mostrarNotificacao(statusTexto[data.status] || `Status atualizado: ${data.status}`);
                }
            }
        });

        // Sobrescrever a função de finalizar pedido para usar Socket.IO
        if (window.finalizarPedido) {
            const finalizarPedidoOriginal = window.finalizarPedido;
            
            window.finalizarPedido = function() {
                const mesaNumero = document.getElementById('mesa-numero').value;
                const observacoes = document.getElementById('observacoes').value;
                
                if (!mesaNumero) {
                    if (window.mostrarNotificacao) {
                        window.mostrarNotificacao('Por favor, informe o número da mesa', 'erro');
                    } else {
                        alert('Por favor, informe o número da mesa');
                    }
                    return;
                }
                
                if (window.carrinho && window.carrinho.length === 0) {
                    if (window.mostrarNotificacao) {
                        window.mostrarNotificacao('Seu carrinho está vazio', 'erro');
                    } else {
                        alert('Seu carrinho está vazio');
                    }
                    return;
                }
                
                // Calcular total
                const total = window.calcularTotal ? window.calcularTotal() : 
                    window.carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
                
                // Enviar pedido via Socket.IO
                socket.emit('enviar_pedido', {
                    mesa: mesaNumero,
                    itens: window.carrinho,
                    observacoes: observacoes,
                    total: total
                });
                
                // Mostrar indicador de carregamento
                const btnFinalizar = document.getElementById('btn-finalizar');
                if (btnFinalizar) {
                    const textoOriginal = btnFinalizar.textContent;
                    btnFinalizar.disabled = true;
                    btnFinalizar.textContent = 'Enviando...';
                    
                    // Restaurar botão após 3 segundos se não receber confirmação
                    setTimeout(() => {
                        if (btnFinalizar.textContent === 'Enviando...') {
                            btnFinalizar.disabled = false;
                            btnFinalizar.textContent = textoOriginal;
                        }
                    }, 3000);
                }
            };
        }

        // Função para mostrar confirmação de pedido
        function mostrarConfirmacaoPedido(mesa) {
            // Criar overlay
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
            overlay.style.zIndex = '1001';
            
            // Criar modal
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '50%';
            modal.style.left = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.backgroundColor = '#13131a';
            modal.style.border = '1px solid #d3ad7f';
            modal.style.borderRadius = '8px';
            modal.style.padding = '20px';
            modal.style.zIndex = '1002';
            modal.style.maxWidth = '90%';
            modal.style.width = '400px';
            modal.style.textAlign = 'center';
            modal.style.color = '#fff';
            
            // Conteúdo do modal
            modal.innerHTML = `
                <h2 style="color: #d3ad7f; margin-bottom: 20px;">Pedido Realizado!</h2>
                <p>Seu pedido foi enviado com sucesso para a mesa ${mesa}.</p>
                <p>Um atendente virá até você em breve.</p>
                <button style="padding: 10px 20px; background-color: #d3ad7f; color: #fff; border: none; border-radius: 4px; margin-top: 20px; cursor: pointer;">OK</button>
            `;
            
            // Adicionar elementos ao DOM
            document.body.appendChild(overlay);
            document.body.appendChild(modal);
            
            // Adicionar evento ao botão
            const button = modal.querySelector('button');
            button.addEventListener('click', () => {
                document.body.removeChild(overlay);
                document.body.removeChild(modal);
            });
            
            // Fechar ao clicar no overlay
            overlay.addEventListener('click', () => {
                document.body.removeChild(overlay);
                document.body.removeChild(modal);
            });
        }
    }
});
