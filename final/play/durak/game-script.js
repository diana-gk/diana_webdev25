//Game state and settings
let gameSettings = {
    perevodnoyMode: false,
    botDifficulty: 'medium', // 'easy', 'medium', 'hard'
    numPlayers: 3, // default: 3 players (user + 2 bots)
    playerNames: ['Player 1', 'Player 2', 'Player 3']
};

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const gameArea = document.getElementById('gameArea');
    
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('hidden');
        gameArea.classList.toggle('full');
    });
    
    // check if this is the first load by checking for a flag in localStorage
    const isFirstLoad = !localStorage.getItem('durakGameInitialized');
    
    // initialize or load saved game
    let gameState = JSON.parse(localStorage.getItem('durakGameState') || 'null');
    if (!gameState) {
        console.log("Creating new game");


        showSettingsModal(true); 
        
        localStorage.setItem('durakGameInitialized', 'true');
        
        // gameState will be initialized when the settings are saved
    } else {
        console.log("Loading saved game");
        console.log("Loaded kozer:", gameState.kozer);
        if (gameState.kozer) {
            gameState.kozer.isRed = gameState.kozer.suit === '♥' || gameState.kozer.suit === '♦';
        }
        
        if (gameState.settings) {
            gameSettings = gameState.settings;
        }
        
        updatePlayerHand(gameState.player1Hand);
        
        const opponentContainer = document.querySelector('.opponent-area');
        opponentContainer.innerHTML = '';
        
        for (let i = 1; i < gameSettings.numPlayers; i++) {
            const opponentDiv = document.createElement('div');
            opponentDiv.className = 'opponent';
            opponentDiv.innerHTML = `
                <div class="opponent-cards"></div>
                <div class="player-name">${gameSettings.playerNames[i]}</div>
            `;
            opponentContainer.appendChild(opponentDiv);
            updateOpponentCards(gameSettings.playerNames[i], gameState.playerHands[i].length);
        }
        
        displayStockpile(gameState.deck, gameState.kozer);
        updateCardArea(gameState);
        updateGameStatus(gameState);
        
        if (isFirstLoad) {
            showSettingsModal(false); // not a new game, just showing settings
            localStorage.setItem('durakGameInitialized', 'true');
        }
        
        // if it's not player 1's turn, trigger bot play
        if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
            setTimeout(() => botPlay(gameState), 1000);
        }
    }
    
    document.getElementById('settingsLink').addEventListener('click', function(e) {
        e.preventDefault();
        showSettingsModal(false); 
    });
    

    document.getElementById('helpLink').addEventListener('click', function(e) {
        e.preventDefault();
        showHelpModal();
    });
    

    if (gameState) {
        initializeGameControls(gameState);
    }

    const leaveGameBtn = document.getElementById('leave');
    if (leaveGameBtn) {
        leaveGameBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            const confirmLeave = confirm("Are you sure you want to leave the current game?");
            
            if (confirmLeave) {
                localStorage.removeItem('durakGameState');
                
                window.location.href = "../../index.html";
            }
        });
    }
});


function showSettingsModal(isNewGame = false) {
    const modal = document.getElementById('settingsModal');
    
    document.getElementById('perevodnoyMode').checked = gameSettings.perevodnoyMode;
    document.getElementById('botDifficulty').value = gameSettings.botDifficulty;
    document.getElementById('numPlayers').value = gameSettings.numPlayers.toString();
    
    if (!modal.hasListeners) {
        modal.querySelector('.close').addEventListener('click', function() {
            // if this is a new game and user tries to close without saving,
            // initialize a default game anyway
            if (isNewGame && !JSON.parse(localStorage.getItem('durakGameState') || 'null')) {
                let gameState = initializeGame();
                localStorage.setItem('durakGameState', JSON.stringify(gameState));
                window.location.reload();
            } else {
                modal.style.display = 'none';
            }
        });
        
        modal.querySelector('#newGame').addEventListener('click', function() {
            // save settings first
            gameSettings.perevodnoyMode = document.getElementById('perevodnoyMode').checked;
            gameSettings.botDifficulty = document.getElementById('botDifficulty').value;
            gameSettings.numPlayers = parseInt(document.getElementById('numPlayers').value);
            
            gameSettings.playerNames = ['Player 1'];
            for (let i = 2; i <= gameSettings.numPlayers; i++) {
                gameSettings.playerNames.push(`Player ${i}`);
            }
            
            let gameState = initializeGame();
            localStorage.setItem('durakGameState', JSON.stringify(gameState));
            
            window.location.reload();
        });
        
        modal.hasListeners = true;
    }
    
    const newGameButton = modal.querySelector('#newGame');
    newGameButton.textContent = "New Game";
    newGameButton.style.display = 'inline-block';
    
    modal.style.display = 'block';
}

function showHelpModal() {
    const modal = document.getElementById('helpModal');
    
    if (!modal.hasListeners) {
        modal.querySelector('.close').addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        modal.querySelector('#helpNewGameBtn').addEventListener('click', function() {
            modal.style.display = 'none';
            
            localStorage.removeItem('durakGameState');
            
            showSettingsModal(true);
        });
        
        modal.hasListeners = true;
    }
    
    modal.style.display = 'block';
}

function shuffle(deck) {
    for (let i = 0; i < deck.length; i++) {
        let shuffle = Math.floor(Math.random() * (deck.length));
        [deck[i], deck[shuffle]] = [deck[shuffle], deck[i]];
    }
    return deck;
}

