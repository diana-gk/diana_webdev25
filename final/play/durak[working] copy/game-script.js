let gameState = null;
let gameOverMessageShown = false;



//Game state and settings
let gameSettings = {
    perevodnoyMode: false,
    podkidnoyMode: true, // Default to enabled since it's traditional
    botDifficulty: 'medium', // 'easy', 'medium', 'hard'
    numPlayers: 3, // default: 3 players (user + 2 bots)
    playerNames: ['Player 1', 'Player 2', 'Player 3']
};

document.addEventListener('DOMContentLoaded', function() {
    gameOverMessageShown = false;

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const gameArea = document.getElementById('gameArea');
    const chatToggle = document.getElementById('chatToggle');
    const chatPanel = document.getElementById('chatPanel');
    const closeChat = document.querySelector('.close-chat');
    const sendButton = document.getElementById('sendButton');
    chatInput = document.getElementById('chatInput');
    chatMessages = document.getElementById('chatMessages');
    

// Toggle chat panel visibility
    chatToggle.addEventListener('click', function() {
        chatPanel.classList.toggle('hidden');
        gameArea.classList.toggle('chat-open');
    });

    // Close chat panel when X is clicked
    closeChat.addEventListener('click', function() {
        chatPanel.classList.add('hidden');
        gameArea.classList.remove('chat-open');
    });
    
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('hidden');
        gameArea.classList.toggle('full');
    });
    
    // check if this is the first load by checking for a flag in localStorage
    const isFirstLoad = !localStorage.getItem('durakGameInitialized');
    
    // initialize or load saved game
    gameState = JSON.parse(localStorage.getItem('durakGameState') || 'null');
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
        
        if (gameState.playerHands && gameState.playerHands[0]) {
            // Ensure player1Hand is always a direct reference to playerHands[0]
            gameState.playerHands[0] = sortPlayerHand(gameState.playerHands[0], gameState.kozer.suit);
            gameState.player1Hand = gameState.playerHands[0];
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
            updateOpponentDisplays(gameState);
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
            setTimeout(() => botPlay(gameState), 3000);
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

        console.log("Setting up opponents display on load");
        const opponentContainer = document.querySelector('.opponent-area');
        
        // Clear opponent area to ensure clean start
        if (opponentContainer) {
            opponentContainer.innerHTML = '';
            
            for (let i = 1; i < gameSettings.numPlayers; i++) {
                const opponentDiv = document.createElement('div');
                opponentDiv.className = 'opponent';
                opponentDiv.innerHTML = `
                    <div class="opponent-cards"></div>
                    <div class="player-name">${gameSettings.playerNames[i]}</div>
                `;
                opponentContainer.appendChild(opponentDiv);
            }
            
            // Explicitly update all opponent displays after creating them
            updateOpponentDisplays(gameState);
        }
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

        // Send message when button is clicked
    sendButton.addEventListener('click', sendMessage);

    // Send message when Enter key is pressed
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }

    
    const defendBtn = document.getElementById('defendBtn');


    if (defendBtn) {
        // Store the original click handler
        const originalClickHandler = defendBtn.onclick;
        
        // Replace with our enhanced version
        defendBtn.onclick = function() {
            // Call the original handler
            const result = originalClickHandler.call(this);
            
            // Now check if the player has emptied their hand after defending
            if (gameState && gameState.player1Hand.length === 0) {
                console.log("Player emptied hand while defending - ending turn immediately");
                
                // Force the end of defense if player ran out of cards
                if (gameState.currentRound.attackCards.length === gameState.currentRound.defenseCards.length) {
                    setTimeout(() => endDefense(gameState, true), 500);
                }
            }
            
            return result;
        };
        
        console.log("Enhanced defend button handler installed");
    }
});


addPileOnButtons();
setTimeout(addEmergencyResetButton, 3000);
setTimeout(initializeStuckGameDetection, 3000);

});

function sendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText) {
        // Create player message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message player-message';
        messageDiv.textContent = messageText;
        chatMessages.appendChild(messageDiv);
        
        // Clear input
        chatInput.value = '';
        
        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate bot response after a short delay
        setTimeout(() => {
            generateBotResponse(messageText);
        }, 1000 + Math.random() * 1000);
    }
}


// Generate bot response based on game state
function generateBotResponse(playerMessage) {
    let botName = '';
    let responseText = '';
    
    // Determine which bot will respond
    if (gameState && gameState.settings && gameState.settings.numPlayers > 1) {
        // Pick a random bot from the active players
        const activeBots = [];
        for (let i = 1; i < gameState.settings.numPlayers; i++) {
            if (!gameState.eliminated[i]) {
                activeBots.push(i);
            }
        }
        
        if (activeBots.length > 0) {
            const botIndex = activeBots[Math.floor(Math.random() * activeBots.length)];
            botName = gameState.settings.playerNames[botIndex];
            
            // Generate response based on game state and player message
            const lowerMessage = playerMessage.toLowerCase();
            
            if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
                responseText = 'Hello there!';
            } else if (lowerMessage.includes('good game') || lowerMessage.includes('gg')) {
                responseText = 'Good game to you too!';
            } else if (lowerMessage.includes('trump') || lowerMessage.includes('kozer')) {
                responseText = `The trump suit is ${gameState.kozer.suit}. Good luck!`;
            } else if (lowerMessage.includes('how many') && lowerMessage.includes('card')) {
                responseText = `I have ${gameState.playerHands[botIndex].length} cards left.`;
            } else if (lowerMessage.includes('your turn') || lowerMessage.includes('go')) {
                responseText = "I'm thinking about my next move...";
            } else {
                // Random generic responses
                const genericResponses = [
                    "Let me think about that...",
                    "Interesting play!",
                    "This game is getting intense.",
                    "Nice move!",
                    "I need to be careful here.",
                    "Let's see what happens next.",
                    "I'm enjoying this game!",
                    "Strategy is key in Durak."
                ];
                responseText = genericResponses[Math.floor(Math.random() * genericResponses.length)];
            }
        }
    }
    
    if (responseText) {
        // Create bot message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message opponent-message';
        
        if (botName) {
            const nameSpan = document.createElement('strong');
            nameSpan.textContent = botName + ': ';
            messageDiv.appendChild(nameSpan);
            
            const textNode = document.createTextNode(responseText);
            messageDiv.appendChild(textNode);
        } else {
            messageDiv.textContent = responseText;
        }
        
        chatMessages.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function showSettingsModal(isNewGame = false) {
    const modal = document.getElementById('settingsModal');
    
    document.getElementById('perevodnoyMode').checked = gameSettings.perevodnoyMode;
    document.getElementById('podkidnoyMode').checked = gameSettings.podkidnoyMode; // Add this line
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
            gameOverMessageShown = false;

            gameSettings.perevodnoyMode = document.getElementById('perevodnoyMode').checked;
            gameSettings.botDifficulty = document.getElementById('botDifficulty').value;
            gameSettings.podkidnoyMode = document.getElementById('podkidnoyMode').checked; // Add this line
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

function validateDeck(deck) {
    const cardMap = new Map();
    const duplicates = [];
    
    // Find duplicates
    for (let i = 0; i < deck.length; i++) {
        const card = deck[i];
        const cardKey = `${card.value}${card.suit}`;
        
        if (cardMap.has(cardKey)) {
            duplicates.push({
                index: i,
                card: card,
                originalIndex: cardMap.get(cardKey)
            });
        } else {
            cardMap.set(cardKey, i);
        }
    }
    
    // Remove duplicates (if any)
    if (duplicates.length > 0) {
        console.warn(`Found ${duplicates.length} duplicate cards in deck`);
        // Sort in reverse order to avoid index shifting issues
        duplicates.sort((a, b) => b.index - a.index);
        
        for (const duplicate of duplicates) {
            console.log(`Removing duplicate: ${duplicate.card.value}${duplicate.card.suit}`);
            deck.splice(duplicate.index, 1);
        }
    }
    
    return deck;
}

function initializeGame() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    // Create the deck with each card only appearing once
    for (let i = 0; i < suits.length; i++) {
        for (let j = 0; j < values.length; j++) {
            deck.push({
                value: values[j],
                suit: suits[i],
                isRed: suits[i] === '♥' || suits[i] === '♦',
            });
        }
    }
    
    // Validate the deck to ensure no duplicates before shuffling
    validateDeck(deck);
    
    // Shuffle the deck
    shuffle(deck);
    
    const numPlayers = gameSettings.numPlayers || 3;
    
    // Deal cards to players
    const playerHands = [];
    for (let i = 0; i < numPlayers; i++) {
        playerHands.push(deck.splice(0, 6));
    }
    
    // Important: Take the kozer from the deck
    // Using splice returns the card AND removes it from the deck
    const kozer = deck.splice(0, 1)[0];
    
    if (kozer) {
        console.log("Initial kozer:", kozer);
        kozer.isRed = kozer.suit === '♥' || kozer.suit === '♦';
    }
    
    // Determines turn order by finding player w/lowest kozer aka trump
    let lowestTrumpPlayer = findLowestTrumpPlayer(playerHands, kozer.suit);
    
    // Next player in circular order is the defender
    let nextDefender = (lowestTrumpPlayer + 1) % numPlayers;
    
    playerHands[0] = sortPlayerHand(playerHands[0], kozer.suit);

    // Validate all hands to ensure no duplicates
    for (let i = 0; i < numPlayers; i++) {
        const validatedHand = validateDeck(playerHands[i]);
        // If validation removed cards, draw more to replace them
        while (validatedHand.length < 6 && deck.length > 0) {
            const replacement = deck.pop();
            // Check if replacement is a duplicate
            if (!checkForDuplicateCard(replacement, { playerHands, kozer, deck, discardPile: [] })) {
                validatedHand.push(replacement);
            }
        }
    }
    
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
    }
    
    // Display stockpile with kozer shown correctly
    displayStockpile(deck, kozer);
    
    // Create game state with proper circular rotation
    const gameState = {
        deck: deck,
        kozer: kozer,
        kozerTaken: false,
        discardPile: [],
        currentPlayer: lowestTrumpPlayer, 
        defender: nextDefender,
        gameInProgress: true,
        settings: gameSettings,
        playerHands: playerHands,
        player1Hand: playerHands[0],
        eliminated: new Array(numPlayers).fill(false),
        attackComplete: false,
        playerPickedUp: false,  
        firstCard: true, 
        currentRound: {
            attackCards: [],
            defenseCards: []
        },
        pileOnAttacker: null,
        allPlayersAttacked: false,
        skipNextPileOnCheck: false
    };
    
    updateGameStatus(gameState);
    updateOpponentDisplays(gameState);
    
    if (lowestTrumpPlayer !== 0) {
        setTimeout(() => botPlay(gameState), 3000);
    }
    
    return gameState;
}


function createDrawingOrder(gameState) {
    const drawingOrder = [];
    const numPlayers = gameSettings.numPlayers;
    
    // First add the attacker if not eliminated
    if (!gameState.eliminated[gameState.currentPlayer]) {
        drawingOrder.push(gameState.currentPlayer);
    }
    
    // Add other players except defender in clockwise order
    let current = (gameState.currentPlayer + 1) % numPlayers;
    while (current !== gameState.defender) {
        if (!gameState.eliminated[current]) {
            drawingOrder.push(current);
        }
        current = (current + 1) % numPlayers;
        
        // Safety check to prevent infinite loops
        if (drawingOrder.length >= numPlayers) {
            console.log("Safety break in drawing order creation");
            break;
        }
    }
    
    // Add defender last if not eliminated
    if (!gameState.eliminated[gameState.defender]) {
        drawingOrder.push(gameState.defender);
    }
    
    return drawingOrder;
}




