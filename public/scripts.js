let recipes = [];
let currentServings = 1;
let activeType = "all";
let isAdmin = false;
let isBugManager = false;

document.addEventListener("DOMContentLoaded", () => {
  fetchRecipes();
  setupUI();
});

/* ------------------ RECIPES ------------------ */

async function fetchRecipes() {
  const res = await fetch("/api/recipes");
  recipes = await res.json();
  displayRecipes();
}

function displayRecipes() {
  const list = document.getElementById("recipe-list");
  list.innerHTML = "";

  const filtered =
    activeType === "all"
      ? recipes
      : recipes.filter(r => r.type === activeType);

  filtered.forEach(recipe => {
    const div = document.createElement("div");
    div.className = "col-md-6 mb-4";
    div.innerHTML = `
      <div class="recipe-card">
        <h4>${recipe.name}</h4>
        <span class="badge bg-primary">${recipe.type}</span>
        <span class="badge bg-success">$${(
          recipe.base_price * currentServings
        ).toFixed(2)}</span>
        <button class="btn btn-primary mt-2">View</button>
      </div>
    `;
    div.querySelector("button").onclick = () =>
      showRecipe(recipe);
    list.appendChild(div);
  });
}

function showRecipe(recipe) {
  alert(
    recipe.name +
      "\n\n" +
      recipe.instructions.join("\n")
  );
}

/* ------------------ ADMIN ------------------ */

function adminLogin(password) {
  fetch("/api/admin-auth", {
    method: "POST",
    body: JSON.stringify({ password }),
  }).then(res => {
    if (res.ok) isAdmin = true;
  });
}

/* ------------------ BUGS ------------------ */

async function submitBug(name, description) {
  await fetch("/api/bugs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reporter_name: name, description }),
  });
}

/* ------------------ UI ------------------ */

function setupUI() {
  document.querySelectorAll(".btn-filter").forEach(btn => {
    btn.onclick = () => {
      activeType = btn.dataset.type;
      displayRecipes();
    };
  });

  document.getElementById("calculateBtn").onclick = () => {
    currentServings =
      parseInt(document.getElementById("servings").value) || 1;
    displayRecipes();
  };
}