function initializeGame() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    for (let i = 0; i < suits.length; i++) {
        for (let j = 0; j < values.length; j++) {
            deck.push({
                value: values[j],
                suit: suits[i],
                isRed: suits[i] === '♥' || suits[i] === '♦',
            });
        }
    }
    
    shuffle(deck);
    
    const numPlayers = gameSettings.numPlayers || 3;
    
    const playerHands = [];
    for (let i = 0; i < numPlayers; i++) {
        playerHands.push(deck.splice(0, 6));
    }
    
    const kozer = deck.splice(0, 1)[0];
    
    if (kozer) {
        console.log("Initial kozer:", kozer);
        kozer.isRed = kozer.suit === '♥' || kozer.suit === '♦';
    }
    
    //determines turn order by finding player w/lowest kozer aka trump
    let lowestTrumpPlayer = findLowestTrumpPlayer(playerHands, kozer.suit);

    setupArena();
    
    updatePlayerHand(playerHands[0]);
    
    const opponentContainer = document.querySelector('.opponent-area');
    opponentContainer.innerHTML = '';
    
    for (let i = 1; i < numPlayers; i++) {
        const opponentDiv = document.createElement('div');
        opponentDiv.className = 'opponent';
        opponentDiv.innerHTML = `
            <div class="opponent-cards"></div>
            <div class="player-name">${gameSettings.playerNames[i]}</div>
        `;
        opponentContainer.appendChild(opponentDiv);
        updateOpponentCards(gameSettings.playerNames[i], playerHands[i].length);
    }
    
    displayStockpile(deck, kozer);
    
    // Create game state
    const gameState = {
        deck: deck,
        kozer: kozer,
        kozerTaken: false,
        discardPile: [],
        currentPlayer: lowestTrumpPlayer, 
        defender: (lowestTrumpPlayer + 1) % numPlayers, 
        gameInProgress: true,
        settings: gameSettings,
        playerHands: playerHands,
        player1Hand: playerHands[0],
        player2Hand: playerHands[1],
        player3Hand: playerHands.length > 2 ? playerHands[2] : [],
        eliminated: new Array(numPlayers).fill(false),
        attackComplete: false,
        currentRound: {
            attackCards: [],
            defenseCards: []
        }
    };
    

    updateGameStatus(gameState);
    
    if (lowestTrumpPlayer !== 0) {
        setTimeout(() => botPlay(gameState), 1000);
    }
    
    return gameState;
}

function findLowestTrumpPlayer(playerHands, trumpSuit) {
    let lowestTrumpRank = 100;
    let lowestTrumpPlayer = 0;
    
    playerHands.forEach((hand, playerIndex) => {
        hand.forEach(card => {
            if (card.suit === trumpSuit) {
                const numericRank = getCardRank(card);
                if (numericRank < lowestTrumpRank) {
                    lowestTrumpRank = numericRank;
                    lowestTrumpPlayer = playerIndex;
                }
            }
        });
    });
    
    // if no trump cards found, player 0 (human) starts
    return lowestTrumpPlayer;
}

function getCardRank(card) {
    const values = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    return values.indexOf(card.value);
}

function setupArena() {
    const arena = document.querySelector('.arena');
    arena.innerHTML = '';
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'gameStatus';
    statusDiv.className = 'game-status';
    arena.appendChild(statusDiv);
    
    const cardAreaDiv = document.createElement('div');
    cardAreaDiv.id = 'cardArea';
    cardAreaDiv.className = 'card-area';
    arena.appendChild(cardAreaDiv);
    
    const actionDiv = document.createElement('div');
    actionDiv.id = 'actionButtons';
    actionDiv.className = 'action-buttons';
    actionDiv.innerHTML = `
        <button id="attackBtn" class="game-btn">Attack</button>
        <button id="finishAttackBtn" class="game-btn">Finish Attack</button>
        <button id="defendBtn" class="game-btn">Defend</button>
        <button id="takeCardsBtn" class="game-btn">Take Cards</button>
        <button id="passBtn" class="game-btn" style="display: none;">Pass</button>
    `;
    arena.appendChild(actionDiv);
}

function updateGameStatus(gameState) {
    const statusDiv = document.getElementById('gameStatus');
    if (!statusDiv) return;
    
    let statusText = '';
    
    if (gameState.gameInProgress) {
        const attackerName = gameSettings.playerNames[gameState.currentPlayer];
        const defenderName = gameSettings.playerNames[gameState.defender];
        
        if (gameState.currentPlayer === 0) {
            statusText = `Your turn to attack ${defenderName}`;
        } else if (gameState.defender === 0) {
            statusText = `${attackerName} is attacking you`;
        } else {
            statusText = `${attackerName} is attacking ${defenderName}`;
        }
    } else {
        // game over
        const activePlayers = gameState.eliminated.filter(eliminated => !eliminated).length;
        
        if (activePlayers === 0) {
            statusText = "Game Over - It's a tie!";
        } else {
            const durakIndex = gameState.eliminated.indexOf(false);
            const durakName = gameSettings.playerNames[durakIndex];
            
            if (durakIndex === 0) {
                statusText = "Game Over - You are the Durak!";
            } else {
                statusText = `Game Over - ${durakName} is the Durak!`;
            }
        }
    }
    
    statusDiv.textContent = statusText;
    
    updateButtonStates(gameState);
}