function drawCardsForPlayer(gameState, playerIndex) {
    const playerHand = gameState.playerHands[playerIndex];
    const playerName = gameSettings.playerNames[playerIndex];
    
    // If hand already has 6+ cards, no need to draw
    if (playerHand.length >= 6) {
        console.log(`${playerName} already has ${playerHand.length} cards - no draw needed`);
        return false;
    }
    
    console.log(`${playerName} has ${playerHand.length} cards before drawing`);
    
    let cardsDrawn = 0;
    let duplicatesFound = 0;
    let maxAttempts = gameState.deck.length * 2; // Prevent infinite loops
    let attempts = 0;
    
    // Draw until 6 cards or deck is empty
    while (playerHand.length < 6 && attempts < maxAttempts) {
        attempts++;
        
        // Check if deck is completely empty
        if (gameState.deck.length === 0 && gameState.kozerTaken) {
            console.log(`No more cards available for ${playerName}`);
            break;
        }
        
        // Draw from deck if available
        if (gameState.deck.length > 0) {
            const drawnCard = gameState.deck.pop();
            
            // Check for duplicate
            const isDuplicate = checkForDuplicateCard(drawnCard, gameState);
            if (isDuplicate) {
                console.log(`DUPLICATE DETECTED: ${drawnCard.value}${drawnCard.suit} - skipping`);
                duplicatesFound++;
                // Put the card in discard pile instead of back in deck to prevent infinite loops
                gameState.discardPile.push(drawnCard);
                continue;
            }
            
            console.log(`${playerName} draws: ${drawnCard.value}${drawnCard.suit}`);
            playerHand.push(drawnCard);
            cardsDrawn++;
        } 
        // Take kozer if deck empty but kozer available
        else if (!gameState.kozerTaken && gameState.kozer) {
            // Check for duplicate kozer
            const isDuplicate = checkForDuplicateCard(gameState.kozer, gameState);
            if (isDuplicate) {
                console.log(`DUPLICATE KOZER DETECTED: ${gameState.kozer.value}${gameState.kozer.suit} - marking as taken`);
                gameState.kozerTaken = true;
                break;
            }
            
            console.log(`${playerName} takes kozer: ${gameState.kozer.value}${gameState.kozer.suit}`);
            playerHand.push(gameState.kozer);
            gameState.kozerTaken = true;
            cardsDrawn++;
            // Only one player can take the kozer
            break;
        } else {
            // No more cards available
            break;
        }
    }
    
    if (duplicatesFound > 0) {
        console.warn(`${duplicatesFound} duplicate cards detected and removed during draw for ${playerName}`);
    }
    
    // If this is the human player, sort their hand
    if (playerIndex === 0 && cardsDrawn > 0) {
        gameState.playerHands[0] = sortPlayerHand(playerHand, gameState.kozer ? gameState.kozer.suit : null);
        gameState.player1Hand = gameState.playerHands[0]; // Keep references in sync
    }
    
    updatePlayerHand(gameState.player1Hand);

    console.log(`${playerName} has ${playerHand.length} cards after drawing ${cardsDrawn} cards`);
    
    gameState.playerPickedUp = false;

    return cardsDrawn > 0;
}

