const menuBtn = document.querySelector('.menu-btn');
const mainNav = document.querySelector('.main-nav');
const filterButtons = document.querySelectorAll('.filter-btn');
const courseCards = document.querySelectorAll('.course-card');

menuBtn.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    filterButtons.forEach(btn => btn.classList.toggle('active', btn === button));

    courseCards.forEach(card => {
      const category = card.dataset.category;
      const show =
        filter === 'all' ||
        category === filter;

      card.style.display = show ? 'block' : 'none';
    });
  });
});