function getNextActivePlayer(gameState, currentPosition) {
    let nextPlayer = (currentPosition + 1) % gameSettings.numPlayers;
    
    // skip eliminated players
    while (gameState.eliminated[nextPlayer]) {
        nextPlayer = (nextPlayer + 1) % gameSettings.numPlayers;
        
        // safety check to prevent infinite loop in case all players are eliminated
        if (nextPlayer === currentPosition) {
            break;
        }
    }
    
    return nextPlayer;
}

function updateButtonStates(gameState) {
    const attackBtn = document.getElementById('attackBtn');
    const finishAttackBtn = document.getElementById('finishAttackBtn');
    const defendBtn = document.getElementById('defendBtn');
    const takeCardsBtn = document.getElementById('takeCardsBtn');
    const passBtn = document.getElementById('passBtn');
    
    if (!attackBtn || !defendBtn || !takeCardsBtn) return;
    
    attackBtn.style.display = 'none';
    finishAttackBtn.style.display = 'none';
    defendBtn.style.display = 'none';
    takeCardsBtn.style.display = 'none';
    passBtn.style.display = 'none';
    
    if (!gameState.gameInProgress) return;
    
    if (gameState.currentPlayer === 0) {
        // player's turn to attack
        attackBtn.style.display = 'inline-block';
        finishAttackBtn.style.display = 'inline-block';
    } else if (gameState.defender === 0) {
        // player's turn to defend
        defendBtn.style.display = 'inline-block';
        takeCardsBtn.style.display = 'inline-block';
        
        // show pass button only if Perevodnoy mode is enabled
        if (gameSettings.perevodnoyMode && canPass(gameState)) {
            passBtn.style.display = 'inline-block';
        }
    }
}

function canPass(gameState) {
    // check if player has a card of the same rank as the most recent attack card
    const currentAttackCard = gameState.currentRound.attackCards[gameState.currentRound.attackCards.length - 1];
    if (!currentAttackCard) return false;
    
    // check if player has a card of the same rank
    return gameState.player1Hand.some(card => card.value === currentAttackCard.value);
}



function initializeGameControls(gameState) {
    //attack btn
    document.getElementById('attackBtn')?.addEventListener('click', function() {
        const selectedCards = document.querySelectorAll('.card.selected');
        if (selectedCards.length !== 1) {
            alert('Please select exactly one card to attack with');
            return;
        }
        
        const cardIndex = Array.from(document.querySelectorAll('.card')).indexOf(selectedCards[0]);
        const card = gameState.player1Hand[cardIndex];
        
        // checks if attack valid
        if (gameState.currentRound.attackCards.length > 0) {
            // check if the card matches any rank already in play


        ////////////////explain this snippet//////////////

            //this line of code creates a new set of combined values from the attack and defense cards
            //first it uses spread operator ... to convert both arrays into individual elem
            //then, the .map(c=>c.value ) 
            //the .map method creates a new array without modifying original contents
            //c=>c.value is taking the elem the .map is pulling out from the object array that
            // the ... operator created, and extracts just the card values/ranks from each card object

            //visual example
            // if our original object looked like this:

            //[
            //     {value: '7', suit: '♥', isRed: true},
            //     {value: 'K', suit: '♠', isRed: false}
            //   ]
            //   
            
            // After applying .map(c => c.value), you'd get:
            //   ['7', 'K']

        const validRanks = [...new Set([
                ...gameState.currentRound.attackCards.map(c => c.value),
                ...gameState.currentRound.defenseCards.map(c => c.value)
            ])];
            

            //then checks that the new card matches the rank of an existing card on the table
            if (!validRanks.includes(card.value)) {
                alert('You can only attack with cards that match ranks already in play');
                return;
            }
        }
        
        gameState.currentRound.attackCards.push(card);
        
        gameState.player1Hand.splice(cardIndex, 1);
        
        updatePlayerHand(gameState.player1Hand);
        updateCardArea(gameState);
        
        // if defender is a bot, trigger bot defense
        if (gameState.defender !== 0) {
            setTimeout(() => botDefend(gameState), 1000);
        }
        
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
    });
    
  
    //finish attack btn
    document.getElementById('finishAttackBtn')?.addEventListener('click', function() {
        if (gameState.currentRound.attackCards.length === 0) {
            alert('You must play at least one card to attack');
            return;
        }
        
        // if all attacks were defended, move discarded cards to discard pile
        if (gameState.currentRound.attackCards.length === gameState.currentRound.defenseCards.length) {
            gameState.discardPile = gameState.discardPile.concat(
                gameState.currentRound.attackCards, 
                gameState.currentRound.defenseCards
            );
            
            // next attacker is the defender
            gameState.currentPlayer = gameState.defender;
        } else {
            // defender takes all cards
            const defenderIndex = gameState.defender;
            const defenderHand = gameState.playerHands[defenderIndex];
            
            defenderHand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
            
            // next attacker is the player to the left of defender
            gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
        }
        
        gameState.currentRound = {
            attackCards: [],
            defenseCards: []
        };
        
        // next defender is to the left of the attacker
        gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
        
        drawCards(gameState);
        
        gameState.player1Hand = gameState.playerHands[0];
        
        updateCardArea(gameState);
        updatePlayerHand(gameState.player1Hand);
        updateAllOpponentDisplays(gameState); 
        updateGameStatus(gameState);
        
        checkGameOver(gameState);
        
        checkPlayersEliminated(gameState);
        
        if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
            setTimeout(() => botPlay(gameState), 1000);
        }
        
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
    });
    

    //defend btn
    document.getElementById('defendBtn')?.addEventListener('click', function() {
        const selectedCards = document.querySelectorAll('.card.selected');
        if (selectedCards.length !== 1) {
            alert('Please select exactly one card to defend with');
            return;
        }
        
        const cardIndex = Array.from(document.querySelectorAll('.card')).indexOf(selectedCards[0]);
        const card = gameState.player1Hand[cardIndex];
        
        const attackCardIndex = gameState.currentRound.defenseCards.length;
        const attackCard = gameState.currentRound.attackCards[attackCardIndex];
        
        // check if the selected card can beat the attack card
        if (!canDefendWith(card, attackCard, gameState.kozer.suit)) {
            alert('This card cannot defend against the attack. You need a higher card of the same suit or a trump card.');
            return;
        }
        
        gameState.currentRound.defenseCards.push(card);
        
        gameState.player1Hand.splice(cardIndex, 1);
        
        updatePlayerHand(gameState.player1Hand);
        updateCardArea(gameState);
        
        // if all attacks are defended, update the game state
        if (gameState.currentRound.defenseCards.length === gameState.currentRound.attackCards.length) {
            // if maximum attacks reached (6) or attacker has no more valid cards
            if (gameState.currentRound.attackCards.length >= 6 || attackerHasNoValidCards(gameState)) {
                endDefense(gameState, true);
            } else if (gameState.currentPlayer !== 0) {
                // if attacker is a bot, let it play another card
                setTimeout(() => botPlay(gameState), 1000);
            }
            // if attacker is human, they need to choose to attack again or finish attack
        }
        
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
    });
    
    // take Cards button
    document.getElementById('takeCardsBtn')?.addEventListener('click', function() {
        takeAllCards(gameState);
                localStorage.setItem('durakGameState', JSON.stringify(gameState));
    });
    
    // Pass button (Perevodnoy mode)
    document.getElementById('passBtn')?.addEventListener('click', function() {
        if (!gameSettings.perevodnoyMode) return;
        
        const selectedCards = document.querySelectorAll('.card.selected');
        if (selectedCards.length !== 1) {
            alert('Please select exactly one card to pass with');
            return;
        }
        
        const cardIndex = Array.from(document.querySelectorAll('.card')).indexOf(selectedCards[0]);
        const card = gameState.player1Hand[cardIndex];
        
        // validate the pass
        const attackCard = gameState.currentRound.attackCards[gameState.currentRound.attackCards.length - 1];
        
        if (card.value !== attackCard.value) {
            alert('You can only pass with a card of the same rank');
            return;
        }
        
        gameState.currentRound.attackCards.push(card);
        
        gameState.player1Hand.splice(cardIndex, 1);
        
        // new defender is the next player
        gameState.defender = (gameState.defender + 1) % gameSettings.numPlayers;
        
        // skip eliminated players
        while (gameState.eliminated[gameState.defender]) {
            gameState.defender = (gameState.defender + 1) % gameSettings.numPlayers;
        }
        
        // player becomes the attacker
        gameState.currentPlayer = 0;
        
        updatePlayerHand(gameState.player1Hand);
        updateCardArea(gameState);
        updateGameStatus(gameState);
        
        if (gameState.defender !== 0) {
            setTimeout(() => botDefend(gameState), 1000);
        }
        
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
    });
}


