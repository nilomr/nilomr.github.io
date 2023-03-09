const animfeatured = document.querySelector('.image.animfeatured');

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function animate() {
    if (isElementInViewport(animfeatured)) {
        animfeatured.classList.add('animate');
        window.removeEventListener('scroll', animate);
    }
}

window.addEventListener('scroll', animate);