function checkForEmptyHandEliminations(gameState) {
    // Only check for eliminations if deck is completely empty
    const isDeckEmpty = gameState.deck.length === 0 && gameState.kozerTaken;
    
    if (!isDeckEmpty) {
        return false;
    }
    
    let eliminationsOccurred = false;
    
    for (let i = 0; i < gameSettings.numPlayers; i++) {
        // Only check non-eliminated players with empty hands
        if (!gameState.eliminated[i] && gameState.playerHands[i].length === 0) {
            gameState.eliminated[i] = true;
            console.log(`Player ${gameSettings.playerNames[i]} eliminated with empty hand`);
            eliminationsOccurred = true;
            
            // Add system message to chat
            const messageDiv = document.createElement('div');
            messageDiv.className = 'system-message';
            messageDiv.textContent = `${gameSettings.playerNames[i]} has left the game.`;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // If eliminations occurred, check if game is over
    if (eliminationsOccurred) {
        checkGameOver(gameState);
    }
    
    return eliminationsOccurred;
}



/**
 * Draw up to 6 cards for each active player in proper order,
 * taking from deck first, then kozer, then handling eliminations.
 */
function drawUpToSix(gameState) {
    console.log("=== DRAWING CARDS UP TO SIX EACH ===");
  
    // ensure elimination array exists
    if (!gameState.eliminated) {
      gameState.eliminated = new Array(gameSettings.numPlayers).fill(false);
    }
  
    // count active players
    const activePlayers = gameState.eliminated.filter(e => !e).length;
    if (activePlayers <= 1) {
      console.log("Only one (or zero) active players – skipping draw.");
      return;
    }
  
    // build drawing order: attacker, others, defender last
    const order = createDrawingOrder(gameState);
    console.log("Drawing order:", order.map(i => gameSettings.playerNames[i]));
  
    // for each in order, top up to 6 cards
    for (const idx of order) {
      if (gameState.eliminated[idx]) continue;
  
      const hand = gameState.playerHands[idx];
      const name = gameSettings.playerNames[idx];
      console.log(`${name} has ${hand.length} cards before drawing`);
  
      while (hand.length < 6) {
        // no cards left at all?
        if (gameState.deck.length === 0 && gameState.kozerTaken) {
          console.log(`No more cards available for ${name}`);
          break;
        }
  
        // draw from deck
        if (gameState.deck.length > 0) {
          const card = gameState.deck.pop();
          console.log(`${name} draws ${card.value}${card.suit}`);
          hand.push(card);
  
        // take kozer if available
        } else if (!gameState.kozerTaken && gameState.kozer) {
          console.log(`${name} takes kozer ${gameState.kozer.value}${gameState.kozer.suit}`);
          hand.push(gameState.kozer);
          gameState.kozerTaken = true;
          break;
        }
      }
  
      // if human player, sort their hand
      if (idx === 0) {
        gameState.playerHands[0] = sortPlayerHand(hand, gameState.kozer.suit);
        gameState.player1Hand = gameState.playerHands[0];
      }
  
      console.log(`${name} has ${hand.length} cards after drawing`);
    }
  
    // once deck+kozer are gone, eliminate any empty‐hand players
    if (gameState.deck.length === 0 && gameState.kozerTaken) {
      checkForEmptyHandEliminations(gameState);
    }
  
    // refresh UI
    displayStockpile(gameState.deck, gameState.kozer, gameState.kozerTaken);
    updateOpponentDisplays(gameState);
  }
  

function canPileOn(gameState, playerIndex) {
    console.log(`Checking if player ${playerIndex} can pile on`);
    
    // Can only pile on if:
    // 1. There are already some attack cards on the table
    // 2. The defender still has cards to defend with
    // 3. The player is not the defender
    // 4. The player has valid cards to play
    // 5. The player is not the current attacker
    
    if (gameState.currentRound.attackCards.length === 0) {
        console.log("No attack cards on table - can't pile on");
        return false;
    }
    
    if (playerIndex === gameState.defender) {
        console.log("Player is defender - can't pile on");
        return false;
    }
    
    if (playerIndex === gameState.currentPlayer) {
        console.log("Player is the main attacker - can't pile on themselves");
        return false;
    }
    
    if (gameState.eliminated[playerIndex]) {
        console.log("Player is eliminated - can't pile on");
        return false;
    }
    
    // Check if defender has capacity to defend more cards
    const defenderHand = gameState.playerHands[gameState.defender];
    const undefendedAttacks = gameState.currentRound.attackCards.length - 
                             gameState.currentRound.defenseCards.length;
    
    if (defenderHand.length <= undefendedAttacks) {
        console.log("Defender has no more capacity - can't pile on");
        return false;
    }
    
    // Check if player has valid cards (matching ranks already in play)
    const playerHand = gameState.playerHands[playerIndex];
    const validRanks = [...new Set([
        ...gameState.currentRound.attackCards.map(c => c.value),
        ...gameState.currentRound.defenseCards.map(c => c.value)
    ])];
    
    const hasValidCard = playerHand.some(card => validRanks.includes(card.value));
    console.log(`Player has valid cards to pile on: ${hasValidCard}`);
    
    return hasValidCard;
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
        <button id="pileOnBtn" class="game-btn" style="display: none;">Pile On</button>
        <button id="skipPileOnBtn" class="game-btn" style="display: none;">Skip</button>
    `;
    arena.appendChild(actionDiv);

    document.getElementById('pileOnBtn').addEventListener('click', handlePileOn);
    document.getElementById('skipPileOnBtn').addEventListener('click', handleSkipPileOn);
}

function addPileOnButtons() {
    const actionButtons = document.getElementById('actionButtons');
    
    if (actionButtons) {
        // Check for existing pile-on buttons
        const existingPileOnBtn = document.getElementById('pileOnBtn');
        const existingSkipPileOnBtn = document.getElementById('skipPileOnBtn');
        
        // Only add if buttons don't already exist
        if (!existingPileOnBtn) {
            // Add pile-on button
            const pileOnBtn = document.createElement('button');
            pileOnBtn.id = 'pileOnBtn';
            pileOnBtn.className = 'game-btn';
            pileOnBtn.textContent = 'Pile On';
            pileOnBtn.style.display = 'none';
            actionButtons.appendChild(pileOnBtn);
            
            // Add event listener
            pileOnBtn.addEventListener('click', handlePileOn);
        }
        
        if (!existingSkipPileOnBtn) {
            // Add skip pile-on button
            const skipPileOnBtn = document.createElement('button');
            skipPileOnBtn.id = 'skipPileOnBtn';
            skipPileOnBtn.className = 'game-btn';
            skipPileOnBtn.textContent = 'Skip';
            skipPileOnBtn.style.display = 'none';
            actionButtons.appendChild(skipPileOnBtn);
            
            // Add event listener
            skipPileOnBtn.addEventListener('click', handleSkipPileOn);
        }
    }
}

function handlePileOn() {

    if (!canPileOn(gameState, 0)) {
        alert("You’re not allowed to pile on right now.");
        return;
      }


    console.log("Pile-on button clicked");
    
    const selectedCards = document.querySelectorAll('.card.selected');
    
    if (selectedCards.length === 0) {
        alert('Please select at least one card to pile on with');
        return;
    }
    
    // Get valid ranks from cards already in play
    const validRanks = [...new Set([
        ...gameState.currentRound.attackCards.map(c => c.value),
        ...gameState.currentRound.defenseCards.map(c => c.value)
    ])];
    
    // IMPROVED VALIDATION: Check if the defender has enough cards
    const defenderHandSize = gameState.playerHands[gameState.defender].length;
    const undefendedAttacks = gameState.currentRound.attackCards.length - 
                             gameState.currentRound.defenseCards.length;
    
    if (undefendedAttacks + selectedCards.length > defenderHandSize) {
        alert(`You cannot play ${selectedCards.length} more cards. The defender only has ${defenderHandSize} cards remaining and already needs to defend against ${undefendedAttacks} cards.`);
        return;
    }
    
    // Collect all selected cards with proper indexes
    const allPlayerCards = document.querySelectorAll('.card');
    let selectedCardDetails = [];
    
    for (let i = 0; i < selectedCards.length; i++) {
        const cardIndex = Array.from(allPlayerCards).indexOf(selectedCards[i]);
        const card = gameState.player1Hand[cardIndex];
        
        // Validate that we found a valid card
        if (!card) {
            console.error("Card not found at index", cardIndex);
            alert("Error with selected card. Please try again.");
            return;
        }
        
        // Check if card has valid rank
        if (!validRanks.includes(card.value)) {
            alert('You can only pile on with cards that match ranks already in play');
            return;
        }
        
        selectedCardDetails.push({ index: cardIndex, card: card });
    }
    
    // Sort in reverse order to avoid index shifting when removing cards
    selectedCardDetails.sort((a, b) => b.index - a.index);
    
    // Process each card
    for (const item of selectedCardDetails) {
        // Add to attack cards
        gameState.currentRound.attackCards.push(item.card);
        
        // Remove from player's hand
        gameState.player1Hand.splice(item.index, 1);
    }
    
    // Keep playerHands[0] and player1Hand in sync
    gameState.playerHands[0] = gameState.player1Hand;
    gameState.player1Hand = sortPlayerHand(gameState.player1Hand, gameState.kozer.suit);
    gameState.playerHands[0] = gameState.player1Hand;
    
    // Update UI
    updatePlayerHand(gameState.player1Hand);
    updateCardArea(gameState);
    updateOpponentDisplays(gameState);
    
    // Clear the pile-on status for this player
    gameState.pileOnAttacker = null;
    
    // FIX: Don't move to the next pile-on attacker automatically
    // Instead, let the defender respond to these new attacks first
    if (gameState.defender !== 0) {
        // If defender is bot, trigger bot defense
        setTimeout(() => botDefend(gameState), 1500);
    } else {
        // If defender is human, update game status for defense
        updateGameStatus(gameState);
    }
    
    // Save state
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}


function handleSkipPileOn() {
    console.log("Skip pile-on button clicked");
    
    // Set skip flag to prevent recursive pile-on checks
    gameState.skipNextPileOnCheck = true;
    
    // Clear the pile-on status for this player
    gameState.pileOnAttacker = null;
    
    // Process the end of successful defense immediately
    processEndOfSuccessfulDefense(gameState);
    
    
    // Update game status
    updateGameStatus(gameState);
    
    // Update all UI elements
    updateButtonStates(gameState);
    updateCardArea(gameState);
    updatePlayerHand(gameState.player1Hand);
    updateOpponentDisplays(gameState);
    
    // Save state
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}


// Improved processEndOfSuccessfulDefense function to fix freezes
function processEndOfSuccessfulDefense(gameState) {
    console.log("=== PROCESSING END OF SUCCESSFUL DEFENSE ===");
    
    // 1. Clear the pile-on state first to prevent recursion issues
    resetPileOnState(gameState);
    
    // 2. Move all cards to discard pile
    gameState.discardPile = gameState.discardPile.concat(
        gameState.currentRound.attackCards, 
        gameState.currentRound.defenseCards
    );
    
    // 3. Clear current round
    gameState.currentRound = {
        attackCards: [],
        defenseCards: []
    };
    
    // 4. Draw cards for all players in proper order
    console.log("Drawing cards after successful defense");
    drawUpToSix(gameState);
    
    // 5. Check for game over BEFORE changing player positions
    checkGameOver(gameState);
    
    if (!gameState.gameInProgress) {
        console.log("Game ended during end of successful defense");
        updateGameStatus(gameState);
        return; // Exit early if game is over
    }
    
    // 6. Handle player picked up flag - defender skips turn if they took cards
    if (gameState.playerPickedUp) {
        // If defender took cards earlier, skip their turn and go to next player
        gameState.currentPlayer = getNextActivePlayer(gameState, gameState.currentPlayer);
        gameState.playerPickedUp = false; // Reset the flag
    } else {
        // Normal flow: defender becomes next attacker
        gameState.currentPlayer = gameState.defender;
    }
    
    // 7. Next defender is player after new attacker
    gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
    
    // 8. Safety check to prevent self-attack
    if (gameState.currentPlayer === gameState.defender) {
        console.log("WARNING: Current player same as defender - potential game logic error");
        if (gameState.eliminated.filter(e => !e).length <= 1) {
            // Only one player left - game over
            gameState.gameInProgress = false;
            updateGameStatus(gameState);
            return;
        } else {
            // Try to fix by advancing to next player
            gameState.currentPlayer = getNextActivePlayer(gameState, gameState.currentPlayer);
            gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
        }
    }
    
    // 9. Reset for next round
    gameState.firstCard = true;
    gameState.skipNextPileOnCheck = false;

    // 10. Update UI
    updateCardArea(gameState);
    updatePlayerHand(gameState.player1Hand);
    updateOpponentDisplays(gameState);
    updateGameStatus(gameState);
    updateButtonStates(gameState);

    // 11. Save state
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
    
    // 12. Trigger bot play if needed with timeout
    if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
        console.log(`Scheduling bot ${gameState.currentPlayer} to play after successful defense`);
        setTimeout(() => botPlay(gameState), 2000);
    }
    
    console.log("Round completed successfully");
}

function updateGameStatus(gameState, isPileOn = false) {
    const statusDiv = document.getElementById('gameStatus');
    if (!statusDiv) return;
    
    let statusText = '';
    
    if (!gameState.gameInProgress) {
        // Game is over - display game over status
        const activePlayers = gameState.eliminated.filter(eliminated => !eliminated).length;
        
        if (activePlayers === 0) {
            statusText = "Game Over - It's a tie!";
        } else if (activePlayers === 1) {
            const durakIndex = gameState.eliminated.indexOf(false);
            const durakName = gameSettings.playerNames[durakIndex];
            
            if (durakIndex === 0) {
                statusText = "Game Over - You are the Durak!";
            } else {
                statusText = `Game Over - ${durakName} is the Durak!`;
            }
        } else {
            statusText = "Game Over";
        }
    } else if (isPileOn || gameState.pileOnAttacker !== null) {
        // FIX: Use the correct names for pile-on status
        // Pile-on is in progress - make sure to use correct player indices
        if (gameState.pileOnAttacker === 0) {
            // Human is piling on
            const defenderName = gameSettings.playerNames[gameState.defender];
            statusText = `Your turn to pile on against ${defenderName}`;
        } else if (gameState.defender === 0) {
            // Human is defending against pile-on
            const attackerName = gameSettings.playerNames[gameState.pileOnAttacker];
            statusText = `${attackerName} is piling on - your turn to defend`;
        } else {
            // Bots are piling on and defending
            const attackerName = gameSettings.playerNames[gameState.pileOnAttacker];
            const defenderName = gameSettings.playerNames[gameState.defender];
            statusText = `${attackerName} is piling on against ${defenderName}`;
        }
    } else {
        // Normal play
        const attackerName = gameSettings.playerNames[gameState.currentPlayer];
        const defenderName = gameSettings.playerNames[gameState.defender];
        
        if (gameState.currentPlayer === 0) {
            statusText = `Your turn to attack ${defenderName}`;
        } else if (gameState.defender === 0) {
            statusText = `${attackerName} is attacking you`;
        } else {
            statusText = `${attackerName} is attacking ${defenderName}`;
        }
    }
    
    statusDiv.textContent = statusText;
    updateButtonStates(gameState);
}


 function getNextActivePlayer(gameState, currentPosition) {
    // Check for any new eliminations that might have occurred
    checkAndUpdateElimination(gameState);
    
    // Count active players
    let activePlayers = 0;
    for (let i = 0; i < gameSettings.numPlayers; i++) {
        if (!gameState.eliminated[i]) {
            activePlayers++;
        }
    }
    
    // If only one player is active, game should be over
    if (activePlayers <= 1) {
        gameState.gameInProgress = false;
        updateGameStatus(gameState);
        checkGameOver(gameState);
        return currentPosition;
    }
    
    // Use a circular rotation to find next non-eliminated player
    let nextPlayer = (currentPosition + 1) % gameSettings.numPlayers;
    
    // Keep rotating until we find a non-eliminated player
    while (gameState.eliminated[nextPlayer]) {
        nextPlayer = (nextPlayer + 1) % gameSettings.numPlayers;
        
        // Safety check: if we've gone full circle and still found nobody, return the current position
        if (nextPlayer === currentPosition) {
            gameState.gameInProgress = false;
            updateGameStatus(gameState);
            checkGameOver(gameState);
            return currentPosition;
        }
    }
    
    return nextPlayer;
}

function updateButtonStates(gameState) {
    const pileOnBtn    = document.getElementById('pileOnBtn');
    const skipPileOnBtn= document.getElementById('skipPileOnBtn');
    const attackBtn    = document.getElementById('attackBtn');
    const finishAttackBtn = document.getElementById('finishAttackBtn');
    const defendBtn    = document.getElementById('defendBtn');
    const takeCardsBtn = document.getElementById('takeCardsBtn');
    const passBtn      = document.getElementById('passBtn');

    // Ensure all buttons exist before accessing them
    if (!pileOnBtn || !skipPileOnBtn || !attackBtn || !finishAttackBtn || 
        !defendBtn || !takeCardsBtn || !passBtn) {
        console.error("Some buttons not found in the DOM");
        return;
    }

    // 1) Hide everything by default
    [attackBtn, finishAttackBtn, defendBtn, takeCardsBtn, passBtn,
     pileOnBtn, skipPileOnBtn].forEach(btn => btn.style.display = 'none');

    if (!gameState || !gameState.gameInProgress) return;

    // 2) If we're in a pile-on cycle, show only those buttons to the human
    if (gameState.pileOnAttacker !== null) {
        const humanTurnToPile = gameState.pileOnAttacker === 0 && !gameState.eliminated[0];
        if (humanTurnToPile) {
            console.log("Showing pile-on buttons for human");
            pileOnBtn.style.display = 'inline-block';
            skipPileOnBtn.style.display = 'inline-block';
        } else if (gameState.defender === 0) {
            console.log("Human is defending against pile-on");
            defendBtn.style.display = 'inline-block';
            takeCardsBtn.style.display = 'inline-block';
        }
        return;  // skip the normal-attack/defend logic
    }

    // 3) Normal attack/defend flow
    if (gameState.currentPlayer === 0) {
        attackBtn.style.display = 'inline-block';
        finishAttackBtn.style.display = 'inline-block';
    } else if (gameState.defender === 0) {
        defendBtn.style.display = 'inline-block';
        takeCardsBtn.style.display = 'inline-block';
        
        // Show pass button only if allowed by game rules and card situation
        if (gameState.settings.perevodnoyMode && canPass(gameState)) {
            passBtn.style.display = 'inline-block';
        }
    }
}



function canPass(gameState) {
    // First, check if player has already played a defense card this round
    if (gameState.currentRound.defenseCards.length > 0) return false;
    
    // Get the most recent attack card
    const currentAttackCard = gameState.currentRound.attackCards[gameState.currentRound.attackCards.length - 1];
    if (!currentAttackCard) return false;
    
    // Check if player has at least one card of the same rank
    return gameState.player1Hand.some(card => card.value === currentAttackCard.value);
}


function initializeGameControls(gameState) {

    addPileOnButtons();
    //pile on btns
    document.getElementById('pileOnBtn')?.addEventListener('click', handlePileOn);
    document.getElementById('skipPileOnBtn')?.addEventListener('click', handleSkipPileOn);    
    
    //attack btn
    document.getElementById('attackBtn')?.addEventListener('click', function() {
        console.log("Attack button clicked");
        
        // Safety check: prevent attacking with more cards than defender can handle
        if (shouldLimitAttack(gameState)) {
            alert('Cannot attack with more cards than the defender has remaining in hand');
            return;
        }

        const selectedCards = document.querySelectorAll('.card.selected');
        if (selectedCards.length === 0) {
            alert('Please select at least one card to attack with');
            return;
        }
        
        // Count how many undefended attacks are currently in play
        const undefendedAttacks = gameState.currentRound.attackCards.length - 
                                gameState.currentRound.defenseCards.length;
        
        // Get defender's hand size
        const defenderHandSize = gameState.playerHands[gameState.defender].length;
        
        // Check if adding the selected cards would exceed defender's hand size
        if (undefendedAttacks + selectedCards.length > defenderHandSize) {
            alert(`You cannot play ${selectedCards.length} cards. The defender only has ${defenderHandSize} cards remaining and already needs to defend against ${undefendedAttacks} cards.`);
            return;
        }
        
        // Rest of the original attack button code...
        // Collect all selected cards with proper indexes
        const allPlayerCards = document.querySelectorAll('.card');
        let selectedCardDetails = [];
        
        for (let i = 0; i < selectedCards.length; i++) {
            const cardIndex = Array.from(allPlayerCards).indexOf(selectedCards[i]);
            const card = gameState.player1Hand[cardIndex];
            
            // Validate that we found a valid card
            if (!card) {
                console.error("Card not found at index", cardIndex);
                alert("Error with selected card. Please try again.");
                return;
            }
            
            selectedCardDetails.push({ index: cardIndex, card: card });
        }
        
        // Validate first card rule
        if (gameState.firstCard && selectedCardDetails.length > 1) {
            const firstValue = selectedCardDetails[0].card.value;
            const allSameValue = selectedCardDetails.every(item => item.card.value === firstValue);
            
            if (!allSameValue) {
                alert('All cards must have the same value for your first attack');
                return;
            }
        }
        
        // Validate subsequent attacks
        if (!gameState.firstCard && gameState.currentRound.attackCards.length > 0) {
            const validRanks = [...new Set([
                ...gameState.currentRound.attackCards.map(c => c.value),
                ...gameState.currentRound.defenseCards.map(c => c.value)
            ])];
            
            const allValidRanks = selectedCardDetails.every(item => 
                validRanks.includes(item.card.value)
            );
            
            if (!allValidRanks) {
                alert('You can only attack with cards that match ranks already in play');
                return;
            }
        }
        
        // All validation passed, make the attack
        console.log("Attack valid, processing...");
        
        // Sort in reverse order to avoid index shifting when removing cards
        selectedCardDetails.sort((a, b) => b.index - a.index);
        
        // Process each card
        for (const item of selectedCardDetails) {
            // Add to attack cards
            gameState.currentRound.attackCards.push(item.card);
            
            // Remove from player's hand
            gameState.player1Hand.splice(item.index, 1);
        }
        
        // Update game state
        if (gameState.firstCard) {
            gameState.firstCard = false;
        }

        // Keep playerHands[0] and player1Hand in sync - important!
        gameState.playerHands[0] = gameState.player1Hand;
        gameState.player1Hand = sortPlayerHand(gameState.player1Hand, gameState.kozer.suit);
        gameState.playerHands[0] = gameState.player1Hand;
        
        // Update UI
        updatePlayerHand(gameState.player1Hand);
        updateCardArea(gameState);
        updateOpponentDisplays(gameState); // Add this line to ensure opponent displays are updated
        
        // Save state
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
        
        // If defender is a bot, trigger bot defense
        if (gameState.defender !== 0) {
            setTimeout(() => botDefend(gameState), 3000);
        }
        
        console.log("Attack completed successfully");
    });
  
    //finish attack btn
    document.getElementById('finishAttackBtn')?.addEventListener('click', function() {
        if (gameState.currentRound.attackCards.length === 0) {
            alert('You must play at least one card to attack');
            return;
        }
        
        // Process attack end
        if (gameState.currentRound.attackCards.length === gameState.currentRound.defenseCards.length) {
            // All cards defended - move to discard pile
            gameState.discardPile = gameState.discardPile.concat(
                gameState.currentRound.attackCards, 
                gameState.currentRound.defenseCards
            );
            
            // Defender becomes attacker
            gameState.currentPlayer = gameState.defender;
        } else {
            // Defender takes all cards
            const defenderHand = gameState.playerHands[gameState.defender];
            defenderHand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
            
            // Next player after defender becomes attacker
            gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
        }
        
        // Clear the round
        gameState.currentRound = {
            attackCards: [],
            defenseCards: []
        };
        
        // Next defender is player after the new attacker
        gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
        
        // CRITICAL: Call the guaranteed draw function
        console.log("Drawing cards after player finishes attack");
        drawUpToSix(gameState);
        drawCardsForPlayer(gameState, 0);
        
        // Reset for next round
        gameState.firstCard = true;
        
        // Make sure player1Hand is always a reference to playerHands[0]
        gameState.player1Hand = gameState.playerHands[0];
        
        // Update UI
        updateCardArea(gameState);
        updatePlayerHand(gameState.player1Hand);
        updateOpponentDisplays(gameState);
        
        // Check for game over
        checkGameOver(gameState);
        
        // If next player is bot and game is still active, trigger bot play
        if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
            setTimeout(() => botPlay(gameState), 2000);
        }
        
        // Save game state
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
    });
    

        //defend btn
        // Update the event listener for the defend button
    document.getElementById('defendBtn')?.addEventListener('click', function() {
        const selectedCards = document.querySelectorAll('.card.selected');
        
        // Count how many undefended attack cards there are
        const undefendedAttackCount = gameState.currentRound.attackCards.length - gameState.currentRound.defenseCards.length;
        
        // If there are multiple undefended attack cards, require selecting that many cards
        if (undefendedAttackCount > 1) {
            if (selectedCards.length !== undefendedAttackCount) {
                alert(`Please select exactly ${undefendedAttackCount} cards to defend with (one for each attack)`);
                return;
            }
            
            // Collect all selected cards and verify they're all valid defenses
            const selectedCardDetails = [];
            const allPlayerCards = document.querySelectorAll('.card');
            
            for (let i = 0; i < selectedCards.length; i++) {
                const cardIndex = Array.from(allPlayerCards).indexOf(selectedCards[i]);
                const card = gameState.player1Hand[cardIndex];
                
                // Validate that we found a valid card
                if (!card) {
                    console.error("Card not found at index", cardIndex);
                    alert("Error with selected card. Please try again.");
                    return;
                }
                
                selectedCardDetails.push({ index: cardIndex, card: card });
            }
            
            // Verify each defense is valid against corresponding attack card
            for (let i = 0; i < undefendedAttackCount; i++) {
                const attackCardIndex = gameState.currentRound.defenseCards.length + i;
                const attackCard = gameState.currentRound.attackCards[attackCardIndex];
                
                // Check that at least one selected card can defend against this attack
                let validDefenseFound = false;
                
                for (let j = 0; j < selectedCardDetails.length; j++) {
                    if (canDefendWith(selectedCardDetails[j].card, attackCard, gameState.kozer.suit)) {
                        validDefenseFound = true;
                        
                        // Move this valid defense card to position i
                        if (j !== i) {
                            [selectedCardDetails[i], selectedCardDetails[j]] = 
                            [selectedCardDetails[j], selectedCardDetails[i]];
                        }
                        
                        break;
                    }
                }
                
                if (!validDefenseFound) {
                    alert(`One of your selected cards cannot defend against attack ${i+1}. Please select valid defense cards.`);
                    return;
                }
            }
            
            // All validations passed, execute all defenses
            // Sort in reverse order to avoid index shifting when removing cards
            selectedCardDetails.sort((a, b) => b.index - a.index);
            
            // Process each defense card
            for (let i = 0; i < undefendedAttackCount; i++) {
                const defenseCard = selectedCardDetails[i].card;
                
                // Add to defense cards in order
                gameState.currentRound.defenseCards.push(defenseCard);
                
                // Remove from player's hand
                gameState.player1Hand.splice(selectedCardDetails[i].index, 1);
            }
            
            // Keep playerHands[0] and player1Hand in sync
            gameState.playerHands[0] = gameState.player1Hand;
            gameState.player1Hand = sortPlayerHand(gameState.player1Hand, gameState.kozer.suit);
            gameState.playerHands[0] = gameState.player1Hand;
            
            updatePlayerHand(gameState.player1Hand);
            updateCardArea(gameState);
            updateOpponentDisplays(gameState); // Add this line to update opponent displays
            
            // Check if all attacks are defended
            if (gameState.currentRound.defenseCards.length === gameState.currentRound.attackCards.length) {
                // If maximum attacks reached (6) or attacker has no valid cards
                if (gameState.currentRound.attackCards.length >= 6 || attackerHasNoValidCards(gameState)) {
                    endDefense(gameState, true);
                } else if (gameState.currentPlayer !== 0) {
                    // If attacker is a bot, let it play another card
                    setTimeout(() => botPlay(gameState), 3000);
                }
            }
            
            localStorage.setItem('durakGameState', JSON.stringify(gameState));
            return;
        }
        
        // Original code for handling a single defense
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

        // Ensure playerHands[0] and player1Hand stay in sync
        gameState.playerHands[0] = gameState.player1Hand;
        gameState.player1Hand = sortPlayerHand(gameState.player1Hand, gameState.kozer.suit);
        gameState.playerHands[0] = gameState.player1Hand;
        
        updatePlayerHand(gameState.player1Hand);
        updateCardArea(gameState);
        updateOpponentDisplays(gameState); // Add this line to update opponent displays
        
        // if all attacks are defended, update the game state
        if (gameState.currentRound.defenseCards.length === gameState.currentRound.attackCards.length) {
            // if maximum attacks reached (6) or attacker has no more valid cards
            if (gameState.currentRound.attackCards.length >= 6 || attackerHasNoValidCards(gameState)) {
                endDefense(gameState, true);
            } else if (gameState.currentPlayer !== 0) {
                // if attacker is a bot, let it play another card
                setTimeout(() => botPlay(gameState), 3000);
            }
            // if attacker is human, they need to choose to attack again or finish attack
        }
        
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
    });
    
    // take Cards button
    document.getElementById('takeCardsBtn')?.addEventListener('click', function() {
        gameState.playerPickedUp = true;
        
        const defenderHand = gameState.playerHands[gameState.defender];
        
        // Add all cards to defender's hand
        defenderHand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
        
        // Clear current round
        gameState.currentRound = {
            attackCards: [],
            defenseCards: []
        };
        
        // Next attacker is player after defender
        gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
        
        // Next defender is player after new attacker
        gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
        
        // FIX: Always reset pile-on state when cards are taken
        resetPileOnState(gameState);
        
        // CRITICAL: Call the guaranteed draw function
        console.log("Drawing cards after player takes cards");
        drawUpToSix(gameState);
        
        // Reset for next round
        gameState.firstCard = true;
        
        // If defender was player 1, need to sort hand and sync references
        if (gameState.defender === 0) {
            gameState.player1Hand = gameState.playerHands[0];
        }
        
        gameState.playerHands[0] = sortPlayerHand(gameState.playerHands[0], gameState.kozer.suit);
        gameState.player1Hand = gameState.playerHands[0];
        
        // Update UI
        updateCardArea(gameState);
        updatePlayerHand(gameState.player1Hand);
        updateOpponentDisplays(gameState);
        updateGameStatus(gameState);
        
        // Check for game over
        checkGameOver(gameState);
        
        // If next player is bot and game is active, schedule bot play
        if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
            setTimeout(() => botPlay(gameState), 2000);
        }
        
        // Save game state
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
    });
    
    // Pass button (Perevodnoy mode)
    document.getElementById('passBtn')?.addEventListener('click', function() {
        if (!gameSettings.perevodnoyMode) return;
        
        const selectedCards = document.querySelectorAll('.card.selected');
        if (selectedCards.length === 0) {
            alert('Please select at least one card to pass with');
            return;
        }
        
        // Safety check: ensure we're not overloading the next defender
        if (wouldPassOverloadNextDefender(gameState, selectedCards.length)) {
            // Find the next defender's name
            const nextDefender = getNextActivePlayer(gameState, gameState.defender);
            const nextDefenderName = gameSettings.playerNames[nextDefender];
            
            alert(`Cannot pass these cards to ${nextDefenderName}. They would have more cards to defend against than they have in their hand.`);
            return;
        }
        
        // Get the most recent attack card's value
        const attackCard = gameState.currentRound.attackCards[gameState.currentRound.attackCards.length - 1];
        const requiredValue = attackCard.value;
        
        // Collect all selected cards with proper indexes
        const allPlayerCards = document.querySelectorAll('.card');
        let selectedCardDetails = [];
        
        for (let i = 0; i < selectedCards.length; i++) {
            const cardIndex = Array.from(allPlayerCards).indexOf(selectedCards[i]);
            const card = gameState.player1Hand[cardIndex];
            
            // Validate that we found a valid card
            if (!card) {
                console.error("Card not found at index", cardIndex);
                alert("Error with selected card. Please try again.");
                return;
            }
            
            selectedCardDetails.push({ index: cardIndex, card: card });
        }
        
        // Check if all selected cards have the required value
        const allSameValue = selectedCardDetails.every(item => item.card.value === requiredValue);
        
        if (!allSameValue) {
            alert('You can only pass with cards of the same rank as the attack card');
            return;
        }
        
        // Sort in reverse order to avoid index shifting when removing cards
        selectedCardDetails.sort((a, b) => b.index - a.index);
        
        // Process each card
        for (const item of selectedCardDetails) {
            // Add to attack cards
            gameState.currentRound.attackCards.push(item.card);
            
            // Remove from player's hand
            gameState.player1Hand.splice(item.index, 1);
        }
        
        // Update playerHands[0] to match player1Hand
        gameState.playerHands[0] = gameState.player1Hand;
        
        // Store the current defender before changing it
        const oldDefender = gameState.defender;
        
        // new defender is the next player in circular order
        gameState.defender = getNextActivePlayer(gameState, gameState.defender);
        
        // player becomes the attacker
        gameState.currentPlayer = oldDefender;
        
        // Set firstCard to false since this is not the first attack anymore
        gameState.firstCard = false;
        
        // Do NOT set attackComplete to true here, since the round is not over
        // The round continues with a new defender
        
        // Sort player's hand
        gameState.player1Hand = sortPlayerHand(gameState.player1Hand, gameState.kozer.suit);
        gameState.playerHands[0] = gameState.player1Hand;
    
        updatePlayerHand(gameState.player1Hand);
        updateCardArea(gameState);
        updateOpponentDisplays(gameState);
        updateGameStatus(gameState);
        
        if (gameState.defender !== 0) {
            setTimeout(() => botDefend(gameState), 3000);
        }
        
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
    });
    
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


function sortPlayerHand(hand, trumpSuit) {
    if (!hand || hand.length === 0) return hand;
    
    // Create copies of the hand to separate trump and non-trump cards
    const nonTrumpCards = hand.filter(card => card.suit !== trumpSuit);
    const trumpCards = hand.filter(card => card.suit === trumpSuit);
    
    // Sort both arrays by card rank (using the existing getCardRank function)
    nonTrumpCards.sort((a, b) => getCardRank(a) - getCardRank(b));
    trumpCards.sort((a, b) => getCardRank(a) - getCardRank(b));
    
    // Return combined sorted hand with non-trump cards first, then trump cards
    return [...nonTrumpCards, ...trumpCards];
}


function updatePlayerHand(hand) {
    const handContainer = document.querySelector('.hand-container');
    
    handContainer.innerHTML = '';
    
    // Track when we transition from non-trump to trump cards
    let lastCardWasTrump = false;
    
    for (let i = 0; i < hand.length; i++) {
        const card = hand[i];
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        // Add trump card styling
        if (gameState && gameState.kozer && card.suit === gameState.kozer.suit) {
            cardDiv.classList.add('trump');
            
            // Add separator class to first trump card
            if (!lastCardWasTrump) {
                cardDiv.classList.add('trump-separator');
            }
            
            lastCardWasTrump = true;
        } else {
            lastCardWasTrump = false;
        }
        
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

function updateOpponentDisplays(gameState) {
    // Make sure we have player hands and settings
    if (!gameState || !gameState.playerHands || !gameSettings) {
        console.error("Cannot update opponents: missing game state data");
        return;
    }
    
    const opponentArea = document.querySelector('.opponent-area');
    if (!opponentArea) return;
    
    // Check if we need to create the opponent elements
    const existingOpponents = opponentArea.querySelectorAll('.opponent');
    const expectedOpponents = gameSettings.numPlayers - 1;
    
    // If number of opponent elements doesn't match expected, recreate them all
    if (existingOpponents.length !== expectedOpponents) {
        console.log("Recreating all opponent elements");
        opponentArea.innerHTML = '';
        
        for (let i = 1; i < gameSettings.numPlayers; i++) {
            const opponentDiv = document.createElement('div');
            opponentDiv.className = 'opponent';
            opponentDiv.innerHTML = `
                <div class="opponent-cards"></div>
                <div class="player-name">${gameSettings.playerNames[i]}</div>
            `;
            opponentArea.appendChild(opponentDiv);
        }
    }
    
    // Now update each opponent's cards
    const opponents = opponentArea.querySelectorAll('.opponent');
    for (let i = 0; i < opponents.length; i++) {
        const playerIndex = i + 1; // opponent indices start at 1
        
        if (playerIndex < gameState.playerHands.length) {
            const playerName = gameSettings.playerNames[playerIndex];
            const handLength = gameState.playerHands[playerIndex] ? gameState.playerHands[playerIndex].length : 0;
            
            // Update name (in case it changed)
            const nameElement = opponents[i].querySelector('.player-name');
            if (nameElement) {
                nameElement.textContent = playerName;
            }
            
            // Update cards
            const opponentCards = opponents[i].querySelector('.opponent-cards');
            if (opponentCards) {
                opponentCards.innerHTML = '';
                
                for (let j = 0; j < handLength; j++) {
                    const cardBackDiv = document.createElement('div');
                    cardBackDiv.className = 'opponent-card-back';
                    opponentCards.appendChild(cardBackDiv);
                }
            }
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
        
        if (deck.length === 0) {
            // When deck is empty AND kozer is taken, show trump suit icon
            stockpileCard.style.display = 'block';  // Keep the card container visible
            
            // Create suit icon
            const suitIcon = document.createElement('div');
            suitIcon.className = 'trump-suit-icon';
            if (kozer && kozer.isRed) {
                suitIcon.classList.add('red');
            }
            suitIcon.textContent = kozer ? kozer.suit : "?";
            
            // Clear and add the suit icon
            stockpileDiv.innerHTML = '';
            stockpileDiv.appendChild(suitIcon);
        } else {
            // Kozer is taken but deck still has cards
            stockpileCard.style.display = 'block';
            stockpileDiv.textContent = deck.length + " cards";
        }
    } else {
        // Normal display when kozer is still visible
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
        
        if (stockpileDiv) {
            totalCards = deck.length + 1;
            stockpileDiv.textContent = totalCards + " cards";
        }
        
        if (stockpileCard) {
            stockpileCard.style.display = 'block';
        }
    }
}

// Fix botPlay function to avoid duplicate updates
function botPass(gameState, passCard) {
    console.log("=== BOT PASSING ===");
    console.log("Current player (attacker):", gameState.currentPlayer);
    console.log("Current defender:", gameState.defender);
    
    // Find all cards with the same value
    const defenderHand = gameState.playerHands[gameState.defender];
    const sameValueCards = defenderHand.filter(card => card.value === passCard.value);
    
    console.log(`Bot has ${sameValueCards.length} cards of value ${passCard.value} to potentially pass`);
    
    // Decide how many to pass based on difficulty
    let numberToPass = 1;
    if (gameSettings.botDifficulty === 'hard' && sameValueCards.length > 1) {
        // Hard bots might pass multiple cards
        numberToPass = Math.min(Math.floor(Math.random() * sameValueCards.length) + 1, sameValueCards.length);
    }
    
    // Safety check for next defender's capacity
    const nextDefender = getNextActivePlayer(gameState, gameState.defender);
    const nextDefenderHandSize = gameState.playerHands[nextDefender].length;
    const currentUndefendedCards = gameState.currentRound.attackCards.length - 
                                 gameState.currentRound.defenseCards.length;
    
    // Limit passes to next defender's capacity
    const maxSafePass = Math.max(0, nextDefenderHandSize - currentUndefendedCards);
    numberToPass = Math.min(numberToPass, maxSafePass);
    
    console.log(`Bot will pass ${numberToPass} cards to next defender`);
    
    // Take cards if can't safely pass
    if (numberToPass === 0) {
        console.log("Cannot safely pass - taking cards instead");
        botTakeCards(gameState);

        gameState.playerPickedUp = true;
        return;
    }
    
    // Select cards to pass
    const cardsToPass = [passCard];
    const remainingSameValueCards = sameValueCards.filter(card => 
        !(card.suit === passCard.suit && card.value === passCard.value));
    
    // Add additional cards if needed
    while (cardsToPass.length < numberToPass && remainingSameValueCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingSameValueCards.length);
        cardsToPass.push(remainingSameValueCards[randomIndex]);
        remainingSameValueCards.splice(randomIndex, 1);
    }
    
    // Process all pass cards
    for (const card of cardsToPass) {
        const cardIndex = defenderHand.findIndex(c => 
            c.suit === card.suit && c.value === card.value);
        
        if (cardIndex !== -1) {
            console.log(`Bot passes card: ${card.value}${card.suit}`);
            gameState.currentRound.attackCards.push(card);
            defenderHand.splice(cardIndex, 1);
        }
    }
    
    // Update UI
    updateCardArea(gameState);
    updateOpponentDisplays(gameState);
    
    // Store current defender before changing
    const oldDefender = gameState.defender;
    
    // New defender is next player
    gameState.defender = nextDefender;
    
    // Previous defender becomes attacker
    gameState.currentPlayer = oldDefender;

    // Safety check for self-attack
    if (gameState.currentPlayer === gameState.defender && gameState.gameInProgress) {
        console.log("Preventing self-attack after pass - ending game");
        gameState.gameInProgress = false;
        updateGameStatus(gameState);
        checkGameOver(gameState);
        return;
    }
    
    // Set firstCard to false since not first attack anymore
    gameState.firstCard = false;
    
    // Update game status
    updateGameStatus(gameState);
    
    // Check for game over
    if (checkGameOver(gameState)) {
        console.log("Game over detected after pass");
        return;
    }

    console.log("After pass - new attacker:", gameState.currentPlayer);
    console.log("After pass - new defender:", gameState.defender);

    // If new defender is bot, trigger bot defense
    if (gameState.defender !== 0 && gameState.gameInProgress) {
        console.log("New defender is bot - scheduling bot defense");
        setTimeout(() => {
            console.log("Executing scheduled bot defense after pass");
            botDefend(gameState);
        }, 1500);
    }
    
    // Save game state
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}



function selectDefenseCard(validDefenseCards, attackCard, difficulty, gameState) {
    // First, make sure we're not working with duplicates within validDefenseCards
    const uniqueDefenseCards = [];
    const seenCards = new Set();
    
    for (const card of validDefenseCards) {
        const cardKey = `${card.value}${card.suit}`;
        if (!seenCards.has(cardKey)) {
            seenCards.add(cardKey);
            uniqueDefenseCards.push(card);
        }
    }
    
    // If no valid cards after deduplication, return null
    if (uniqueDefenseCards.length === 0) return null;
    
    // Easy bots use random card
    if (difficulty === 'easy') {
        return uniqueDefenseCards[Math.floor(Math.random() * uniqueDefenseCards.length)];
    }
    
    // Medium and hard bots use strategy
    // Separate trump and non-trump defense cards
    const trumpDefenseCards = uniqueDefenseCards.filter(card => card.suit === gameState.kozer.suit);
    const nonTrumpDefenseCards = uniqueDefenseCards.filter(card => card.suit !== gameState.kozer.suit);
    
    if (attackCard.suit === gameState.kozer.suit) {
        // Attack is trump, must use higher trump
        trumpDefenseCards.sort((a, b) => getCardRank(a) - getCardRank(b));
        return trumpDefenseCards.length > 0 ? trumpDefenseCards[0] : null;
    } else if (nonTrumpDefenseCards.length > 0) {
        // Non-trump attack with non-trump defense available
        nonTrumpDefenseCards.sort((a, b) => getCardRank(a) - getCardRank(b));
        return nonTrumpDefenseCards[0];
    } else {
        // Must use trump
        trumpDefenseCards.sort((a, b) => getCardRank(a) - getCardRank(b));
        return trumpDefenseCards.length > 0 ? trumpDefenseCards[0] : null;
    }
}


function botDefend(gameState) {
    console.log("=== BOT DEFENDING ===");
    console.log("Current player (attacker):", gameState.currentPlayer);
    console.log("Current defender:", gameState.defender);
    
    if (!gameState.gameInProgress) return;
 
    const defenderHand = gameState.playerHands[gameState.defender];
    if (defenderHand.length === 0) {
        processEndOfSuccessfulDefense(gameState);
    }
    
    // Skip if it's not a bot's turn to defend
    if (gameState.defender === 0) {
        updateGameStatus(gameState);
    };
    
    // FIX for stuck game: Check if in a stuck pile-on state
    if (gameState.pileOnAttacker !== null && gameState.currentRound.attackCards.length === gameState.currentRound.defenseCards.length) {
        console.log("Game appears stuck in pile-on state - forcibly continuing");
        gameState.pileOnAttacker = null;
        processEndOfSuccessfulDefense(gameState);
        return;
    }
    
    console.log(`Bot ${gameState.defender} is defending`);
   
    const difficulty = gameSettings.botDifficulty;

    
    // Count undefended attack cards
    const undefendedAttackCount = gameState.currentRound.attackCards.length - gameState.currentRound.defenseCards.length;
    
    // Don't attempt to defend if there are no undefended cards
    if (undefendedAttackCount === 0) {
        console.log("No undefended attack cards - skipping defense");
        // Make sure pile-on phase continues properly
        setTimeout(() => endDefense(gameState, true), 1000);
        return;
    }

    // Check if the bot can pass - only if no defense cards played yet
    let canBotPass = gameSettings.perevodnoyMode && gameState.currentRound.defenseCards.length === 0;
    
    // Multiple undefended cards - must defend all or take all
    if (undefendedAttackCount > 1) {
        let canDefendAll = true;
        let potentialDefenseCards = [];
        
        // Check if bot can defend against all attacks
        for (let i = 0; i < undefendedAttackCount; i++) {
            const attackCardIndex = gameState.currentRound.defenseCards.length + i;
            const attackCard = gameState.currentRound.attackCards[attackCardIndex];
            
            const validDefenseForThisAttack = defenderHand.filter(card => 
                canDefendWith(card, attackCard, gameState.kozer.suit));
                
            if (validDefenseForThisAttack.length === 0) {
                canDefendAll = false;
                break;
            }
            
            potentialDefenseCards.push(validDefenseForThisAttack);
        }
        
        // Decision based on difficulty and capability
        if (!canDefendAll || (difficulty === 'hard' && Math.random() < 0.3)) {
            console.log("Bot decides to take cards (multiple attacks)");
            botTakeCards(gameState);
            gameState.playerPickedUp = true;
            return;
        }
        
        // Defend each attack
        for (let i = 0; i < undefendedAttackCount; i++) {
            const attackCardIndex = gameState.currentRound.defenseCards.length;
            const attackCard = gameState.currentRound.attackCards[attackCardIndex];
            const validDefenseCards = potentialDefenseCards[i];
            
            // Select defense card based on difficulty
            let defenseCard = selectDefenseCard(validDefenseCards, attackCard, difficulty, gameState);
            
            // Play defense card
            if (defenseCard) {
                const cardIndex = defenderHand.findIndex(card => 
                    card.suit === defenseCard.suit && card.value === defenseCard.value);
                
                gameState.currentRound.defenseCards.push(defenseCard);
                defenderHand.splice(cardIndex, 1);
                
                // Update display after each defense
                updateCardArea(gameState);
            } else {
                // Shouldn't happen, but take cards as fallback
                botTakeCards(gameState);
                gameState.playerPickedUp = true;
                return;
            }
        }
        
        // Update all displays after all defenses
        updateOpponentDisplays(gameState);
        
        // CRITICAL FIX: After defending all cards, proper continuation
        // Check if this was a pile-on attack
        if (gameState.pileOnAttacker !== null) {
            console.log("Bot defended against pile-on attack - continuing pile-on phase");
            setTimeout(() => endDefense(gameState, true), 1500);
        } else if (gameState.currentRound.attackCards.length >= 6 || attackerHasNoValidCards(gameState)) {
            console.log("Bot defended all - max attacks reached or attacker has no more valid cards");
            setTimeout(() => endDefense(gameState, true), 1500);
        } else {
            console.log("Bot defended all - allowing attacker to play more cards");
            setTimeout(() => botPlay(gameState), 1500);
        }
        
        return;
    }
    
    // Single card defense logic
    const attackCardIndex = gameState.currentRound.defenseCards.length;
    const attackCard = gameState.currentRound.attackCards[attackCardIndex];
    
    if (!attackCard) {
        console.error("No attack card to defend against");
        return;
    }
    
    const validDefenseCards = defenderHand.filter(card => 
        canDefendWith(card, attackCard, gameState.kozer.suit));
    
    // Check for pass card if allowed
    let passCard = null;
    if (canBotPass) {
        passCard = defenderHand.find(card => card.value === attackCard.value);
    }
    
    // Bot decision making
    if (validDefenseCards.length > 0) {
        // Select based on difficulty
        const defenseCard = selectDefenseCard(validDefenseCards, attackCard, difficulty, gameState);
        
        // Hard bots might pass instead of defending
        if (difficulty === 'hard' && canBotPass && passCard && Math.random() < 0.7) {
            console.log("Hard bot decides to pass instead of defend");
            botPass(gameState, passCard);
            return;
        }
        
        // Otherwise defend
        if (defenseCard) {
            const cardIndex = defenderHand.findIndex(card => 
                card.suit === defenseCard.suit && card.value === defenseCard.value);
            
            gameState.currentRound.defenseCards.push(defenseCard);
            defenderHand.splice(cardIndex, 1);
            
            // Update displays
            updateCardArea(gameState);
            updateOpponentDisplays(gameState);
            
            // Check if all attacks are defended
            if (gameState.currentRound.defenseCards.length === gameState.currentRound.attackCards.length) {
                // FIX: Check if this was a pile-on attack
                if (gameState.pileOnAttacker !== null) {
                    console.log("Bot defended against pile-on attack - continuing pile-on phase");
                    setTimeout(() => endDefense(gameState, true), 1500);
                } else if (gameState.currentRound.attackCards.length >= 6 || 
                    attackerHasNoValidCards(gameState) || 
                    defenderHand.length === 0) {
                    
                    console.log("Bot successfully defended all attacks - ending defense");
                    setTimeout(() => endDefense(gameState, true), 1500);
                } else {
                    console.log("Bot successfully defended - allowing more attacks");
                    setTimeout(() => botPlay(gameState), 1500);
                }
            }
        }
    } else if (canBotPass && passCard && Math.random() < 0.7) {
        console.log("Bot decides to pass");
        botPass(gameState, passCard);
    } else {
        console.log("Bot cannot defend or pass - taking cards");
        botTakeCards(gameState);
        gameState.playerPickedUp = true;

    }
    
    // Save state after any bot action
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}


function botPileOn(gameState) {
    console.log("=== BOT PILE-ON ===");
    
    // Safety check - don't continue if game not in progress or no pile-on attacker
    if (!gameState.gameInProgress || gameState.pileOnAttacker === null) {
        console.log("botPileOn called but game not in progress or no pileOnAttacker");
        return;
    }
    
    // Record when bot actions happen to help detect stuck states
    sessionStorage.setItem('lastBotActionTime', Date.now().toString());
    
    const playerIndex = gameState.pileOnAttacker;
    const attackerHand = gameState.playerHands[playerIndex];
    const difficulty = gameSettings.botDifficulty;
    
    // Detect potential stuck state
    if (gameState.currentRound.attackCards.length === gameState.currentRound.defenseCards.length &&
        gameState.lastPileOnAttackTime) {
        const now = new Date().getTime();
        if (now - gameState.lastPileOnAttackTime > 5000) {
            console.log("Stuck in pile-on state detected - forcing continuation");
            gameState.pileOnAttacker = null;
            processEndOfSuccessfulDefense(gameState);
            return;
        }
    }
    
    // Mark the time of this pile-on attempt
    gameState.lastPileOnAttackTime = new Date().getTime();
    
    // Get valid ranks from cards already in play
    const validRanks = [...new Set([
        ...gameState.currentRound.attackCards.map(c => c.value),
        ...gameState.currentRound.defenseCards.map(c => c.value)
    ])];
    
    // Filter for valid cards in bot's hand
    const validCards = attackerHand.filter(card => validRanks.includes(card.value));
    
    // Check defender capacity
    const defenderHandSize = gameState.playerHands[gameState.defender].length;
    const undefendedAttacks = gameState.currentRound.attackCards.length - 
                             gameState.currentRound.defenseCards.length;
    
    if (undefendedAttacks >= defenderHandSize) {
        console.log(`Bot ${playerIndex} cannot pile on - defender has no capacity`);
        // Clear pileOnAttacker to ensure proper flow
        gameState.pileOnAttacker = null;
        setTimeout(() => processEndOfSuccessfulDefense(gameState), 1000);
        return;
    }
    
    // Check if bot can and wants to pile on
    let shouldPileOn = false;
    let attackCard = null;
    
    if (validCards.length > 0) {
        // Decide whether to pile on based on difficulty
        if (difficulty === 'easy') {
            shouldPileOn = Math.random() < 0.5;
        } else if (difficulty === 'medium') {
            shouldPileOn = Math.random() < 0.7;
        } else {
            shouldPileOn = Math.random() < 0.9;
        }
        
        if (shouldPileOn) {
            // For medium/hard bots, prefer non-trump cards
            if (difficulty !== 'easy') {
                const nonTrumpCards = validCards.filter(card => card.suit !== gameState.kozer.suit);
                
                if (nonTrumpCards.length > 0) {
                    nonTrumpCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                    attackCard = nonTrumpCards[0];
                } else {
                    validCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                    attackCard = validCards[0];
                }
            } else {
                attackCard = validCards[Math.floor(Math.random() * validCards.length)];
            }
        }
    }
    
    if (attackCard) {
        console.log(`Bot ${playerIndex} piles on with: ${attackCard.value}${attackCard.suit}`);
        
        // Play the card
        const cardIndex = attackerHand.findIndex(card => 
            card.suit === attackCard.suit && card.value === attackCard.value);
        
        if (cardIndex === -1) {
            console.error("CRITICAL ERROR: Card not found in hand");
            // Force recovery
            gameState.pileOnAttacker = null;
            processEndOfSuccessfulDefense(gameState);
            return;
        }
        
        // Play the card
        gameState.currentRound.attackCards.push(attackCard);
        attackerHand.splice(cardIndex, 1);
        
        // Update UI
        updateCardArea(gameState);
        updateOpponentDisplays(gameState);
        
        // IMPORTANT: Clear pile-on status for this player explicitly
        const currentPileOnAttacker = gameState.pileOnAttacker;
        gameState.pileOnAttacker = null;
        
        // Log the current defender to verify it's correct
        console.log(`Current defender is Player ${gameState.defender}`);
        
        // If defender is human, update button states and game status
        if (gameState.defender === 0) {
            updateGameStatus(gameState);
            updateButtonStates(gameState);
        } else {
            // Defender is bot - trigger bot defense
            setTimeout(() => {
                if (gameState.gameInProgress) {
                    botDefend(gameState);
                }
            }, 1500);
        }
    } else {
        console.log(`Bot ${playerIndex} chooses not to pile on`);
        
        // Clear pile-on status before moving to next
        gameState.pileOnAttacker = null;
        
        // Use processEndOfSuccessfulDefense to properly terminate the pile-on phase
        setTimeout(() => {
            if (gameState.gameInProgress) {
                processEndOfSuccessfulDefense(gameState);
            }
        }, 1000);
    }
    
    // Save state
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}



function botPlay(gameState) {
    console.log("=== BOT PLAYING ATTACK ===");
    console.log("Current player (attacker):", gameState.currentPlayer);
    console.log("Current defender:", gameState.defender);
    
    if (!gameState.gameInProgress) {
        console.log("Game not in progress - skipping bot play");
        return;
    }
    
    // Skip if it's not a bot's turn
    if (gameState.currentPlayer === 0) {
        console.log("Not bot's turn - skipping bot play");
        return;
    }
    
    console.log(`Bot ${gameState.currentPlayer} playing as attacker`);
    
    // Safety check - don't overload defender
    const defenderHandSize = gameState.playerHands[gameState.defender].length;
    const undefendedAttacks = gameState.currentRound.attackCards.length - 
                             gameState.currentRound.defenseCards.length;
    
    if (undefendedAttacks >= defenderHandSize) {
        console.log("Defender hand already full - limiting attack");
        endBotAttack(gameState);
        return;
    }

    const attackerHand = gameState.playerHands[gameState.currentPlayer];
    const difficulty = gameSettings.botDifficulty;
    
    // Bot decides which card to play
    let attackCard = null;
    
    // First attack logic
    if (gameState.currentRound.attackCards.length === 0) {
        if (difficulty === 'easy') {
            // Random card for easy bots
            attackCard = attackerHand[Math.floor(Math.random() * attackerHand.length)];
        } else {
            // Strategy for medium/hard bots
            const nonTrumpCards = attackerHand.filter(card => card.suit !== gameState.kozer.suit);
            
            if (nonTrumpCards.length > 0) {
                // Use lowest non-trump
                nonTrumpCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                attackCard = nonTrumpCards[0];
            } else {
                // Use lowest trump if only trumps available
                attackerHand.sort((a, b) => getCardRank(a) - getCardRank(b));
                attackCard = attackerHand[0];
            }
        }
    } else {
        // Subsequent attack logic - must match existing ranks
        const validRanks = [...new Set([
            ...gameState.currentRound.attackCards.map(c => c.value),
            ...gameState.currentRound.defenseCards.map(c => c.value)
        ])];

        const validCards = attackerHand.filter(card => validRanks.includes(card.value));
        
        if (validCards.length > 0) {
            if (difficulty === 'easy') {
                // Random valid card for easy bots
                attackCard = validCards[Math.floor(Math.random() * validCards.length)];
            } else {
                // Strategy for medium/hard bots
                const nonTrumpCards = validCards.filter(card => card.suit !== gameState.kozer.suit);
                
                if (nonTrumpCards.length > 0) {
                    nonTrumpCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                    attackCard = nonTrumpCards[0];
                } else if (validCards.length > 0) {
                    validCards.sort((a, b) => getCardRank(a) - getCardRank(b));
                    attackCard = validCards[0];
                }
            }
        }
    }
    
    if (attackCard) {
        console.log(`Bot plays attack card: ${attackCard.value}${attackCard.suit}`);
        
        // Play the card
        const cardIndex = attackerHand.findIndex(card => 
            card.suit === attackCard.suit && card.value === attackCard.value);
        
        gameState.currentRound.attackCards.push(attackCard);
        attackerHand.splice(cardIndex, 1);
        
        // Update game UI
        updateCardArea(gameState);
        updateOpponentDisplays(gameState);
        
        // Continue game flow based on defender
        if (gameState.defender !== 0) {
            console.log("Defender is also a bot - scheduling bot defense");
            setTimeout(() => {
                console.log("Executing scheduled bot defense");
                botDefend(gameState);
            }, 1500);
        } else {
            console.log("Defender is human - updating status");
            updateGameStatus(gameState);
            updateButtonStates(gameState);
        }
    } else {
        console.log("Bot has no valid attack card - ending attack");
        // CRITICAL FIX: Always end attack explicitly 
        endBotAttack(gameState);
    }
    
    // Always save state
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}


function botTakeCards(gameState) {
    console.log("=== BOT TAKING CARDS ===");
    
    // CRITICAL FIX: Set attackComplete to true immediately
    gameState.attackComplete = true;
    
    const defenderHand = gameState.playerHands[gameState.defender];
    
    // Add all cards to defender's hand
    defenderHand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
    
    // Clear current round
    gameState.currentRound = {
        attackCards: [],
        defenseCards: []
    };

    // CRITICAL FIX: Force card drawing
    console.log("Drawing cards after bot takes cards");
    drawUpToSix(gameState);
    drawCardsForPlayer(gameState, 0);
    
    // Next attacker is the player after the defender
    gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
    
    // Next defender is the player after the new attacker
    gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
    
    // Safety check to prevent self-attack
    if (gameState.currentPlayer === gameState.defender && gameState.gameInProgress) {
        console.log("Preventing self-attack after taking cards - ending game");
        gameState.gameInProgress = false;
        updateGameStatus(gameState);
        checkGameOver(gameState);
        return;
    }
    
    // Update status text
    const statusDiv = document.getElementById('gameStatus');
    if (statusDiv && gameState.gameInProgress) {
        const defenderName = gameSettings.playerNames[gameState.defender];
        statusDiv.textContent = `${defenderName} picked up.`;
    }
    
    

    // Reset for next round
    gameState.attackComplete = false;
    gameState.firstCard = true;
    
    // Update displays
    updateCardArea(gameState);
    updatePlayerHand(gameState.player1Hand);
    updateOpponentDisplays(gameState);
    updateGameStatus(gameState);
    
    // Check if game is over
    if (checkGameOver(gameState)) {
        console.log("Game over detected after bot takes cards");
        return;
    }
    
    // If next player is bot and game is still active, schedule bot play
    if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
        console.log("Scheduling next bot play after taking cards");
        setTimeout(() => {
            console.log("Executing scheduled bot play after taking cards");
            botPlay(gameState);
        }, 2000);
    }
    
    // Save game state
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}



function endDefense(gameState, successful) {
    console.log("=== ENDING DEFENSE ===");
    console.log("Defense successful:", successful);

    // Handle player pickup state first
    if (gameState.playerPickedUp) {
        console.log("Player already picked up cards - skipping to process end of defense");
        processEndOfSuccessfulDefense(gameState);
        return;
    }

    // Anti-stuck check for pile-on mode
    if (gameState.pileOnAttacker !== null && 
        gameState.currentRound.attackCards.length === gameState.currentRound.defenseCards.length) {
        
        const currentTime = new Date().getTime();
        const pileOnStartTime = gameState.pileOnStartTime || currentTime - 15000; // Default to 15 seconds ago if missing
        
        // If pile-on phase has been active for more than 10 seconds, force continue
        if (currentTime - pileOnStartTime > 10000) {
            console.log("Stuck pile-on state detected - forcing continuation");
            gameState.pileOnAttacker = null;
            processEndOfSuccessfulDefense(gameState);
            return;
        }
    }

    // If defense wasn't successful, handle defender taking cards
    if (!successful) {
        console.log("Defense failed - defender takes all cards");
        gameState.playerPickedUp = true;
        
        const defenderHand = gameState.playerHands[gameState.defender];
        defenderHand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
        
        // Clear current round
        gameState.currentRound = {
            attackCards: [],
            defenseCards: []
        };
        
        // Next attacker is player after defender
        gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
        
        // Next defender is player after new attacker
        gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
        
        // Reset pile-on state
        resetPileOnState(gameState);
        
        // Draw cards
        console.log("Drawing cards after failed defense");
        drawUpToSix(gameState);
        
        // Reset for next round
        gameState.firstCard = true;
    } 
    else if (gameState.settings.podkidnoyMode && !gameState.skipNextPileOnCheck) {
        console.log("Defense successful with podkidnoy mode - checking for pile-on attackers");
        
        // Check if all attacks are defended
        const allAttacksDefended = gameState.currentRound.attackCards.length === 
                                  gameState.currentRound.defenseCards.length;
        
        // If not all attacks are defended, return early - need to finish defense first
        if (!allAttacksDefended) {
            console.log("Not all attacks are defended yet - can't start or continue pile-on");
            return;
        }
        
        // Clean approach to pile-on phase management
        if (gameState.pileOnAttacker === null) {
            // Start a new pile-on phase
            gameState.pileOnStartTime = new Date().getTime();
            
            // Find the next potential pile-on attacker
            let nextAttacker = getNextActivePlayer(gameState, gameState.currentPlayer);
            
            // Skip ineligible players (defender and main attacker)
            while (nextAttacker === gameState.defender || nextAttacker === gameState.currentPlayer) {
                nextAttacker = getNextActivePlayer(gameState, nextAttacker);
                
                // If we've checked all players and looped around, there's no valid pile-on attacker
                if (nextAttacker === gameState.currentPlayer) {
                    console.log("No eligible pile-on attackers - finishing round");
                    processEndOfSuccessfulDefense(gameState);
                    return;
                }
            }
            
            // Check if this player can actually pile on
            if (canPileOn(gameState, nextAttacker)) {
                console.log("Starting new pile-on with player:", nextAttacker);
                gameState.pileOnAttacker = nextAttacker;
                gameState.pileOnAttackerCount = 1;
                
                if (gameState.pileOnAttacker === 0) {
                    // Human can pile on
                    updateGameStatus(gameState, true);
                    updateButtonStates(gameState);
                } else {
                    // Bot can pile on
                    updateGameStatus(gameState, true);
                    setTimeout(() => {
                        if (gameState.pileOnAttacker !== null && gameState.gameInProgress) {
                            botPileOn(gameState);
                        }
                    }, 2000);
                }
                return;
            } else {
                // No valid pile-on - finish the round
                console.log("No eligible pile-on attackers - finishing round");
                processEndOfSuccessfulDefense(gameState);
                return;
            }
        } else {
            // Continue an existing pile-on phase
            const currentPileOn = gameState.pileOnAttacker;
            
            // Find next pile-on attacker, skipping ineligible players
            let nextAttacker = getNextActivePlayer(gameState, currentPileOn);
            
            // Skip ineligible players (defender and main attacker)
            while (nextAttacker === gameState.defender || nextAttacker === gameState.currentPlayer) {
                nextAttacker = getNextActivePlayer(gameState, nextAttacker);
                
                // If we've checked all players and looped back to the current pile-on attacker,
                // or we've already done a full cycle, end the pile-on phase
                if (nextAttacker === currentPileOn || 
                    gameState.pileOnAttackerCount >= gameSettings.numPlayers) {
                    console.log("Pile-on cycle complete - finishing round");
                    gameState.pileOnAttacker = null;
                    processEndOfSuccessfulDefense(gameState);
                    return;
                }
            }
            
            // Update pile-on state
            gameState.pileOnAttacker = nextAttacker;
            gameState.pileOnAttackerCount = (gameState.pileOnAttackerCount || 0) + 1;
            
            // Check if next player can pile on
            if (!canPileOn(gameState, gameState.pileOnAttacker)) {
                // Can't pile on - try next player
                console.log("Next player cannot pile on - continuing cycle");
                setTimeout(() => endDefense(gameState, true), 500);
                return;
            }
            
            // Valid pile-on player found
            if (gameState.pileOnAttacker === 0) {
                // Human can pile on
                updateGameStatus(gameState, true);
                updateButtonStates(gameState);
            } else {
                // Bot can pile on
                updateGameStatus(gameState, true);
                setTimeout(() => {
                    if (gameState.pileOnAttacker !== null && gameState.gameInProgress) {
                        botPileOn(gameState);
                    }
                }, 2000);
            }
            return;
        }
    } else {
        // Podkidnoy mode disabled or we're skipping pile-on checks
        console.log("Skipping pile-on phase - processing end of successful defense");
        processEndOfSuccessfulDefense(gameState);
    }
    
    // Update UI
    updateCardArea(gameState);
    updatePlayerHand(gameState.player1Hand);
    updateOpponentDisplays(gameState);
    updateGameStatus(gameState);
    
    // Check for game over
    if (checkGameOver(gameState)) {
        console.log("Game over detected in endDefense");
        return;
    }
    
    // If next player is bot and game is active, schedule bot play
    if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
        console.log("Next player is bot - scheduling bot play");
        setTimeout(() => botPlay(gameState), 2000);
    }
    
    // Save game state
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
}



// Fix endBotAttack to avoid duplicate updates
function endBotAttack(gameState) {
    console.log("=== BOT ENDING ATTACK ===");
    console.log("Current player (attacker):", gameState.currentPlayer);
    console.log("Current defender:", gameState.defender);
    console.log("Attack cards:", gameState.currentRound.attackCards.length);
    console.log("Defense cards:", gameState.currentRound.defenseCards.length);
  
    // Mark that the attack is complete
    gameState.attackComplete = true;
  
    // If bot somehow played zero cards, just advance the turn
    if (gameState.currentRound.attackCards.length === 0) {
      console.error("Bot tried to end attack without playing any cards");
      gameState.currentPlayer = getNextActivePlayer(gameState, gameState.currentPlayer);
      gameState.defender     = getNextActivePlayer(gameState, gameState.currentPlayer);
      return;
    }
  
    // If every attack was defended, discard them and swap roles
    if (gameState.currentRound.attackCards.length === gameState.currentRound.defenseCards.length) {
      console.log("All attacks were defended — moving to discard pile");
      gameState.discardPile = gameState.discardPile.concat(
        gameState.currentRound.attackCards,
        gameState.currentRound.defenseCards
      );
      gameState.currentPlayer = gameState.defender;
    } else {
      // Otherwise defender takes them all
      console.log("Not all attacks defended — defender takes cards");
      const hand = gameState.playerHands[gameState.defender];
      hand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
      gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
    }
  
    // Clear the table and pick the next defender
    gameState.currentRound = { attackCards: [], defenseCards: [] };
    gameState.defender    = getNextActivePlayer(gameState, gameState.currentPlayer);
  
    // Prevent someone from attacking themselves
    if (gameState.currentPlayer === gameState.defender && gameState.gameInProgress) {
      console.log("Preventing self-attack — ending game");
      gameState.gameInProgress = false;
      updateGameStatus(gameState);
      checkGameOver(gameState);
      return;
    }
  
    // Draw-back up to full hands
    console.log("Drawing cards — attackComplete =", gameState.attackComplete);
    drawUpToSix(gameState);
  
    // Reset for the next round
    gameState.attackComplete = false;
    gameState.firstCard      = true;
    gameState.player1Hand    = gameState.playerHands[0];
  
    // Refresh the UI
    updateCardArea(gameState);
    updatePlayerHand(gameState.player1Hand);
    updateOpponentDisplays(gameState);
    updateGameStatus(gameState);
  
    // Check for game-over
    if (checkGameOver(gameState)) return;
  
    // If it’s still a bot’s turn, schedule it
    if (gameState.currentPlayer !== 0 && gameState.gameInProgress) {
      console.log("Next player is bot — scheduling botPlay");
      setTimeout(() => botPlay(gameState), 3000);
    }
  
    // Persist
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
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



function checkAndUpdateElimination(gameState) {
    // Only eliminate players when stockpile is empty (deck empty AND kozer taken)
    const isStockpileEmpty = gameState.deck.length === 0 && gameState.kozerTaken;
    
    if (isStockpileEmpty) {
        let eliminationsOccurred = false;
        
        for (let i = 0; i < gameSettings.numPlayers; i++) {
            if (gameState.playerHands[i].length === 0 && !gameState.eliminated[i]) {
                console.log(`Player ${gameSettings.playerNames[i]} has been eliminated in checkAndUpdateElimination!`);
                gameState.eliminated[i] = true;
                eliminationsOccurred = true;
                
                // Add system message to chat
                const messageDiv = document.createElement('div');
                messageDiv.className = 'system-message';
                messageDiv.textContent = `${gameSettings.playerNames[i]} has left the game.`;
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
        
        // Return true if any eliminations occurred
        return eliminationsOccurred;
    }
    
    return false;
}


function checkGameOver(gameState) {
    // Check if game is already over
    if (!gameState.gameInProgress) return true;
    
    // Stockpile is considered empty when both deck is empty AND kozer is taken
    const isStockpileEmpty = gameState.deck.length === 0 && gameState.kozerTaken;
    
    // Update elimination status for any players with 0 cards when stockpile is empty
    if (isStockpileEmpty) {
        for (let i = 0; i < gameSettings.numPlayers; i++) {
            if (gameState.playerHands[i].length === 0 && !gameState.eliminated[i]) {
                console.log(`Player ${gameSettings.playerNames[i]} has been eliminated!`);
                gameState.eliminated[i] = true;
                
                // Add system message to chat
                const messageDiv = document.createElement('div');
                messageDiv.className = 'system-message';
                messageDiv.textContent = `${gameSettings.playerNames[i]} has left the game.`;
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    }
    
    // Count active players
    let activePlayers = 0;
    let lastActivePlayer = -1;
    
    for (let i = 0; i < gameSettings.numPlayers; i++) {
        if (!gameState.eliminated[i]) {
            activePlayers++;
            lastActivePlayer = i;
        }
    }
    
    // Determine if game is over
    if (activePlayers <= 1) {
        gameState.gameInProgress = false;
        
        // Display game over message only if it hasn't been shown yet
        if (!gameOverMessageShown) {
            gameOverMessageShown = true;
            
            let message = "";
            if (activePlayers === 0) {
                message = "Game over - It's a tie! All players eliminated.";
            } else {
                const durakName = gameSettings.playerNames[lastActivePlayer];
                message = `Game over - ${durakName} is the durak!`;
            }
            
            setTimeout(() => {
                alert(message);
            }, 500);
        }
        
        // Update the game status display
        updateGameStatus(gameState);
        return true;
    }
    
    // Update the game status display
    updateGameStatus(gameState);
    return false;
}

function wouldPassOverloadNextDefender(gameState, numCardsToPass) {
    // Get the next defender (the one who would receive the pass)
    const nextDefender = getNextActivePlayer(gameState, gameState.defender);
    
    // Calculate how many cards they would need to defend against
    const currentUndefendedCards = gameState.currentRound.attackCards.length - 
                                 gameState.currentRound.defenseCards.length;
    
    // Add the number of cards being passed
    const totalCardsToDefend = currentUndefendedCards + numCardsToPass;
    
    // Get the next defender's hand size
    const nextDefenderHandSize = gameState.playerHands[nextDefender].length;
    
    // Return true if passing would give more cards than they have in hand
    return totalCardsToDefend > nextDefenderHandSize;
}

// Update the shouldLimitAttack function to be more explicit
function shouldLimitAttack(gameState) {
    const defenderHand = gameState.playerHands[gameState.defender];
    const undefendedAttacks = gameState.currentRound.attackCards.length - gameState.currentRound.defenseCards.length;
    
    // Calculate how many more cards the defender could theoretically defend against
    const remainingDefenseCapacity = defenderHand.length - undefendedAttacks;
    
    // If defender has fewer cards than undefended attacks or no capacity left, limit further attacks
    return remainingDefenseCapacity <= 0;
}


function resetPileOnState(gameState) {
    console.log("Resetting pile-on state");
    
    // Clear all pile-on related flags
    gameState.pileOnAttacker = null;
    gameState.allPlayersAttacked = false;
    gameState.skipNextPileOnCheck = false;
    gameState.pileOnStartTime = null;
    gameState.pileOnAttackerCount = 0;
    gameState.lastPileOnAttackTime = null;
    
    // Additional cleanup for any other pile-on related flags
    if (gameState.waitingForPileOn) {
        delete gameState.waitingForPileOn;
    }
    
    // Force update button states to ensure UI is responsive
    updateButtonStates(gameState);
    
    // Verify current player and defender are different
    if (gameState.currentPlayer === gameState.defender && gameState.gameInProgress) {
        console.warn("Detected same player as attacker and defender in resetPileOnState");
        const nextPlayer = getNextActivePlayer(gameState, gameState.currentPlayer);
        if (nextPlayer !== gameState.currentPlayer) {
            gameState.defender = nextPlayer;
        }
    }
}


function checkForDuplicateCard(card, gameState) {
    if (!card || !card.suit || !card.value) {
        console.error("Invalid card passed to duplicate check:", card);
        return true; // Treat invalid cards as duplicates
    }

    // Check all player hands
    for (let i = 0; i < gameState.playerHands.length; i++) {
        const hand = gameState.playerHands[i];
        for (let j = 0; j < hand.length; j++) {
            if (hand[j].suit === card.suit && hand[j].value === card.value) {
                console.log(`Duplicate found in player ${i}'s hand: ${card.value}${card.suit}`);
                return true;
            }
        }
    }
    
    // Check attack cards
    for (let i = 0; i < gameState.currentRound.attackCards.length; i++) {
        const attackCard = gameState.currentRound.attackCards[i];
        if (attackCard.suit === card.suit && attackCard.value === card.value) {
            console.log(`Duplicate found in attack cards: ${card.value}${card.suit}`);
            return true;
        }
    }
    
    // Check defense cards
    for (let i = 0; i < gameState.currentRound.defenseCards.length; i++) {
        const defenseCard = gameState.currentRound.defenseCards[i];
        if (defenseCard.suit === card.suit && defenseCard.value === card.value) {
            console.log(`Duplicate found in defense cards: ${card.value}${card.suit}`);
            return true;
        }
    }
    
    // Check discard pile
    for (let i = 0; i < gameState.discardPile.length; i++) {
        const discardCard = gameState.discardPile[i];
        if (discardCard.suit === card.suit && discardCard.value === card.value) {
            console.log(`Duplicate found in discard pile: ${card.value}${card.suit}`);
            return true;
        }
    }
    
    // Check if it matches the kozer (if kozer is not yet taken)
    if (!gameState.kozerTaken && gameState.kozer && 
        gameState.kozer.suit === card.suit && gameState.kozer.value === card.value) {
        console.log(`Duplicate matches kozer: ${card.value}${card.suit}`);
        return true;
    }
    
    return false;
}