function checkPlayersEliminated(gameState) {
    if (gameState.deck.length === 0) {
        let anyPlayerEliminated = false;
        
        for (let i = 0; i < gameSettings.numPlayers; i++) {
            if (gameState.playerHands[i].length === 0 && !gameState.eliminated[i]) {
                gameState.eliminated[i] = true;
                console.log(`Player ${gameSettings.playerNames[i]} has been eliminated!`);
                anyPlayerEliminated = true;
                
                if (i === gameState.currentPlayer) {
                    gameState.currentPlayer = getNextActivePlayer(gameState, gameState.currentPlayer);
                }
                
                if (i === gameState.defender) {
                    gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
                }
            }
        }
        
        if (anyPlayerEliminated) {
            updateGameStatus(gameState);
            checkGameOver(gameState);
        }
    }
}



function drawCards(gameState) {
    // players draw cards in order: attacker first, then others clockwise, defender last
    const playerOrder = [];
    
    // start with attacker
    let currentIndex = gameState.currentPlayer;
    
    // add attacker if not eliminated
    if (!gameState.eliminated[currentIndex]) {
        playerOrder.push(currentIndex);
    }
    
    // add players in clockwise order, skipping eliminated ones
    currentIndex = getNextActivePlayer(gameState, currentIndex);
    while (currentIndex !== gameState.defender) {
        playerOrder.push(currentIndex);
        currentIndex = getNextActivePlayer(gameState, currentIndex);
        
        // safety check to prevent infinite loop
        if (playerOrder.length >= gameSettings.numPlayers) {
            break;
        }
    }
    
    // add defender last if not eliminated
    if (!gameState.eliminated[gameState.defender]) {
        playerOrder.push(gameState.defender);
    }
    
    // draw cards for each player in order
    for (const playerIndex of playerOrder) {
        const playerHand = gameState.playerHands[playerIndex];
        
        while (playerHand.length < 6 && (gameState.deck.length > 0 || (!gameState.kozerTaken && gameState.kozer))) {
            if (gameState.deck.length === 0 && !gameState.kozerTaken && gameState.kozer) {
                playerHand.push(gameState.kozer);
                gameState.kozerTaken = true;
                displayStockpile(gameState.deck, gameState.kozer, gameState.kozerTaken);
                break; 
            } else if (gameState.deck.length > 0) {
                playerHand.push(gameState.deck.pop());
            }
        }
    }
    
    gameState.player1Hand = gameState.playerHands[0];
    
    displayStockpile(gameState.deck, gameState.kozer, gameState.kozerTaken);
    
    checkPlayersEliminated(gameState);

}


