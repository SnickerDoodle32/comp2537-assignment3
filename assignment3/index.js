let firstCard = undefined;
let secondCard = undefined;
let lockBoard = false;
let hasFlippedCard = false;
let clicks = 0;
let matchedPairs = 0;
let totalPairs = 0;
let timeRemaining = 0;
let timerInterval = undefined;
let gameStarted = false;
let peekUsed = false;
let canClick = false;

const difficultySettings = {
  test: { pairs: 3, time: 5 },
  easy: { pairs: 3, time: 60 },
  medium: { pairs: 6, time: 90 },
  hard: { pairs: 10, time: 120 }
};

$(document).ready(function() {
  initThemeToggle();
  initButtons();
  setup();
});

function initThemeToggle() {
  const themeBtn = $('#theme-toggle');
  const body = $('body');

  themeBtn.on('click', function() {
    body.toggleClass('dark');
    if (body.hasClass('dark')) {
      $(this).html('<i class="fa-solid fa-sun"></i> Light');
    } else {
      $(this).html('<i class="fa-solid fa-moon"></i> Dark');
    }
  });
}

function initButtons() {
  $('#start-btn').on('click', startGame);
  $('#reset-btn').on('click', startGame);
  $('#peek-btn').on('click', peekCards);
  $('#end-btn').on('click', endGame);
}

function setup() {
  $('#game_grid').on('click', '.card', function() {
    if (!canClick || lockBoard) return;

    const card = $(this);

    if (card.hasClass('flip') || card.hasClass('matched')) return;

    flipCard(card);
  });
}

function startGame() {
  resetGame();

  const difficulty = $('#difficulty').val();
  const settings = difficultySettings[difficulty];

  totalPairs = settings.pairs;
  timeRemaining = settings.time;

  updateStatus();

  $('#start-btn').prop('disabled', true);
  $('#reset-btn').prop('disabled', true);
  $('#end-btn').prop('disabled', true);
  $('#difficulty').prop('disabled', true);
  $('#peek-btn').prop('disabled', true);

  fetchPokemon(settings.pairs)
    .then(pokemonList => {
      createCardGrid(pokemonList);
      startTimer();
      canClick = true;
      gameStarted = true;
      $('#start-btn').prop('disabled', false);
      $('#reset-btn').prop('disabled', false);
      $('#end-btn').prop('disabled', false);
      $('#peek-btn').prop('disabled', false);
    })
    .catch(error => {
      console.error('Error fetching Pokemon:', error);
      showMessage('Failed to load Pokemon. Please try again.', 'lose');
      $('#start-btn').prop('disabled', false);
      $('#reset-btn').prop('disabled', false);
      $('#difficulty').prop('disabled', false);
    });
}

function resetGame() {
  clearInterval(timerInterval);

  firstCard = undefined;
  secondCard = undefined;
  hasFlippedCard = false;
  lockBoard = false;
  clicks = 0;
  matchedPairs = 0;
  totalPairs = 0;
  timeRemaining = 0;
  gameStarted = false;
  peekUsed = false;
  canClick = false;

  $('#game_grid').empty();
  $('#game-message').addClass('hidden').removeClass('win lose');
  $('#peek-btn').prop('disabled', true);

  updateStatus();
}

async function fetchPokemon(pairs) {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
    const data = await response.json();

    const shuffled = [...data.results].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, pairs);

    const detailedPokemon = await Promise.all(
      selected.map(pokemon => fetch(pokemon.url).then(res => res.json()))
    );

    const cardPairs = [];
    detailedPokemon.forEach(pokemon => {
      const image = pokemon.sprites.other['official-artwork'].front_default;
      if (image) {
        cardPairs.push({ name: pokemon.name, image: image });
        cardPairs.push({ name: pokemon.name, image: image });
      }
    });

    return cardPairs.sort(() => Math.random() - 0.5);
  } catch (error) {
    throw error;
  }
}

