// Book reader application logic

// 1. Chapter list definitions
const chapters = [
    { id: "cover", title: "Front Cover", isMeta: true },
    { id: "01", title: "Chapter 1: The Trust Revolution & Why Blockchain is a Hot Career Choice", file: "chapter_01_trust_revolution_and_career.md" },
    { id: "02", title: "Chapter 2: Blockchain Fundamentals Made Easy", file: "chapter_02_blockchain_fundamentals.md" },
    { id: "03", title: "Chapter 3: Basics of Bitcoin, Ethereum, and Smart Contracts", file: "chapter_03_bitcoin_ethereum_smart_contracts.md" },
    { id: "04", title: "Chapter 4: The Web3 Ecosystem & Real-World Use Cases", file: "chapter_04_web3_ecosystem_use_cases.md" },
    { id: "05", title: "Chapter 5: Top Career Roles in Blockchain & Web3", file: "chapter_05_top_career_roles.md" },
    { id: "06", title: "Chapter 6: Essential Skills and Tools (Your Web3 Toolkit)", file: "chapter_06_essential_skills_tools.md" },
    { id: "07", title: "Chapter 7: Hands-on Learning: Writing Solidity & Building Simple dApps", file: "chapter_07_hands_on_solidity_dapps.md" },
    { id: "08", title: "Chapter 8: How Students Can Build a Strong Portfolio with Projects", file: "chapter_08_building_portfolio.md" },
    { id: "09", title: "Chapter 9: Job Search Strategies: Resumes, Interviews, and Career Growth", file: "chapter_09_job_search_strategies.md" },
    { id: "10", title: "Chapter 10: 6–12 Month Learning & Career Action Plan + Future Trends", file: "chapter_10_learning_action_plan_future_trends.md" },
    { id: "back", title: "Back Cover", isMeta: true }
];

let activeChapter = chapters[0];

// 2. DOM Elements
const chaptersListEl = document.getElementById("chaptersList");
const bookContentEl = document.getElementById("bookContent");
const topNavTitleEl = document.getElementById("topNavChapterTitle");
const readerContainerEl = document.getElementById("readerContainer");
const progressBarEl = document.getElementById("progressBar");

// Theme DOM
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleText = document.getElementById("themeToggleText");

// Search DOM
const searchInput = document.getElementById("searchInput");

// Mobile Layout DOM
const mobileToggleBtn = document.getElementById("mobileToggleBtn");
const mobileCloseBtn = document.getElementById("mobileCloseBtn");
const sidebarEl = document.getElementById("sidebar");

// Print PDF DOM
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const printBookWrapper = document.getElementById("printBookWrapper");

// 3. Initialize App
window.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderChaptersList(chapters);
    loadChapter(activeChapter.id);
    setupEventListeners();
});

// 4. Render Sidebar List
function renderChaptersList(list) {
    chaptersListEl.innerHTML = "";
    list.forEach(chap => {
        const li = document.createElement("li");
        li.id = `nav-${chap.id}`;
        if (chap.id === activeChapter.id) {
            li.classList.add("active");
        }
        
        const a = document.createElement("a");
        a.textContent = chap.title;
        a.addEventListener("click", () => {
            loadChapter(chap.id);
            if (window.innerWidth <= 992) {
                sidebarEl.classList.remove("open");
            }
        });
        
        li.appendChild(a);
        chaptersListEl.appendChild(li);
    });
}