function canDefendWith(defenseCard, attackCard, trumpSuit) {
    // trump (kozer) can beat any non-trump
    if (defenseCard.suit === trumpSuit && attackCard.suit !== trumpSuit) {
        return true;
    }
    
    // must be same suit and higher rank to defend
    if (defenseCard.suit === attackCard.suit) {
        return getCardRank(defenseCard) > getCardRank(attackCard);
    }
    
    // can't defend: different non-trump suits
    return false;
}

function updateCardArea(gameState) {
    const cardArea = document.getElementById('cardArea');
    if (!cardArea) return;
    
    cardArea.innerHTML = '';
    
    for (let i = 0; i < gameState.currentRound.attackCards.length; i++) {
        const attackCard = gameState.currentRound.attackCards[i];
        const defenseCard = gameState.currentRound.defenseCards[i];
        
        const pairDiv = document.createElement('div');
        pairDiv.className = 'card-pair';
        
        const attackCardDiv = createCardElement(attackCard);
        attackCardDiv.classList.add('attack-card');
        pairDiv.appendChild(attackCardDiv);
        
        if (defenseCard) {
            const defenseCardDiv = createCardElement(defenseCard);
            defenseCardDiv.classList.add('defense-card');
            pairDiv.appendChild(defenseCardDiv);
        }
        
        cardArea.appendChild(pairDiv);
    }
}

function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'table-card';
    
    const valueDiv = document.createElement('div');
    valueDiv.className = 'card-value';
    if (card.isRed) {
        valueDiv.classList.add('red');
    }
    valueDiv.textContent = card.value;
    
    const suitDiv = document.createElement('div');
    suitDiv.className = 'card-suit';
    if (card.isRed) {
        suitDiv.classList.add('red');
    }
    suitDiv.textContent = card.suit;
    
    cardDiv.appendChild(valueDiv);
    cardDiv.appendChild(suitDiv);
    
    return cardDiv;
}

function updatePlayerHand(hand) {
    const handContainer = document.querySelector('.hand-container');
    
    handContainer.innerHTML = '';
    
    for (let i = 0; i < hand.length; i++) {
        const card = hand[i];
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'card-value';
        if (card.isRed) {
            valueDiv.classList.add('red');
        }
        valueDiv.textContent = card.value;
        
        const suitDiv = document.createElement('div');
        suitDiv.className = 'card-suit';
        if (card.isRed) {
            suitDiv.classList.add('red');
        }
        suitDiv.textContent = card.suit;
        
        cardDiv.appendChild(valueDiv);
        cardDiv.appendChild(suitDiv);
        handContainer.appendChild(cardDiv);
        
        cardDiv.addEventListener('click', function() {
            cardDiv.classList.toggle('selected');
        });
    }
}

function updateOpponentCards(playerName, cardCount) {
    const opponents = document.querySelectorAll('.opponent');
    let opponentDiv = null;
    for (let i = 0; i < opponents.length; i++) {
        if (opponents[i].querySelector('.player-name').textContent === playerName) {
            opponentDiv = opponents[i];
            break;
        }
    }
    if (opponentDiv) {
        const opponentCards = opponentDiv.querySelector('.opponent-cards');
        
        opponentCards.innerHTML = '';
        
        for (let i = 0; i < cardCount; i++) {
            const cardBackDiv = document.createElement('div');
            cardBackDiv.className = 'opponent-card-back';
            opponentCards.appendChild(cardBackDiv);
        }
    }
}

function displayStockpile(deck, kozer, kozerTaken) {
    const kozerDiv = document.getElementById('kozer');
    const stockpileDiv = document.querySelector('.stockpile-div');
    const stockpileCard = document.querySelector('.stockpile-card');

    
    if (!kozerDiv) {
        console.error("Kozer div not found! Check your HTML.");
        return;
    }
    
    kozerDiv.innerHTML = '';
    
    if (kozerTaken) {
        kozerDiv.style.display = 'none';
        stockpileCard.style.display = 'none';
        stockpileDiv.innerHTML = '';

    } else {
        kozerDiv.style.display = 'block';
        
        if (kozer) {
            const kozerCardDiv = document.createElement('div');
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'card-value';
            if (kozer.isRed) {
                valueDiv.classList.add('red');
            }
            valueDiv.textContent = kozer.value ? kozer.value : "?";
            
            const suitDiv = document.createElement('div');
            suitDiv.className = 'card-suit';
            if (kozer.isRed) {
                suitDiv.classList.add('red');
            }
            suitDiv.textContent = kozer.suit ? kozer.suit : "?";
            
            kozerCardDiv.appendChild(valueDiv);
            kozerCardDiv.appendChild(suitDiv);
            kozerDiv.appendChild(kozerCardDiv);
        }
    }
    
    if (stockpileDiv) {
        const totalCards = !kozerTaken ? deck.length + 1 : deck.length;
       (!kozerTaken) ? (stockpileDiv.textContent = totalCards + " cards") : "";
    }
    
    if (stockpileCard) {
        stockpileCard.style.display = (deck.length > 0) ? 'block' : 'none';
    }
}