function recoverFromStuckState() {
    if (!gameState) return false;
    
    console.log("ATTEMPTING TO RECOVER FROM STUCK STATE");
    
    // Check if we're in a pile-on phase that might be stuck
    if (gameState.pileOnAttacker !== null) {
        console.log("Recovering from stuck pile-on state");
        
        // Fully reset pile-on state
        resetPileOnState(gameState);
        
        // If attacks and defenses are equal, end the round successfully
        if (gameState.currentRound.attackCards.length === gameState.currentRound.defenseCards.length) {
            processEndOfSuccessfulDefense(gameState);
        } else {
            // Otherwise, make defender take cards
            const defenderHand = gameState.playerHands[gameState.defender];
            defenderHand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
            
            // Clear current round
            gameState.currentRound = {
                attackCards: [],
                defenseCards: []
            };
            
            // Next attacker is player after defender
            gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
            
            // Next defender is player after new attacker
            gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
        }
        
        // Force draw cards for everyone
        drawUpToSix(gameState);
        
        // Reset for next round
        gameState.firstCard = true;
        
        // Update all UI elements
        updateCardArea(gameState);
        updatePlayerHand(gameState.player1Hand);
        updateOpponentDisplays(gameState);
        updateGameStatus(gameState);
        
        // Save state
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
        
        return true;
    }
    
    return false;
}