function createCardGrid(pokemonList) {
  const grid = $('#game_grid');
  grid.empty();

  const columns = pokemonList.length <= 6 ? 3 : pokemonList.length <= 12 ? 4 : 5;
  grid.css('grid-template-columns', `repeat(${columns}, 1fr)`);

  pokemonList.forEach((pokemon, index) => {
    const card = $('<div>')
      .addClass('card')
      .attr('data-name', pokemon.name)
      .attr('data-index', index);

    const frontFace = $('<div>').addClass('front_face');
    const img = $('<img>').attr('src', pokemon.image).attr('alt', pokemon.name);
    frontFace.append(img);

    const backFace = $('<div>').addClass('back_face');
    const backImg = $('<img>').attr('src', 'back.webp').attr('alt', 'Card Back');
    backFace.append(backImg);

    card.append(frontFace).append(backFace);
    grid.append(card);
  });
}

function flipCard(card) {
  if (lockBoard) return;
  if (card === firstCard) return;

  card.addClass('flip');

  if (!hasFlippedCard) {
    hasFlippedCard = true;
    firstCard = card;
    return;
  }

  secondCard = card;
  clicks++;
  updateStatus();

  checkForMatch();
}

function checkForMatch() {
  const isMatch = firstCard.data('name') === secondCard.data('name');

  if (isMatch) {
    disableCards();
  } else {
    unflipCards();
  }
}

function disableCards() {
  firstCard.addClass('matched');
  secondCard.addClass('matched');

  firstCard.off('click');
  secondCard.off('click');

  matchedPairs++;
  updateStatus();

  resetBoard();

  if (matchedPairs === totalPairs) {
    endGame(true);
  }
}

function unflipCards() {
  lockBoard = true;

  setTimeout(() => {
    firstCard.removeClass('flip');
    secondCard.removeClass('flip');
    resetBoard();
  }, 1000);
}

function resetBoard() {
  [hasFlippedCard, lockBoard] = [false, false];
  [firstCard, secondCard] = [undefined, undefined];
}

function startTimer() {
  updateStatus();

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateStatus();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      endGame(false);
    }
  }, 1000);
}

function updateStatus() {
  $('#clicks').text(clicks);
  $('#matched').text(matchedPairs);
  $('#pairs-left').text(totalPairs - matchedPairs);
  $('#total-pairs').text(totalPairs);
  $('#time-remaining').text(gameStarted ? timeRemaining : '--');
}

function endGame(won) {
  clearInterval(timerInterval);
  $('#game_grid').empty();
  $('#game-message').addClass('hidden').removeClass('win lose');
  $('#peek-btn').prop('disabled', true);
  $('#end-btn').prop('disabled', true);
  $('#reset-btn').prop('disabled', true);
  $('#difficulty').prop('disabled', false);
  $('#start-btn').prop('disabled', false);
  
  clicks = 0;
  matchedPairs = 0;
  totalPairs = 0;
  timeRemaining = 0;
  gameStarted = false;
  peekUsed = false;
  canClick = false;
  firstCard = undefined;
  secondCard = undefined;
  lockBoard = false;
  hasFlippedCard = false;

  if (won === true) {
    showMessage('You Win!', 'win');
  } else if (won === false) {
    showMessage('Game Over', 'lose');
  } else {
    showMessage('Game Ended', 'lose');
  }

  updateStatus();
}

function showMessage(message, type) {
  const msgEl = $('#game-message');
  msgEl.html(message).removeClass('hidden').addClass(type);
}

function peekCards() {
  if (peekUsed || lockBoard || matchedPairs === totalPairs) return;

  peekUsed = true;
  $('#peek-btn').prop('disabled', true);

  const unmatchedCards = $('.card:not(.matched)');
  unmatchedCards.addClass('flip');

  setTimeout(() => {
    unmatchedCards.removeClass('flip');
  }, 2000);
}