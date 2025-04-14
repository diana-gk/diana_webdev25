document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const gameArea = document.getElementById('gameArea');
    
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('hidden');
        gameArea.classList.toggle('full');
    });
    
    
    const gameState = initializeGame();
});



function shuffle(deck) {
        for (let i = 0; i < deck.length; i++) {
        let shuffle = Math.floor(Math.random() * (deck.length));
        [ deck[i], deck[shuffle] ] = [ deck[shuffle], deck[i] ];
      }
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
                isRed: suits[i] === '♥' || suits[i] === '♦'
            });
        }
    }
    
    shuffle(deck);
    
    const player1Hand = deck.splice(0, 6);
    const player2Hand = deck.splice(0, 6);
    const player3Hand = deck.splice(0, 6);
    
    updatePlayerHand(player1Hand);
    
    updateOpponentCards('Player 2', player2Hand.length);
    updateOpponentCards('Player 3', player3Hand.length);
    
    // return the remaining deck and hands
    return {
        deck: deck,
        player1Hand: player1Hand,
        player2Hand: player2Hand,
        player3Hand: player3Hand
    };
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
    };
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