function botPlay(gameState) {
    if (!gameState.gameInProgress) return;
    
    // skip if it's not a bot's turn to play
    if (gameState.currentPlayer === 0) return;
    
    //console.log(`Bot ${gameState.currentPlayer} is playing as attacker`);
    
    // draw cards for the bot before playing if needed
    const attackerHand = gameState.playerHands[gameState.currentPlayer];
    
    // draw cards if the bot has fewer than 6 cards and there are cards available
    if (attackerHand.length < 6 && (gameState.deck.length > 0 || (!gameState.kozerTaken && gameState.kozer))) {
        // draw cards only for the current bot
        while (attackerHand.length < 6 && (gameState.deck.length > 0 || (!gameState.kozerTaken && gameState.kozer))) {
            if (gameState.deck.length === 0 && !gameState.kozerTaken && gameState.kozer) {
                attackerHand.push(gameState.kozer);
                gameState.kozerTaken = true;
                displayStockpile(gameState.deck, gameState.kozer, gameState.kozerTaken);
                break;
            } else if (gameState.deck.length > 0) {
                attackerHand.push(gameState.deck.pop());
            }
        }
        
        updateOpponentCards(gameSettings.playerNames[gameState.currentPlayer], attackerHand.length);
        displayStockpile(gameState.deck, gameState.kozer, gameState.kozerTaken);
    }
    
    const difficulty = gameSettings.botDifficulty;
    
    
    // bot decides which card to play
    let attackCard = null;
    
    if (gameState.currentRound.attackCards.length === 0) {
        // first attack: choose card based on difficulty
        if (difficulty === 'easy') {
            // Easy bots play randomly
            attackCard = attackerHand[Math.floor(Math.random() * attackerHand.length)];
        } else {
            // medium/hard bots play lowest non-trump first
            const nonTrumpCards = attackerHand.filter(card => card.suit !== gameState.kozer.suit);
            
            if (nonTrumpCards.length > 0) {
                // sort by rank
                nonTrumpCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                attackCard = nonTrumpCards[0];
            } else {
                // if only trump cards, play lowest trump
                attackerHand.sort((a, b) => getCardRank(a) - getCardRank(b));
                attackCard = attackerHand[0];
            }
        }
    } else {
        // subsequent attacks: must match ranks already in play, this snippet already explained above
        const validRanks = [...new Set([
            ...gameState.currentRound.attackCards.map(c => c.value),
            ...gameState.currentRound.defenseCards.map(c => c.value)
        ])];

        
        const validCards = attackerHand.filter(card => validRanks.includes(card.value));
        
        if (validCards.length > 0) {
            if (difficulty === 'easy') {
                // easy bots play randomly from valid cards
                attackCard = validCards[Math.floor(Math.random() * validCards.length)];
            } else {
                // medium/hard bots prefer low non-trump cards
                const nonTrumpCards = validCards.filter(card => card.suit !== gameState.kozer.suit);
                
                if (nonTrumpCards.length > 0) {
                    nonTrumpCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                    attackCard = nonTrumpCards[0];
                } else if (validCards.length > 0) {
                    // if only trump cards, play lowest
                    validCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                    attackCard = validCards[0];
                }
            }
        }
    }
    
    if (attackCard) {
        //play card
        const cardIndex = attackerHand.findIndex(card => 
            card.suit === attackCard.suit && card.value === attackCard.value);
        
        
        gameState.currentRound.attackCards.push(attackCard);
        
        attackerHand.splice(cardIndex, 1);
        
        updateOpponentCards(gameSettings.playerNames[gameState.currentPlayer], attackerHand.length);
        updateAllOpponentDisplays(gameState); 
        updateCardArea(gameState);
        
        if (gameState.defender !== 0) {
            setTimeout(() => botDefend(gameState), 800);
        } else {
            updateGameStatus(gameState);
        }
    } else {
        // if no valid attack card, end attack
        endBotAttack(gameState);
    }
    
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}





//////////////////////////////// the function i hate the most

