This is my final project submission for the Sp25 Web Dev Class.




UPDATE 1 [MAY 1st]
-------------------------------------------------------
Since the midterm, my primary focus was implementing the game functionality for just one game, Durak, the bot play mode, which proved a lot longer and harder than I anticipated, but it helped since I was able to find other open source code for the game and I had also previously written some of my own in python before, so I was able to reuse a lot of logic, it just took a while converting it all to JS language. undertaking this project reminded me why i never finished this website in the first place when i tried to make it last time.

I also added social media icons, and responsiveness for mobile sizing.


stuff I want to try to add before final submission:
- stockpile kozer/trump icon when stockpile ends
- organize the cards in the player's hand

- fix perevodnoy function so they can't pass in the middle of the turn 
- allow other players to attack "out of turn" once primary fight is over



below is all the other stuff i did not get to and will not before final submission 
For the buttons/pages, I could probably try to add them visually, but they likely would not actually function online 


other stuff to add:
- add all of the sidebar pages/links
- add chat button, add videochat buttons in game
- add login/sign up pages
- add all learn pages


harder stuff to do:
- add a database for all the user accounts
- get a live chat/live video running, probaly server/network related stuff
- online multiplayer would be dope, with private rooms/servers and public ones
-----------------------------------------


UPDATE [FINAL MAY 9]


bugs fixed/things added:
- chat button functionality with programmed responses
-fixed passing (perevodnoy) mode (Yayyy!!!!)
-added podkidnoy mode (yay!!!!!) aka functionality to play multiple cards at the same time
- added a stockpile placeholder suit after its empty
- the player's hand is now organized
- fixed bug where bots would draw out of order
- made sure the UI updates for opponent cards each time they play a card
- fixed bug where bots would sometimes attack themselves 
- made checking game status/game over functions less redundant 
- made sure opponent cards ui updated after every card played
- to allow multiple attackers instead of only allowing one at a time


other bugs I fixed/stuff Iadded:
- sometimes my player wont draw until 6 at end of turn
- sometimes it will attack, then skip my player before i have responded
- sometimes it will ask an eliminated player to play
- sometimes bots dont draw at the end of their turn
- when i run out of cards to play at the end of the game, it still sometimes asks me to attack the next player 
- allow to pass with more than 1 card as long as card ranks identical!
- do not allow a player to be given more cards to defend than they are holding. end their turn once they run out of cards and move to next player
- end of game messages appeared more than once sometimes when it announces the durak, made sure they only pop up once & dont spam
- prevent pass/attack if defender not holding enough cards
- sometimes the skip button does not work for pile on
- after a player/bot picks up during a pile on, end the turn and start next attack
- buttons to play do not always pop up when bots pile up against human player
- duplicate cards


most annoying bug: making sure bots and player always draw at the end of their turn
for some reason this one just kept happening
but lo behold this is our final product

i know the website is not 100% finished but I do feel like I have finalized the durak game so i feel very accomplished :D 

thank you so much for an awesome semester professor, have a great summer and i look foward to working with you next semester on the indpendent research :D