// 5. Load and Parse Chapter Markdown
async function loadChapter(id) {
    const chap = chapters.find(c => c.id === id);
    if (!chap) return;
    
    activeChapter = chap;
    topNavTitleEl.textContent = chap.title;
    
    // Highlight Active Sidebar Item
    document.querySelectorAll("#chaptersList li").forEach(li => li.classList.remove("active"));
    const activeNav = document.getElementById(`nav-${chap.id}`);
    if (activeNav) activeNav.classList.add("active");
    
    readerContainerEl.scrollTop = 0;
    updateProgressBar();
    
    // Render static covers if isMeta is set
    if (chap.isMeta) {
        if (chap.id === "cover") {
            bookContentEl.innerHTML = `
                <div class="web-cover-view" style="text-align: center; padding: 20px 0;">
                    <img src="/assets/book_front_cover.jpg" alt="Front Cover" style="max-height: 60vh; width: auto; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); margin-bottom: 24px; border: 1px solid var(--border-color);">
                    <h1 style="font-size: 38px; margin-bottom: 8px;">Blockchain & Career Opportunities</h1>
                    <h2 style="font-size: 20px; color: var(--accent-primary); border: none; margin-top: 0; padding-bottom: 0;">A Student's Guide to Web3</h2>
                    <p style="font-size: 18px; margin-top: 30px; font-weight: 600; color: var(--text-secondary);">Kalyanjit Hatibaruah</p>
                </div>
            `;
        } else if (chap.id === "back") {
            bookContentEl.innerHTML = `
                <div class="web-cover-view" style="text-align: center; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
                    <h1 style="font-size: 32px; margin-bottom: 24px;">Blockchain & Career Opportunities</h1>
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: var(--text-secondary);">This guidebook bridges the gap between complex blockchain systems and real-world career pathways, specifically tailored for the next generation of IT students and software engineers.</p>
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 32px; color: var(--text-secondary);">From the fundamentals of ledger security to writing Solidity contracts and preparing for developer roles, this book outlines a complete, practical roadmap to breaking into Web3.</p>
                    <p style="font-size: 18px; font-weight: 600; color: var(--text-primary);">Kalyanjit Hatibaruah</p>
                    <hr style="border: none; height: 1px; background-color: var(--border-color); margin: 30px 0;">
                    <p style="font-size: 12px; color: var(--text-muted);">First Edition &copy; 2026. All Rights Reserved.</p>
                </div>
            `;
        }
        return;
    }
    
    bookContentEl.innerHTML = `<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Loading Chapter Content...</div>`;
    
    try {
        const response = await fetch(`/chapters/${chap.file}`);
        if (!response.ok) throw new Error("Failed to load chapter content.");
        const markdown = await response.text();
        
        // Parse markdown using marked.js
        bookContentEl.innerHTML = marked.parse(markdown);
        
        // Add Copy Button to code blocks and apply syntax highlighting
        setupCodeBlocks();
        
        // Trigger Prism syntax highlighter
        if (window.Prism) {
            Prism.highlightAll();
        }
    } catch (error) {
        bookContentEl.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Unable to load the chapter content. Please verify that the local server is running.</p>
            </div>
        `;
    }
}

// 6. Setup Solidity/JS Code Block Copy Buttons
function setupCodeBlocks() {
    const preBlocks = bookContentEl.querySelectorAll("pre");
    preBlocks.forEach(pre => {
        const code = pre.querySelector("code");
        if (!code) return;
        
        const btn = document.createElement("button");
        btn.className = "copy-code-btn";
        btn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
        
        btn.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(code.innerText);
                btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
                btn.style.backgroundColor = "var(--cyan-accent)";
                setTimeout(() => {
                    btn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
                    btn.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }, 2000);
            } catch (err) {
                btn.innerText = "Error copying";
            }
        });
        
        pre.appendChild(btn);
    });
}

// 7. Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeUI(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
    if (theme === "dark") {
        themeToggleText.textContent = "Light Mode";
    } else {
        themeToggleText.textContent = "Dark Mode";
    }
}

// 8. Search Filter Logic
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        renderChaptersList(chapters);
        return;
    }
    
    const filtered = chapters.filter(chap => {
        return chap.title.toLowerCase().includes(query);
    });
    
    renderChaptersList(filtered);
}

// 9. Reading Progress Indicator
function updateProgressBar() {
    const scrollTop = readerContainerEl.scrollTop;
    const scrollHeight = readerContainerEl.scrollHeight - readerContainerEl.clientHeight;
    if (scrollHeight <= 0) {
        progressBarEl.style.width = "0%";
        return;
    }
    const percent = (scrollTop / scrollHeight) * 100;
    progressBarEl.style.width = `${percent}%`;
}

// 10. Event Listeners Setup
function setupEventListeners() {
    // Theme Toggle
    themeToggleBtn.addEventListener("click", toggleTheme);
    
    // Search
    searchInput.addEventListener("input", handleSearch);
    
    // Scroll progress bar
    readerContainerEl.addEventListener("scroll", updateProgressBar);
    
    // Mobile Drawer Navigation Toggles
    mobileToggleBtn.addEventListener("click", () => {
        sidebarEl.classList.add("open");
    });
    
    mobileCloseBtn.addEventListener("click", () => {
        sidebarEl.classList.remove("open");
    });

    // PDF Download Event
    downloadPdfBtn.addEventListener("click", downloadBookAsPdf);
}

// 11. Compile Book & Generate PDF
async function downloadBookAsPdf() {
    const originalText = downloadPdfBtn.innerHTML;
    downloadPdfBtn.disabled = true;
    downloadPdfBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Compiling Book...`;
    
    try {
        let fullBookHtml = "";
        
        // A. Add Front Cover Page
        fullBookHtml += `
            <div class="print-cover">
                <img src="/assets/book_front_cover.jpg" alt="Front Cover">
                <h1>Blockchain & Career Opportunities</h1>
                <h2>A Student's Guide to Web3</h2>
                <div class="print-author">Kalyanjit Hatibaruah</div>
            </div>
        `;
        
        // B. Add all 10 chapters
        for (const chap of chapters) {
            const response = await fetch(`/chapters/${chap.file}`);
            if (!response.ok) throw new Error(`Failed to load ${chap.title}`);
            let markdown = await response.text();
            
            // Clean paths if needed, then parse markdown
            let chapHtml = marked.parse(markdown);
            
            fullBookHtml += `
                <div class="print-chapter">
                    ${chapHtml}
                </div>
            `;
        }
        
        // C. Add Back Cover Page
        fullBookHtml += `
            <div class="print-backcover">
                <h2>Blockchain & Career Opportunities</h2>
                <p>This guidebook bridges the gap between complex blockchain systems and real-world career pathways, specifically tailored for the next generation of IT students and software engineers.</p>
                <p>From the fundamentals of ledger security to writing Solidity contracts and preparing for developer roles, this book outlines a complete, practical roadmap to breaking into Web3.</p>
                <div class="print-author">Kalyanjit Hatibaruah</div>
                <div class="back-footer">First Edition &copy; 2026. All Rights Reserved.</div>
            </div>
        `;
        
        // D. Render into printBookWrapper
        printBookWrapper.innerHTML = fullBookHtml;
        
        // Wait for all cover & content images to fully load before opening print window
        const images = Array.from(printBookWrapper.querySelectorAll("img"));
        const loadPromises = images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Don't block print if an image fails to load
            });
        });
        
        await Promise.all(loadPromises);
        
        // E. Trigger browser print dialog
        window.print();
        
    } catch (error) {
        console.error("PDF generation error:", error);
        alert("Failed to compile the book as PDF. Please make sure the local server is fully active.");
    } finally {
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.innerHTML = originalText;
        printBookWrapper.innerHTML = ""; // Clear wrapper to save memory
    }
}
