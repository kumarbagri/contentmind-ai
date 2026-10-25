function fmtDate(iso){
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
(function(){
  var grid = document.getElementById("blogGrid");
  if (grid && typeof POSTS !== "undefined") {
    var limit = grid.dataset.limit ? parseInt(grid.dataset.limit, 10) : POSTS.length;
    grid.innerHTML = POSTS.slice(0, limit).map(function(p){
      return '<article class="post">' +
        '<div class="thumb" aria-hidden="true"><span></span></div>' +
        '<div class="body">' +
          '<div class="meta"><span class="tag">' + p.tag + '</span><span>' + fmtDate(p.date) + '</span></div>' +
          '<h3>' + p.title + '</h3>' +
          '<p>' + p.excerpt + '</p>' +
        '</div>' +
      '</article>';
    }).join("");
  }
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