function botDefend(gameState) {
    if (!gameState.gameInProgress) return;
    
    // skip if it's not a bot's turn to defend
    if (gameState.defender === 0) return;
    
    //console.log(`Bot ${gameState.defender} is defending`);
    
    // draw cards for the defending bot if needed
    const defenderHand = gameState.playerHands[gameState.defender];
    
    // draw cards if the bot has fewer than 6 cards and there are cards available
    if (defenderHand.length < 6 && (gameState.deck.length > 0 || (!gameState.kozerTaken && gameState.kozer))) {
        // draw cards only for the current defending bot
        while (defenderHand.length < 6 && (gameState.deck.length > 0 || (!gameState.kozerTaken && gameState.kozer))) {
            if (gameState.deck.length === 0 && !gameState.kozerTaken && gameState.kozer) {
                defenderHand.push(gameState.kozer);
                gameState.kozerTaken = true;
                displayStockpile(gameState.deck, gameState.kozer, gameState.kozerTaken);
                break;
            } else if (gameState.deck.length > 0) {
                defenderHand.push(gameState.deck.pop());
            }
        }
        
        updateOpponentCards(gameSettings.playerNames[gameState.defender], defenderHand.length);
        displayStockpile(gameState.deck, gameState.kozer, gameState.kozerTaken);
    }
    
    const difficulty = gameSettings.botDifficulty;
    
    const attackCardIndex = gameState.currentRound.defenseCards.length;
    const attackCard = gameState.currentRound.attackCards[attackCardIndex];
    
    if (!attackCard) {
        console.error("No attack card to defend against");
        return;
    }
    
    const validDefenseCards = defenderHand.filter(card => 
        canDefendWith(card, attackCard, gameState.kozer.suit));
    
    let passCard = null;
    if (gameSettings.perevodnoyMode) {
        passCard = defenderHand.find(card => card.value === attackCard.value);
    }
    
    if (validDefenseCards.length > 0) {
        let defenseCard = null;
        
        if (difficulty === 'easy') {
            // easy bot defends with random valid card
            defenseCard = validDefenseCards[Math.floor(Math.random() * validDefenseCards.length)];
        } else if (difficulty === 'medium') {
            // medium bot tries to use lowest valid card
            
            // separate trump and non-trump defense cards
            const trumpDefenseCards = validDefenseCards.filter(card => card.suit === gameState.kozer.suit);
            const nonTrumpDefenseCards = validDefenseCards.filter(card => card.suit !== gameState.kozer.suit);
            
            if (attackCard.suit === gameState.kozer.suit) {
                // if attack is trump, must use higher trump
                trumpDefenseCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                defenseCard = trumpDefenseCards[0]; 
            } else if (nonTrumpDefenseCards.length > 0) {
                // if not trump attack and we have non-trump defense, use lowest valid non-trump
                nonTrumpDefenseCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                defenseCard = nonTrumpDefenseCards[0];
            } else {
                // must use trump
                trumpDefenseCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                defenseCard = trumpDefenseCards[0]; 
            }
        } else if (difficulty === 'hard') {
            // hard bot decides based on more factors
            
            if (passCard && Math.random() < 0.7) { // 70% chance to pass if possible
                botPass(gameState, passCard);
                return;
            }
            
            // if we have few cards and defending would leave us with 0-1 cards, prefer to take
            if (defenderHand.length <= 3 && gameState.deck.length === 0 && Math.random() < 0.6) {
                botTakeCards(gameState);
                return;
            }
            
           
            // similar to medium, but prioritize non-trump cards for defense
            const trumpDefenseCards = validDefenseCards.filter(card => card.suit === gameState.kozer.suit);
            const nonTrumpDefenseCards = validDefenseCards.filter(card => card.suit !== gameState.kozer.suit);
            
            if (attackCard.suit === gameState.kozer.suit) {
                // must use trump against trump
                trumpDefenseCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                defenseCard = trumpDefenseCards[0];
            } else if (nonTrumpDefenseCards.length > 0) {
                // use non-trump for non-trump attack
                nonTrumpDefenseCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                defenseCard = nonTrumpDefenseCards[0];
            } else {
                // must use trump
                // if low trump, use it; if high trump and game is late, maybe take cards
                if (gameState.deck.length === 0 && Math.random() < 0.4) {
                    botTakeCards(gameState);
                    return;
                }
                trumpDefenseCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                defenseCard = trumpDefenseCards[0];
            }
        }
        
        // if we have a defense card, use it
        if (defenseCard) {
            // find card index in hand
            const cardIndex = defenderHand.findIndex(card => 
                card.suit === defenseCard.suit && card.value === defenseCard.value);
            
            gameState.currentRound.defenseCards.push(defenseCard);
            
            defenderHand.splice(cardIndex, 1);
            
            updateOpponentCards(gameSettings.playerNames[gameState.defender], defenderHand.length);
            updateAllOpponentDisplays(gameState); 
            updateCardArea(gameState);
            
            // if all attacks are defended, end the round
            if (gameState.currentRound.defenseCards.length === gameState.currentRound.attackCards.length) {
                // max attacks reached or no more cards to play
                if (gameState.currentRound.attackCards.length >= 6 || 
                    attackerHasNoValidCards(gameState) || 
                    defenderHand.length === 0) {
                    
                    setTimeout(() => endDefense(gameState, true), 500);
                } else {
                    // allow for additional attacks
                    setTimeout(() => botPlay(gameState), 800);
                }
            }
        }
    } else if (passCard && gameSettings.perevodnoyMode) {
        // pass instead of defend
        botPass(gameState, passCard);
    } else {
        // no valid defense or pass card, take all cards
        botTakeCards(gameState);
    }
    
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}


/////////////////////



function botPass(gameState, passCard) {
    // find card index in hand
    const defenderHand = gameState.playerHands[gameState.defender];
    const cardIndex = defenderHand.findIndex(card => 
        card.suit === passCard.suit && card.value === passCard.value);
    
    gameState.currentRound.attackCards.push(passCard);
    
    defenderHand.splice(cardIndex, 1);
    
    updateOpponentCards(gameSettings.playerNames[gameState.defender], defenderHand.length);
    updateAllOpponentDisplays(gameState); 
    updateCardArea(gameState);
    
    // new defender is the next player
    const oldDefender = gameState.defender;
    gameState.defender = getNextActivePlayer(gameState, gameState.defender);
    
    // previous defender becomes the attacker
    gameState.currentPlayer = oldDefender;
    
    updateGameStatus(gameState);
    
    checkPlayersEliminated(gameState);
    
    // if new defender is a bot, trigger bot defense
    if (gameState.defender !== 0) {
        setTimeout(() => botDefend(gameState), 800);
    }
    
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}

function botTakeCards(gameState) {
    takeAllCards(gameState);
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}

