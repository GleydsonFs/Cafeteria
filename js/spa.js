// Navegação SPA (Single Page Application) sem abrir novas abas
document.addEventListener('DOMContentLoaded', function() {
    // Interceptar cliques em links internos
    document.body.addEventListener('click', function(e) {
        // Verificar se o clique foi em um link
        let target = e.target;
        while (target && target !== document.body) {
            if (target.tagName === 'A') {
                // Verificar se é um link interno
                const href = target.getAttribute('href');
                
                // Ignorar links externos, âncoras puras ou links com target="_blank"
                if (!href || href.startsWith('http') || href.startsWith('#') || 
                    target.getAttribute('target') === '_blank' || 
                    href.includes('javascript:') || 
                    e.ctrlKey || e.metaKey) {
                    return;
                }
                
                // Prevenir comportamento padrão
                e.preventDefault();
                
                // Carregar a página via AJAX
                carregarPaginaAjax(href);
                
                // Atualizar URL sem recarregar a página
                window.history.pushState({path: href}, '', href);
                
                return;
            }
            target = target.parentNode;
        }
    });
    
    // Lidar com navegação pelo histórico (botões voltar/avançar)
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.path) {
            carregarPaginaAjax(e.state.path);
        }
    });
    
    // Função para carregar página via AJAX
    function carregarPaginaAjax(url) {
        // Mostrar indicador de carregamento
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.style.position = 'fixed';
        loadingIndicator.style.top = '0';
        loadingIndicator.style.left = '0';
        loadingIndicator.style.width = '100%';
        loadingIndicator.style.height = '3px';
        loadingIndicator.style.backgroundColor = '#d3ad7f';
        loadingIndicator.style.zIndex = '9999';
        loadingIndicator.style.animation = 'loading-animation 1s infinite';
        
        // Adicionar estilo de animação
        const style = document.createElement('style');
        style.textContent = `
            @keyframes loading-animation {
                0% { width: 0; }
                50% { width: 50%; }
                100% { width: 100%; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loadingIndicator);
        
        // Fazer requisição AJAX
        fetch(url)
            .then(response => response.text())
            .then(html => {
                // Criar um DOM temporário para analisar o HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Extrair o conteúdo principal
                const newContent = doc.body.innerHTML;
                
                // Atualizar o título da página
                document.title = doc.title;
                
                // Atualizar o conteúdo da página
                document.body.innerHTML = newContent;
                
                // Recarregar scripts para garantir que os eventos sejam registrados
                const scripts = Array.from(doc.querySelectorAll('script'));
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    
                    // Copiar atributos
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    
                    // Copiar conteúdo inline
                    if (oldScript.innerHTML) {
                        newScript.innerHTML = oldScript.innerHTML;
                    }
                    
                    // Substituir o script antigo
                    if (oldScript.parentNode) {
                        document.body.appendChild(newScript);
                    }
                });
                
                // Carregar scripts do sistema de pedidos
                carregarScriptsPedidos();
                
                // Rolar para o topo
                window.scrollTo(0, 0);
            })
            .catch(error => {
                console.error('Erro ao carregar página:', error);
                // Em caso de erro, redirecionar normalmente
                window.location.href = url;
            })
            .finally(() => {
                // Remover indicador de carregamento
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    document.body.removeChild(loadingIndicator);
                }
            });
    }
    
    // Função para carregar scripts do sistema de pedidos
    function carregarScriptsPedidos() {
        // Carregar script de pedidos
        const scriptPedidos = document.createElement('script');
        scriptPedidos.src = '/js/pedidos.js';
        document.body.appendChild(scriptPedidos);
        
        // Carregar script de responsividade
        const scriptResponsivo = document.createElement('script');
        scriptResponsivo.src = '/js/responsivo.js';
        document.body.appendChild(scriptResponsivo);
        
        // Carregar script de multilíngue
        const scriptMultilingue = document.createElement('script');
        scriptMultilingue.src = '/js/multilingue.js';
        document.body.appendChild(scriptMultilingue);
    }
});
