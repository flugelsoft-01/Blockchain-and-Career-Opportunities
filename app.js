import { auth, provider, signInWithPopup, signOut } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";

let currentUser = null;

// 1. Chapter list definitions
const chapters = [
    { id: "cover", title: "Front Cover", isMeta: true },
    { id: "profile", title: "Author Profiles", isMeta: true },
    { id: "copyright", title: "Copyright & Disclaimer", isMeta: true },
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
    { id: "glossary", title: "Glossary of Terms", isMeta: true },
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
    routePage(); // history routing
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
        a.href = chap.id === "cover" ? "/" : (chap.id === "profile" ? "/profile" : (chap.id === "back" ? "/back" : `/chapter/${chap.id}`));
        a.addEventListener("click", (e) => {
            e.preventDefault();
            routeTo(chap.id);
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
    
    // Auth Gating: Only the Cover Page is public
    if (id !== "cover" && !currentUser) {
        activeChapter = chap;
        topNavTitleEl.textContent = chap.title;
        document.querySelectorAll("#chaptersList li").forEach(li => li.classList.remove("active"));
        const activeNav = document.getElementById(`nav-${chap.id}`);
        if (activeNav) activeNav.classList.add("active");
        
        bookContentEl.innerHTML = `
            <div class="auth-gate-container" style="text-align: center; padding: 80px 20px; max-width: 500px; margin: 0 auto;">
                <i class="fa-solid fa-lock" style="font-size: 60px; color: var(--accent-primary); margin-bottom: 24px;"></i>
                <h1 style="font-size: 28px; margin-bottom: 12px; color: var(--text-primary);">Premium Content Locked</h1>
                <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 30px;">
                    This chapter of the guidebook is available exclusively for registered IT students and readers. Sign in with your Google account to unlock full access.
                </p>
                <button class="gate-signin-btn" id="gateSignInBtn" style="display: flex; align-items: center; justify-content: center; gap: 10px; margin: 0 auto; background-color: var(--accent-primary); border: none; border-radius: 8px; padding: 14px 28px; color: #fff; font-family: var(--font-body); font-size: 15px; font-weight: 700; cursor: pointer; transition: background-color 0.2s;">
                    <i class="fa-brands fa-google"></i>
                    <span>Sign In with Google</span>
                </button>
            </div>
        `;
        
        document.getElementById("gateSignInBtn").addEventListener("click", async () => {
            try {
                const result = await signInWithPopup(auth, provider);
                if (result.user) {
                    loadChapter(id);
                }
            } catch (err) {
                console.error("Gated sign-in failed:", err);
            }
        });
        
        readerContainerEl.scrollTop = 0;
        updateProgressBar();
        return;
    }
    
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
                    <p style="font-size: 18px; margin-top: 30px; font-weight: 600; color: var(--text-secondary);">Kalyanjit Hatibaruah &amp; Pratibha Das Hatibaruah</p>
                </div>
            `;
        } else if (chap.id === "profile") {
            bookContentEl.innerHTML = `
                <div class="web-profile-view" style="max-width: 850px; margin: 0 auto; padding-bottom: 30px;">
                    <h1 style="font-size: 32px; margin-bottom: 30px; text-align: center;">About the Authors</h1>
                    
                    <div class="profiles-container" style="display: flex; flex-direction: column; gap: 40px; margin-top: 20px;">
                        
                        <!-- Kalyanjit Hatibaruah Profile Card -->
                        <div class="profile-card-horizontal" style="display: flex; gap: 30px; background: var(--bg-card); padding: 30px; border-radius: 12px; border: 1px solid var(--border-color); align-items: flex-start; flex-wrap: wrap;">
                            <div style="flex: 0 0 200px; text-align: center; margin: 0 auto;">
                                <img src="/assets/kalyanjit.jpg" alt="Kalyanjit Hatibaruah Portrait" style="width: 180px; height: 180px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                            </div>
                            <div style="flex: 1; min-width: 280px;">
                                <h2 style="font-size: 24px; margin-top: 0; color: var(--accent-primary); border: none; padding-bottom: 8px;">Kalyanjit Hatibaruah</h2>
                                <p style="font-size: 14.5px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px;">
                                    <strong>Kalyanjit Hatibaruah</strong> is a globally recognized technology strategist, entrepreneur, author, and keynote speaker with over <strong>30 years of experience</strong> at the intersection of technology, business, and innovation. As the <strong>Chairman of Flugelsoft Group</strong>, he advises enterprises, startups, educational institutions, and governments on Artificial Intelligence, Blockchain, Web3, Quantum Computing, Digital Governance, and Digital Transformation.
                                </p>
                                <p style="font-size: 14.5px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px;">
                                    An Electronics & Communication Engineer from <strong>NIT Kurukshetra</strong> with an MBA from <strong>Pune University</strong>, Kalyanjit has built multidisciplinary expertise spanning enterprise software, distributed systems, AI/ML, blockchain, tokenization, and emerging technologies. He is widely recognized for helping organizations translate cutting-edge technologies into practical business and governance solutions.
                                </p>
                                <p style="font-size: 14.5px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px;">
                                    A sought-after international speaker, he has delivered keynote addresses, workshops, and panel discussions at universities, industry forums, and global conferences on AI, Web3, Blockchain, entrepreneurship, startup ecosystems, and digital public infrastructure. He also mentors startups through leading incubators, including T-Hub, Nirmaan (IIT Madras), IIMK LIVE, STPI, India Accelerator, and several international innovation programs.
                                </p>
                                <p style="font-size: 14.5px; line-height: 1.6; color: var(--text-secondary);">
                                    Kalyanjit is the co-author of books on <strong>Blockchain, Artificial Intelligence, and the Metaverse</strong> and is passionate about democratizing knowledge of emerging technologies. Through his writing, consulting, mentoring, and public speaking, he continues to inspire innovators, policymakers, business leaders, and students to harness technology for sustainable growth and societal impact.
                                </p>
                                <a href="https://www.linkedin.com/in/kalyanjit" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; margin-top: 15px; background: #0077b5; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13.5px; font-weight: 600; transition: background 0.2s;">
                                    <i class="fa-brands fa-linkedin"></i> Connect on LinkedIn
                                </a>
                            </div>
                        </div>

                        <!-- Pratibha Das Hatibaruah Profile Card -->
                        <div class="profile-card-horizontal" style="display: flex; gap: 30px; background: var(--bg-card); padding: 30px; border-radius: 12px; border: 1px solid var(--border-color); align-items: flex-start; flex-wrap: wrap;">
                            <div style="flex: 0 0 200px; text-align: center; margin: 0 auto;">
                                <img src="/assets/pratibha.jpg" alt="Pratibha Das Hatibaruah Portrait" style="width: 180px; height: 180px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                            </div>
                            <div style="flex: 1; min-width: 280px;">
                                <h2 style="font-size: 24px; margin-top: 0; color: var(--accent-primary); border: none; padding-bottom: 8px;">Pratibha Das Hatibaruah</h2>
                                <p style="font-size: 14.5px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px;">
                                    <strong>Pratibha Das Hatibaruah</strong> is a technology entrepreneur, author, educator, and public speaker specializing in Blockchain, Web3, Artificial Intelligence, and other emerging technologies. She is the Founder and Director of Flugelsoft, a technology company focused on digital innovation, technology consulting, and professional education.
                                </p>
                                <p style="font-size: 14.5px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px;">
                                    Before embarking on her entrepreneurial journey, Pratibha built a successful career with leading technology companies, including <strong>Infosys</strong>, where she worked on enterprise technology solutions. She also gained extensive expertise as a Network Engineer, earning industry-recognized certifications such as <strong>Microsoft Certified Systems Engineer (MCSE)</strong> and <strong>Cisco Certified Network Associate (CCNA)</strong>.
                                </p>
                                <p style="font-size: 14.5px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px;">
                                    Pratibha is the co-author of this book. She has also co-authored books on <strong>Artificial Intelligence</strong> and the <strong>Metaverse</strong>, reflecting her commitment to making emerging technologies accessible to a wider audience.
                                </p>
                                <p style="font-size: 14.5px; line-height: 1.6; color: var(--text-secondary);">
                                    A sought-after speaker and mentor, Pratibha regularly conducts workshops, corporate training programs, and university sessions on Blockchain, AI, Web3, digital transformation, and entrepreneurship. Her ability to translate complex technologies into practical business insights has established her as a respected voice in the emerging technology ecosystem.
                                </p>
                                <a href="https://www.linkedin.com/in/web3pratibha" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; margin-top: 15px; background: #0077b5; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13.5px; font-weight: 600; transition: background 0.2s;">
                                    <i class="fa-brands fa-linkedin"></i> Connect on LinkedIn
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            `;
        } else if (chap.id === "copyright") {
            bookContentEl.innerHTML = `
                <div class="web-copyright-view" style="max-width: 650px; margin: 0 auto; padding: 30px 20px; line-height: 1.8; color: var(--text-secondary);">
                    <h1 style="font-size: 32px; margin-bottom: 24px; text-align: center; color: var(--text-primary);">Copyright &amp; Disclaimer</h1>
                    
                    <p style="font-weight: 600; color: var(--text-primary); text-align: center; margin-bottom: 24px; font-size: 16px;">
                        Blockchain &amp; Career Opportunities: A Student's Guide to Web3
                    </p>
                    
                    <p>
                        <strong>Copyright &copy; 2026 by Flugelsoft Lab.</strong> All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.
                    </p>
                    
                    <p style="margin-top: 20px;">
                        <strong>Publisher:</strong> Flugelsoft Lab Publishing Division<br>
                        <strong>First Edition:</strong> 2026<br>
                        <strong>ISBN:</strong> [Registration Pending]
                    </p>
                    
                    <hr style="border: none; height: 1px; background-color: var(--border-color); margin: 30px 0;">
                    
                    <h3 style="color: var(--text-primary); font-size: 18px; margin-bottom: 10px;">Disclaimer</h3>
                    <p style="font-size: 14px; line-height: 1.6;">
                        The information provided in this guidebook is for educational and informational purposes only. Blockchain technologies, smart contracts, and cryptocurrencies involve significant financial and technical risks. The authors and Flugelsoft Lab do not warrant that the smart contracts or code examples provided in this book are secure or free from vulnerabilities. Nothing in this book constitutes investment, financial, tax, or legal advice. Readers are advised to conduct their own research and exercise caution when deploying code or committing capital to Web3 platforms.
                    </p>
                </div>
            `;
        } else if (chap.id === "glossary") {
            bookContentEl.innerHTML = `
                <div class="web-glossary-view" style="max-width: 800px; margin: 0 auto; padding-bottom: 30px;">
                    <h1 style="font-size: 32px; margin-bottom: 24px; text-align: center; color: var(--text-primary);">Glossary of Terms</h1>
                    <p style="text-align: center; color: var(--text-secondary); margin-bottom: 30px; font-size: 15px;">Key concepts and terminology to help students navigate the Web3 landscape.</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 20px;">
                        <div style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <strong style="color: var(--accent-primary); font-size: 16px; display: block; margin-bottom: 6px;">Blockchain</strong>
                            <p style="font-size: 14.5px; color: var(--text-secondary); margin: 0; line-height: 1.6;">
                                A decentralized, distributed digital ledger that records transactions across many computers chronologically and immutably, secured by cryptographic hashing.
                            </p>
                        </div>
                        <div style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <strong style="color: var(--accent-primary); font-size: 16px; display: block; margin-bottom: 6px;">Smart Contract</strong>
                            <p style="font-size: 14.5px; color: var(--text-secondary); margin: 0; line-height: 1.6;">
                                Self-executing digital contracts with terms of agreement written directly into lines of code, residing and running autonomously on a blockchain network.
                            </p>
                        </div>
                        <div style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <strong style="color: var(--accent-primary); font-size: 16px; display: block; margin-bottom: 6px;">Consensus Mechanism</strong>
                            <p style="font-size: 14.5px; color: var(--text-secondary); margin: 0; line-height: 1.6;">
                                A protocol (e.g., Proof of Work, Proof of Stake) that allows distributed computer nodes on a blockchain network to agree on the valid state of the ledger.
                            </p>
                        </div>
                        <div style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <strong style="color: var(--accent-primary); font-size: 16px; display: block; margin-bottom: 6px;">Gas Fee</strong>
                            <p style="font-size: 14.5px; color: var(--text-secondary); margin: 0; line-height: 1.6;">
                                Transaction execution fees paid by users to blockchain validators or miners to cover the computing power required to process transactions and run smart contracts.
                            </p>
                        </div>
                        <div style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <strong style="color: var(--accent-primary); font-size: 16px; display: block; margin-bottom: 6px;">dApp (Decentralized Application)</strong>
                            <p style="font-size: 14.5px; color: var(--text-secondary); margin: 0; line-height: 1.6;">
                                Software applications that run on a peer-to-peer network or blockchain, combining a traditional frontend interface with decentralized smart contracts.
                            </p>
                        </div>
                        <div style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <strong style="color: var(--accent-primary); font-size: 16px; display: block; margin-bottom: 6px;">ERC-20 Standard</strong>
                            <p style="font-size: 14.5px; color: var(--text-secondary); margin: 0; line-height: 1.6;">
                                The technical standard for creating fungible tokens on the Ethereum blockchain, establishing a common set of API rules for token transfers and storage.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        } else if (chap.id === "back") {
            bookContentEl.innerHTML = `
                <div class="web-cover-view" style="text-align: center; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
                    <h1 style="font-size: 32px; margin-bottom: 24px;">Blockchain & Career Opportunities</h1>
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: var(--text-secondary);">This guidebook bridges the gap between complex blockchain systems and real-world career pathways, specifically tailored for the next generation of IT students and software engineers.</p>
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 32px; color: var(--text-secondary);">From the fundamentals of ledger security to writing Solidity contracts and preparing for developer roles, this book outlines a complete, practical roadmap to breaking into Web3.</p>
                    <p style="font-size: 18px; font-weight: 600; color: var(--text-primary);">Kalyanjit Hatibaruah &amp; Pratibha Das Hatibaruah</p>
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

    // Auth Listeners
    document.getElementById("signInBtn").addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Sign in error:", err);
        }
    });

    document.getElementById("signOutBtn").addEventListener("click", async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Sign out error:", err);
        }
    });

    // History Popstate Navigation
    window.addEventListener("popstate", routePage);
}

// 10.5 HTML5 History SPA Routing
function routeTo(id) {
    let path = "/";
    if (id === "profile") path = "/profile";
    else if (id === "back") path = "/back";
    else if (id !== "cover") path = `/chapter/${id}`;
    
    history.pushState({}, "", path);
    loadChapter(id);
}

function routePage() {
    const path = window.location.pathname;
    let id = "cover";
    if (path === "/profile") {
        id = "profile";
    } else if (path === "/back") {
        id = "back";
    } else if (path.startsWith("/chapter/")) {
        id = path.replace("/chapter/", "");
    }
    loadChapter(id);
}

// 10.6 Firebase Authentication State Observer
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const signInBtn = document.getElementById("signInBtn");
    const userInfoContainer = document.getElementById("userInfoContainer");
    const userName = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");
    
    if (user) {
        signInBtn.style.display = "none";
        userInfoContainer.style.display = "flex";
        userName.textContent = user.displayName || "Registered Reader";
        userAvatar.src = user.photoURL || "https://lh3.googleusercontent.com/a/default-user=s80";
        
        // If current page was locked, trigger reload to render content
        const path = window.location.pathname;
        let id = "cover";
        if (path === "/profile") id = "profile";
        else if (path === "/back") id = "back";
        else if (path.startsWith("/chapter/")) id = path.replace("/chapter/", "");
        
        // Reload page if it's currently showing locked gate screen
        if (id !== "cover" && bookContentEl.querySelector(".auth-gate-container")) {
            loadChapter(id);
        }
    } else {
        signInBtn.style.display = "flex";
        userInfoContainer.style.display = "none";
        
        // Redirect to cover if user logged out while on protected content
        const path = window.location.pathname;
        if (path !== "/" && path !== "/cover") {
            routeTo("cover");
        }
    }
});

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
                <div class="print-author">Kalyanjit Hatibaruah &amp; Pratibha Das Hatibaruah</div>
            </div>
        `;
        
        // A2. Add Author Profiles Page
        fullBookHtml += `
            <div class="print-chapter" style="page-break-after: always; text-align: center;">
                <h1 style="font-size: 32px; margin-bottom: 24px; color: #000 !important;">About the Authors</h1>
                
                <!-- Kalyanjit Hatibaruah Profile Card -->
                <div style="display: flex; gap: 20px; text-align: left; margin-bottom: 30px; page-break-inside: avoid;">
                    <div style="flex: 0 0 150px; text-align: center;">
                        <img src="/assets/kalyanjit.jpg" alt="Kalyanjit Hatibaruah Portrait" style="width: 130px; height: 130px; object-fit: cover; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    </div>
                    <div style="flex: 1;">
                        <h2 style="font-size: 18px; color: #6366f1 !important; border: none !important; margin-top: 0 !important; padding-bottom: 4px;">Kalyanjit Hatibaruah</h2>
                        <p style="font-size: 13px; line-height: 1.5; color: #333 !important; margin-bottom: 8px;">
                            <strong>Kalyanjit Hatibaruah</strong> is a globally recognized technology strategist, entrepreneur, author, and keynote speaker with over 30 years of experience at the intersection of technology, business, and innovation. As the Chairman of Flugelsoft Group, he advises enterprises, startups, educational institutions, and governments on AI, Blockchain, Web3, and Digital Transformation.
                        </p>
                        <p style="font-size: 13px; line-height: 1.5; color: #333 !important; margin-bottom: 8px;">
                            An Electronics & Communication Engineer from NIT Kurukshetra with an MBA from Pune University, Kalyanjit has built multidisciplinary expertise spanning enterprise software, distributed systems, blockchain, tokenization, and emerging technologies.
                        </p>
                        <p style="font-size: 13px; line-height: 1.5; color: #333 !important;">
                            He is a co-author of books on Blockchain, AI, and the Metaverse. He mentors startups through leading incubators including T-Hub, IIT Madras (Nirmaan), IIMK LIVE, and STPI, and continues to inspire innovators globally.
                        </p>
                        <div style="font-size: 12px; color: #0077b5; font-weight: 600; margin-top: 8px;">
                            LinkedIn: linkedin.com/in/kalyanjit
                        </div>
                    </div>
                </div>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

                <!-- Pratibha Das Hatibaruah Profile Card -->
                <div style="display: flex; gap: 20px; text-align: left; page-break-inside: avoid;">
                    <div style="flex: 0 0 150px; text-align: center;">
                        <img src="/assets/pratibha.jpg" alt="Pratibha Das Hatibaruah Portrait" style="width: 130px; height: 130px; object-fit: cover; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    </div>
                    <div style="flex: 1;">
                        <h2 style="font-size: 18px; color: #6366f1 !important; border: none !important; margin-top: 0 !important; padding-bottom: 4px;">Pratibha Das Hatibaruah</h2>
                        <p style="font-size: 13px; line-height: 1.5; color: #333 !important; margin-bottom: 8px;">
                            <strong>Pratibha Das Hatibaruah</strong> is a technology entrepreneur, author, educator, and public speaker specializing in Blockchain, Web3, AI, and emerging tech. She is the Founder and Director of Flugelsoft, a digital innovation and professional education company.
                        </p>
                        <p style="font-size: 13px; line-height: 1.5; color: #333 !important; margin-bottom: 8px;">
                            Before Flugelsoft, she worked with leading tech companies like <strong>Infosys</strong> and gained extensive expertise as a Network Engineer holding certifications like MCSE and CCNA.
                        </p>
                        <p style="font-size: 13px; line-height: 1.5; color: #333 !important;">
                            Pratibha is the co-author of books on Blockchain, AI, and the Metaverse, and is a regular speaker/mentor conducting university and corporate training sessions.
                        </p>
                        <div style="font-size: 12px; color: #0077b5; font-weight: 600; margin-top: 8px;">
                            LinkedIn: linkedin.com/in/web3pratibha
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // A3. Add Copyright & Disclaimer Page (Print Mode)
        fullBookHtml += `
            <div class="print-chapter" style="page-break-after: always; padding: 40px; color: #000 !important; line-height: 1.6;">
                <h1 style="font-size: 26px; text-align: center; margin-bottom: 24px; color: #000 !important; font-weight: 700; border-bottom: none !important;">Copyright &amp; Disclaimer</h1>
                
                <p style="font-weight: 600; text-align: center; margin-bottom: 24px; color: #000 !important; font-size: 14px;">
                    Blockchain &amp; Career Opportunities: A Student's Guide to Web3
                </p>
                
                <p style="font-size: 12.5px; color: #333 !important; text-align: justify; margin-bottom: 16px;">
                    <strong>Copyright &copy; 2026 by Flugelsoft Lab.</strong> All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.
                </p>
                
                <p style="font-size: 12.5px; color: #333 !important; margin-bottom: 30px;">
                    <strong>Publisher:</strong> Flugelsoft Lab Publishing Division<br>
                    <strong>First Edition:</strong> 2026<br>
                    <strong>ISBN:</strong> [Registration Pending]
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <h3 style="font-size: 14px; margin-bottom: 8px; color: #000 !important; font-weight: 700;">Disclaimer</h3>
                <p style="font-size: 11px; line-height: 1.5; color: #444 !important; text-align: justify;">
                    The information provided in this guidebook is for educational and informational purposes only. Blockchain technologies, smart contracts, and cryptocurrencies involve significant financial and technical risks. The authors and Flugelsoft Lab do not warrant that the smart contracts or code examples provided in this book are secure or free from vulnerabilities. Nothing in this book constitutes investment, financial, tax, or legal advice. Readers are advised to conduct their own research and exercise caution when deploying code or committing capital to Web3 platforms.
                </p>
            </div>
        `;
        
        for (const chap of chapters) {
            if (chap.isMeta) continue;
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
        
        // B2. Add Glossary of Terms Page (Print Mode)
        fullBookHtml += `
            <div class="print-chapter" style="page-break-after: always; padding: 40px; color: #000 !important; line-height: 1.6;">
                <h1 style="font-size: 26px; text-align: center; margin-bottom: 20px; color: #000 !important; font-weight: 700; border-bottom: none !important;">Glossary of Terms</h1>
                <p style="text-align: center; font-size: 13px; color: #444 !important; margin-bottom: 24px;">Key concepts and terminology to help students navigate the Web3 landscape.</p>
                
                <div style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
                    <div style="page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <strong style="color: #6366f1 !important; font-size: 14px;">Blockchain</strong>
                        <p style="font-size: 12.5px; color: #333 !important; margin: 4px 0 0 0;">
                            A decentralized, distributed digital ledger that records transactions across many computers chronologically and immutably, secured by cryptographic hashing.
                        </p>
                    </div>
                    <div style="page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <strong style="color: #6366f1 !important; font-size: 14px;">Smart Contract</strong>
                        <p style="font-size: 12.5px; color: #333 !important; margin: 4px 0 0 0;">
                            Self-executing digital contracts with terms of agreement written directly into code, running autonomously on a blockchain network.
                        </p>
                    </div>
                    <div style="page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <strong style="color: #6366f1 !important; font-size: 14px;">Consensus Mechanism</strong>
                        <p style="font-size: 12.5px; color: #333 !important; margin: 4px 0 0 0;">
                            A protocol (e.g., Proof of Work, Proof of Stake) that allows distributed computer nodes on a network to agree on the valid state of the ledger.
                        </p>
                    </div>
                    <div style="page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <strong style="color: #6366f1 !important; font-size: 14px;">Gas Fee</strong>
                        <p style="font-size: 12.5px; color: #333 !important; margin: 4px 0 0 0;">
                            Transaction execution fees paid by users to blockchain validators to cover the computing power required to process transactions and run contracts.
                        </p>
                    </div>
                    <div style="page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <strong style="color: #6366f1 !important; font-size: 14px;">dApp (Decentralized Application)</strong>
                        <p style="font-size: 12.5px; color: #333 !important; margin: 4px 0 0 0;">
                            Software applications that run on a peer-to-peer network or blockchain, combining a traditional frontend interface with decentralized smart contracts.
                        </p>
                    </div>
                    <div style="page-break-inside: avoid; padding-bottom: 5px;">
                        <strong style="color: #6366f1 !important; font-size: 14px;">ERC-20 Standard</strong>
                        <p style="font-size: 12.5px; color: #333 !important; margin: 4px 0 0 0;">
                            The technical standard for creating fungible tokens on Ethereum, establishing a common set of API rules for token transfers and storage.
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // C. Add Back Cover Page
        fullBookHtml += `
            <div class="print-backcover">
                <h2>Blockchain & Career Opportunities</h2>
                <p>This guidebook bridges the gap between complex blockchain systems and real-world career pathways, specifically tailored for the next generation of IT students and software engineers.</p>
                <p>From the fundamentals of ledger security to writing Solidity contracts and preparing for developer roles, this book outlines a complete, practical roadmap to breaking into Web3.</p>
                <div class="print-author">Kalyanjit Hatibaruah &amp; Pratibha Das Hatibaruah</div>
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
