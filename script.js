/* =========================
   FOOTER YEAR
========================= */

const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}


/* =========================
   MOBILE MENU
========================= */

const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
    });
  });
}


/* =========================
   SCROLL REVEAL
========================= */

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.15,
  }
);

document.querySelectorAll(".reveal").forEach((element) => {
  observer.observe(element);
});


/* =========================
   ROTATING FEATURED SONGS
   Used on index.html
========================= */

const featuredSongs = document.getElementById("featuredSongs");

const songs = [
  {
    title: "Chemical Road",
    link: "songs/chemical-road.html",
    cover: "assets/chemical.png",
    alt: "Chemical Road cover art",
    description:
      "A dark emotional track about the strange roads inside the mind, where chemistry, memory and survival keep pulling in different directions.",
  },
  {
    title: "Digital Home",
    link: "songs/digital-home.html",
    cover: "assets/digital-home.png",
    alt: "Digital Home cover art",
    description:
      "A cinematic emotional track about finding real connection inside a digital world, disappearing without a goodbye, and coming back to say thank you.",
  },
  {
    title: "Hour by Hour",
    link: "songs/hour-by-hour.html",
    cover: "assets/hour-by-hour-cover.png",
    alt: "Hour by Hour cover art",
    description:
      "A dark emotional track about surviving time in fragments, running out of fuel, and trying to make it through one hour at a time.",
  },
  {
    title: "Family",
    link: "songs/family.html",
    cover: "assets/family-cover.png",
    alt: "Family cover art",
    description:
      "A heavy and direct song about blood, damage, memory, survival, and the painful truth that family is not always safety.",
  },
  {
    title: "My Own Apocalypse",
    link: "songs/my-own-apocalypse.html",
    cover: "assets/my-own-apocalypse.png",
    alt: "My Own Apocalypse cover art",
    description:
      "A ruined-world emotional landscape where the disaster is internal: numbness, anger, masks, and collapse from the inside.",
  },
  {
    title: "Perfect Cracks",
    link: "songs/perfect-cracks.html",
    cover: "assets/perfect-cracks-cover.png",
    alt: "Perfect Cracks cover art",
    description:
      "The album project behind the Jay Vale sound: damage, masks, survival, reflection, and the cracks that made the truth visible.",
  },
  {
    title: "Answer Me This",
    link: "songs/answer-me-this.html",
    cover: "assets/answer-me-this-cover.png",
    alt: "Answer Me This cover art",
    description:
      "A direct confrontation with unanswered questions, silence, and the need to finally be heard.",
  },
  {
    title: "Self-Diagnosed Schyzophrenic",
    link: "songs/self-diagnosed-schyzophrenic.html",
    cover: "assets/self-diagnosed-schyzophrenic-cover.png",
    alt: "Self-Diagnosed Schyzophrenic cover art",
    description:
      "A chaotic, sharp-edged track about identity, labels, confusion, and the danger of being reduced to symptoms.",
  },
  {
    title: "Selfhate",
    link: "songs/selfhate.html",
    cover: "assets/selfhate-cover.png",
    alt: "Selfhate cover art",
    description:
      "A heavy inner-conflict track about turning anger inward and fighting the voice that keeps attacking from inside.",
  },
  {
    title: "Fought Not To Be",
    link: "songs/fought-not-to-be.html",
    cover: "assets/fought-not-to-be-cover.png",
    alt: "Fought Not To Be cover art",
    description:
      "A symbolic escape from becoming the past and refusing to become inherited damage.",
  },
  {
    title: "Behind the Wall",
    link: "songs/behind-the-wall.html",
    cover: "assets/behind-the-wall.png",
    alt: "Behind the Wall cover art",
    description:
      "A song about the hidden younger self, the protector, and the pain still speaking from behind the wall.",
  },
  {
    title: "Can You Relate",
    link: "songs/can-you-relate.html",
    cover: "assets/can-you-relate-cover.png",
    alt: "Can You Relate cover art",
    description:
      "A track about recognition, loneliness, and asking whether anyone else knows how to heal when the damage is you.",
  },
];

let songStartIndex = 0;

function renderFeaturedSongs() {
  if (!featuredSongs) {
    return;
  }

  const visibleSongs = [];

  for (let i = 0; i < 3; i++) {
    const songIndex = (songStartIndex + i) % songs.length;
    visibleSongs.push(songs[songIndex]);
  }

  featuredSongs.innerHTML = visibleSongs
    .map(
      (song) => `
        <a class="song-card rotating-song-card" href="${song.link}">
          <img
            class="song-cover"
            src="${song.cover}"
            alt="${song.alt}"
          />

          <h3>${song.title}</h3>

          <p>${song.description}</p>
        </a>
      `
    )
    .join("");

  songStartIndex = (songStartIndex + 1) % songs.length;
}

renderFeaturedSongs();

if (featuredSongs) {
  setInterval(renderFeaturedSongs, 7000);
}


/* =========================
   COMING SOON MUSIC
   Used on portfolio.html
========================= */

const comingSoonMusic = document.getElementById("comingSoonMusic");

const comingSoonSongs = [
  {
    title: "ILIBILITY",
    status: "Coming soon",
    releaseDate: "Release date: 25 May",
    description:
      "A sharp track about labels, fake understanding, and people using intelligent words while failing to actually read the person.",
  },
  {
    title: "Sparking Match",
    status: "Coming soon",
    releaseDate: "Release date: 26 May",
    description:
      "A track about mistaking attention for love, and how one small spark can light up a place that was already dry inside.",
  },
  {
    title: "Everything",
    status: "Coming soon",
    releaseDate: "Release date: 26 May",
    description:
      "A song about wanting everything, needing too much, feeling capable of nothing, and chasing temporary happiness to stay upright.",
  },
  {
    title: "Narcissistic Grandiosity",
    status: "Coming soon",
    releaseDate: "Release date: 27 May",
    description:
      "A dark concept about the perfect mask, the cracked real face underneath, and the collapse between image and truth.",
  },
];

let comingSoonIndex = 0;

function renderComingSoonMusic() {
  if (!comingSoonMusic) {
    return;
  }

  const song = comingSoonSongs[comingSoonIndex];

  comingSoonMusic.innerHTML = `
    <p class="coming-soon-status">${song.status}</p>

    <h3>${song.title}</h3>

    <p class="coming-soon-date">${song.releaseDate}</p>

    <p>${song.description}</p>
  `;

  comingSoonIndex = (comingSoonIndex + 1) % comingSoonSongs.length;
}

renderComingSoonMusic();

if (comingSoonMusic) {
  setInterval(renderComingSoonMusic, 5000);
}
