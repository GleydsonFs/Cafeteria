// Responsividade e menu mobile para o sistema de pedidos
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos em um dispositivo móvel
    const isMobile = window.innerWidth <= 768;
    
    // Ajustar estilos do botão de carrinho para mobile
    const botaoCarrinho = document.getElementById('botao-carrinho');
    if (botaoCarrinho && isMobile) {
        // Ajustar posição para não sobrepor o botão de WhatsApp
        botaoCarrinho.style.bottom = '170px';
        botaoCarrinho.style.right = '20px';
        botaoCarrinho.style.width = '50px';
        botaoCarrinho.style.height = '50px';
        botaoCarrinho.style.fontSize = '14px';
    }
    
    // Ajustar estilos dos botões de adicionar para mobile
    const botoesAdicionar = document.querySelectorAll('.btn-adicionar-pedido');
    if (isMobile) {
        botoesAdicionar.forEach(botao => {
            botao.style.fontSize = '12px';
            botao.style.padding = '3px 6px';
            botao.style.width = 'auto';
            botao.style.maxWidth = '120px';
        });
    }
    
    // Ajustar modal do carrinho para mobile
    function ajustarModalMobile() {
        const modal = document.getElementById('modal-carrinho');
        if (modal && isMobile) {
            modal.style.width = '90%';
            modal.style.maxHeight = '80vh';
            
            // Ajustar tamanho dos botões no modal
            const botoes = modal.querySelectorAll('button');
            botoes.forEach(botao => {
                botao.style.padding = '6px 10px';
                botao.style.fontSize = '13px';
            });
        }
    }
    
    // Observar mudanças no DOM para ajustar modal quando for criado
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.id === 'modal-carrinho') {
                        ajustarModalMobile();
                    }
                }
            }
        });
    });
    
    observer.observe(document.body, { childList: true });
    
    // Garantir que o menu mobile funcione corretamente
    const btnMenuMob = document.getElementById('btn-menu-mob');
    const menuMobile = document.getElementById('menu-mobile');
    
    if (btnMenuMob && menuMobile) {
        btnMenuMob.addEventListener('click', function() {
            if (menuMobile.style.display === 'block') {
                menuMobile.style.display = 'none';
            } else {
                menuMobile.style.display = 'block';
            }
        });
    }
    
    // Ajustar notificações para mobile
    const notificacaoOriginal = window.mostrarNotificacao;
    if (notificacaoOriginal && isMobile) {
        window.mostrarNotificacao = function(mensagem, tipo) {
            const notificacao = document.createElement('div');
            notificacao.textContent = mensagem;
            notificacao.style.position = 'fixed';
            notificacao.style.bottom = '80px';
            notificacao.style.left = '50%';
            notificacao.style.transform = 'translateX(-50%)';
            notificacao.style.padding = '8px 16px';
            notificacao.style.borderRadius = '4px';
            notificacao.style.zIndex = '1000';
            notificacao.style.fontSize = '13px';
            notificacao.style.maxWidth = '80%';
            notificacao.style.textAlign = 'center';
            
            if (tipo === 'erro') {
                notificacao.style.backgroundColor = '#e74c3c';
            } else {
                notificacao.style.backgroundColor = '#2ecc71';
            }
            notificacao.style.color = '#fff';
            
            document.body.appendChild(notificacao);
            
            setTimeout(() => {
                document.body.removeChild(notificacao);
            }, 3000);
        };
    }
    
    // Ajustar para orientação landscape em dispositivos móveis
    window.addEventListener('orientationchange', function() {
        const botaoCarrinho = document.getElementById('botao-carrinho');
        const modal = document.getElementById('modal-carrinho');
        
        if (window.orientation === 90 || window.orientation === -90) {
            // Landscape
            if (botaoCarrinho) {
                botaoCarrinho.style.bottom = '20px';
                botaoCarrinho.style.right = '20px';
            }
            
            if (modal) {
                modal.style.maxHeight = '70vh';
            }
        } else {
            // Portrait
            if (botaoCarrinho) {
                botaoCarrinho.style.bottom = '170px';
                botaoCarrinho.style.right = '20px';
            }
            
            if (modal) {
                modal.style.maxHeight = '80vh';
            }
        }
    });
});
