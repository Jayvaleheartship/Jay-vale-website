// Update footer year automatically
const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}


// Mobile menu toggle
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


// Reveal elements when they scroll into view
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


// Rotating featured songs on homepage
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
    cover: "assets/my-own-apocalypse-cover.png",
    alt: "My Own Apocalypse cover art",
    description:
      "A ruined-world emotional landscape where the disaster is internal. Ash, pressure, broken reflections and the feeling of surviving yourself.",
  },
  {
    title: "Perfect Cracks",
    link: "songs/perfect-cracks.html",
    cover: "assets/perfect-cracks-cover.png",
    alt: "Perfect Cracks cover art",
    description:
      "Depression, origin stories and the ugly beauty of damage that explains a person without excusing everything they do.",
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
    cover: "assets/behind-the-wall-cover.png",
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
      "A track about recognition, loneliness, and the question of whether anyone else understands what this feels like.",
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

setInterval(renderFeaturedSongs, 7000);
