const track = document.querySelector('.carousel-track');
const slides = Array.from(track.children);
const nextButton = document.querySelector('.carousel-button.next');
const prevButton = document.querySelector('.carousel-button.prev');
const indicatorText = document.querySelector('#index-indicator');

let currentSlideIndex = 0;

window.onload = () => updateTextIndicator();

function updateSlidePosition() {
    const slideWidth = slides[0].getBoundingClientRect().width;
    track.style.transform = `translateX(-${currentSlideIndex * slideWidth}px)`;
    updateTextIndicator();
}

function updateTextIndicator() {
    indicatorText.textContent = `${currentSlideIndex + 1}/${slides.length}`;
}

nextButton.addEventListener('click', () => {
    if (currentSlideIndex < slides.length - 1) currentSlideIndex++;
    else currentSlideIndex = 0;
    updateSlidePosition();
});

prevButton.addEventListener('click', () => {
    if (currentSlideIndex > 0) currentSlideIndex--;
    else currentSlideIndex = slides.length - 1;
    updateSlidePosition();
});

window.addEventListener('resize', updateSlidePosition);
