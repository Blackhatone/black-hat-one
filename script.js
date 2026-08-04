document.addEventListener('DOMContentLoaded', async () => {
    const toggleButton     = document.getElementById('toggleButton');
    const menuContainer    = document.getElementById('menuContainer');
    const menuItems        = document.querySelectorAll('.menu-item');
    const infoModal        = document.getElementById('infoModal');
    const modalContent     = document.getElementById('modalContent');
    const closeModal       = document.getElementById('closeModal');
    const modalTitle       = document.getElementById('modalTitle');
    const carouselContainer = document.getElementById('carouselContainer');
    const modalBody        = document.getElementById('modalBody');

    let servicesData = {};
    let siteConfig = { whatsapp: '+595975634334', email: 'blackhatonemultiservicios@gmail.com', promos: [] };
    let promosData = [];
    let promosShownOnLoad = false;

    function updateGlobalUI() {
        const waLink = document.getElementById('contactWa');
        const emailLink = document.getElementById('contactEmail');
        const socialContainer = document.getElementById('socialLinks');
        
        if (waLink) {
            const cleanPhone = siteConfig.whatsapp.replace(/\+/g, '');
            waLink.href = `https://wa.me/${cleanPhone}`;
            waLink.title = `WhatsApp: ${siteConfig.whatsapp}`;
        }
        if (emailLink) {
            emailLink.href = `mailto:${siteConfig.email}`;
            emailLink.title = `Correo: ${siteConfig.email}`;
        }

        // Renderizar iconos de redes sociales dinámicamente
        if (socialContainer) {
            socialContainer.innerHTML = '';
            if (siteConfig.instagram) {
                socialContainer.innerHTML += `
                    <a href="${siteConfig.instagram}" target="_blank" title="Instagram">
                        <i class='bx bxl-instagram'></i>
                    </a>`;
            }
            if (siteConfig.facebook) {
                socialContainer.innerHTML += `
                    <a href="${siteConfig.facebook}" target="_blank" title="Facebook">
                        <i class='bx bxl-facebook-circle'></i>
                    </a>`;
            }
        }
    }

    // ==================== Estado del carrusel ====================
    window._carousel = { current: 0, total: 0, interval: null };

    window.changeSlide = function(dir) {
        const c = window._carousel;
        c.current = (c.current + dir + c.total) % c.total;
        _updateCarousel();
        resetAutoPlay();
    };

    window.goToSlide = function(index) {
        window._carousel.current = index;
        _updateCarousel();
        resetAutoPlay();
    };

    function _updateCarousel() {
        const track   = document.getElementById('carouselTrack');
        const counter = document.getElementById('carouselCounter');
        if (!track) return;
        const c = window._carousel;
        
        // Mover el track por múltiplos de 100% del ancho del slide
        track.style.transform = `translateX(-${c.current * 100}%)`;
        
        document.querySelectorAll('.carousel-dot').forEach((d, i) =>
            d.classList.toggle('active', i === c.current)
        );
        if (counter) counter.textContent = `${c.current + 1} / ${c.total}`;
    }

    function startAutoPlay() {
        if (window._carousel.total > 1) {
            window._carousel.interval = setInterval(() => {
                const c = window._carousel;
                c.current = (c.current + 1) % c.total;
                _updateCarousel();
            }, 5000);
        }
    }

    function resetAutoPlay() {
        clearInterval(window._carousel.interval);
        startAutoPlay();
    }

    function renderCarousel(images) {
        clearInterval(window._carousel.interval);
        if (!images || images.length === 0) {
            carouselContainer.style.display = 'none';
            carouselContainer.innerHTML = '';
            return;
        }

        // Normalizar datos: convertir todo a objetos {url, description}
        const normalized = [];
        images.forEach(item => {
            if (typeof item === 'string') {
                normalized.push({ url: item, description: '' });
            } else if (item.urls && Array.isArray(item.urls)) {
                // Si tiene un array de URLs, aplanarlo manteniendo la misma descripción
                item.urls.forEach(u => normalized.push({ url: u, description: item.description || '' }));
            } else {
                // Caso normal {url, description}
                normalized.push(item);
            }
        });

        carouselContainer.style.display = 'block';
        window._carousel = { current: 0, total: normalized.length, interval: null };

        const slides = normalized.map(post => `
            <div class="carousel-slide">
                <img src="${post.url}" alt="Ejemplo de trabajo">
                ${post.description ? `<div class="carousel-caption">${post.description}</div>` : ''}
            </div>
        `).join('');

        if (normalized.length === 1) {
            carouselContainer.innerHTML = `
                <div class="carousel-wrapper">
                    <div class="carousel-track">
                        ${slides}
                    </div>
                </div>`;
            return;
        }

        const dots = normalized.map((_, i) =>
            `<span class="carousel-dot${i === 0 ? ' active' : ''}" onclick="goToSlide(${i})"></span>`
        ).join('');

        carouselContainer.innerHTML = `
            <div class="carousel-wrapper">
                <div class="carousel-track" id="carouselTrack">${slides}</div>
                <button class="carousel-btn prev" onclick="changeSlide(-1)">&#8249;</button>
                <button class="carousel-btn next" onclick="changeSlide(1)">&#8250;</button>
            </div>
            <div class="carousel-dots">${dots}</div>
            <div class="carousel-counter" id="carouselCounter">1 / ${normalized.length}</div>`;
        
        startAutoPlay();
    }

    // ==================== Menú Toggle ====================
    toggleButton.addEventListener('click', () => {
        menuContainer.classList.toggle('active');
    });

    // ==================== Inicialización Global ====================
    async function handleVisitorCount(allData) {
        try {
            const visitorRow = allData.find(s => s.id === '__visitor_count__');
            let currentCount = (visitorRow && visitorRow.content) ? parseInt(visitorRow.content) : 0;
            currentCount++;

            const newVisitorRow = {
                id: '__visitor_count__',
                title: 'Visitor Count',
                content: currentCount.toString(),
                icon: 'bx-user',
                images: []
            };

            await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: [newVisitorRow] })
            });
        } catch (e) {
            console.error("Error en contador:", e);
        }
    }

    async function init() {
        try {
            const res = await fetch('/api/services');
            if (res.ok) {
                const json = await res.json();
                if (json && json.data && json.data.length > 0) {
                    applyServicesData(json.data);
                    handleVisitorCount(json.data);
                    return;
                }
            }
            console.warn('Cargando respaldo local desde data.json...');
            fetch('./data.json').then(r => r.json()).then(d => { if (d && d.services) applyServicesData(d.services); });
        } catch (err) {
            console.error('Error conectando a /api/services, usando respaldo local:', err);
            fetch('./data.json').then(r => r.json()).then(d => { if (d && d.services) applyServicesData(d.services); });
        }
    }

    init();

    // ==================== Aplicar datos y Renderizar Menú ====================
    function applyServicesData(data) {
        servicesData = {};
        const menuServices = [];

        // 1. Extraer configuración global primero
        const configRow = data.find(s => s.id === '__site_config__');
        if (configRow) {
            try { 
                const parsed = typeof configRow.content === 'string' ? JSON.parse(configRow.content) : configRow.content;
                if (parsed) siteConfig = parsed;
                updateGlobalUI();
                // Cargar promos
                promosData = siteConfig.promos || [];
                if (!promosShownOnLoad && promosData.some(p => p.active)) {
                    promosShownOnLoad = true;
                    setTimeout(() => showIntroPromos(), 1500);
                }
            } catch(e) { console.error("Error al aplicar configuración:", e); }
        }

        // 2. Extraer contador de visitas
        const countRow = data.find(s => s.id === '__visitor_count__');
        if (countRow) {
            const countDisplay = document.getElementById('countVal');
            if (countDisplay) {
                const newCount = countRow.content.toString().padStart(6, '0');
                if (countDisplay.textContent !== newCount) {
                    countDisplay.textContent = newCount;
                    countDisplay.classList.add('count-update');
                    setTimeout(() => countDisplay.classList.remove('count-update'), 500);
                }
            }
        }

        // 3. Mapear servicios y preparar lista para el menú
        data.forEach(service => { 
            if (service.id !== '__site_config__' && service.id !== '__visitor_count__') {
                if (typeof service.images === 'string') {
                    try { service.images = JSON.parse(service.images); } catch(e) { service.images = []; }
                }
                if (!Array.isArray(service.images)) service.images = [];
                servicesData[service.id] = service;
                menuServices.push(service);
            }
        });

        // 3. Aplicar orden personalizado si existe
        if (siteConfig.categoryOrder && siteConfig.categoryOrder.length > 0) {
            menuServices.sort((a, b) => {
                const indexA = siteConfig.categoryOrder.indexOf(a.id);
                const indexB = siteConfig.categoryOrder.indexOf(b.id);
                // Si no está en la lista de orden, mandarlo al final
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
        }

        renderMenuIcons(menuServices);
    }

    function renderMenuIcons(servicesList) {
        // Limpiar items existentes
        const existingItems = menuContainer.querySelectorAll('.menu-item');
        existingItems.forEach(item => item.remove());

        servicesList.forEach((s, idx) => {
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.style.setProperty('--i', idx);
            item.setAttribute('data-target', s.id);
            item.setAttribute('data-tooltip', s.title);
            
            // Alternar lados para la animación slideIn
            const side = (idx % 2 === 0) ? 'left' : 'right';
            item.setAttribute('data-side', side);
            
            item.innerHTML = `<i class='bx ${s.icon || 'bx-cube'}'></i>`;
            
            item.addEventListener('click', () => { openServiceModal(s.id); });
            
            menuContainer.appendChild(item);
        });
    }

    function openServiceModal(targetId) {
        const serviceInfo = servicesData[targetId];
        if (!serviceInfo) return;

        modalTitle.textContent = serviceInfo.title;
        const cleanPhone = siteConfig.whatsapp.replace(/\+/g, '');
        
        // Verificar si hay promos activas para mostrar el botón
        const hasActivePromos = promosData.some(p => p.active);
        const promoBtnHTML = hasActivePromos ? 
            `<button class="cta-promos-btn" onclick="window._openPromosFromModal()" title="Ver Promociones Disponibles">
                <i class='bx bx-purchase-tag-alt'></i> Consulte Promociones
            </button>` : '';
        
        modalBody.innerHTML = (serviceInfo.content || '<p>Contenido no disponible.</p>') + 
            `<div class="modal-actions-row">
                ${promoBtnHTML}
                <a href="https://wa.me/${cleanPhone}" target="_blank" class="cta-whatsapp" title="Solicitar Presupuesto por WhatsApp">
                    <i class='bx bxl-whatsapp'></i>
                </a>
            </div>`;

        // Armar array de imágenes
        let serviceImages = serviceInfo.images;
        if (typeof serviceImages === 'string') {
            try { serviceImages = JSON.parse(serviceImages); } catch(e) { serviceImages = []; }
        }

        let images = [];
        if (Array.isArray(serviceImages) && serviceImages.length > 0) {
            images = serviceImages;
        } else if (serviceInfo.image) {
            images = [serviceInfo.image];
        }
        renderCarousel(images);

        // Determinar lado basado en la posición actual o data-attribute
        const triggerItem = menuContainer.querySelector(`.menu-item[data-target="${targetId}"]`);
        const side = triggerItem ? triggerItem.getAttribute('data-side') : 'left';
        
        modalContent.className = 'modal-content cyber-card panel-' + side;
        infoModal.classList.add('transparent-back');
        infoModal.style.display = 'flex';
        menuContainer.classList.remove('active');
    }

    // ==================== Cerrar panel ====================
    closeModal.addEventListener('click', () => { infoModal.style.display = 'none'; });

    window.addEventListener('click', (e) => {
        if (e.target === infoModal) infoModal.style.display = 'none';
    });

    // ==================== Sistema de Promociones Flotantes ====================
    const promosOverlay = document.getElementById('promosOverlay');
    const promosCloseBtn = document.getElementById('promosCloseBtn');

    function renderPromoCards(promos) {
        const activePromos = promos.filter(p => p.active);
        if (activePromos.length === 0) {
            promosOverlay.innerHTML = '';
            return;
        }

        const cleanPhone = siteConfig.whatsapp.replace(/\+/g, '');

        promosOverlay.innerHTML = activePromos.map(promo => `
            <div class="promo-card">
                <span class="promo-badge">PROMO</span>
                <div class="promo-card-image">
                    ${promo.image 
                        ? `<img src="${promo.image}" alt="${promo.title || 'Promoción'}">`
                        : `<div class="promo-placeholder"><i class='bx bx-purchase-tag-alt'></i></div>`
                    }
                </div>
                <div class="promo-card-body">
                    ${promo.title ? `<div class="promo-card-title">${promo.title}</div>` : ''}
                    ${promo.description ? `<div class="promo-card-desc">${promo.description}</div>` : ''}
                    ${promo.price ? `<div class="promo-card-price">${promo.price}</div>` : ''}
                    <a href="https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hola! Me interesa la promo: ' + (promo.title || 'Promoción'))}" target="_blank" class="promo-wa-btn">
                        <i class='bx bxl-whatsapp'></i> Consultar
                    </a>
                </div>
            </div>
        `).join('');
    }

    // Animación inicial al cargar la página (se muestran 5 segundos y desaparecen)
    function showIntroPromos() {
        renderPromoCards(promosData);
        const cards = promosOverlay.querySelectorAll('.promo-card');
        if (cards.length === 0) return;

        // Entrada
        cards.forEach(c => c.classList.add('intro-enter'));

        // Salida después de 5 segundos
        setTimeout(() => {
            cards.forEach(c => {
                c.classList.remove('intro-enter');
                c.classList.add('intro-exit');
            });
            // Limpiar después de la animación de salida
            setTimeout(() => {
                promosOverlay.innerHTML = '';
                promosOverlay.classList.remove('active');
            }, 800);
        }, 5000);
    }

    // Abrir promos desde el botón del modal de servicio
    window._openPromosFromModal = function() {
        // Cerrar el modal de servicio
        infoModal.style.display = 'none';
        
        // Renderizar y mostrar promos
        renderPromoCards(promosData);
        promosOverlay.classList.add('active', 'with-backdrop');
        promosCloseBtn.classList.add('visible');
        
        // Animar entrada
        setTimeout(() => {
            promosOverlay.querySelectorAll('.promo-card').forEach(c => c.classList.add('visible'));
        }, 50);
    };

    // Cerrar promos (botón X)
    promosCloseBtn.addEventListener('click', closePromos);
    promosOverlay.addEventListener('click', (e) => {
        if (e.target === promosOverlay) closePromos();
    });

    function closePromos() {
        promosOverlay.querySelectorAll('.promo-card').forEach(c => c.classList.remove('visible'));
        setTimeout(() => {
            promosOverlay.classList.remove('active', 'with-backdrop');
            promosCloseBtn.classList.remove('visible');
            promosOverlay.innerHTML = '';
        }, 500);
    }

    // ==================== Fondo de Hexágonos (Canvas) ====================
    const canvas = document.getElementById('hexCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const hexSize = 25; // Tamaño del lado

        function drawHexGrid() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            ctx.strokeStyle = 'rgba(196, 255, 0, 0.08)';
            ctx.lineWidth = 1;

            const hexWidth = Math.sqrt(3) * hexSize;
            const hexHeight = 2 * hexSize;
            const vertDist = hexHeight * 0.75;
            const horizDist = hexWidth;

            // Dibujar una cuadrícula de hexágonos entrelazados
            for (let y = 0; y < canvas.height + hexHeight; y += vertDist) {
                const isEven = Math.round(y / vertDist) % 2 === 0;
                const xOffset = isEven ? 0 : horizDist / 2;
                for (let x = 0; x < canvas.width + hexWidth; x += horizDist) {
                    drawHexagon(ctx, x + xOffset, y, hexSize);
                }
            }
        }

        function drawHexagon(ctx, x, y, size) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                // 30 grados de rotación para "pointy top"
                const angle = (Math.PI / 180) * (60 * i - 30);
                const px = x + size * Math.cos(angle);
                const py = y + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }

        drawHexGrid();
        window.addEventListener('resize', drawHexGrid);
    }
});
