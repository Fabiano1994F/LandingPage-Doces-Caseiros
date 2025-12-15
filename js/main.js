document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleção de Elementos DOM e Determinação do Contexto
    
    // Elemento global, presente em ambas as páginas (index.html e carrinho.html)
    const cartCountSpan = document.getElementById('cart-count');
    // Elementos presentes apenas na página principal (index.html)
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    // Determina se estamos na página dedicada ao carrinho
    const isCartPage = document.querySelector('.page-carrinho') !== null;
    
    // Elementos Específicos da Página do Carrinho (usados apenas se isCartPage for true)
    const cartItemsContainer = isCartPage ? document.getElementById('cart-items-page') : null;
    const cartTotalSpan = isCartPage ? document.getElementById('cart-total-page') : null;
    const checkoutBtn = isCartPage ? document.getElementById('checkout-btn-page') : null;
    const cartSubtotalSpan = isCartPage ? document.getElementById('cart-subtotal') : null; 

    // 2. Variável de Estado do Carrinho
    let cart = []; // Array que armazena os objetos dos itens

    // 3. Funções Utilitárias
    
    // Carrega o carrinho do LocalStorage
    function loadCart() {
        const storedCart = localStorage.getItem('docesCart');
        if (storedCart) {
            cart = JSON.parse(storedCart);
        }
        renderCart();
    }

    // Salva o carrinho no LocalStorage
    function saveCart() {
        localStorage.setItem('docesCart', JSON.stringify(cart));
    }

    // Formata um número para moeda brasileira
    function formatCurrency(value) {
        const numValue = parseFloat(value) || 0; 
        return numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // 4. Lógica Principal do Carrinho

    // Adiciona um item ao carrinho
    function addItemToCart(item) {
        const existingItem = cart.find(i => i.id === item.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            const price = parseFloat(item.price);
            cart.push({ ...item, price: price, quantity: 1 });
        }
        saveCart();
        renderCart();
    }

    // Atualiza a quantidade ou remove o item
    function updateCartItem(itemId, action) {
        const itemIndex = cart.findIndex(i => i.id === itemId);

        if (itemIndex > -1) {
            if (action === 'increment') {
                cart[itemIndex].quantity++;
            } else if (action === 'decrement') {
                cart[itemIndex].quantity--;
                // Remove o item se a quantidade chegar a zero
                if (cart[itemIndex].quantity < 1) {
                    cart.splice(itemIndex, 1);
                }
            } else if (action === 'remove') {
                cart.splice(itemIndex, 1);
            }
            saveCart();
            renderCart();
        }
    }

    // Renderiza a lista de itens, o contador e o total
    function renderCart() {
        let total = 0;
        let itemCount = 0;

        if (cart.length > 0) {
             cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                itemCount += item.quantity;
             });
        }
        
        // --- Lógica Comum: Atualiza o contador no cabeçalho ---
        cartCountSpan.textContent = itemCount; 

        // --- Lógica Específica da Página do Carrinho (carrinho.html) ---
        if (isCartPage) {
            cartItemsContainer.innerHTML = ''; // Limpa a lista atual

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">O carrinho está vazio.</p>';
                checkoutBtn.disabled = true;
            } else {
                cart.forEach(item => {
                    const itemTotal = item.price * item.quantity;

                    const cartItemDiv = document.createElement('div');
                    cartItemDiv.classList.add('cart-item');
                    
                    // HTML adaptado para a listagem da página de carrinho
                    cartItemDiv.innerHTML = `
                        <div class="item-details">
                            <p class="item-name">${item.name}</p>
                            <p>${formatCurrency(item.price)} cada</p>
                        </div>
                        <div class="item-controls">
                            <button data-id="${item.id}" data-action="decrement" aria-label="Diminuir quantidade">-</button>
                            <span class="item-quantity">${item.quantity}</span>
                            <button data-id="${item.id}" data-action="increment" aria-label="Aumentar quantidade">+</button>
                            <button data-id="${item.id}" data-action="remove" class="remove-item-btn" aria-label="Remover item completo">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="item-total-price">
                             ${formatCurrency(itemTotal)}
                        </div>
                    `;
                    cartItemsContainer.appendChild(cartItemDiv);
                });
                checkoutBtn.disabled = false;
            }

            // Atualiza resumo da página de carrinho
            cartSubtotalSpan.textContent = formatCurrency(total);
            cartTotalSpan.textContent = formatCurrency(total);
        }
    }

    // 5. Lógica de Checkout (WhatsApp)
    function generateWhatsAppMessage() {
        if (cart.length === 0) return;

        let message = "Olá! Gostaria de fazer o seguinte pedido do Ki Doce:\n\n";
        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            message += `${index + 1}. ${item.quantity}x ${item.name} (Subtotal: ${formatCurrency(itemTotal)})\n`;
        });

        message += `\n*TOTAL GERAL: ${formatCurrency(total)}*`;
        message += "\n\nPor favor, confirme a disponibilidade e o valor do frete. Agradeço!";
        
        // DICA: Substitua pelo seu número de telefone (com código do país e DDD)
        const phoneNumber = "5511900000000"; 
        const encodedMessage = encodeURIComponent(message);
        
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    }

    // 6. Configuração de Event Listeners

    // Botões "Adicionar ao Carrinho" (apenas na página principal)
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const item = {
                id: e.currentTarget.dataset.id,
                name: e.currentTarget.dataset.name,
                price: parseFloat(e.currentTarget.dataset.price) 
            };
            addItemToCart(item);
            // Opcional: Redirecionar após adicionar o primeiro item (para o cliente ver o que fez)
            // window.location.href = 'carrinho.html'; 
        });
    });

    // Delegacão de eventos (apenas na página do carrinho)
    if (isCartPage) {
        cartItemsContainer.addEventListener('click', (e) => {
            const target = e.target;
            // Busca o botão mais próximo, caso o clique tenha sido no ícone (fas fa-trash)
            const button = target.closest('button');

            if (button) {
                const itemId = button.dataset.id;
                const action = button.dataset.action;

                if (action === 'increment' || action === 'decrement' || action === 'remove') {
                    updateCartItem(itemId, action);
                }
            }
        });

        // Botão Finalizar Pedido
        checkoutBtn.addEventListener('click', generateWhatsAppMessage);
    }

    // Inicializa o carrinho ao carregar a página
    loadCart();
});