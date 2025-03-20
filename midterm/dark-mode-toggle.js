document.addEventListener('DOMContentLoaded', function() {
    const toggleInput = document.getElementById('dark-mode-toggle');
    const toggleIcon = document.querySelector('.toggle-icon');
    const toggleText = document.querySelector('.toggle-text');
    
    //this actually saves user prefences for dark or light mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedMode = localStorage.getItem('darkMode');
    
    if (savedMode === 'dark' || (savedMode === null && prefersDarkMode)) {
        enableDarkMode();
        toggleInput.checked = true;
    }

    // snippet of code I learned 
    //can use the querySelector to select all icons with the .game-icon img class and replace their
    //img srcs with an alternate photo
    
    function switchCardIcons(toDark) {
        const cardIcons = document.querySelectorAll('.game-icon img');
        cardIcons.forEach(icon => {
            const currentSrc = icon.src;
            if (toDark && !currentSrc.includes('cards-neon')) {
                icon.src = currentSrc.replace('cards-icon.png', 'cards-neon.png');
            } 
            else if (!toDark && currentSrc.includes('cards-neon')) {
                icon.src = currentSrc.replace('cards-neon.png', 'cards-icon.png');
            }
        });
    }


        
    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'dark');
        toggleIcon.innerHTML = '☀️';
        toggleText.textContent = 'Light Mode';
        switchCardIcons(true);
    }
    
    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'light');
        toggleIcon.innerHTML = '🌙';
        toggleText.textContent = 'Dark Mode';
        switchCardIcons(false);
    }
    
    toggleInput.addEventListener('change', function() {
        if (this.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });
    
    console.log("Dark mode toggle script loaded");
});