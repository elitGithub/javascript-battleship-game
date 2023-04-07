const flipButton = document.querySelector('#flip-button');
const startButton = document.querySelector('#start-button');
const optionsContainer = document.querySelector('.option-container');
const gamesBoardContainer = document.querySelector('#gamesboard-container');
const infoDisplay = document.querySelector('#info');
const turnDisplay = document.querySelector('#turn-display');
flipButton.addEventListener('click', flip);
startButton.addEventListener('click', startGame);
let angle = 0;

function flip() {
  angle = angle === 0 ? 90 : 0;
  const optionShips = Array.from(optionsContainer.children);
  optionShips.forEach(optionShip => optionShip.style.transform = `rotate(${ angle }deg)`);
}

const width = 10;
const boardSize = width * width;

function createBoard(color, user) {
  const gameBoardContainer = document.createElement('div');
  gameBoardContainer.classList.add('game-board');
  gameBoardContainer.style.backgroundColor = color;
  gameBoardContainer.id = user;

  for (let i = 0; i < boardSize; i++) {
    const block = document.createElement('div');
    block.classList.add('block');
    block.id = String(i);
    gameBoardContainer.appendChild(block);

  }
  gamesBoardContainer.appendChild(gameBoardContainer);
}

createBoard('yellow', 'player');
createBoard('pink', 'computer');

class Ship {
  constructor(name, length) {
    this.name = name;
    this.length = length;
  }

}

const destroyer = new Ship('destroyer', 2);
const submarine = new Ship('submarine', 3);
const cruiser = new Ship('cruiser', 3);
const battleship = new Ship('battleship', 4);
const carrier = new Ship('carrier', 5);

const ships = [destroyer, submarine, cruiser, battleship, carrier];
let notDropped;

function getValidity(allBoardBlocks, isHorizontal, startIndex, ship) {
  let validStart;
  if (isHorizontal) {
    validStart = startIndex <= boardSize - ship.length ? startIndex : boardSize - ship.length;
  } else {
    validStart = startIndex <= boardSize - (width * ship.length) ? startIndex : startIndex - (ship.length * width);
  }

  let shipBlocks = [];
  for (let i = 0; i < ship.length; i++) {
    if (isHorizontal) {
      shipBlocks.push(allBoardBlocks[Number(validStart) + i]);
    } else {
      shipBlocks.push(allBoardBlocks[Number(validStart) + i * width]);
    }
  }

  let valid;
  if (isHorizontal) {
    shipBlocks.every((_shipBlock, index) => valid = shipBlocks[0].id % width !== width - (shipBlocks.length - (index + 1)));
  } else {
    shipBlocks.every((_shipBlock, index) => valid = shipBlocks[0].id < 90 + (width * (index + 1)));
  }

  const notTaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains('taken'));

  return { shipBlocks, valid, notTaken };
}

function addShipPiece(ship, user, startId = '') {
  const allBoardBlocks = document.querySelectorAll(`#${ user } div`);
  let randomBoolean = (Math.random() < 0.5);
  let isHorizontal = (user === 'player') ? (angle === 0) : randomBoolean;
  let randomStartIndex = Math.floor(Math.random() * boardSize);
  let startIndex = startId ? startId : randomStartIndex;

  const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship);

  if (valid && notTaken) {
    shipBlocks.forEach(shipBlock => {
      shipBlock.classList.add(ship.name);
      shipBlock.classList.add('taken');
    });
  } else {
    if (user === 'computer') {
      addShipPiece(ship, user, startId);
    }

    if (user === 'player') {
      notDropped = true;
    }
  }
}

// Computer ship placement
ships.forEach(ship => addShipPiece(ship, 'computer'));

// Player ship placement
let draggedShip;
const optionShips = Array.from(optionsContainer.children);
optionShips.forEach(optionShip => optionShip.addEventListener('dragstart', dragStart));
const allPlayerBlocks = document.querySelectorAll('#player div');
allPlayerBlocks.forEach(playerBlock => {
  playerBlock.addEventListener('dragover', dragOver);
  playerBlock.addEventListener('drop', dropShip);
});

function dragStart(e) {
  notDropped = false;
  draggedShip = e.target;
}

function dragOver(e) {
  e.preventDefault();
  const ship = ships[draggedShip.id];
  highlightArea(e.target.id, ship);
}

