function expandTopBorder() {
  var cards = document.querySelectorAll('.program-card');
  cards.forEach(function(card) {
    var viewMore = card.querySelector('.view-more');
    viewMore.addEventListener('click', function() {
      card.classList.toggle('expanded');
      var categories = card.querySelector('.program-categories');
      if (card.classList.contains('expanded')) {
        categories.style.height = '24px';
      } else {
        categories.style.height = '4px';
      }
    });
  });
}
window.onload = expandTopBorder;
