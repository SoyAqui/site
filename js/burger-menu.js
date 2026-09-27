// Бургер-меню
document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = document.querySelector('.burger-menu');
    const mainNav = document.querySelector('.main-nav');
    
    if (burgerMenu && mainNav) {
        burgerMenu.addEventListener('click', function() {
            const isActive = this.classList.toggle('active');
            mainNav.classList.toggle('active');
            this.setAttribute('aria-expanded', isActive);
        });
        
        // Закрыть меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!burgerMenu.contains(e.target) && !mainNav.contains(e.target)) {
                burgerMenu.classList.remove('active');
                mainNav.classList.remove('active');
                burgerMenu.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Закрыть меню при клике на ссылку
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                burgerMenu.classList.remove('active');
                mainNav.classList.remove('active');
                burgerMenu.setAttribute('aria-expanded', 'false');
            });
        });
    }
});
