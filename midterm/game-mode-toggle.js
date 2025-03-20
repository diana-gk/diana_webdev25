// Refactored Game Mode Toggle for HTML-defined dropdowns
document.addEventListener('DOMContentLoaded', function() {
    const learnButton = document.querySelector('.L');
    const playButton = document.querySelector('.P');
    const gameIcons = document.querySelectorAll('.game-icon');
    const learnBaseUrl = 'learn/';
    
    const games = {
        'Durak': 'durak',
        'Cabo': 'cabo',
        'Bullshit': 'bullshit',
        'Spades': 'spades',
        'Go Fish': 'go-fish',
        'Spit': 'spit',
        'Palace': 'palace',
        'Crazy 8\'s': 'crazy-eights',
        'Spider': 'spider'
    };
    
    let currentMode = '';
    let isInitialized = false;
    
    function closeAllDropdowns() {
        document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
    
    function setMode(mode) {
        // Skip if mode hasn't changed after initialization
        if (mode === currentMode && isInitialized) return;
        
        isInitialized = true;
        currentMode = mode;
        
        document.body.classList.remove('learn-mode', 'play-mode');
        learnButton.classList.remove('active-mode');
        playButton.classList.remove('active-mode');
        
        if (mode === 'learn') {
            learnButton.classList.add('active-mode');
            document.body.classList.add('learn-mode');
        } else { // 'play' mode
            playButton.classList.add('active-mode');
            document.body.classList.add('play-mode');
        }
        
        updateGameLinks(mode);
        closeAllDropdowns();
    }
    
    function updateGameLinks(mode) {
        const isLearnMode = mode === 'learn';
        const baseUrl = isLearnMode ? learnBaseUrl : '';
        
        gameIcons.forEach(gameIcon => {
            const link = gameIcon.querySelector('a');
            const gameName = link.textContent.trim();
            const gamePath = games[gameName] || gameName.toLowerCase().replace(/\s+/g, '-');
            
            link.href = isLearnMode ? baseUrl + gamePath + '.html' : '#';
            
            const dropdown = gameIcon.querySelector('.dropdown-content');
            if (dropdown) {
                dropdown.style.display = isLearnMode ? 'none' : '';
            }
            
            gameIcon.classList.remove('learn-style', 'play-style');
            gameIcon.classList.add(isLearnMode ? 'learn-style' : 'play-style');
        });
    }
    
    gameIcons.forEach(gameIcon => {
        const link = gameIcon.querySelector('a');
        
        link.addEventListener('click', function(e) {
            // Only handle clicks if we're in play mode
            if (currentMode === 'play') {
                e.preventDefault(); // Prevent default navigation
                
                const dropdown = this.parentNode.querySelector('.dropdown-content');
                if (dropdown) {
                    dropdown.classList.toggle('show');
                    
                    // Close all other open dropdowns
                    document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
                        if (openDropdown !== dropdown) {
                            openDropdown.classList.remove('show');
                        }
                    });
                }
            }
        });
    });
    
    learnButton.addEventListener('click', function(e) {
        e.preventDefault();
        setMode('learn');
    });
    
    playButton.addEventListener('click', function(e) {
        e.preventDefault();
        setMode('play');
    });
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.game-icon')) {
            closeAllDropdowns();
        }
    });
    
    setMode('play');
});