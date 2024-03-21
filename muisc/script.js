function toggleBoth(event) {
    toggleIcons();
    toggleSearch();
    event.preventDefault(); // Prevent default behavior of anchor tag
  }

  function toggleIcons() {
    const homeLink = document.getElementById('homeLink');
    const favouritesLink = document.getElementById('favouritesLink');
    const searchcontainer = document.getElementById('search-container');
    const title1 = document.getElementById('title1');

    if (homeLink.style.display === 'none') {
      homeLink.style.display = 'inline-block';
      favouritesLink.style.display = 'inline-block';
      searchcontainer.style.display = "block";
      title1.style.display="none";
    } else {
      homeLink.style.display = 'none';
      favouritesLink.style.display = 'none';
      searchcontainer.style.display = "none";
      title1.style.display="block";
    }
  }

const resultsContainer = document.querySelector('.results-container');
const favouritesContainer = document.querySelector('.favourite-container');
const favouritesLink = document.getElementById('favouritesLink');
const homeLink = document.getElementById('homeLink');
const currentImg = document.querySelector('.current-img');
const currentTitle = document.querySelector('.current-title');
const currentAudio = document.querySelector('.current-audio');
let currentlyPlayingIndex = null;

function saveFavoritesToLocalStorage() {
    localStorage.setItem('favorites', JSON.stringify(uniqueFavourites));
}

function loadFavoritesFromLocalStorage() {
    const storedFavorites = localStorage.getItem('favorites');
    return storedFavorites ? JSON.parse(storedFavorites) : [];
}

// Load favorites from localStorage
const uniqueFavourites = loadFavoritesFromLocalStorage();

function createResultItem(result, index, isFavourite = false) {
    const containerClass = isFavourite ? 'fav-item' : 'result-item'; // Updated class name

    let resultItem = document.createElement('div');
    resultItem.classList.add('container', containerClass);
    resultItem.innerHTML = `
        <div class="img">
            <img src="${result.img}" class="image" alt="${result.title}">
        </div>
        <div class="title">
            <h2>${result.title}</h2>
            <audio class="audio" src="https://musicapi.x007.workers.dev/fetch?id=${result.id}&bitrate=32" preload="auto" controls></audio>
        </div>
        <div class="button">
            <button class="heartButton ${isFavourite ? 'favourite' : ''}"><i class="fa-solid fa-heart"></i></button>
            <button class="playButton">&#9654;</button>
        </div>
    `;

    // Add event listener to the heart button
    const heartButton = resultItem.querySelector('.heartButton');
    heartButton.addEventListener('click', () => toggleFavourite(result, resultItem, isFavourite));

    // Add event listener to the play button
    const playButton = resultItem.querySelector('.playButton');
    const audio = resultItem.querySelector('.audio');

    playButton.addEventListener('click', function() {
        // Pause all other audios
        const allAudios = document.querySelectorAll('.audio');
        allAudios.forEach(a => {
            if (a !== audio) {
                a.pause();
            }
        });
    
        if (audio.paused) {
            audio.play();
            this.innerHTML = '&#10074;&#10074;';
            updateCurrentPlaying(result);
            resultItem.querySelector('.title h2').style.color = 'orange';
        } else {
            audio.pause();
            this.innerHTML = '&#9654;';
            resultItem.querySelector('.title h2').style.color = 'white';
        }
    });
    

    // Add event listener for ended event to play next song automatically
    audio.addEventListener('ended', () => {
      const nextAudio = resultItem.nextElementSibling.querySelector('.audio');
      if (nextAudio) {
          nextAudio.play();
          resultItem.nextElementSibling.querySelector('h2').style.color = 'orange';
          resultItem.querySelector('h2').style.color = 'white';
          const nextResult = resultItem.nextElementSibling;
          updateCurrentPlaying({
            img: nextResult.querySelector('.image').src,
            title: nextResult.querySelector('h2').textContent,
          });
      }
  });
  
    return resultItem;
}


function toggleFavourite(result, resultItem, isFavouriteContainer) {
    const heartButton = resultItem.querySelector('.heartButton');
    const isFavourite = heartButton.classList.toggle('favourite');

    if (isFavourite) {
        // Check if the result is not already in the uniqueFavourites array
        if (!uniqueFavourites.some(item => item.id === result.id)) {
            uniqueFavourites.push(result);
            saveFavoritesToLocalStorage(); // Save favorites to localStorage

            // Add the result item to the favorites container immediately
            const favouriteResultItem = createResultItem(result, favouritesContainer.children.length, true);
            favouritesContainer.appendChild(favouriteResultItem);
        }
    } else {
        // Remove from favourites and uniqueFavourites array
        const container = isFavouriteContainer ? favouritesContainer : resultsContainer;
        const indexToRemove = Array.from(container.children).findIndex(item => item === resultItem);
        container.removeChild(resultItem);
        uniqueFavourites.splice(indexToRemove, 1);
        saveFavoritesToLocalStorage(); // Save favorites to localStorage
    }

    // If on the favorites page, update the display immediately
    if (isFavouriteContainer) {
        playAudio(currentlyPlayingIndex, true); // Refresh the currently playing audio
    }
}

async function performSearch() {
    const musicInput = document.querySelector('.inputtext').value;
    let url = `https://musicapi.x007.workers.dev/search?q=${musicInput}&searchEngine=seevn`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        console.log(result);

        // Clear previous results
        resultsContainer.innerHTML = '';

        if (result.response.length === 0) {
            // If no results found, fetch from another URL
            url = `https://musicapi.x007.workers.dev/search?q=${musicInput}&searchEngine=wunk`;
            const responseFallback = await fetch(url);
            const resultFallback = await responseFallback.json();
            console.log(resultFallback);

            if (resultFallback.response.length === 0) {
                const noResultsMessage = document.createElement('div');
                noResultsMessage.textContent = 'No results found.';
                resultsContainer.appendChild(noResultsMessage);
            } else {
                // Display results from the fallback URL
                for (let i = 0; i < resultFallback.response.length; i++) {
                    const resultItem = createResultItem(resultFallback.response[i], i);
                    resultsContainer.appendChild(resultItem);
                }
            }
        } else {
            // Display results from the original URL
            for (let i = 0; i < result.response.length; i++) {
                const resultItem = createResultItem(result.response[i], i);
                resultsContainer.appendChild(resultItem);
            }
        }
    } catch (error) {
        console.error(error);
    }
}


function updateCurrentPlaying(result) {
    currentImg.src = result.img;
    currentTitle.textContent = result.title;
}
// Function to hide the favourite container and display the results container
function displayResultsContainer() {
    document.querySelector('.results-container').style.display = 'flex';
    document.querySelector('.favourite-container').style.display = 'none';
}

// Add event listener to execute the function when the window reloads
window.onload = displayResultsContainer;


document.querySelector('.searchbtn').addEventListener('click', async () => {
    await performSearch();
});

document.getElementById('searchInput').addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        await performSearch();
    }
});

favouritesLink.addEventListener('click', () => {
    favouritesContainer.style.display = 'flex';
    resultsContainer.style.display = 'none';
});

homeLink.addEventListener('click', () => {
    resultsContainer.style.display = 'flex';
    favouritesContainer.style.display = 'none';
});

// Add an event listener to the window for when the page is loaded
window.addEventListener('load', () => {
    // Display favorites on page load
    for (let i = 0; i < uniqueFavourites.length; i++) {
        const favouriteResultItem = createResultItem(uniqueFavourites[i], i, true);
        favouritesContainer.appendChild(favouriteResultItem);
    }
});