function takeAllCards(gameState) {
    const defenderHand = gameState.playerHands[gameState.defender];
    defenderHand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
    
    gameState.currentRound = {
        attackCards: [],
        defenseCards: []
    };
    
    // next attacker is player to the left of defender
    gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
    
    // set next defender
    gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
    
    drawCards(gameState);
    
    gameState.player1Hand = gameState.playerHands[0];
    
    updateCardArea(gameState);
    updatePlayerHand(gameState.player1Hand);
    updateAllOpponentDisplays(gameState); 
    updateGameStatus(gameState);
    
    checkGameOver(gameState);
    
    checkPlayersEliminated(gameState);
    
    // if next player is a bot, trigger bot play
    if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
        setTimeout(() => botPlay(gameState), 1000);
    }
}


function endDefense(gameState, successful) {
    if (successful) {
        // move all cards to discard pile

        //concat is a function that adds two arrays by the way
        gameState.discardPile = gameState.discardPile.concat(
            gameState.currentRound.attackCards, 
            gameState.currentRound.defenseCards
        );
        
        // defender becomes the next attacker
        gameState.currentPlayer = gameState.defender;
    } else {
        // defender takes all cards
        const defenderHand = gameState.playerHands[gameState.defender];
        //uses nifty spread operator ... to turn all cards on table into sep elements to add to defender hand
        defenderHand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
        
        // next attacker is to the left of the defender
        gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
    }
    
    gameState.currentRound = {
        attackCards: [],
        defenseCards: []
    };
    
    //skips eliminated players
    gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
    
    drawCards(gameState);
    
    gameState.player1Hand = gameState.playerHands[0];
    
    updateCardArea(gameState);
    updatePlayerHand(gameState.player1Hand);
    updateAllOpponentDisplays(gameState);
    updateGameStatus(gameState);
    
    checkGameOver(gameState);
    
    checkPlayersEliminated(gameState);
    
    // if next player is a bot, trigger bot play
    if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
        setTimeout(() => botPlay(gameState), 1000);
    }
}


function endBotAttack(gameState) {
    //if no cards were played, something is wrong
    if (gameState.currentRound.attackCards.length === 0) {
        console.error("Bot tried to end attack without playing any cards");
        return;
    }
    
    // if all attacks were defended, move cards to discard pile
    if (gameState.currentRound.attackCards.length === gameState.currentRound.defenseCards.length) {
        gameState.discardPile = gameState.discardPile.concat(
            gameState.currentRound.attackCards, 
            gameState.currentRound.defenseCards
        );
        
        gameState.currentPlayer = gameState.defender;
    } else {
        // defender takes all cards
        const defenderHand = gameState.playerHands[gameState.defender];
        defenderHand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
        
        // next attacker is the player to the left of defender
        gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
    }
    
    gameState.currentRound = {
        attackCards: [],
        defenseCards: []
    };
    
    // next defender is to the left of the attacker
    gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
    
    drawCards(gameState);
    
    gameState.player1Hand = gameState.playerHands[0];
    
    updateCardArea(gameState);
    updatePlayerHand(gameState.player1Hand);
    updateAllOpponentDisplays(gameState); 
    updateGameStatus(gameState);
    
    checkGameOver(gameState);
    
    checkPlayersEliminated(gameState);
    
    if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
        setTimeout(() => botPlay(gameState), 1000);
    }
}


function attackerHasNoValidCards(gameState) {
    // check if attacker has any valid cards to attack with
    const attackerHand = gameState.playerHands[gameState.currentPlayer];
    
    // if this is the first attack, any card is valid
    if (gameState.currentRound.attackCards.length === 0) {
        return attackerHand.length === 0;
    }
    
    // get ranks already in play
    const validRanks = [...new Set([
        ...gameState.currentRound.attackCards.map(c => c.value),
        ...gameState.currentRound.defenseCards.map(c => c.value)
    ])];
    
    // Check if attacker has any cards with valid ranks
    return !attackerHand.some(card => validRanks.includes(card.value));
}



function checkGameOver(gameState) {
    for (let i = 0; i < gameSettings.numPlayers; i++) {
        if (gameState.playerHands[i].length === 0 && gameState.deck.length === 0) {
            gameState.eliminated[i] = true;
            //console.log(`Player ${gameSettings.playerNames[i]} has been eliminated!`);
        }
    }
    
    let activePlayers = 0;
    let lastActivePlayer = -1;
    
    for (let i = 0; i < gameSettings.numPlayers; i++) {
        if (!gameState.eliminated[i]) {
            activePlayers++;
            lastActivePlayer = i;
        }
    }
    
    if (activePlayers === 1) {
        gameState.gameInProgress = false;
        updateGameStatus(gameState);
        
        const durakName = gameSettings.playerNames[lastActivePlayer];
        
        // console.log(`Game over - ${durakName} is the durak!`);
        
        setTimeout(() => {
            alert(`Game over - ${durakName} is the durak!`)}, 500);
        
        return true;
    } else if (activePlayers === 0) {
        gameState.gameInProgress = false;
        updateGameStatus(gameState);
        
       // console.log(`Game over - It's a tie! All players eliminated.`);
        
        setTimeout(() => {
            alert(`Game over - It's a tie! All players eliminated.`);
        }, 500);
        
        return true;
    }
    
    return false;
}

function updateAllOpponentDisplays(gameState) {
    for (let i = 1; i < gameSettings.numPlayers; i++) {
        if (i < gameState.playerHands.length) {
            updateOpponentCards(gameSettings.playerNames[i], gameState.playerHands[i].length);
        }
    }
}