function addEmergencyResetButton() {
    // Check if button already exists
    if (document.getElementById('emergencyResetBtn')) return;
    
    const arena = document.querySelector('.arena');
    if (!arena) return;
    
    const resetBtn = document.createElement('button');
    resetBtn.id = 'emergencyResetBtn';
    resetBtn.className = 'game-btn';
    resetBtn.style.backgroundColor = '#ff3b30';
    resetBtn.style.marginTop = '10px';
    resetBtn.textContent = 'Unstick Game';
    resetBtn.addEventListener('click', function() {
        if (recoverFromStuckState()) {
            alert('Game state has been reset. You can continue playing.');
            resetBtn.style.display = 'none';
        } else {
            alert('Could not recover game state. Try restarting the game.');
        }
    });
    
    arena.appendChild(resetBtn);
    
    // Also add a timeout to automatically try recovery after 10 seconds of stuck state
    setTimeout(() => {
        if (gameState && gameState.pileOnAttacker !== null) {
            console.log("Auto-recovery attempt after timeout");
            recoverFromStuckState();
        }
    }, 10000);
}

function initializeStuckGameDetection() {
    console.log("Initializing stuck game detection system");
    
    // Initialize or reset the watchdog timer
    sessionStorage.setItem('durakGameWatchdog', JSON.stringify({
        timestamp: Date.now(),
        turnCount: 0,
        checkCount: 0
    }));
    
    // Set up periodic checking (every 5 seconds)
    const watchdogInterval = setInterval(() => {
        if (!gameState || !gameState.gameInProgress) {
            return; // Don't check if game isn't active
        }
        
        const watchdog = JSON.parse(sessionStorage.getItem('durakGameWatchdog') || '{}');
        const currentTime = Date.now();
        
        // Update check count
        watchdog.checkCount = (watchdog.checkCount || 0) + 1;
        
        // Calculate time since last timestamp update
        const timeSinceUpdate = currentTime - (watchdog.timestamp || 0);
        
        // If it's been more than 30 seconds since the last game state change
        // and we've checked multiple times, the game might be stuck
        if (timeSinceUpdate > 30000 && watchdog.checkCount > 3) {
            console.warn(`Game appears stuck: ${timeSinceUpdate}ms since last state change`);
            
            // Try to recover automatically
            recoverFromStuckState();
            
            // Reset watchdog
            watchdog.timestamp = currentTime;
            watchdog.turnCount = 0;
            watchdog.checkCount = 0;
        }
        
        sessionStorage.setItem('durakGameWatchdog', JSON.stringify(watchdog));
    }, 5000);
    
    // Expose the interval ID so it can be cleared if needed
    window.durakWatchdogInterval = watchdogInterval;
    
    // Add listeners to update the watchdog when game state changes
    const updateWatchdog = () => {
        const watchdog = JSON.parse(sessionStorage.getItem('durakGameWatchdog') || '{}');
        watchdog.timestamp = Date.now();
        watchdog.turnCount = (watchdog.turnCount || 0) + 1;
        watchdog.checkCount = 0; // Reset check count when there's activity
        sessionStorage.setItem('durakGameWatchdog', JSON.stringify(watchdog));
    };
    
    // These are key game elements to monitor for user interaction
    const gameButtons = [
        'attackBtn', 'finishAttackBtn', 'defendBtn', 'takeCardsBtn',
        'passBtn', 'pileOnBtn', 'skipPileOnBtn'
    ];
    
    // Add click listeners to all game buttons
    gameButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', updateWatchdog);
        }
    });
    
    // Update the watchdog when the player interacts with cards
    document.querySelector('.hand-container')?.addEventListener('click', updateWatchdog);
    
    return watchdogInterval;
}

