let recipes = [];
let currentServings = 1;
let activeType = "all";
let isAdmin = false;
let isBugManager = false;
let currentRecipe = null;
let currentBugId = null;

const ADMIN_PASSWORD = "troop634admin";
const BUG_MANAGER_PASSWORD = "bugmanager634";

document.addEventListener("DOMContentLoaded", () => {
  fetchRecipes();
  setupUI();
});

/* ------------------ TOAST NOTIFICATIONS ------------------ */

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  
  setTimeout(() => {
    toast.remove();
  }, 5500);
}

/* ------------------ RECIPES ------------------ */

async function fetchRecipes() {
  try {
    const res = await fetch("/api/recipes");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    recipes = await res.json();
    displayRecipes();
  } catch (error) {
    console.error("Error fetching recipes:", error);
    const list = document.getElementById("recipe-list");
    list.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Failed to load recipes. Please check your database connection.
          <br><small>Error: ${error.message}</small>
        </div>
      </div>
    `;
    showToast("Failed to load recipes", "error");
  }
}

function displayRecipes() {
  const list = document.getElementById("recipe-list");
  list.innerHTML = "";

  const filtered = activeType === "all" 
    ? recipes 
    : recipes.filter(r => r.type === activeType);

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="fas fa-utensils fa-3x text-muted mb-3"></i>
        <p class="text-muted">No recipes found in this category.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(recipe => {
    const div = document.createElement("div");
    div.className = "col-md-6 mb-4";
    
    const ingredients = typeof recipe.ingredients === 'string' 
      ? JSON.parse(recipe.ingredients) 
      : recipe.ingredients;
    
    const nutrition = typeof recipe.nutrition === 'string'
      ? JSON.parse(recipe.nutrition)
      : recipe.nutrition;

    div.innerHTML = `
      <div class="recipe-card">
        <h4>${recipe.name}</h4>
        <div class="recipe-meta">
          <span class="badge bg-primary">${recipe.type}</span>
          <span class="badge bg-success">$${(recipe.base_price * currentServings).toFixed(2)}</span>
        </div>
        <div class="recipe-preview mt-3">
          <div class="nutrition-preview">
            <span><i class="fas fa-fire"></i> ${nutrition.calories * currentServings} cal</span>
            <span><i class="fas fa-drumstick-bite"></i> ${nutrition.protein * currentServings}g protein</span>
          </div>
        </div>
        <button class="btn btn-primary mt-3 view-recipe">
          <i class="fas fa-eye me-2"></i>View Recipe
        </button>
      </div>
    `;
    
    div.querySelector(".view-recipe").onclick = () => showRecipe(recipe);
    list.appendChild(div);
  });
}

function showRecipe(recipe) {
  currentRecipe = recipe;
  
  const ingredients = typeof recipe.ingredients === 'string'
    ? JSON.parse(recipe.ingredients)
    : recipe.ingredients;
  
  const instructions = typeof recipe.instructions === 'string'
    ? JSON.parse(recipe.instructions)
    : recipe.instructions;
  
  const nutrition = typeof recipe.nutrition === 'string'
    ? JSON.parse(recipe.nutrition)
    : recipe.nutrition;

  const modal = document.getElementById("recipeModal");
  const modalInstance = bootstrap.Modal.getOrCreateInstance(modal);
  
  modal.querySelector(".modal-title").textContent = recipe.name;
  
  const detailsHtml = `
    <div class="recipe-details">
      <div class="recipe-details-section">
        <h5><i class="fas fa-chart-pie"></i> Nutrition (for ${currentServings} serving${currentServings > 1 ? 's' : ''})</h5>
        <div class="recipe-details-group">
          <div class="recipe-details-item">
            <div class="label">Calories</div>
            <div class="value">${nutrition.calories * currentServings}</div>
          </div>
          <div class="recipe-details-item">
            <div class="label">Protein</div>
            <div class="value">${nutrition.protein * currentServings}g</div>
          </div>
          <div class="recipe-details-item">
            <div class="label">Carbs</div>
            <div class="value">${nutrition.carbs * currentServings}g</div>
          </div>
          <div class="recipe-details-item">
            <div class="label">Fat</div>
            <div class="value">${nutrition.fat * currentServings}g</div>
          </div>
          <div class="recipe-details-item">
            <div class="label">Fiber</div>
            <div class="value">${nutrition.fiber * currentServings}g</div>
          </div>
        </div>
      </div>

      <div class="recipe-details-section">
        <h5><i class="fas fa-shopping-basket"></i> Ingredients</h5>
        <div class="ingredients-list">
          ${ingredients.map(ing => `
            <div class="ingredient-item">
              <span class="amount">${parseFloat(ing.amount) * currentServings} ${ing.unit}</span>
              <span class="name">${ing.name}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="recipe-details-section">
        <h5><i class="fas fa-list-ol"></i> Instructions</h5>
        <ol class="recipe-instructions">
          ${instructions.map(inst => `<li>${inst}</li>`).join('')}
        </ol>
      </div>
    </div>
  `;
  
  modal.querySelector(".recipe-details").innerHTML = detailsHtml;
  
  const adminControls = modal.querySelector(".modal-footer.admin-controls");
  if (isAdmin) {
    adminControls.style.display = "flex";
  } else {
    adminControls.style.display = "none";
  }
  
  modalInstance.show();
}

/* ------------------ ADMIN ------------------ */

function showAdminControls() {
  document.getElementById("adminControls").style.display = "block";
  document.querySelectorAll(".modal-footer.admin-controls").forEach(el => {
    el.style.display = "flex";
  });
  showToast("Admin logged in successfully", "success");
}

function hideAdminControls() {
  document.getElementById("adminControls").style.display = "none";
  document.querySelectorAll(".modal-footer.admin-controls").forEach(el => {
    el.style.display = "none";
  });
  showToast("Admin logged out", "info");
}

/* ------------------ BUG MANAGER ------------------ */

function showBugManagerControls() {
  document.querySelectorAll(".bug-manager-controls").forEach(el => {
    el.style.display = "flex";
  });
  showToast("Bug Manager logged in successfully", "success");
}

function hideBugManagerControls() {
  document.querySelectorAll(".bug-manager-controls").forEach(el => {
    el.style.display = "none";
  });
  showToast("Bug Manager logged out", "info");
}

async function loadBugs() {
  try {
    const res = await fetch("/api/bugs");
    if (!res.ok) throw new Error("Failed to fetch bugs");
    const bugs = await res.json();
    
    const bugList = document.getElementById("bugList");
    
    if (bugs.length === 0) {
      bugList.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
          <p class="text-muted">No issues reported yet!</p>
        </div>
      `;
      return;
    }
    
    bugList.innerHTML = bugs.map(bug => `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h6 class="mb-1">${bug.reporter_name}</h6>
            <p class="mb-1">${bug.description}</p>
            <small class="text-muted">
              ${new Date(bug.reported_at).toLocaleString()}
            </small>
          </div>
          <div class="d-flex gap-2 align-items-center">
            <span class="badge ${bug.status === 'open' ? 'bg-danger' : 'bg-success'}">
              ${bug.status}
            </span>
            ${isBugManager ? `
              <button class="btn btn-sm btn-success mark-fixed" data-id="${bug.id}" ${bug.status === 'resolved' ? 'disabled' : ''}>
                <i class="fas fa-check"></i>
              </button>
              <button class="btn btn-sm btn-danger delete-bug" data-id="${bug.id}">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
    
    if (isBugManager) {
      bugList.querySelectorAll(".mark-fixed").forEach(btn => {
        btn.onclick = () => {
          currentBugId = btn.dataset.id;
          const confirmModal = new bootstrap.Modal(document.getElementById("confirmFixModal"));
          confirmModal.show();
        };
      });
      
      bugList.querySelectorAll(".delete-bug").forEach(btn => {
        btn.onclick = () => {
          currentBugId = btn.dataset.id;
          const confirmModal = new bootstrap.Modal(document.getElementById("confirmDeleteModal"));
          confirmModal.show();
        };
      });
    }
  } catch (error) {
    console.error("Error loading bugs:", error);
    showToast("Failed to load issues", "error");
  }
}

async function markBugFixed(id) {
  try {
    const res = await fetch("/api/bugs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    
    if (!res.ok) throw new Error("Failed to mark bug as fixed");
    
    showToast("Issue marked as resolved", "success");
    loadBugs();
  } catch (error) {
    console.error("Error marking bug as fixed:", error);
    showToast("Failed to mark issue as resolved", "error");
  }
}

async function deleteBug(id) {
  try {
    const res = await fetch(`/api/bugs?id=${id}`, {
      method: "DELETE",
    });
    
    if (!res.ok) throw new Error("Failed to delete bug");
    
    showToast("Issue deleted successfully", "success");
    loadBugs();
  } catch (error) {
    console.error("Error deleting bug:", error);
    showToast("Failed to delete issue", "error");
  }
}

/* ------------------ UI SETUP ------------------ */

function setupUI() {
  // Filter buttons
  document.querySelectorAll(".btn-filter").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeType = btn.dataset.type;
      displayRecipes();
    };
  });

  // Calculate servings
  document.getElementById("calculateBtn").onclick = () => {
    currentServings = parseInt(document.getElementById("servings").value) || 1;
    displayRecipes();
    showToast(`Portions calculated for ${currentServings} serving${currentServings > 1 ? 's' : ''}`, "success");
  };

  // Admin login
  document.getElementById("adminLoginBtn").onclick = () => {
    const modal = new bootstrap.Modal(document.getElementById("adminModal"));
    modal.show();
  };

  document.getElementById("adminLoginForm").onsubmit = (e) => {
    e.preventDefault();
    const password = document.getElementById("adminPassword").value;
    
    if (password === ADMIN_PASSWORD) {
      isAdmin = true;
      showAdminControls();
      bootstrap.Modal.getInstance(document.getElementById("adminModal")).hide();
      document.getElementById("adminPassword").value = "";
    } else {
      showToast("Invalid admin password", "error");
    }
  };

  document.getElementById("adminLogoutBtn").onclick = () => {
    isAdmin = false;
    hideAdminControls();
  };

  // Bug Manager login
  document.getElementById("bugManagerBtn").onclick = () => {
    const modal = new bootstrap.Modal(document.getElementById("bugManagerModal"));
    modal.show();
  };

  document.getElementById("bugManagerForm").onsubmit = (e) => {
    e.preventDefault();
    const password = document.getElementById("bugManagerPassword").value;
    
    if (password === BUG_MANAGER_PASSWORD) {
      isBugManager = true;
      showBugManagerControls();
      bootstrap.Modal.getInstance(document.getElementById("bugManagerModal")).hide();
      document.getElementById("bugManagerPassword").value = "";
    } else {
      showToast("Invalid bug manager password", "error");
    }
  };

  document.getElementById("bugManagerLogoutBtn").onclick = () => {
    const modal = new bootstrap.Modal(document.getElementById("bugManagerLogoutModal"));
    modal.show();
  };

  document.getElementById("confirmBugManagerLogoutBtn").onclick = () => {
    isBugManager = false;
    hideBugManagerControls();
    bootstrap.Modal.getInstance(document.getElementById("bugManagerLogoutModal")).hide();
    
    const bugListModal = bootstrap.Modal.getInstance(document.getElementById("bugListModal"));
    if (bugListModal) {
      bugListModal.hide();
    }
  };

  // View bugs
  document.getElementById("viewBugsBtn").onclick = () => {
    loadBugs();
    const modal = new bootstrap.Modal(document.getElementById("bugListModal"));
    modal.show();
  };

  // Report bug
  document.getElementById("reportBugBtn").onclick = () => {
    const modal = new bootstrap.Modal(document.getElementById("bugReportModal"));
    modal.show();
  };

  document.getElementById("bugReportForm").onsubmit = async (e) => {
    e.preventDefault();
    
    const name = document.getElementById("reporterName").value;
    const description = document.getElementById("bugDescription").value;
    
    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporter_name: name, description }),
      });
      
      if (!res.ok) throw new Error("Failed to submit bug report");
      
      showToast("Issue reported successfully", "success");
      document.getElementById("bugReportForm").reset();
      bootstrap.Modal.getInstance(document.getElementById("bugReportModal")).hide();
    } catch (error) {
      console.error("Error submitting bug report:", error);
      showToast("Failed to submit issue", "error");
    }
  };

  // Confirm fix bug
  document.getElementById("confirmFixBtn").onclick = () => {
    if (currentBugId) {
      markBugFixed(currentBugId);
      bootstrap.Modal.getInstance(document.getElementById("confirmFixModal")).hide();
      currentBugId = null;
    }
  };

  // Confirm delete bug
  document.getElementById("confirmDeleteBtn").onclick = () => {
    if (currentBugId) {
      deleteBug(currentBugId);
      bootstrap.Modal.getInstance(document.getElementById("confirmDeleteModal")).hide();
      currentBugId = null;
    }
  };
}