function dropShip(e) {
  const startId = e.target.id;
  const ship = ships[draggedShip.id];
  addShipPiece(ship, 'player', startId);
  if (!notDropped) {
    draggedShip.remove();
  }
}

// Add highlight for drag
function highlightArea(startIndex, ship) {
  const allBoardBlocks = document.querySelectorAll('#player div');
  let isHorizontal = (angle === 0);

  const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship);

  if (valid && notTaken) {
    shipBlocks.forEach(shipBlock => {
      shipBlock.classList.add('hover');
      setTimeout(() => shipBlock.classList.remove('hover'), 500);
    });
  }
}

let gameOver = false;
let playerTurn;

//Start game
function startGame() {
  infoDisplay.textContent = '';
  if (optionsContainer.children.length !== 0) {
    infoDisplay.textContent = 'Please place all your pieces first';
    return;
  }

  addEventListenerToBlocks('computer', 'click', handleClick);
}

function addEventListenerToBlocks(user, event, callback) {
  const allBoardBlocks = document.querySelectorAll(`#${ user } div`);
  allBoardBlocks.forEach(block => block.addEventListener(event, callback));
}

function removeEventListenerFromBlocks(user, event, callback) {
  const allBoardBlocks = document.querySelectorAll(`#${ user } div`);
  allBoardBlocks.forEach(block => block.removeEventListener(event, callback));
}

let playerHits = [];
const playerSunkShips = [];
let computerHits = [];
const computerSunkShips = [];

function handleClick(e) {
  if (!gameOver) {
    if (e.target.classList.contains('taken')) {
      e.target.classList.add('boom');
      infoDisplay.textContent = 'You hit the computer\'s ship!';
      let classes = Array.from(e.target.classList);
      classes = classes.filter(className => className !== 'block');
      classes = classes.filter(className => className !== 'boom');
      classes = classes.filter(className => className !== 'taken');
      playerHits.push(... classes);
      checkScore('player', playerHits, playerSunkShips);
    }

    if (!e.target.classList.contains('taken')) {
      infoDisplay.textContent = 'Nothing hit this time.';
      e.target.classList.add('empty');
    }
    playerTurn = false;
    removeEventListenerFromBlocks('computer', 'click', handleClick);
    setTimeout(computerGo, 3000);
  }
}

function computerGo() {
  if (!gameOver) {
    turnDisplay.textContent = 'Computer\'s turn.';
    infoDisplay.textContent = 'The computer is thinking...';

    setTimeout(() => {
      let randomGo = Math.floor(Math.random() * width * width);
      const allBoardBlocks = document.querySelectorAll('#player div');
      // If the computer hits something that it already hit.
      if ((allBoardBlocks[randomGo].classList.contains('taken') &&
          allBoardBlocks[randomGo].classList.contains('boom')) ||
          allBoardBlocks[randomGo].classList.contains('empty')) {
        computerGo();
        return;
      }

      if (allBoardBlocks[randomGo].classList.contains('taken')) {
        allBoardBlocks[randomGo].classList.add('boom');
        infoDisplay.textContent = 'The computer hit your ship.';
        let classes = Array.from(allBoardBlocks[randomGo].classList);
        classes = classes.filter(className => className !== 'block');
        classes = classes.filter(className => className !== 'boom');
        classes = classes.filter(className => className !== 'taken');
        computerHits.push(... classes);
        checkScore('computer', computerHits, computerSunkShips);
        return;
      }

      infoDisplay.textContent = 'Nothing hit this time';
      allBoardBlocks[randomGo].classList.add('empty');

    }, 3000);

    setTimeout(() => {
      playerTurn = true;
      turnDisplay.textContent = 'Your go.';
      infoDisplay.textContent = 'Please take your go.';
      addEventListenerToBlocks('computer', 'click', handleClick);
    }, 6000);
  }
}

function checkScore(user, userHits, userSunkShips) {
  function checkShip(shipName, shipLength) {
    if (userHits.filter(storedShipName => storedShipName === shipName).length === shipLength) {
      infoDisplay.textContent = `You sunk the ${user}'s ${shipName}`;
    }
  }

  checkShip('destroyer', 2);
  checkShip('submarine', 3);
  checkShip('cruiser', 3);
  checkShip('battleship', 4);
  checkShip('carrier', 5);

  console.log('playerHits', playerHits);
  console.log('playerSunkShips', playerSunkShips);
}