// Enhanced recovery function
function recoverFromStuckState() {
    if (!gameState) return false;
    
    console.log("ATTEMPTING TO RECOVER FROM STUCK STATE");
    
    // Check for specific stuck conditions and fix them
    
    // Case 1: Stuck in pile-on phase
    if (gameState.pileOnAttacker !== null) {
        console.log("Recovering from stuck pile-on state");
        
        // Fully reset pile-on state
        resetPileOnState(gameState);
        
        // If attacks and defenses are equal, end the round successfully
        if (gameState.currentRound.attackCards.length === gameState.currentRound.defenseCards.length) {
            processEndOfSuccessfulDefense(gameState);
            return true;
        } else {
            // Otherwise, make defender take cards
            const defenderHand = gameState.playerHands[gameState.defender];
            defenderHand.push(...gameState.currentRound.attackCards, ...gameState.currentRound.defenseCards);
            
            // Clear current round
            gameState.currentRound = {
                attackCards: [],
                defenseCards: []
            };
            
            // Next attacker is player after defender
            gameState.currentPlayer = getNextActivePlayer(gameState, gameState.defender);
            
            // Next defender is player after new attacker
            gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
            
            // Force draw cards for everyone
            drawUpToSix(gameState);
            
            // Reset for next round
            gameState.firstCard = true;
            
            // Update all UI elements
            updateCardArea(gameState);
            updatePlayerHand(gameState.player1Hand);
            updateOpponentDisplays(gameState);
            updateGameStatus(gameState);
            
            // Save state
            localStorage.setItem('durakGameState', JSON.stringify(gameState));
            
            // If it's a bot's turn, trigger it
            if (gameState.currentPlayer !== 0) {
                setTimeout(() => botPlay(gameState), 2000);
            }
            
            return true;
        }
    }
    
    // Case 2: Circular reference where attacker and defender are the same
    if (gameState.currentPlayer === gameState.defender) {
        console.log("Recovering from self-reference state");
        
        // Fix player references
        gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
        
        // Update UI
        updateGameStatus(gameState);
        
        // Save state
        localStorage.setItem('durakGameState', JSON.stringify(gameState));
        return true;
    }
    
    // Case 3: Check if we're waiting for a bot that never played
    const lastActionTime = sessionStorage.getItem('lastBotActionTime');
    const currentTime = Date.now();
    
    if (lastActionTime && (currentTime - parseInt(lastActionTime)) > 10000 && gameState.currentPlayer !== 0) {
        console.log("Bot appears stuck - forcing its turn");
        
        // Force the bot to play
        if (gameState.currentPlayer === gameState.defender) {
            botDefend(gameState);
        } else {
            botPlay(gameState);
        }
        
        // Update timestamp
        sessionStorage.setItem('lastBotActionTime', currentTime.toString());
        return true;
    }
    
    // If no specific condition was identified, try a general reset
    console.log("No specific stuck condition identified, trying general reset");
    
    // Clear all cards on the table
    gameState.currentRound = {
        attackCards: [],
        defenseCards: []
    };
    
    // Reset pile-on state
    resetPileOnState(gameState);
    
    // Advance to next player
    gameState.currentPlayer = getNextActivePlayer(gameState, gameState.currentPlayer);
    gameState.defender = getNextActivePlayer(gameState, gameState.currentPlayer);
    
    // Reset first card flag
    gameState.firstCard = true;
    
    // Update UI
    updateCardArea(gameState);
    updateGameStatus(gameState);
    updateButtonStates(gameState);
    
    // Save state
    localStorage.setItem('durakGameState', JSON.stringify(gameState));
    
    // If it's a bot's turn, trigger it
    if (gameState.currentPlayer !== 0) {
        setTimeout(() => botPlay(gameState), 2000);
    }
    
    return true;
}

