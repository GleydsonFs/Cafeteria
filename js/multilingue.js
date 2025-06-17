// Sistema multilíngue sem alterar o layout visual
document.addEventListener('DOMContentLoaded', function() {
    // Configurações
    const config = {
        idiomas: {
            'pt': 'Português',
            'en': 'English',
            'es': 'Español'
        },
        idiomaAtual: localStorage.getItem('idioma') || 'pt',
        seletorEstilo: {
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: '999',
            backgroundColor: '#d3ad7f',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        },
        dropdownEstilo: {
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '5px',
            backgroundColor: '#13131a',
            border: '1px solid #d3ad7f',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: '1000',
            display: 'none'
        },
        opcaoEstilo: {
            padding: '8px 12px',
            color: '#fff',
            cursor: 'pointer',
            display: 'block',
            whiteSpace: 'nowrap'
        }
    };

    // Traduções
    const traducoes = {
        'pt': {
            'navbar': {
                'inicio': 'Início',
                'cardapio': 'Cardápio',
                'avaliacoes': 'Avaliações',
                'espaco': 'Nosso Espaço',
                'endereco': 'Endereço e Funcionamento'
            },
            'botoes': {
                'adicionar': 'Adicionar ao pedido',
                'peca': 'PEÇA O SEU'
            },
            'carrinho': {
                'titulo': 'Seu Pedido',
                'vazio': 'Seu carrinho está vazio',
                'total': 'Total',
                'mesa': 'Número da Mesa',
                'observacoes': 'Observações',
                'limpar': 'Limpar',
                'fechar': 'Fechar',
                'finalizar': 'Finalizar Pedido'
            },
            'notificacoes': {
                'adicionado': 'Produto adicionado ao carrinho!',
                'mesa_requerida': 'Por favor, informe o número da mesa',
                'carrinho_vazio': 'Seu carrinho está vazio',
                'pedido_sucesso': 'Pedido Realizado!',
                'pedido_enviado': 'Seu pedido foi enviado com sucesso para a mesa',
                'atendente_breve': 'Um atendente virá até você em breve.'
            }
        },
        'en': {
            'navbar': {
                'inicio': 'Home',
                'cardapio': 'Menu',
                'avaliacoes': 'Reviews',
                'espaco': 'Our Space',
                'endereco': 'Address & Hours'
            },
            'botoes': {
                'adicionar': 'Add to order',
                'peca': 'ORDER NOW'
            },
            'carrinho': {
                'titulo': 'Your Order',
                'vazio': 'Your cart is empty',
                'total': 'Total',
                'mesa': 'Table Number',
                'observacoes': 'Notes',
                'limpar': 'Clear',
                'fechar': 'Close',
                'finalizar': 'Place Order'
            },
            'notificacoes': {
                'adicionado': 'Product added to cart!',
                'mesa_requerida': 'Please enter your table number',
                'carrinho_vazio': 'Your cart is empty',
                'pedido_sucesso': 'Order Placed!',
                'pedido_enviado': 'Your order has been successfully sent to table',
                'atendente_breve': 'A server will come to you shortly.'
            }
        },
        'es': {
            'navbar': {
                'inicio': 'Inicio',
                'cardapio': 'Menú',
                'avaliacoes': 'Reseñas',
                'espaco': 'Nuestro Espacio',
                'endereco': 'Dirección y Horarios'
            },
            'botoes': {
                'adicionar': 'Añadir al pedido',
                'peca': 'PÍDELO'
            },
            'carrinho': {
                'titulo': 'Tu Pedido',
                'vazio': 'Tu carrito está vacío',
                'total': 'Total',
                'mesa': 'Número de Mesa',
                'observacoes': 'Observaciones',
                'limpar': 'Limpiar',
                'fechar': 'Cerrar',
                'finalizar': 'Finalizar Pedido'
            },
            'notificacoes': {
                'adicionado': '¡Producto añadido al carrito!',
                'mesa_requerida': 'Por favor, ingrese el número de mesa',
                'carrinho_vazio': 'Tu carrito está vacío',
                'pedido_sucesso': '¡Pedido Realizado!',
                'pedido_enviado': 'Tu pedido ha sido enviado con éxito a la mesa',
                'atendente_breve': 'Un camarero vendrá a ti en breve.'
            }
        }
    };

    inicializarSeletorIdiomas();
    aplicarTraducoes();

    function inicializarSeletorIdiomas() {
        const seletor = document.createElement('div');
        seletor.id = 'seletor-idioma';
        Object.assign(seletor.style, config.seletorEstilo);
        seletor.textContent = config.idiomas[config.idiomaAtual];

        const dropdown = document.createElement('div');
        dropdown.id = 'dropdown-idioma';
        Object.assign(dropdown.style, config.dropdownEstilo);

        Object.keys(config.idiomas).forEach(idioma => {
            const opcao = document.createElement('div');
            opcao.textContent = config.idiomas[idioma];
            Object.assign(opcao.style, config.opcaoEstilo);

            if (idioma === config.idiomaAtual) {
                opcao.style.backgroundColor = '#333';
                opcao.style.fontWeight = 'bold';
            }

            opcao.addEventListener('click', () => {
                trocarIdioma(idioma);
                seletor.textContent = config.idiomas[idioma];
                dropdown.style.display = 'none';
            });

            opcao.addEventListener('mouseover', () => {
                if (idioma !== config.idiomaAtual) opcao.style.backgroundColor = '#333';
            });

            opcao.addEventListener('mouseout', () => {
                if (idioma !== config.idiomaAtual) opcao.style.backgroundColor = 'transparent';
            });

            dropdown.appendChild(opcao);
        });

        seletor.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });

        seletor.appendChild(dropdown);
        document.body.appendChild(seletor);
    }

    function trocarIdioma(idioma) {
        config.idiomaAtual = idioma;
        localStorage.setItem('idioma', idioma);
        aplicarTraducoes();
    }

    function aplicarTraducoes() {
        const t = traducoes[config.idiomaAtual];
        if (!t) return;

        document.querySelectorAll('.navbar a').forEach(link => {
    const href = link.getAttribute('href');

    // Atualiza o texto e o href de acordo com a página
    if (href && (href.includes('index.html') || href === '/')) {
        link.textContent = t.navbar.inicio;
        link.setAttribute('href', 'index.html');
    } else if (href && (href.includes('#menu') || href.includes('cardapio.html'))) {
        link.textContent = t.navbar.cardapio;
        link.setAttribute('href', 'index.html#menu');
    } else if (href && href.includes('#review')) {
        link.textContent = t.navbar.avaliacoes;
        link.setAttribute('href', 'index.html#review');
    } else if (href && (href.includes('#space') || href.includes('#espaco'))) {
        link.textContent = t.navbar.espaco;
        link.setAttribute('index.html#space');
        
    } else if (href && href.includes('#address')) {
        link.textContent = t.navbar.endereco;
        link.setAttribute('index.html#address');
    }
});


        document.querySelectorAll('.btn-adicionar-pedido').forEach(btn => {
            btn.textContent = t.botoes.adicionar;
        });

        document.querySelectorAll('.btn-menu').forEach(btn => {
            btn.textContent = t.botoes.peca;
        });

        const modalCarrinho = document.getElementById('modal-carrinho');
        if (modalCarrinho) {
            const titulo = modalCarrinho.querySelector('h2');
            if (titulo) titulo.textContent = t.carrinho.titulo;

            const vazio = modalCarrinho.querySelector('#itens-carrinho p');
            if (vazio && vazio.textContent.includes('vazio')) vazio.textContent = t.carrinho.vazio;

            const totalLabel = modalCarrinho.querySelector('div[style*="justify-content: space-between"] span:first-child');
            if (totalLabel) totalLabel.textContent = t.carrinho.total + ':';

            const mesa = modalCarrinho.querySelector('label[for="mesa-numero"]');
            if (mesa) mesa.textContent = t.carrinho.mesa + ':';

            const obs = modalCarrinho.querySelector('label[for="observacoes"]');
            if (obs) obs.textContent = t.carrinho.observacoes + ':';

            const limpar = document.getElementById('btn-limpar');
            if (limpar) limpar.textContent = t.carrinho.limpar;

            const fechar = document.getElementById('btn-fechar');
            if (fechar) fechar.textContent = t.carrinho.fechar;

            const finalizar = document.getElementById('btn-finalizar');
            if (finalizar) finalizar.textContent = t.carrinho.finalizar;
        }

        const modais = document.querySelectorAll('div[style*="z-index: 1002"]');
        modais.forEach(modal => {
            const titulo = modal.querySelector('h2');
            if (titulo && titulo.textContent.includes('Pedido')) {
                titulo.textContent = t.notificacoes.pedido_sucesso;

                const ps = modal.querySelectorAll('p');
                if (ps.length >= 2) {
                    const match = ps[0].textContent.match(/\d+/);
                    const mesa = match ? match[0] : '';
                    ps[0].textContent = `${t.notificacoes.pedido_enviado} ${mesa}.`;
                    ps[1].textContent = t.notificacoes.atendente_breve;
                }
            }
        });

        if (window.mostrarNotificacao) {
            const original = window.mostrarNotificacao;
            window.mostrarNotificacao = function(msg, tipo) {
                if (msg.includes('adicionado ao carrinho')) msg = t.notificacoes.adicionado;
                else if (msg.includes('informe o número da mesa')) msg = t.notificacoes.mesa_requerida;
                else if (msg.includes('carrinho está vazio')) msg = t.notificacoes.carrinho_vazio;
                original(msg, tipo);
            };
        }
    }

    const observer = new MutationObserver(function(mutations) {
        let atualizar = false;
        mutations.forEach(m => {
            if (m.addedNodes.length > 0) {
                m.addedNodes.forEach(node => {
                    if (node.id === 'modal-carrinho' || node.classList?.contains('btn-adicionar-pedido')) {
                        atualizar = true;
                    }
                });
            }
        });
        if (atualizar) aplicarTraducoes();
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
