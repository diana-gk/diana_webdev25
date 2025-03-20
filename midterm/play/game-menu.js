document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const gameArea = document.getElementById('gameArea');
        
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('hidden');
            gameArea.classList.toggle('full');
            
            const icon = menuToggle.querySelector('img');
            if (sidebar.classList.contains('hidden')) {
            } else {
            }
        });
    });
