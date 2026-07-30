// =============================================
// GLOBAL VARIABLES AND INITIALIZATION
// =============================================

// Google Sheet ID
const SHEET_ID = '1FUpqRyVWcQZGK8bPuXEd12f-4xU7h6M9VUHlG4rMlnw';
// API Base URL
const API_BASE = 'https://opensheet.elk.sh';

// Student data management
let studentData = {}; // Store all student data
let studentNames12th = []; // Will be populated after loading

// Store data
let teacherData = {};
let holidayData = [];
let testData = [];
let pptData = [];
let resourcesData = [];
let mathsMarksData = [];
let notebookData = [];
let projectsData = [];
let testMarksData = [];
let applicationsData = [];
let todayAssembly = null; // Store today's assembly info
let noticeData = []; // Store notice data from index1 sheet
let quickActionsData = []; // Store quick actions data from index1 sheet
let allBirthdaysData = []; // Store birthday data
let class12thBirthdays = []; // Store only 12th class birthdays

// DOM Elements
const teacherNameEl = document.getElementById('teacherName');
const teacherDobCountdownEl = document.getElementById('teacherDobCountdown');
const popupOverlay = document.getElementById('popupOverlay');
const popupContainer = document.getElementById('popupContainer');
const popupTitle = document.getElementById('popupTitle');
const popupContent = document.getElementById('popupContent');
const holidayPopup = document.getElementById('holidayPopup');
const holidayNameEl = document.getElementById('holidayName');
const holidayDateEl = document.getElementById('holidayDate');
const assemblyBanner = document.getElementById('assemblyBanner');
const assemblyBannerLink = document.getElementById('assemblyBannerLink');
const assemblyHouseName = document.getElementById('assemblyHouseName');
const bannerTimer = document.getElementById('bannerTimer');
const themeCss = document.getElementById('theme-css');
const noAssemblyPopup = document.getElementById('noAssemblyPopup');
const noAssemblyText = document.getElementById('noAssemblyText');
const noticePopup = document.getElementById('noticePopup');
const noticeContent = document.getElementById('noticeContent');
const noticeDate = document.getElementById('noticeDate');
const logoPopupNotice = document.getElementById('logoPopupNotice');
const logoPopupDate = document.getElementById('logoPopupDate');
const birthdaySection = document.getElementById('birthday-section');
const birthdayList = document.getElementById('birthday-list');
const themeSelectorPopup = document.getElementById('themeSelectorPopup');

// =============================================
// HELPER FUNCTIONS
// =============================================

// Function to load student data from JSON
function loadStudentData() {
    return new Promise((resolve, reject) => {
        console.log('Loading student data...');
        
        // Check if STUDENT_DATA already exists (loaded via script tag)
        if (window.STUDENT_DATA && window.STUDENT_DATA.STUDENT_DATA) {
            console.log('Student data found in window.STUDENT_DATA');
            studentData = window.STUDENT_DATA.STUDENT_DATA;
            
            // Extract 12th class student names
            const classKeys = Object.keys(studentData);
            console.log('Available class keys:', classKeys);
            
            // Find 12th class key (handles various formats)
            const twelfthClassKey = classKeys.find(key => {
                const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                return normalizedKey === '12th' || normalizedKey === '12th' || normalizedKey.includes('12th');
            });
            
            if (twelfthClassKey) {
                console.log(`Found 12th class with key: "${twelfthClassKey}"`);
                studentNames12th = studentData[twelfthClassKey]
                    .filter(student => student && student.name)
                    .map(student => student.name.trim());
                console.log(`Loaded ${studentNames12th.length} students for Class 12th:`, studentNames12th);
            } else {
                console.error('12th class data not found in STUDENT_DATA');
                // Try any key that might be 12th
                for (const key of classKeys) {
                    if (key.toLowerCase().includes('12th')) {
                        studentNames12th = studentData[key]
                            .filter(student => student && student.name)
                            .map(student => student.name.trim());
                        console.log(`Loaded ${studentNames12th.length} students using key: "${key}"`);
                        break;
                    }
                }
            }
            
            if (studentNames12th.length === 0) {
                console.warn('No student names found for Class 12th');
            }
            
            resolve();
        } else {
            console.log('Fetching student data from JSON file...');
            // Try to fetch JSON directly
            fetch('json/class.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.STUDENT_DATA) {
                        throw new Error('STUDENT_DATA not found in JSON');
                    }
                    
                    studentData = data.STUDENT_DATA;
                    console.log('Student data fetched successfully');
                    
                    // Extract 12th class student names
                    const classKeys = Object.keys(studentData);
                    console.log('Available class keys:', classKeys);
                    
                    // Find 12th class key
                    const twelfthClassKey = classKeys.find(key => {
                        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return normalizedKey === '12th' || normalizedKey === '12th' || normalizedKey.includes('12th');
                    });
                    
                    if (twelfthClassKey) {
                        console.log(`Found 12th class with key: "${twelfthClassKey}"`);
                        studentNames12th = studentData[twelfthClassKey]
                            .filter(student => student && student.name)
                            .map(student => student.name.trim());
                        console.log(`Loaded ${studentNames12th.length} students for Class 12th`);
                    } else {
                        console.error('12th class data not found in STUDENT_DATA');
                        // Fallback
                        const fallbackKey = classKeys.find(key => key.toLowerCase().includes('12th'));
                        if (fallbackKey) {
                            studentNames12th = studentData[fallbackKey]
                                .filter(student => student && student.name)
                                .map(student => student.name.trim());
                            console.log(`Loaded ${studentNames12th.length} students using fallback key: "${fallbackKey}"`);
                        }
                    }
                    
                    resolve();
                })
                .catch(error => {
                    console.error('Error loading student data:', error);
                    studentNames12th = []; // Empty array as fallback
                    reject(error);
                });
        }
    });
}

// Helper function to normalize class names for comparison
function normalizeClassName(className) {
    if (!className || typeof className !== 'string') return '';
    return className
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove special characters
        .trim();
}

// Helper function to check if class is 12th
function isClass12th(className) {
    if (!className) return false;
    const normalized = normalizeClassName(className);
    return normalized === '12th' || normalized === '12th' || normalized.includes('12th');
}

// =============================================
// THEME MANAGEMENT - MOVED TO BOTTOM
// =============================================

// Time-based theme switching
function applyTimeBasedTheme() {
    const now = new Date();
    const hour = now.getHours();
    
    // Check if there's no assembly today
    if (!todayAssembly) {
        if (hour >= 6 && hour < 18) {
            // Day time (6 AM to 6 PM) - Light theme
            switchTheme('light.css');
        } else {
            // Night time (6 PM to 6 AM) - Dark theme
            switchTheme('class.css');
        }
    }
}

// Theme toggle functions
function toggleThemeSelector() {
    themeSelectorPopup.classList.toggle('show');
}

function switchTheme(cssFile) {
    themeCss.href = 'css/' + cssFile;
    localStorage.setItem('selectedTheme', cssFile);
    themeSelectorPopup.classList.remove('show');
    
    // Update active state in theme selector
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.classList.remove('active');
        if (option.onclick.toString().includes(cssFile)) {
            option.classList.add('active');
        }
    });
}

// Close theme selector when clicking outside
document.addEventListener('click', (event) => {
    const themeToggleBtn = document.querySelector('.theme-toggle-btn');
    if (!themeToggleBtn.contains(event.target) && !themeSelectorPopup.contains(event.target)) {
        themeSelectorPopup.classList.remove('show');
    }
});

// =============================================
// INITIALIZATION
// =============================================

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard initializing...');
    
    try {
        // Step 1: Load student data first (CRITICAL)
        await loadStudentData();
        console.log('Student data loaded successfully');
        
        // Step 2: Load saved theme or apply time-based theme
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme) {
            switchTheme(savedTheme);
        } else {
            applyTimeBasedTheme();
        }
        
        // Step 3: Check today's assembly
        checkTodaysAssembly();
        
        // Step 4: Fetch other data
        fetchTeacherData();
        fetchHolidayData();
        fetchTestData();
        fetchPPTData();
        fetchResourcesData();
        fetchMathsMarksData();
        fetchNotebookData();
        fetchProjectsData();
        fetchTestMarksData();
        loadQuickActions();
        fetchNoticeData();
        loadBirthdays();
        
        // Check SMPS data availability
        checkSMPSData();
        
        // Check data availability after a short delay
        setTimeout(() => {
            checkDataAvailability();
            checkPPTData();
            checkStudyMaterialData();
            checkEmptySections();
        }, 2000);
        
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        // Still try to load other components
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme) {
            switchTheme(savedTheme);
        } else {
            applyTimeBasedTheme();
        }
        
        checkTodaysAssembly();
        fetchTeacherData();
        fetchHolidayData();
        // Initialize with empty student data for fallback
        if (studentNames12th.length === 0) {
            console.warn('Using empty student names array as fallback');
        }
    }
});

// =============================================
// BIRTHDAY FUNCTIONS (FIXED)
// =============================================

async function loadBirthdays() {
    try {
        console.log('Loading birthdays...');
        
        // Ensure student data is loaded
        if (studentNames12th.length === 0) {
            console.warn('No student names loaded yet, trying to load...');
            try {
                await loadStudentData();
            } catch (e) {
                console.error('Failed to load student data for birthdays:', e);
            }
        }
        
        const res = await fetch('https://opensheet.elk.sh/1FUpqRyVWcQZGK8bPuXEd12f-4xU7h6M9VUHlG4rMlnw/Birthdays');
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (!data || data.length === 0) {
            console.warn('No birthday data found');
            birthdaySection.style.display = 'none';
            return;
        }
        
        allBirthdaysData = data;
        console.log(`Total birthdays loaded: ${allBirthdaysData.length}`);
        
        // Filter for 12th class only using the helper function
        class12thBirthdays = data.filter(row => {
            if (!row || !row.class) return false;
            return isClass12th(row.class);
        });
        
        console.log(`Class 12th birthdays found: ${class12thBirthdays.length}`);
        
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDate = today.getDate();
        const todayList = [];

        class12thBirthdays.forEach(row => {
            if (!row.dob) return;
            
            let mm, dd;
            if (row.dob.includes('-')) {
                const parts = row.dob.split('-');
                if (parts.length >= 2) {
                    // Try to parse as MM-DD or DD-MM
                    const part1 = parseInt(parts[0]);
                    const part2 = parseInt(parts[1]);
                    
                    if (part1 > 0 && part1 <= 12 && part2 > 0 && part2 <= 31) {
                        // Likely MM-DD
                        mm = part1;
                        dd = part2;
                    } else if (part2 > 0 && part2 <= 12 && part1 > 0 && part1 <= 31) {
                        // Likely DD-MM
                        dd = part1;
                        mm = part2;
                    }
                }
            }

            if (!mm || !dd) return;
            
            if (dd === currentDate && mm === currentMonth) {
                const dob = new Date(today.getFullYear(), mm - 1, dd);
                const showDate = `${String(dd).padStart(2, '0')}-${dob.toLocaleString('default', { month: 'short' })}`;
                
                todayList.push({
                    admission: row.admission || '',
                    name: row.name || 'Unknown',
                    class: row.class || '',
                    father: row.father || 'N/A',
                    mother: row.mother || 'N/A',
                    showDate: showDate
                });
            }
        });

        // Show/hide birthday section based on today's birthdays
        if (todayList.length > 0) {
            console.log(`Found ${todayList.length} birthdays today`);
            let html = '';
            todayList.forEach(birthday => {
                const imageUrl = `images/${birthday.admission}.jpg`;
                
                html += `
                    <div class="birthday-card class-12th">
                        <div class="birthday-badge"><i class="fas fa-birthday-cake"></i></div>
                        <img src="${imageUrl}" alt="${birthday.name}" class="student-image" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2235%22 height=%2235%22 viewBox=%220 0 35 35%22%3E%3Ccircle cx=%2217.5%22 cy=%2217.5%22 r=%2217.5%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2217.5%22 y=%2220%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%228%22 fill=%22%23666%22%3EPhoto%3C/text%3E%3C/svg%3E'">
                        <div class="student-name">${birthday.name}</div>
                        <div class="student-class">Class 12th</div>
                        <div class="parent-info">
                            <div>${birthday.father}</div>
                            <div>${birthday.mother}</div>
                        </div>
                        <div class="birthday-date">${birthday.showDate}</div>
                    </div>
                `;
            });
            
            birthdayList.innerHTML = html;
            birthdaySection.style.display = 'block';
            
            // Add click event to birthday cards
            setTimeout(() => {
                addBirthdayCardClickEvent();
            }, 100);
        } else {
            console.log('No birthdays today');
            // Hide birthday section if no birthdays today
            birthdaySection.style.display = 'none';
        }
        
    } catch (error) {
        console.error("Error loading birthdays:", error);
        birthdaySection.style.display = 'none';
    }
}

function addBirthdayCardClickEvent() {
    const birthdayCards = document.querySelectorAll('.birthday-card');
    birthdayCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('a')) { // Don't trigger if clicking on a link
                showCurrentMonthBirthdays();
            }
        });
    });
}

function showCurrentMonthBirthdays() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    
    const monthBirthdays = class12thBirthdays.filter(row => {
        if (!row.dob) return false;
        
        let mm, dd;
        if (row.dob.includes('-')) {
            const parts = row.dob.split('-');
            if (parts.length >= 2) {
                const part1 = parseInt(parts[0]);
                const part2 = parseInt(parts[1]);
                
                if (part1 > 0 && part1 <= 12 && part2 > 0 && part2 <= 31) {
                    mm = part1;
                } else if (part2 > 0 && part2 <= 12 && part1 > 0 && part1 <= 31) {
                    mm = part2;
                }
            }
        }
        
        return mm === currentMonth;
    });
    
    document.getElementById('total-month-birthdays').textContent = 
        `${monthBirthdays.length} Birthdays`;
    
    let birthdaysHTML = '';
    
    if (monthBirthdays.length > 0) {
        monthBirthdays.forEach(birthday => {
            const imageUrl = `images/${birthday.admission || ''}.jpg`;
            let showDate = 'Date unknown';
            
            if (birthday.dob) {
                const parts = birthday.dob.split('-');
                if (parts.length >= 2) {
                    const part1 = parseInt(parts[0]);
                    const part2 = parseInt(parts[1]);
                    let dd, mm;
                    
                    if (part1 > 0 && part1 <= 12 && part2 > 0 && part2 <= 31) {
                        mm = part1;
                        dd = part2;
                    } else if (part2 > 0 && part2 <= 12 && part1 > 0 && part1 <= 31) {
                        dd = part1;
                        mm = part2;
                    }
                    
                    if (dd && mm) {
                        const dob = new Date(today.getFullYear(), mm - 1, dd);
                        showDate = `${String(dd).padStart(2, '0')}-${dob.toLocaleString('default', { month: 'short' })}`;
                    }
                }
            }
            
            birthdaysHTML += `
                <div class="student-item class-12th">
                    <div class="student-item-header">
                        <img src="${imageUrl}" alt="${birthday.name}" class="student-item-image" 
                             onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22 viewBox=%220 0 50 50%22%3E%3Ccircle cx=%2225%22 cy=%2225%22 r=%2225%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2225%22 y=%2228%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2210%22 fill=%22%23666%22%3EPhoto%3C/text%3E%3C/svg%3E'">
                        <div>
                            <div class="student-item-name">${birthday.name || 'Unknown'}</div>
                            <div class="student-item-details">
                                <div>Class: ${birthday.class || 'N/A'}</div>
                                <div>Date: ${showDate}</div>
                                <div>Father: ${birthday.father || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                    <div class="student-item-class">${showDate}</div>
                </div>
            `;
        });
    } else {
        birthdaysHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--muted); grid-column: 1 / -1;">
                <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>No birthdays this month</h3>
                <p>No birthdays found for current month.</p>
            </div>
        `;
    }
    
    document.getElementById('month-birthdays-container').innerHTML = birthdaysHTML;
    openBirthdayPopup();
}

function openBirthdayPopup() {
    document.getElementById('birthday-popup').style.display = 'flex';
}

function closeBirthdayPopup() {
    document.getElementById('birthday-popup').style.display = 'none';
}

// =============================================
// NOTICE BOARD FUNCTIONS (FIXED)
// =============================================

const NOTICES_SHEET_URL = 'https://opensheet.elk.sh/1FUpqRyVWcQZGK8bPuXEd12f-4xU7h6M9VUHlG4rMlnw/Notices';
let allNotices = [];
let showingAll = false;
let currentMonthFilter = 'all';

function openNoticeBoard() {
    document.getElementById('notices-popup').style.display = 'block';
    loadNotices();
}

function closeNoticeBoard() {
    document.getElementById('notices-popup').style.display = 'none';
}

// Check if date is today
function isToday(dateString) {
    if (!dateString) return false;
    
    const today = new Date();
    const date = new Date(dateString);
    
    return date.toDateString() === today.toDateString();
}

// Get month from date string
function getMonthFromDate(dateString) {
    if (!dateString) return -1;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? -1 : date.getMonth();
}

// Filter notices by month AND Class (12th ya All)
function filterNotices(notices, month) {
    // First filter by month
    let filtered = month === 'all' ? notices : notices.filter(notice => 
        getMonthFromDate(notice.Date) === parseInt(month)
    );
    
    // Then filter by Class column (show only if Class is 'All' or 12th)
    filtered = filtered.filter(notice => {
        const noticeClass = notice.Class ? notice.Class.toString().trim() : '';
        return noticeClass.toLowerCase() === 'all' || isClass12th(noticeClass);
    });
    
    return filtered;
}

// Format date nicely
function formatNoticeDate(dateString) {
    if (!dateString) return 'Date not specified';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Load notices from Google Sheet
async function loadNotices() {
    try {
        console.log('Loading notices...');
        const response = await fetch(NOTICES_SHEET_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Total notices loaded: ${data.length}`);
        
        // Store all notices
        allNotices = data;
        
        // Update stats
        updateStats(data);
        
        // Display notices (sorted by date - newest first)
        displayNotices(data);
        
    } catch (error) {
        console.error('Error loading notices:', error);
        document.getElementById('notices-container').innerHTML = `
            <div style="text-align: center; padding: 1.5rem; color: var(--primary); grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 0.8rem;"></i>
                <h3>Failed to load notices</h3>
                <p>Please check your internet connection and try again.</p>
            </div>
        `;
    }
}

// Update statistics
function updateStats(notices) {
    const today = new Date().toDateString();
    let todayCount = 0;
    let fileCount = 0;
    let imageCount = 0;
    let class12thCount = 0;
    
    notices.forEach(notice => {
        if (isToday(notice.Date)) todayCount++;
        if (notice['File Link (Optional)']) fileCount++;
        if (notice['Image Link (Fixed)']) imageCount++;
        
        // Count notices for Class 12th
        const noticeClass = notice.Class ? notice.Class.toString().trim() : '';
        if (noticeClass.toLowerCase() === 'all' || isClass12th(noticeClass)) {
            class12thCount++;
        }
    });
    
    document.getElementById('total-notices').textContent = notices.length;
    document.getElementById('today-notices').textContent = todayCount;
    document.getElementById('file-notices').textContent = fileCount;
    document.getElementById('image-notices').textContent = imageCount;
}

// Display notices (sorted by date - newest first)
function displayNotices(notices) {
    const container = document.getElementById('notices-container');
    
    if (notices.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 1.5rem; color: var(--primary); grid-column: 1 / -1;">
                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.8rem;"></i>
                <h3>No notices available</h3>
                <p>Check back later for new announcements.</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sortedNotices = [...notices].sort((a, b) => {
        const dateA = new Date(a.Date || 0);
        const dateB = new Date(b.Date || 0);
        return dateB - dateA; // Newest first
    });
    
    // Apply filters
    const filteredNotices = filterNotices(sortedNotices, currentMonthFilter);
    console.log(`Filtered notices for display: ${filteredNotices.length}`);
    
    // Limit to 6 if not showing all
    const displayNotices = showingAll ? filteredNotices : filteredNotices.slice(0, 6);
    
    let html = '';
    
    displayNotices.forEach(notice => {
        const isTodayNotice = isToday(notice.Date);
        const noticeClass = notice.Class || 'All';
        
        html += `
            <div class="notice-card">
                <div class="notice-header">
                    <img src="images/smps_logo.jpg" alt="School Logo" class="notice-logo" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0MzYxZWUiLz4KPHBhdGggZD0iTTIwIDIyQzIyLjIwOTEgMjIgMjQgMjAuMjA5MSAyNCAxOEMyNCAxNS43OTA5IDIyMjA5MSAxNCAyMCAxNEMxNy43OTA5IDE0IDE2IDE1Ljc5MDkgMTYgMThDMTYgMjAuMjA5MSAxNy43OTA5IDIyIDIwIDIzWiIgZmlsbD0iI2Y4ZmFmYyIvPgo8L3N2Zz4K'">
                    <div>
                        <h3 class="notice-title">${notice.Title || 'Untitled Notice'}</h3>
                        <div class="notice-class-badge">
                            <i class="fas fa-graduation-cap"></i> ${noticeClass}
                        </div>
                    </div>
                </div>
                
                <div class="notice-date-row">
                    ${isTodayNotice ? `
                        <span class="today-badge">
                            <i class="fas fa-star"></i> Today
                        </span>
                    ` : ''}
                    <div class="notice-date">
                        <i class="fas fa-calendar"></i> ${formatNoticeDate(notice.Date)}
                    </div>
                </div>
                
                <div class="notice-content">
                    ${notice.Content || 'No content available.'}
                </div>
                
                ${notice.Notes ? `
                    <div class="notice-notes">
                        <strong><i class="fas fa-sticky-note"></i> Notes:</strong> ${notice.Notes}
                    </div>
                ` : ''}
                
                <div class="notice-actions">
                    ${notice['Image Link (Fixed)'] ? `
                        <a href="${notice['Image Link (Fixed)']}" target="_blank" class="notice-action image-action">
                            <i class="fas fa-image"></i> View Image
                        </a>
                    ` : ''}
                    
                    ${notice['File Link (Optional)'] ? `
                        <a href="${notice['File Link (Optional)']}" target="_blank" class="notice-action file-action">
                            <i class="fas fa-file-download"></i> Download File
                        </a>
                    ` : ''}
                </div>
                
                ${notice.Footer ? `
                    <div class="notice-footer">
                        ${notice.Footer}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    // Show message if no notices match the filter
    if (filteredNotices.length === 0) {
        html = `
            <div style="text-align: center; padding: 1.5rem; color: var(--primary); grid-column: 1 / -1;">
                <i class="fas fa-filter" style="font-size: 2rem; margin-bottom: 0.8rem;"></i>
                <h3>No notices for selected criteria</h3>
                <p>Try selecting a different month or check back later.</p>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Filter notices by month
function filterNoticesByMonth() {
    currentMonthFilter = document.getElementById('monthFilter').value;
    displayNotices(allNotices);
}

// Toggle between showing all and limited notices
function toggleShowAllNotices() {
    showingAll = !showingAll;
    const showAllBtn = document.getElementById('showAllBtn');
    showAllBtn.innerHTML = showingAll ? 
        '<i class="fas fa-eye-slash"></i> Show Less' : 
        '<i class="fas fa-eye"></i> Show All Notices';
    displayNotices(allNotices);
}

// Close popup when clicking outside
document.addEventListener('click', (event) => {
    const noticesPopup = document.getElementById('notices-popup');
    if (event.target === noticesPopup) {
        closeNoticeBoard();
    }
});

// Close with Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeNoticeBoard();
    }
});

// =============================================
// EXISTING FUNCTIONS (UPDATED WITH FIXES)
// =============================================

async function fetchNoticeData() {
    try {
        const response = await fetch('https://opensheet.elk.sh/1FUpqRyVWcQZGK8bPuXEd12f-4xU7h6M9VUHlG4rMlnw/index1');
        const data = await response.json();
        
        quickActionsData = data;
        
        const today = new Date();
        const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        
        const class12thNotices = data.filter(row => {
            const rowClass = row.Class ? row.Class.toString().trim() : '';
            const rowDate = row.Date ? new Date(row.Date) : null;
            
            if (!rowDate) return false;
            
            const rowDateFormatted = `${rowDate.getMonth() + 1}/${rowDate.getDate()}/${rowDate.getFullYear()}`;
            
            return isClass12th(rowClass) && rowDateFormatted === todayFormatted && row.Notices;
        });
        
        if (class12thNotices.length > 0) {
            const latestNotice = class12thNotices[0];
            
            if (logoPopupNotice && logoPopupDate) {
                const noticeDate = new Date(latestNotice.Date);
                const formattedDate = noticeDate.toLocaleDateString('en-GB', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                });
                
                logoPopupNotice.textContent = latestNotice.Notices;
                logoPopupDate.textContent = formattedDate;
            }
            
            showNoticePopup(latestNotice.Notices, latestNotice.Date);
        }
        
        noticeData = class12thNotices;
    } catch (error) {
        console.error('Error fetching notice data:', error);
    }
}

function showNoticePopup(content, dateString) {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-GB', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
    
    noticeContent.textContent = content;
    noticeDate.textContent = formattedDate;
    
    setTimeout(() => {
        noticePopup.classList.add('active');
    }, 3000);
}

function closeNoticePopup() {
    noticePopup.classList.remove('active');
}

function showLogoPopup(houseOrClassName, message, notice = null, noticeDate = null) {
    const logoPopup = document.getElementById('logoPopup');
    const logoPopupHouse = document.getElementById('logoPopupHouse');
    const logoPopupText = document.getElementById('logoPopupText');
    const logoPopupNotice = document.getElementById('logoPopupNotice');
    const logoPopupDateEl = document.getElementById('logoPopupDate');
    
    logoPopupHouse.textContent = houseOrClassName;
    logoPopupText.textContent = message || `Today's Assembly by ${houseOrClassName}`;
    
    if (notice && logoPopupNotice) {
        logoPopupNotice.textContent = notice;
        logoPopupNotice.style.display = 'block';
    } else {
        logoPopupNotice.style.display = 'none';
    }
    
    if (noticeDate && logoPopupDateEl) {
        const date = new Date(noticeDate);
        const formattedDate = date.toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        logoPopupDateEl.textContent = formattedDate;
        logoPopupDateEl.style.display = 'inline-block';
    } else {
        logoPopupDateEl.style.display = 'none';
    }
    
    document.body.classList.add('popup-active');
    logoPopup.classList.add('active');
    
    setTimeout(() => {
        logoPopup.classList.remove('active');
        setTimeout(() => {
            document.body.classList.remove('popup-active');
        }, 500);
    }, 2000);
}

function showNoAssemblyPopup() {
    document.body.classList.add('popup-active');
    noAssemblyPopup.classList.add('active');
    
    setTimeout(() => {
        noAssemblyPopup.classList.remove('active');
        setTimeout(() => {
            document.body.classList.remove('popup-active');
        }, 500);
    }, 2000);
}

async function checkTodaysAssembly() {
    try {
        const HOUSEWISE_URL = `https://opensheet.elk.sh/${SHEET_ID}/Housewise_Assembly`;
        const CLASSWISE_URL = `https://opensheet.elk.sh/${SHEET_ID}/Classwise_Assembly`;
        
        const [housewiseData, classwiseData] = await Promise.all([
            fetch(HOUSEWISE_URL).then(res => res.json()),
            fetch(CLASSWISE_URL).then(res => res.json())
        ]);
        
        const today = new Date();
        const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        
        let todaysHouseAssembly = housewiseData.find(row => row.Date === todayFormatted);
        
        if (todaysHouseAssembly) {
            todayAssembly = {
                type: 'house',
                house: todaysHouseAssembly['Select House'] || 'Unknown',
                date: todayFormatted
            };
            
            applyThemeBasedOnHouse(todayAssembly.house);
            showAssemblyBanner(todayAssembly.house);
            
            const todaysNotice = noticeData.length > 0 ? noticeData[0] : null;
            
            showLogoPopup(
                todayAssembly.house, 
                `Today's Assembly by ${todayAssembly.house} House`,
                todaysNotice ? todaysNotice.Notices : null,
                todaysNotice ? todaysNotice.Date : null
            );
            
        } else {
            let todaysClassAssembly = classwiseData.find(row => row['Date of Assembly'] === todayFormatted);
            
            if (todaysClassAssembly) {
                todayAssembly = {
                    type: 'class',
                    className: todaysClassAssembly['Class'] || 'Unknown',
                    date: todayFormatted
                };
                
                if (isClass12th(todayAssembly.className)) {
                    applyThemeBasedOnHouse('12th');
                    showAssemblyBanner('Class 12th');
                    
                    const todaysNotice = noticeData.length > 0 ? noticeData[0] : null;
                    
                    showLogoPopup(
                        'Class 12th', 
                        'Class 12th Assembly',
                        todaysNotice ? todaysNotice.Notices : null,
                        todaysNotice ? todaysNotice.Date : null
                    );
                } else {
                    applyDefaultTheme();
                    hideAssemblyBanner();
                    showNoAssemblyPopup();
                }
            } else {
                todayAssembly = null;
                applyTimeBasedTheme(); // Apply time-based theme when no assembly
                hideAssemblyBanner();
                
                if (noticeData.length > 0) {
                    const todaysNotice = noticeData[0];
                    showLogoPopup(
                        'Class 12th',
                        'No Assembly Today',
                        todaysNotice.Notices,
                        todaysNotice.Date
                    );
                } else {
                    showNoAssemblyPopup();
                }
            }
        }
        
    } catch (error) {
        console.error('Error checking today\'s assembly:', error);
        applyTimeBasedTheme(); // Apply time-based theme on error
        hideAssemblyBanner();
        showNoAssemblyPopup();
    }
}

function applyThemeBasedOnHouse(houseName) {
    document.body.classList.remove('theme-al-hamrah', 'theme-azhar', 'theme-nizamia', 'theme-qurtaba');
    
    const themeMap = {
        'Al-Hamrah': 'css/alhamrah.css',
        'Azhar': 'css/azhar.css',
        'Nizamia': 'css/nizamia.css',
        'Qurtaba': 'css/qurtaba.css',
        '12th': 'css/class.css'
    };
    
    let cssFile = themeMap[houseName];
    
    if (!cssFile) {
        const houseLower = houseName.toLowerCase();
        if (houseLower.includes('hamrah') || houseLower.includes('al-hamrah')) {
            cssFile = 'css/alhamrah.css';
        } else if (houseLower.includes('azhar')) {
            cssFile = 'css/azhar.css';
        } else if (houseLower.includes('nizamia')) {
            cssFile = 'css/nizamia.css';
        } else if (houseLower.includes('qurtaba')) {
            cssFile = 'css/qurtaba.css';
        } else if (isClass12th(houseName)) {
            cssFile = 'css/class.css';
        } else {
            cssFile = 'css/class.css';
        }
    }
    
    themeCss.href = cssFile;
    const themeClass = houseName.toLowerCase().replace(/\s+/g, '-');
    document.body.classList.add(`theme-${themeClass}`);
}

function applyDefaultTheme() {
    themeCss.href = 'css/class.css';
    document.body.className = '';
}

function startBannerTimer() {
    let secondsLeft = 10;
    const timerElement = document.getElementById('bannerTimer');
    
    const timerInterval = setInterval(() => {
        secondsLeft--;
        timerElement.textContent = `${secondsLeft}s`;
        
        if (secondsLeft <= 0) {
            clearInterval(timerInterval);
            hideAssemblyBanner();
        }
    }, 1000);
}

function showAssemblyBanner(houseOrClassName) {
    assemblyHouseName.textContent = houseOrClassName;
    
    const bannerColors = {
        'Al-Hamrah': 'linear-gradient(135deg, #b71c1c, #d32f2f, #f44336)',
        'Azhar': 'linear-gradient(135deg, #0d47a1, #1976d2, #2196f3)',
        'Nizamia': 'linear-gradient(135deg, #f57f17, #ff9800, #ffb74d)',
        'Qurtaba': 'linear-gradient(135deg, #1b5e20, #388e3c, #4caf50)',
        '12th': 'linear-gradient(135deg, #1565c0, #1976d2, #2196f3)'
    };
    
    let bannerColor = 'linear-gradient(135deg, #daa520, #b8860b, #8b4513)';
    
    for (const [key, value] of Object.entries(bannerColors)) {
        if (houseOrClassName.includes(key) || key.includes(houseOrClassName)) {
            bannerColor = value;
            break;
        }
    }
    
    assemblyBanner.style.background = bannerColor;
    assemblyBanner.style.display = 'flex';
    assemblyBannerLink.style.display = 'block';
    
    document.querySelector('.container').style.marginTop = '50px';
    startBannerTimer();
}

function hideAssemblyBanner() {
    assemblyBanner.style.display = 'none';
    assemblyBannerLink.style.display = 'none';
    document.querySelector('.container').style.marginTop = '0';
}

async function checkSMPSData() {
    try {
        const response = await fetch(`${API_BASE}/1V4lqO_jw9jk4Oy5FZ6LPlWcLfKEKqefeGoYF3Td2E2I/Details`);
        const data = await response.json();
        
        const class12thData = data.filter(row => {
            const rowValues = Object.values(row);
            const classValue = rowValues[1];
            const submitValue = rowValues[16];
            return classValue && isClass12th(classValue) && 
                   submitValue && submitValue.toString().toLowerCase().includes('submit');
        });
        
        if (class12thData.length === 0) {
            document.getElementById('smpsBtn').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking SMPS data:', error);
        document.getElementById('smpsBtn').style.display = 'none';
    }
}

function checkDataAvailability() {
    if (resourcesData.length === 0) {
        document.getElementById('resourcesBtn').style.display = 'none';
    }
    
    if (projectsData.length === 0) {
        document.getElementById('projectsBtn').style.display = 'none';
    }
    
    if (testMarksData.length === 0) {
        document.getElementById('testMarksBtn').style.display = 'none';
    }
    
    if (mathsMarksData.length === 0) {
        document.getElementById('mathsMarksBtn').style.display = 'none';
    }
    
    if (notebookData.length === 0) {
        document.getElementById('notebookBtn').style.display = 'none';
    }
    
    checkActivityData();
    checkEmptySections();
}

async function checkActivityData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/Activity`);
        const data = await response.json();
        
        const class12thActivities = data.filter(row => 
            isClass12th(row.Class) || isClass12th(row['Select Class'])
        );
        
        if (class12thActivities.length === 0) {
            document.getElementById('activityBtn').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking activity data:', error);
        document.getElementById('activityBtn').style.display = 'none';
    }
}

async function checkStudyMaterialData() {
    const studyMaterials = [
        { type: 'ncert', sheet: 'Books', buttonId: 'ncertBtn' },
        { type: 'notes', sheet: 'Notes', buttonId: 'notesBtn' },
        { type: 'rdSharma', sheet: 'RD_Sharma', buttonId: 'rdSharmaBtn' },
        { type: 'rdSharmaMCQ', sheet: 'Rd_MCQs', buttonId: 'rdSharmaMCQBtn' },
        { type: 'pyqs', sheet: 'PYQs', buttonId: 'pyqsBtn' }
    ];

    for (const material of studyMaterials) {
        try {
            const response = await fetch(`${API_BASE}/${SHEET_ID}/${material.sheet}`);
            const data = await response.json();
            
            let filteredData = [];
            filteredData = data.filter(row => isClass12th(row.Class));
            
            if (filteredData.length === 0) {
                document.getElementById(material.buttonId).style.display = 'none';
            }
            checkEmptySections();
        } catch (error) {
            console.error(`Error checking ${material.type} data:`, error);
            document.getElementById(material.buttonId).style.display = 'none';
        }
    }
}

async function checkPPTData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/PPT`);
        const data = await response.json();
        
        const class12thPPT = data.filter(row => isClass12th(row.Class));
        
        if (class12thPPT.length === 0) {
            document.getElementById('pptBtn').style.display = 'none';
            checkEmptySections();
        }
    } catch (error) {
        console.error('Error checking PPT data:', error);
        document.getElementById('pptBtn').style.display = 'none';
    }
}

async function fetchTeacherData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/Class Teacher`);
        const data = await response.json();
        
        const class12thTeacher = data.find(row => isClass12th(row.Class));
        if (class12thTeacher) {
            teacherData = {
                name: class12thTeacher["Teacher's name"],
                dob: class12thTeacher.dob
            };
            teacherNameEl.textContent = teacherData.name;
            updateDobCountdown();
        }
    } catch (error) {
        console.error('Error fetching teacher data:', error);
        teacherNameEl.textContent = 'Error loading data';
    }
}

function updateDobCountdown() {
    if (!teacherData.dob) return;
    const dobParts = teacherData.dob.split('/');
    const dobMonth = parseInt(dobParts[0]) - 1;
    const dobDay = parseInt(dobParts[1]);
    const dobYear = parseInt(dobParts[2]);
    
    const today = new Date();
    const currentYear = today.getFullYear();
    let nextBirthday = new Date(currentYear, dobMonth, dobDay);
    if (today > nextBirthday) {
        nextBirthday = new Date(currentYear + 1, dobMonth, dobDay);
    }
    
    const daysRemaining = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    teacherDobCountdownEl.textContent = `${daysRemaining} days until birthday`;
}

async function fetchHolidayData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/Holidays`);
        const data = await response.json();
        
        holidayData = data;
        checkForTodayHoliday();
    } catch (error) {
        console.error('Error fetching holiday data:', error);
    }
}

function checkForTodayHoliday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayHoliday = holidayData.find(holiday => {
        const holidayDate = new Date(holiday.Date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === today.getTime();
    });
    if (todayHoliday) {
        holidayNameEl.textContent = todayHoliday.Name;
        holidayDateEl.textContent = formatDate(new Date(todayHoliday.Date));
        
        holidayPopup.style.display = 'block';
        setTimeout(() => {
            holidayPopup.style.display = 'none';
        }, 5000);
    }
}

async function fetchTestData() {
    try {
        const [attendanceRes, marksRes] = await Promise.all([
            fetch(`${API_BASE}/${SHEET_ID}/12th_Test_Attend`),
            fetch(`${API_BASE}/${SHEET_ID}/12th_Test_Marks`)
        ]);
        const attendanceData = await attendanceRes.json();
        const marksData = await marksRes.json();
        
        testData = { attendance: attendanceData, marks: marksData };
    } catch (error) {
        console.error('Error fetching test data:', error);
    }
}

function checkEmptySections() {
    const sections = document.querySelectorAll(".section");

    sections.forEach(section => {
        const buttons = section.querySelectorAll(".dashboard-btn");

        let visible = 0;
        buttons.forEach(btn => {
            if (btn.style.display !== "none") visible++;
        });

        if (visible === 0) {
            section.style.display = "none";
        }
    });
}

async function fetchPPTData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/PPT`);
        const data = await response.json();
        pptData = data;
    } catch (error) {
        console.error('Error fetching PPT data:', error);
    }
}

async function fetchResourcesData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/Files`);
        const data = await response.json();
        resourcesData = data.filter(row => isClass12th(row['Select Class']));
    } catch (error) {
        console.error('Error fetching resources data:', error);
    }
}

async function fetchMathsMarksData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/Maths_Marks`);
        const data = await response.json();
        mathsMarksData = data.filter(row => isClass12th(row.Class));
    } catch (error) {
        console.error('Error fetching maths marks data:', error);
    }
}

async function fetchNotebookData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/Work`);
        const data = await response.json();
        notebookData = data.filter(row => isClass12th(row.Class));
    } catch (error) {
        console.error('Error fetching notebook data:', error);
    }
}

async function fetchProjectsData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/Others`);
        const data = await response.json();
        projectsData = data.filter(row => 
            isClass12th(row.Class) || isClass12th(row['Select Class'])
        );
    } catch (error) {
        console.error('Error fetching projects data:', error);
    }
}

async function fetchTestMarksData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/Marks`);
        const data = await response.json();
        
        testMarksData = data.filter(row => 
            isClass12th(row['Select Class'])
        ).map(row => {
            const testType = row['Type'] || '';
            const subject = row['Subject'] || '';
            
            let maxMarks = 0;
            if (testType === 'Periodic Test' || testType === 'Test out of 20') {
                maxMarks = 20;
            } else if (testType === 'Test out of 10' || testType === 'Oral') {
                maxMarks = 10;
            } else if (testType === 'Test out of 80' || testType === 'Summative Assessment') {
                maxMarks = 80;
            } else if (testType === 'Preboard') {
                if (['Physics', 'Chemistry', 'Biology', 'Physical Education'].includes(subject)) {
                    maxMarks = 70;
                } else {
                    maxMarks = 80;
                }
            }
            
            return {
                ...row,
                maxMarks: maxMarks,
                calculatedPercentage: maxMarks > 0 ? true : false
            };
        });
    } catch (error) {
        console.error('Error fetching All Subject Marks data:', error);
    }
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// =============================================
// STUDY MATERIAL FUNCTIONS (UPDATED - Entire Row Clickable)
// =============================================

async function showStudyMaterial(type) {
    let sheetName = '';
    let title = '';
    
    switch(type) {
        case 'ncert':
            sheetName = 'Books';
            title = 'NCERT Book';
            break;
        case 'rdSharma':
            sheetName = 'RD_Sharma';
            title = 'RD Sharma';
            break;
        case 'rdSharmaMCQ':
            sheetName = 'Rd_MCQs';
            title = 'RD Sharma (MCQs)';
            break;
        case 'pyqs':
            sheetName = 'PYQs';
            title = 'PYQs & Sample Papers';
            break;
        case 'notes':
            sheetName = 'Notes';
            title = 'Notes';
            break;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/${sheetName}`);
        const data = await response.json();
        
        let filteredData = [];
        if (type === 'pyqs') {
            filteredData = data.filter(row => isClass12th(row.Class));
        } else {
            filteredData = data.filter(row => isClass12th(row.Class));
        }

        let html = '';
        if (type === 'notes' || type === 'ncert') {
            html += `
                <div style="margin-bottom: 15px;">
                    <label><b>Select Subject:</b></label>
                    <select id="subjectFilter" class="subject-dropdown" onchange="filterSubjectRows()">
                        <option value="Mathematics" selected>Mathematics</option>
                        <option value="Science">Science</option>
                    </select>
                </div>
            `;
        }
        
        if (filteredData.length === 0) {
            html = '<p>No data available.</p>';
        } else {
            html += '<div class="table-container"><table>';
            if (type === 'pyqs') {
                html += '<thead><tr><th>Subject Name</th><th>Chapter Name</th><th>Link</th></tr></thead><tbody>';
                filteredData.forEach((row, index) => {
                    const link = row.Link || '';
                    html += `
                        <tr class="clickable-row" data-link="${link}" onclick="openRowLink('${link.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                            <td>${row.Subject || ''}</td>
                            <td>${row["Chapter's Name"] || ''}</td>
                            <td>
                                <a href="${link}" target="_blank" class="file-button pdf" onclick="event.stopPropagation()">
                                    <i class="fas fa-file-pdf"></i> View
                                </a>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html += '<thead><tr><th>Subject Name</th><th>Chapter Name</th><th>Link</th></tr></thead><tbody>';
                filteredData.forEach((row, index) => {
                    const subject = row.Subject || '';
                    const chapterName = row["Chapter's Name"] || '';
                    const link = row.Link || '';
                    html += `
                        <tr class="clickable-row" data-link="${link}" onclick="openRowLink('${link.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                            <td>${subject}</td>
                            <td>${chapterName}</td>
                            <td><a href="${link}" target="_blank" class="file-button pdf" onclick="event.stopPropagation()">
                                <i class="fas fa-file-pdf"></i> View
                            </a></td>
                        </tr>
                    `;
                });
            }
            html += '</tbody></table></div>';
        }
        
        popupTitle.textContent = title;
        popupContent.innerHTML = html;
        showPopup();
    } catch (error) {
        console.error(`Error fetching ${type} data:`, error);
        popupTitle.textContent = title;
        popupContent.innerHTML = '<p>Error loading data. Please try again later.</p>';
        showPopup();
    }
}

// Function to open link when row is clicked
function openRowLink(link) {
    if (link && link.trim() !== '') {
        window.open(link, '_blank');
    }
}

// Function to show projects with clickable rows
function showProjects() {
    popupTitle.textContent = 'Projects';
    if (projectsData.length === 0) {
        popupContent.innerHTML = '<p>Loading projects data...</p>';
        showPopup();
        return;
    }
    
    let html = '<div class="table-container"><table>';
    html += '<thead><tr><th>Name of Students</th><th>Roll No</th><th>Topics for Projects</th><th>Status(submit/pending)</th><th>Alloted Date</th><th>Submission Date</th><th>Link</th></tr></thead><tbody>';
    
    projectsData.forEach(row => {
        const admNo = row["Adm No"] || '';
        const rollNo = row["Roll No"] || '';
        const name = row["Name of Students"] || '';
        const topic = row.Topic || '';
        const status = row.Status || '';
        const allotedDate = row["Alloted Date"] || '';
        const submissionDate = row["Submission Date"] || '';
        const link = row.Link || '';
        
        const statusClass = status.toLowerCase() === 'submit' ? 'status-submitted' : 'status-pending';
        const statusText = status.toLowerCase() === 'submit' ? 'Submitted' : 'Pending';
        
        html += `<tr class="clickable-row" data-link="${link}" onclick="openRowLink('${link.replace(/'/g, "\\'")}')" style="cursor: pointer;">
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="images/${admNo}.jpg" alt="${name}" class="student-img" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0MzYxZWUiLz4KPHBhdGggZD0iTTIwIDIyQzIyLjIwOTEgMjIgMjQgMjAuMjA5MSAyNCAxOEMyNCAxNS43OTA5IDIyMjA5MSAxNCAyMCAxNEMxNy43OTA5IDE0IDE2IDE1Ljc5MDkgMTYgMThDMTYgMjAuMjA5MSAxNy43OTA5IDIyIDIwIDIzWiIgZmlsbD0iI2Y4ZmFmYyIvPgo8cGF0aD4KPC9zdmc+Cg=='">
                    <span>${name}</span>
                </div>
            </td>
            <td>${rollNo}</td>
            <td>${topic}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${allotedDate}</td>
            <td>${submissionDate}</td>
            <td>${link ? `<a href="${link}" target="_blank" class="file-button pdf" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i> View</a>` : 'N/A'}</td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    popupContent.innerHTML = html;
    showPopup();
}

// PPT Materials
function showPPT() {
    popupTitle.textContent = "PPT Materials - Class 12th";
    
    let html = `
        <div class="tabs" style="margin-top: 10px;">
            <button class="tab-btn active" data-tab="ppt-materials-popup">
                <i class="fas fa-file-powerpoint"></i> Lecture Materials
            </button>
        </div>

        <div id="ppt-materials-popup" class="tab-content active">
            <div class="controls">
                <div class="search-container">
                    <div class="search-box">
                        <input type="text" id="searchInput-ppt" placeholder="Search by chapter name or number...">
                        <button onclick="filterPPTData()">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
                
                <div class="filter-container">
                    <button class="filter-btn" onclick="sortPPTByChapter()">
                        <i class="fas fa-sort-numeric-down"></i> Sort by Chapter
                    </button>
                    <button class="filter-btn" onclick="sortPPTByName()">
                        <i class="fas fa-sort-alpha-down"></i> Sort by Name
                    </button>
                </div>
            </div>

            <div class="ppt-container" id="pptContainer-materials">
                <div class="loading">
                    <div class="spinner"></div>
                    <div class="loading-text">Loading lecture materials...</div>
                </div>
            </div>
        </div>
    `;

    popupContent.innerHTML = html;
    showPopup();
    setTimeout(() => {
        loadPPTMaterials();
    }, 100);
}

// Load PPT Materials only
async function loadPPTMaterials() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/PPT`);
        const data = await response.json();
        
        // Filter for Class 12th only
        const class12thPPT = data.filter(row => isClass12th(row.Class));
        
        if (class12thPPT.length === 0) {
            document.getElementById('pptContainer-materials').innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--muted);">
                    <i class="fas fa-file-powerpoint" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>No PPT Materials Available</h3>
                    <p>No lecture materials found for Class 12th.</p>
                </div>
            `;
            return;
        }
        
        displayPPTMaterials(class12thPPT);
    } catch (error) {
        console.error('Error loading PPT materials:', error);
        document.getElementById('pptContainer-materials').innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Error Loading Materials</h3>
                <p>Failed to load PPT materials. Please try again later.</p>
            </div>
        `;
    }
}

let pptMaterialsData = [];

function displayPPTMaterials(materials) {
    pptMaterialsData = materials;
    const container = document.getElementById('pptContainer-materials');
    
    if (materials.length === 0) {
        container.innerHTML = '<p>No PPT materials available.</p>';
        return;
    }
    
    let html = '<div class="ppt-grid">';
    
    materials.forEach((material, index) => {
        const subject = material.Subject || 'General';
        const chapter = material["Chapter's Name"] || 'Untitled';
        const link = material.Link || '';
        const date = material.Date || '';
        
        // Split multiple links by comma
        let linkButtons = '';
        if (link && link.trim() !== '') {
            const linksArray = link.split(',').map(l => l.trim()).filter(l => l !== '');
            
            linksArray.forEach((singleLink, idx) => {
                linkButtons += `
                    <a href="${singleLink}" target="_blank" class="ppt-material-link" style="margin-bottom: 5px;" onclick="event.stopPropagation()">
                        <i class="fas fa-external-link-alt"></i> Link ${idx + 1}
                    </a>
                `;
            });
        }
        
        // Make the entire card clickable to open the first link
        const firstLink = link.split(',')[0]?.trim() || '';
        html += `
            <div class="ppt-material-card clickable-row" data-link="${firstLink}" onclick="openRowLink('${firstLink.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                <div class="ppt-material-header">
                    <div class="ppt-material-subject">${subject}</div>
                    <div class="ppt-material-chapter">${chapter}</div>
                </div>
                <div class="ppt-material-body">
                    <div class="ppt-material-meta">
                        ${date ? `<span class="ppt-material-date"><i class="fas fa-calendar"></i> ${date}</span>` : ''}
                    </div>
                    ${linkButtons ? `
                    <div class="ppt-material-actions" style="flex-direction: column; gap: 5px;">
                        ${linkButtons}
                    </div>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function filterPPTData() {
    const searchTerm = document.getElementById('searchInput-ppt').value.toLowerCase();
    if (!searchTerm) {
        displayPPTMaterials(pptMaterialsData);
        return;
    }
    
    const filtered = pptMaterialsData.filter(material => 
        material.Subject?.toLowerCase().includes(searchTerm) ||
        material["Chapter's Name"]?.toLowerCase().includes(searchTerm)
    );
    
    displayPPTMaterials(filtered);
}

function sortPPTByChapter() {
    const sorted = [...pptMaterialsData].sort((a, b) => {
        return (a["Chapter's Name"] || '').localeCompare(b["Chapter's Name"] || '');
    });
    displayPPTMaterials(sorted);
}

function sortPPTByName() {
    const sorted = [...pptMaterialsData].sort((a, b) => {
        return (a.Subject || '').localeCompare(b.Subject || '');
    });
    displayPPTMaterials(sorted);
}

// =============================================
// TEST MARKS FUNCTIONS (UPDATED - Row click opens details)
// =============================================

function showTestMarks() {
    popupTitle.textContent = 'All Subject Marks Viewer';
    
    let html = `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <button class="file-button pdf" onclick="showAllStudentsMarks()" style="flex: 1;">
                    <i class="fas fa-users"></i> All Students
                </button>
                <button class="file-button excel" onclick="showMarksDetails()" style="flex: 1;">
                    <i class="fas fa-chart-bar"></i> Marks
                </button>
            </div>
        </div>
        <div id="marksContent">
            <div style="text-align: center; padding: 40px; color: var(--muted);">
                <i class="fas fa-graduation-cap" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Select an option above</h3>
                <p>Choose "All Students" to view student list or "Marks" to see detailed marks analysis</p>
            </div>
        </div>
    `;
    
    popupContent.innerHTML = html;
    showPopup();
}

// Function to show all students list
function showAllStudentsMarks() {
    if (testMarksData.length === 0) {
        document.getElementById('marksContent').innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>No Marks Data Available</h3>
                <p>Loading marks data...</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="filter-section">
            <div class="filter-controls">
                <div class="filter-group">
                    <label for="studentSearchMarks"><i class="fas fa-search"></i> Search Student:</label>
                    <div class="search-box">
                        <input type="text" id="studentSearchMarks" placeholder="Enter student name">
                        <i class="fas fa-search"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Total Tests</th>
                        <th>Average Score</th>
                        <th>Highest Score</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="studentsListBody">
    `;
    
    // Calculate student-wise statistics
    const studentStats = {};
    
    testMarksData.forEach(test => {
        const testType = test['Type'] || '';
        const subject = test['Subject'] || '';
        const dateOfExam = test['Date of Exam'] || '';
        const maxMarks = test.maxMarks || 0;
        
        studentNames12th.forEach(studentName => {
            const marksKey = `${studentName} - Marks`;
            if (!studentStats[studentName]) {
                studentStats[studentName] = {
                    totalTests: 0,
                    totalMarks: 0,
                    totalMaxMarks: 0,
                    highestScore: 0,
                    tests: []
                };
            }
            
            if (test[marksKey] !== undefined && test[marksKey] !== '' && !isNaN(parseFloat(test[marksKey]))) {
                const marks = parseFloat(test[marksKey]);
                studentStats[studentName].totalTests++;
                studentStats[studentName].totalMarks += marks;
                studentStats[studentName].totalMaxMarks += maxMarks;
                if (marks > studentStats[studentName].highestScore) {
                    studentStats[studentName].highestScore = marks;
                }
                
                studentStats[studentName].tests.push({
                    date: dateOfExam,
                    type: testType,
                    subject: subject,
                    marks: marks,
                    maxMarks: maxMarks
                });
            }
        });
    });
    
    // Sort students alphabetically
    const sortedStudents = studentNames12th.sort((a, b) => a.localeCompare(b));
    
    sortedStudents.forEach(studentName => {
        const stats = studentStats[studentName];
        const totalTests = stats ? stats.totalTests : 0;
        const avgMarks = stats && stats.totalTests > 0 ? (stats.totalMarks / stats.totalTests).toFixed(1) : 0;
        const highestScore = stats ? stats.highestScore : 0;
        
        html += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-user-graduate"></i>
                        <span>${studentName}</span>
                    </div>
                </td>
                <td>${totalTests}</td>
                <td>${avgMarks}</td>
                <td>${highestScore}</td>
                <td>
                    <button class="file-button pdf" onclick="downloadStudentMarksReport('${studentName}')">
                        <i class="fas fa-download"></i> Download Report
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    </div>
    `;
    
    document.getElementById('marksContent').innerHTML = html;
    
    // Add search functionality
    document.getElementById('studentSearchMarks').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#studentsListBody tr');
        
        rows.forEach(row => {
            const studentName = row.querySelector('td:first-child').textContent.toLowerCase();
            row.style.display = studentName.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Function to show marks details (with row click functionality)
function showMarksDetails() {
    if (testMarksData.length === 0) {
        document.getElementById('marksContent').innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>No Marks Data Available</h3>
                <p>Loading marks data...</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="filter-section">
            <div class="filter-controls">
                <div class="filter-group">
                    <label for="studentSearch"><i class="fas fa-search"></i> Search Student:</label>
                    <div class="search-box">
                        <input type="text" id="studentSearch" placeholder="Enter student name">
                        <i class="fas fa-search"></i>
                    </div>
                </div>
                <div class="filter-group">
                    <label for="typeFilter"><i class="fas fa-filter"></i> Filter by Type:</label>
                    <select id="typeFilter" onchange="filterTestMarksByType()">
                        <option value="all">All Types</option>
                        <option value="Periodic Test">Periodic Test</option>
                        <option value="Summative Assessment">Summative Assessment</option>
                        <option value="Test out of 20">Test out of 20</option>
                        <option value="Test out of 10">Test out of 10</option>
                        <option value="Test out of 80">Test out of 80</option>
                        <option value="Preboard">Preboard</option>
                        <option value="Oral">Oral</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="subjectFilterTest"><i class="fas fa-book"></i> Filter by Subject:</label>
                    <select id="subjectFilterTest" onchange="filterTestMarksBySubject()">
                        <option value="all">All Subjects</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="Computer">Computer</option>
                        <option value="Social Studies">Social Studies</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Urdu">Urdu</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Biology">Biology</option>
                        <option value="Physical Education">Physical Education</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="stats-container">
            <div class="stats-card">
                <div class="stats-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stats-number" id="totalStudents">${testMarksData.length}</div>
                <div class="stats-label">Total Tests</div>
            </div>
            <div class="stats-card">
                <div class="stats-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stats-number" id="averageMarks">0</div>
                <div class="stats-label">Average Score</div>
            </div>
            <div class="stats-card">
                <div class="stats-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="stats-number" id="topperScore">0</div>
                <div class="stats-label">Highest Score</div>
            </div>
            <div class="stats-card">
                <div class="stats-icon">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="stats-number" id="avgPercentage">0%</div>
                <div class="stats-label">Avg. Percentage</div>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Date of Exam</th>
                        <th>Type</th>
                        <th>Subject</th>
                        <th>Max Marks</th>
                        <th>Students Count</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="testDataBody">
    `;
    
    testMarksData.forEach((test, index) => {
        let studentCount = 0;
        let totalMarks = 0;
        
        for (const key in test) {
            if (key.includes(' - Marks') && test[key] !== undefined && test[key] !== '' && !isNaN(parseFloat(test[key]))) {
                studentCount++;
                totalMarks += parseFloat(test[key]);
            }
        }
        
        const testType = test['Type'] || 'N/A';
        const subject = test['Subject'] || 'N/A';
        const maxMarks = test.maxMarks || 0;
        const avgMarks = studentCount > 0 ? (totalMarks / studentCount).toFixed(1) : 0;
        const avgPercentage = maxMarks > 0 ? ((avgMarks / maxMarks) * 100).toFixed(1) : 0;
        const paperLink = test['Paper Link'] || '';
        
        html += `
            <tr class="clickable-test-row" data-index="${index}" onclick="viewTestDetails(${index})" style="cursor: pointer;">
                <td>${test['Date of Exam'] || 'N/A'}</td>
                <td><span class="type-badge ${testType.toLowerCase().replace(/\s+/g, '-')}">${testType}</span></td>
                <td><span class="subject-badge">${subject}</span></td>
                <td>${maxMarks}</td>
                <td>${studentCount}</td>
                <td>
                    <button class="file-button pdf" onclick="event.stopPropagation(); viewTestDetails(${index})">View Details</button>
                    <button class="file-button excel" onclick="event.stopPropagation(); exportTestData(${index})">Export</button>
                    ${paperLink ? `<button class="file-button paper-link" onclick="event.stopPropagation(); window.open('${paperLink}', '_blank')">Paper Link</button>` : ''}
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('marksContent').innerHTML = html;
    calculateTestStats();
    
    document.getElementById('studentSearch').addEventListener('input', function() {
        filterTestMarks(this.value);
    });
}

// Function to download student marks report
function downloadStudentMarksReport(studentName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add school logo and header
    doc.setFontSize(20);
    doc.setTextColor(40, 53, 147);
    doc.text("Saiema Mansoor Public School", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Student Marks Report", 105, 30, { align: "center" });
    
    doc.setFontSize(12);
    doc.text("Class 12th - Academic Year 2025-26", 105, 40, { align: "center" });
    
    // Student Information
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Student Information:", 20, 55);
    
    doc.setFontSize(12);
    doc.text(`Name: ${studentName}`, 20, 65);
    doc.text(`Class: 12th`, 20, 72);
    
    // Collect all tests for this student
    const studentTests = [];
    let totalMarks = 0;
    let totalMaxMarks = 0;
    let presentCount = 0;
    let absentCount = 0;
    
    testMarksData.forEach(test => {
        const marksKey = `${studentName} - Marks`;
        const testType = test['Type'] || '';
        const subject = test['Subject'] || '';
        const dateOfExam = test['Date of Exam'] || '';
        const maxMarks = test.maxMarks || 0;
        
        if (test[marksKey] !== undefined && test[marksKey] !== '' && !isNaN(parseFloat(test[marksKey]))) {
            const marks = parseFloat(test[marksKey]);
            studentTests.push({
                date: dateOfExam,
                type: testType,
                subject: subject,
                marks: marks,
                maxMarks: maxMarks,
                status: 'Present'
            });
            totalMarks += marks;
            totalMaxMarks += maxMarks;
            presentCount++;
        } else {
            // Check if other students have marks for this test
            let otherStudentsHaveMarks = false;
            for (const key in test) {
                if (key.includes(' - Marks') && test[key] !== undefined && test[key] !== '' && !isNaN(parseFloat(test[key]))) {
                    otherStudentsHaveMarks = true;
                    break;
                }
            }
            
            if (otherStudentsHaveMarks) {
                studentTests.push({
                    date: dateOfExam,
                    type: testType,
                    subject: subject,
                    marks: 0,
                    maxMarks: maxMarks,
                    status: 'Absent'
                });
                absentCount++;
            }
        }
    });
    
    // Sort tests by date
    studentTests.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Test Summary
    doc.setFontSize(14);
    doc.text("Test Summary:", 20, 85);
    
    doc.setFontSize(12);
    doc.text(`Total Tests: ${studentTests.length}`, 20, 95);
    doc.text(`Present: ${presentCount}`, 20, 102);
    doc.text(`Absent: ${absentCount}`, 20, 109);
    
    if (presentCount > 0) {
        const averageMarks = (totalMarks / presentCount).toFixed(1);
        const averagePercentage = (totalMarks / totalMaxMarks * 100).toFixed(1);
        doc.text(`Average Marks: ${averageMarks}`, 20, 116);
        doc.text(`Average Percentage: ${averagePercentage}%`, 20, 123);
    }
    
    // Marks Table
    doc.setFontSize(14);
    doc.text("Detailed Marks:", 20, 140);
    
    // Create table headers
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(40, 53, 147);
    doc.rect(20, 145, 170, 8, 'F');
    doc.text("Date", 25, 150);
    doc.text("Type", 60, 150);
    doc.text("Subject", 95, 150);
    doc.text("Marks", 130, 150);
    doc.text("Max", 150, 150);
    doc.text("Status", 165, 150);
    
    // Table rows
    doc.setTextColor(0, 0, 0);
    let yPos = 158;
    
    studentTests.forEach((test, index) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.text(test.date, 25, yPos);
        doc.text(test.type, 60, yPos);
        doc.text(test.subject, 95, yPos);
        doc.text(test.marks.toString(), 130, yPos);
        doc.text(test.maxMarks.toString(), 150, yPos);
        
        if (test.status === 'Absent') {
            doc.setTextColor(255, 0, 0);
        }
        doc.text(test.status, 165, yPos);
        doc.setTextColor(0, 0, 0);
        
        yPos += 8;
    });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Generated by Class 12th Dashboard", 105, 280, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 285, { align: "center" });
    
    // Save the PDF
    doc.save(`${studentName}_Marks_Report.pdf`);
}

function calculateTestStats() {
    if (testMarksData.length === 0) return;
    
    let totalTests = testMarksData.length;
    let totalMarks = 0;
    let totalMaxMarks = 0;
    let highestScore = 0;
    let testCount = 0;
    
    testMarksData.forEach(test => {
        let studentCount = 0;
        let testTotalMarks = 0;
        let testHighest = 0;
        
        for (const key in test) {
            if (key.includes(' - Marks') && test[key] !== undefined && test[key] !== '' && !isNaN(parseFloat(test[key]))) {
                const marks = parseFloat(test[key]);
                studentCount++;
                testTotalMarks += marks;
                if (marks > testHighest) testHighest = marks;
            }
        }
        
        if (studentCount > 0) {
            const maxMarks = test.maxMarks || 0;
            totalMarks += (testTotalMarks / studentCount);
            totalMaxMarks += maxMarks;
            if (testHighest > highestScore) highestScore = testHighest;
            testCount++;
        }
    });
    
    const averageMarks = testCount > 0 ? (totalMarks / testCount).toFixed(1) : 0;
    const averagePercentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0;
    
    document.getElementById('totalStudents').textContent = totalTests;
    document.getElementById('averageMarks').textContent = averageMarks;
    document.getElementById('topperScore').textContent = highestScore.toFixed(1);
    document.getElementById('avgPercentage').textContent = `${averagePercentage}%`;
}

// UPDATED: View Test Details with Absent students
function viewTestDetails(index) {
    const test = testMarksData[index];
    const testType = test['Type'] || '';
    const subject = test['Subject'] || '';
    const maxMarks = test.maxMarks || 0;
    const dateOfExam = test['Date of Exam'] || '';
    const examName = test['Name of Test'] || testType;
    
    let html = `
        <div class="test-details-header">
            <h3>Test Details</h3>
            <div class="test-info">
                <div><strong>Date:</strong> ${dateOfExam}</div>
                <div><strong>Type:</strong> ${testType}</div>
                <div><strong>Subject:</strong> ${subject}</div>
                <div><strong>Max Marks:</strong> ${maxMarks}</div>
            </div>
        </div>
        <div class="table-container"><table>
        <thead><tr><th>Student Name</th><th>Marks</th><th>Percentage</th><th>Status</th><th>Performance</th></tr></thead><tbody>
    `;
    
    let studentCount = 0;
    let totalMarks = 0;
    let highestMarks = 0;
    let presentCount = 0;
    let absentCount = 0;
    
    studentNames12th.forEach(studentName => {
        const marksKey = `${studentName} - Marks`;
        let marks = 0;
        let status = 'Absent';
        let percentage = 0;
        
        if (test[marksKey] !== undefined && test[marksKey] !== '' && !isNaN(parseFloat(test[marksKey]))) {
            marks = parseFloat(test[marksKey]);
            percentage = maxMarks > 0 ? ((marks / maxMarks) * 100).toFixed(1) : 0;
            status = 'Present';
            presentCount++;
            totalMarks += marks;
            studentCount++;
            if (marks > highestMarks) highestMarks = marks;
        } else {
            absentCount++;
        }
        
        let performanceClass = '';
        let performanceText = '';
        
        if (status === 'Present') {
            if (percentage >= 90) {
                performanceClass = 'excellent';
                performanceText = 'Excellent';
            } else if (percentage >= 75) {
                performanceClass = 'good';
                performanceText = 'Good';
            } else if (percentage >= 50) {
                performanceClass = 'average';
                performanceText = 'Average';
            } else if (percentage >= 33) {
                performanceClass = 'pass';
                performanceText = 'Pass';
            } else {
                performanceClass = 'poor';
                performanceText = 'Needs Improvement';
            }
        } else {
            performanceClass = 'poor';
            performanceText = 'Absent';
        }
        
        html += `
            <tr>
                <td>
                    <a class="clickable-student" onclick="downloadStudentMarksPDF('${studentName}', '${dateOfExam}', '${examName}', '${subject}', ${marks}, ${maxMarks}, ${percentage}, '${status}')">
                        <i class="fas fa-user"></i> ${studentName}
                    </a>
                </td>
                <td>${status === 'Present' ? `${marks}/${maxMarks}` : 'Absent'}</td>
                <td>${status === 'Present' ? `${percentage}%` : 'N/A'}</td>
                <td><span class="${status === 'Present' ? 'status-submitted' : 'status-pending'}">${status}</span></td>
                <td><span class="performance-badge ${performanceClass}">${performanceText}</span></td>
            </tr>
        `;
    });
    
    const averageMarks = presentCount > 0 ? (totalMarks / presentCount).toFixed(1) : 0;
    const averagePercentage = maxMarks > 0 ? ((averageMarks / maxMarks) * 100).toFixed(1) : 0;
    
    html += `
        </tbody></table></div>
        <div class="test-summary">
            <div class="summary-card">
                <div class="summary-label">Total Students</div>
                <div class="summary-value">${studentNames12th.length}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Present</div>
                <div class="summary-value">${presentCount}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Absent</div>
                <div class="summary-value">${absentCount}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Average Marks</div>
                <div class="summary-value">${averageMarks}/${maxMarks}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Average Percentage</div>
                <div class="summary-value">${averagePercentage}%</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Highest Score</div>
                <div class="summary-value">${highestMarks}/${maxMarks}</div>
            </div>
        </div>
    `;
    
    popupContent.innerHTML = html;
}

// NEW: Function to download student marks as PDF
function downloadStudentMarksPDF(studentName, dateOfExam, examName, subject, marks, maxMarks, percentage, status = 'Present') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add school logo and header
    doc.setFontSize(20);
    doc.setTextColor(40, 53, 147);
    doc.text("Saiema Mansoor Public School", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Student Marks Report", 105, 30, { align: "center" });
    
    doc.setFontSize(12);
    doc.text("Class 12th - Academic Year 2025-26", 105, 40, { align: "center" });
    
    // Student Information
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Student Information:", 20, 55);
    
    doc.setFontSize(12);
    doc.text(`Name: ${studentName}`, 20, 65);
    doc.text(`Class: 12th`, 20, 72);
    
    // Test Information
    doc.setFontSize(14);
    doc.text("Test Information:", 20, 85);
    
    doc.setFontSize(12);
    doc.text(`Date of Exam: ${dateOfExam}`, 20, 95);
    doc.text(`Exam Name: ${examName}`, 20, 102);
    doc.text(`Subject: ${subject}`, 20, 109);
    doc.text(`Maximum Marks: ${maxMarks}`, 20, 116);
    
    // Marks Information
    doc.setFontSize(14);
    doc.text("Marks Details:", 20, 130);
    
    doc.setFontSize(12);
    
    if (status === 'Absent') {
        doc.setTextColor(255, 0, 0);
        doc.text(`Status: ABSENT`, 20, 140);
        doc.text(`Marks Obtained: Not Available`, 20, 147);
        doc.text(`Percentage: Not Available`, 20, 154);
    } else {
        doc.setTextColor(0, 0, 0);
        doc.text(`Status: ${status}`, 20, 140);
        doc.text(`Marks Obtained: ${marks}/${maxMarks}`, 20, 147);
        doc.text(`Percentage: ${percentage}%`, 20, 154);
        
        // Performance Indicator
        let performance = '';
        if (percentage >= 90) performance = 'Excellent';
        else if (percentage >= 75) performance = 'Good';
        else if (percentage >= 50) performance = 'Average';
        else if (percentage >= 33) performance = 'Pass';
        else performance = 'Needs Improvement';
        
        doc.text(`Performance: ${performance}`, 20, 161);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Generated by Class 12th Dashboard", 105, 280, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 285, { align: "center" });
    
    // Save the PDF
    doc.save(`${studentName}_${subject}_${dateOfExam.replace(/\//g, '-')}_Marks.pdf`);
}

function filterTestMarksByType() {
    const selectedType = document.getElementById('typeFilter').value;
    filterTestMarksTable(selectedType, 'type');
}

function filterTestMarksBySubject() {
    const selectedSubject = document.getElementById('subjectFilterTest').value;
    filterTestMarksTable(selectedSubject, 'subject');
}

function filterTestMarksTable(filterValue, filterType) {
    const rows = document.querySelectorAll('#testDataBody tr');
    
    rows.forEach(row => {
        let showRow = true;
        
        if (filterValue !== 'all') {
            if (filterType === 'type') {
                const typeCell = row.querySelector('td:nth-child(2)');
                if (typeCell) {
                    const typeText = typeCell.textContent.trim();
                    showRow = typeText === filterValue;
                }
            } else if (filterType === 'subject') {
                const subjectCell = row.querySelector('td:nth-child(3)');
                if (subjectCell) {
                    const subjectText = subjectCell.textContent.trim();
                    showRow = subjectText === filterValue;
                }
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

function filterTestMarks(searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    const rows = document.querySelectorAll('#testDataBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchLower) ? '' : 'none';
    });
}

function exportTestData(index) {
    const test = testMarksData[index];
    let csvContent = "Student Name,Marks,Percentage,Status\n";
    
    studentNames12th.forEach(studentName => {
        const marksKey = `${studentName} - Marks`;
        let marks = '';
        let percentage = '';
        let status = 'Absent';
        
        if (test[marksKey] !== undefined && test[marksKey] !== '' && !isNaN(parseFloat(test[marksKey]))) {
            marks = parseFloat(test[marksKey]);
            const maxMarks = test.maxMarks || 1;
            percentage = ((marks / maxMarks) * 100).toFixed(2);
            status = 'Present';
        }
        
        csvContent += `${studentName},${marks},${percentage}%,${status}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Test_${test['Date of Exam'] || 'Data'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// =============================================
// RESOURCES FUNCTIONS (UPDATED - Entire Row Clickable)
// =============================================

function showResources() {
    popupTitle.textContent = 'Resources Hub';
    if (resourcesData.length === 0) {
        popupContent.innerHTML = '<p>Loading resources data...</p>';
        showPopup();
        return;
    }
    
    let html = '<div class="table-container"><table>';
    html += '<thead><tr><th>Subjects&nbsp;&nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;</th><th>File Type</th><th>Topic of the filess</th><th>Files</th></tr></thead><tbody>';
    
    resourcesData.forEach(row => {
        const timestamp = row['Timestamp'] || '';
        const dateFormatted = formatDate(new Date(timestamp));
        const subject = row['Select Subject'] || '';
        const resourceType = row['Resource Type'] || '';
        const topic = row['Topic'] || '';
        const fileUpload = row['Files'] || '';
        
        let fileButtonsHtml = '';
        let firstFileLink = '';
        if (fileUpload && fileUpload.trim() !== '') {
            const fileLinks = fileUpload.split(/[,;\s\n]+/).filter(link => link.trim() !== '');
            firstFileLink = fileLinks[0] || '';
            
            fileLinks.forEach((link, index) => {
                const fileExtension = link.split('.').pop()?.toLowerCase() || 'unknown';
                const fileTypeClass = fileExtension === 'pdf' ? 'pdf' : 
                                    (fileExtension === 'doc' || fileExtension === 'docx') ? 'doc' : 
                                    (fileExtension === 'ppt' || fileExtension === 'pptx') ? 'ppt' : 'unknown';
                
                const fileIcon = fileExtension === 'pdf' ? 'file-pdf' : 
                               (fileExtension === 'doc' || fileExtension === 'docx') ? 'file-word' : 
                               (fileExtension === 'ppt' || fileExtension === 'pptx') ? 'file-powerpoint' : 'file';
                
                fileButtonsHtml += `
                    <a class="file-button ${fileTypeClass}" href="${link}" target="_blank" title="View file" onclick="event.stopPropagation()">
                        <i class="fas fa-${fileIcon}"></i> File ${index+1}
                    </a>
                `;
            });
        }
        
        html += `<tr class="clickable-row" data-link="${firstFileLink}" onclick="openRowLink('${firstFileLink.replace(/'/g, "\\'")}')" style="cursor: pointer;">
            <td>${subject}</td>
            <td>${resourceType}</td>
            <td>${topic}</td>
            <td><div class="file-buttons">${fileButtonsHtml || 'No files'}</div></td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    popupContent.innerHTML = html;
    showPopup();
}

// =============================================
// MATHS MARKS FUNCTIONS
// =============================================

function showMathsMarks() {
    popupTitle.textContent = 'Maths Marks';
    if (mathsMarksData.length === 0) {
        popupContent.innerHTML = '<p>Loading maths marks data...</p>';
        showPopup();
        return;
    }
    
    const allColumns = ['Name', 'PT-1', 'SA-1', 'PT-2', 'SA-2'];
    const columnsWithData = ['Name'];
    
    allColumns.forEach(col => {
        if (col !== 'Name') {
            const hasData = mathsMarksData.some(student => {
                const value = student[col];
                return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value)) && parseFloat(value) > 0;
            });
            if (hasData) {
                columnsWithData.push(col);
            }
        }
    });
    
    let html = '<div class="table-container"><table>';
    html += '<thead><tr>';
    
    columnsWithData.forEach(col => {
        html += `<th>${col}</th>`;
    });
    
    if (columnsWithData.length > 1) {
        html += '<th>Total</th><th>Status</th>';
    }
    
    html += '</tr></thead><tbody>';
    
    mathsMarksData.forEach(student => {
        let rowHtml = '';
        let total = 0;
        let maxMarks = 0;
        
        columnsWithData.forEach(col => {
            if (col === 'Name') {
                rowHtml += `<td>${student[col] || ''}</td>`;
            } else {
                const value = parseFloat(student[col]) || 0;
                rowHtml += `<td>${value > 0 ? value : '-'}</td>`;
                
                if (value > 0) {
                    total += value;
                    if (col === 'PT-1' || col === 'PT-2') {
                        maxMarks += 20;
                    } else if (col === 'SA-1' || col === 'SA-2') {
                        maxMarks += 80;
                    }
                }
            }
        });
        
        if (columnsWithData.length > 1) {
            const percent = maxMarks > 0 ? (total / maxMarks) * 100 : 0;
            const status = percent >= 33 ? "Pass" : "Fail";
            const statusClass = status === "Pass" ? "status-submitted" : "status-pending";
            
            rowHtml += `<td>${total}</td>`;
            rowHtml += `<td><span class="status-badge ${statusClass}">${status} (${percent.toFixed(1)}%)</span></td>`;
        }
        
        html += `<tr>${rowHtml}</tr>`;
    });
    
    html += '</tbody></table></div>';
    popupContent.innerHTML = html;
    showPopup();
}

// =============================================
// NOTEBOOK TRACKER FUNCTIONS
// =============================================

function showNotebookTracker() {
    popupTitle.textContent = 'Notebook Tracker';
    if (notebookData.length === 0) {
        popupContent.innerHTML = '<p>Loading notebook data...</p>';
        showPopup();
        return;
    }
    
    let html = '<div class="table-container"><table>';
    html += '<thead><tr><th>Name of Students</th><th>Completed or not</th><th>Checked By</th><th>Date Checked</th><th>Chapters Done</th><th>Remarks</th></tr></thead><tbody>';
    
    notebookData.forEach(student => {
        const status = student.Notebook_Status || 'Unknown';
        const statusClass = status === 'Completed' ? 'notebook-status-completed' : 'notebook-status-not-completed';
        
        html += `<tr>
            <td>${student.Name}</td>
            <td><span class="${statusClass}">${status}</span></td>
            <td>${student.Checked_By || 'N/A'}</td>
            <td>${student.Date_Checked || 'N/A'}</td>
            <td>${student.Chapters_Done || 'N/A'}</td>
            <td>${student.Remarks || 'N/A'}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    popupContent.innerHTML = html;
    showPopup();
}

// =============================================
// POPUP MANAGEMENT FUNCTIONS
// =============================================

function showPopup() {
    popupOverlay.style.display = 'block';
    popupContainer.style.display = 'block';
}

function closePopup() {
    popupOverlay.style.display = 'none';
    popupContainer.style.display = 'none';
    document.getElementById('attend-popup-container').style.display = 'none';
}

popupOverlay.addEventListener('click', closePopup);

function filterSubjectRows() {
    const selected = document.getElementById("subjectFilter").value;

    document.querySelectorAll("#popupContent table tbody tr").forEach(row => {
        const subjectCell = row.querySelector("td:first-child");
        if (!subjectCell) return;

        const subject = subjectCell.textContent.trim();
        row.style.display = (subject === selected) ? "" : "none";
    });
}

// =============================================
// QUICK ACTIONS FUNCTIONS
// =============================================

async function loadQuickActions() {
    try {
        if (quickActionsData.length === 0) {
            await fetchNoticeData();
        }
        
        const container = document.getElementById("quick-actions-grid");
        
        const class12thActions = quickActionsData.filter(row => 
            isClass12th(row.Class)
        );
        
        if (class12thActions.length === 0) {
            container.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #666;">No quick actions available for Class 12th</p>';
            return;
        }
        
        const today = new Date();
        const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        
        let html = '';
        
        class12thActions.forEach(resource => {
            const resourceDate = resource.Date ? new Date(resource.Date) : null;
            let isToday = false;
            
            if (resourceDate) {
                const resourceDateFormatted = `${resourceDate.getMonth() + 1}/${resourceDate.getDate()}/${resourceDate.getFullYear()}`;
                isToday = resourceDateFormatted === todayFormatted;
            }
            
            const buttonText = resource.button || 'Action';
            let logoIcon = resource.logo || 'fas fa-link';
            let cssClass = resource.css || '';
            let onclickAction = '';
            
            if (logoIcon.includes('fas fa-')) {
            } else if (logoIcon.includes('fa-')) {
                logoIcon = 'fas ' + logoIcon;
            } else {
                logoIcon = 'fas fa-link';
            }
            
            if (resource.codes && resource.codes.trim() !== '') {
                onclickAction = `runCode('${buttonText.replace(/'/g, "\\'")}', '${resource.codes.replace(/'/g, "\\'")}')`;
            } else if (resource.link && resource.link.endsWith('.json')) {
                onclickAction = `fetchAndShowJSON('${resource.link.replace(/'/g, "\\'")}', '${buttonText.replace(/'/g, "\\'")}')`;
            } else if (resource.link) {
                onclickAction = `window.open('${resource.link}', '_blank')`;
            } else if (resource.json && resource.json.trim() !== '') {
                onclickAction = `showResourceJSON('${buttonText.replace(/'/g, "\\'")}', '${resource.json.replace(/'/g, "\\'")}')`;
            } else {
                onclickAction = `alert('No action defined for this button')`;
            }
            
            html += `
                <button class="dashboard-btn ${cssClass} ${isToday ? 'today-special' : ''}" onclick="${onclickAction}">
                    <i class="${logoIcon}"></i>
                    <span>${buttonText}</span>
                    ${isToday ? '<span class="today-badge">Today</span>' : ''}
                </button>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Error loading quick actions:", error);
        document.getElementById("quick-actions-grid").innerHTML = 
            '<p style="text-align: center; grid-column: 1 / -1; color: #ff4444;">Error loading quick actions</p>';
    }
}

async function fetchAndShowJSON(url, title) {
    try {
        const response = await fetch(url);
        const jsonData = await response.json();
        showJSONPopup(jsonData, title);
    } catch (error) {
        console.error('Error fetching JSON:', error);
        alert('Error loading JSON data');
    }
}

function showResourceJSON(title, jsonString) {
    try {
        const jsonData = JSON.parse(jsonString);
        showJSONPopup(jsonData, title);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Error parsing JSON data');
    }
}

function showJSONPopup(jsonData, title) {
    popupTitle.textContent = title || 'JSON Data';
    
    let html = '<div class="json-popup-container">';
    
    if (Array.isArray(jsonData)) {
        jsonData.forEach((item, index) => {
            html += `
                <div class="json-card ${index % 2 === 0 ? 'even' : 'odd'}">
                    <div class="json-card-header">
                        <i class="${item.icon || 'fas fa-info-circle'}"></i>
                        <h4>${item.title || `Item ${index + 1}`}</h4>
                    </div>
                    <div class="json-card-content">
                        ${item.content || JSON.stringify(item, null, 2)}
                    </div>
                </div>
            `;
        });
    } else if (typeof jsonData === 'object') {
        html += `
            <div class="json-card">
                <div class="json-card-header">
                    <i class="${jsonData.icon || 'fas fa-info-circle'}"></i>
                    <h4>${jsonData.title || 'JSON Object'}</h4>
                </div>
                <div class="json-card-content">
                    <pre>${JSON.stringify(jsonData, null, 2)}</pre>
                </div>
            </div>
        `;
    } else {
        html += `<p>${jsonData}</p>`;
    }
    
    html += '</div>';
    popupContent.innerHTML = html;
    showPopup();
}

function runCode(title, code) {
    const modal = document.getElementById('code-runner-modal');
    const titleElement = document.getElementById('runner-title');
    const iframe = document.getElementById('code-runner-iframe');

    if (!modal || !titleElement || !iframe) {
        createCodeRunnerModal();
    }

    titleElement.textContent = title;
    
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(code);
    iframe.contentWindow.document.close();

    modal.style.display = 'flex';
}

function createCodeRunnerModal() {
    const modalHTML = `
        <div id="code-runner-modal" class="code-runner-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; justify-content: center; align-items: center;">
            <div style="background: white; width: 90%; height: 90%; border-radius: 10px; display: flex; flex-direction: column;">
                <div style="padding: 15px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                    <h3 id="runner-title">Code Runner</h3>
                    <button onclick="closeCodeRunnerModal()" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
                </div>
                <iframe id="code-runner-iframe" src="about:blank" style="flex: 1; border: none; border-radius: 0 0 10px 10px;"></iframe>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeCodeRunnerModal() {
    const modal = document.getElementById('code-runner-modal');
    const iframe = document.getElementById('code-runner-iframe');

    if (iframe) {
        iframe.src = 'about:blank';
    }

    if (modal) {
        modal.style.display = 'none';
    }
}

function handleResultRedirect() {
    window.location.href = "result.html";
}

// =============================================
// SMPS SHEET VIEWER FUNCTIONS
// =============================================

const SMPS_SHEET_URL = "https://opensheet.elk.sh/1V4lqO_jw9jk4Oy5FZ6LPlWcLfKEKqefeGoYF3Td2E2I/Details";
let smpsAllHeaders = [];
let smpsAllRows = [];
let smpsSelectedColumns = new Set();
let smpsSelectedRows = new Set();
let smpsOriginalData = [];
let smpsRawData = [];
const SMPS_CORRECT_PASSWORD = "8982";

function showSMPSViewer() {
    document.getElementById('smpsModal').style.display = 'flex';
    popupOverlay.style.display = 'block';
}

function closeSMPSModal() {
    document.getElementById('smpsModal').style.display = 'none';
    popupOverlay.style.display = 'none';
    document.getElementById('smpsPasswordInput').value = '';
    document.getElementById('smpsErrorMessage').textContent = '';
}

function closeSMPSViewer() {
    document.getElementById('smpsPopupContainer').style.display = 'none';
    popupOverlay.style.display = 'none';
}

function checkSMPSPassword() {
    const passwordInput = document.getElementById("smpsPasswordInput");
    const errorMessage = document.getElementById("smpsErrorMessage");
    const smpsModal = document.getElementById("smpsModal");
    
    if (passwordInput.value === SMPS_CORRECT_PASSWORD) {
        closeSMPSModal();
        document.getElementById("smpsPopupContainer").style.display = "block";
        loadSMPSData();
    } else {
        errorMessage.textContent = "Incorrect password. Please try again.";
        passwordInput.value = "";
        passwordInput.focus();
    }
}

document.getElementById("smpsPasswordInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkSMPSPassword();
    }
});

function loadSMPSData() {
    fetch(SMPS_SHEET_URL)
        .then(res => res.json())
        .then(data => {
            if (!data || data.length < 2) {
                document.getElementById('smpsPrintArea').innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--light-muted);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                        <h3>No Data Available</h3>
                        <p>Sheet data is insufficient or empty.</p>
                    </div>
                `;
                return;
            }
            
            smpsRawData = data;
            smpsAllHeaders = Object.keys(smpsRawData[0]);
            
            const subHeaderRow = smpsRawData[1];
            const studentData = smpsRawData.slice(2); 

            const class12thData = studentData.filter(row => {
                const rowValues = smpsAllHeaders.map(header => row[header]);
                const classValue = rowValues[1];
                const submitValue = rowValues[16];
                
                return classValue && isClass12th(classValue) && 
                       submitValue && submitValue.toString().toLowerCase().includes('submit');
            });
            
            if (class12thData.length === 0) {
                document.getElementById('smpsPrintArea').innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--light-muted);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                        <h3>No Filtered Data Available</h3>
                        <p>No SMPS data found for Class 12th with 'submit' status.</p>
                    </div>
                `;
                return;
            }

            smpsOriginalData = [smpsRawData[0], subHeaderRow, ...class12thData];
            smpsAllRows = smpsOriginalData.map((_, index) => index);
            smpsSelectedColumns = new Set(smpsAllHeaders);
            smpsSelectedRows = new Set(smpsAllRows);
            
            updateSMPSColumnCount();
            updateSMPSRowCount();
            
            const checkboxesContainer = document.getElementById("smpsCheckboxes");
            checkboxesContainer.innerHTML = '';

            smpsAllHeaders.forEach(header => {
                const checkboxItem = document.createElement('div');
                checkboxItem.className = 'smps-checkbox-item';
                checkboxItem.innerHTML = `
                    <input type="checkbox" id="smps-chk-${header}" checked 
                            onchange="toggleSMPSColumn('${header}', this)">
                    <label for="smps-chk-${header}">${header}</label>
                `;
                checkboxesContainer.appendChild(checkboxItem);
            });
            
            createSMPSRowCheckboxes(smpsOriginalData);
            renderSMPSDataTable(smpsOriginalData);
        })
        .catch(error => {
            console.error('Error loading SMPS data:', error);
            document.getElementById("smpsPrintArea").innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>Error Loading Data</h3>
                    <p>Failed to fetch data from the server. Please try again later.</p>
                </div>
            `;
        });
}

function createSMPSRowCheckboxes(data) {
    const rowCheckboxesContainer = document.getElementById("smpsRowCheckboxes");
    rowCheckboxesContainer.innerHTML = '';
    
    data.forEach((row, index) => {
        const isFixedRow = index < 2;
        
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'smps-checkbox-item';
        
        let labelText = `Row ${index + 1}`;
        if (index === 0) labelText = "Header Row (Adm No, Class...)";
        if (index === 1) labelText = "Sub-Header Row (A, B, C...)";

        checkboxItem.innerHTML = `
            <input type="checkbox" id="smps-row-chk-${index}" checked 
                    onchange="toggleSMPSRow(${index}, this)">
            <label for="smps-row-chk-${index}">${labelText}</label>
        `;
        rowCheckboxesContainer.appendChild(checkboxItem);
    });
}

function toggleSMPSColumn(header, checkbox) {
    if (checkbox.checked) {
        smpsSelectedColumns.add(header);
    } else {
        smpsSelectedColumns.delete(header);
    }
    
    updateSMPSColumnCount();
    renderSMPSDataTable(smpsOriginalData);
}

function toggleSMPSRow(rowIndex, checkbox) {
    if (rowIndex < 2) {
        checkbox.checked = true;
        return; 
    }
    
    if (checkbox.checked) {
        smpsSelectedRows.add(rowIndex);
    } else {
        smpsSelectedRows.delete(rowIndex);
    }
    
    updateSMPSRowCount();
    renderSMPSDataTable(smpsOriginalData);
}

function updateSMPSColumnCount() {
    document.getElementById("smpsSelectedCount").textContent = smpsSelectedColumns.size;
    document.getElementById("smpsTotalCount").textContent = smpsAllHeaders.length;
}

function updateSMPSRowCount() {
    document.getElementById("smpsSelectedRowCount").textContent = smpsSelectedRows.size;
    document.getElementById("smpsTotalRowCount").textContent = smpsAllRows.length;
}

function toggleAllSMPSColumns(select) {
    const checkboxes = document.querySelectorAll('#smpsCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = select;
        const header = checkbox.id.replace('smps-chk-', '');
        if (select) {
            smpsSelectedColumns.add(header);
        } else {
            smpsSelectedColumns.delete(header);
        }
    });
    
    updateSMPSColumnCount();
    renderSMPSDataTable(smpsOriginalData);
}

function toggleAllSMPSRows(select) {
    const checkboxes = document.querySelectorAll('#smpsRowCheckboxes input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
        if (index < 2) {
            checkbox.checked = true;
            smpsSelectedRows.add(index);
            return;
        }
        
        checkbox.checked = select;
        if (select) {
            smpsSelectedRows.add(index);
        } else {
            smpsSelectedRows.delete(index);
        }
    });
    
    updateSMPSRowCount();
    renderSMPSDataTable(smpsOriginalData);
}

function renderSMPSDataTable(data) {
    const table = document.getElementById("smpsDataTable");
    table.innerHTML = '';

    const mainHeaderRow = document.createElement('tr');
    smpsAllHeaders.forEach(header => {
        if (!smpsSelectedColumns.has(header)) return;
        
        const th = document.createElement('th');
        th.textContent = data[0][header];
        mainHeaderRow.appendChild(th);
    });
    table.appendChild(mainHeaderRow);

    data.slice(1).forEach((row, indexOffset) => {
        const index = indexOffset + 1;
        if (!smpsSelectedRows.has(index)) return;
        
        const tr = document.createElement('tr');
        
        if (index === 1) {
            tr.classList.add('smps-highlight-row');
            tr.style.backgroundColor = 'rgba(255, 249, 219, 0.2)';
            tr.style.fontWeight = 'bold';
        } else if (index > 1 && (index - 2) % 2 === 0) {
        }

        if (index > 1 && (index - 2) % 5 === 0) {
            tr.classList.add('smps-highlight-row');
        }
        
        smpsAllHeaders.forEach(header => {
            if (!smpsSelectedColumns.has(header)) return;
            
            const td = document.createElement('td');
            td.textContent = row[header] || "";
            td.style.textAlign = 'center';

            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
}

function downloadSMPSExcel() {
    let csvContent = "";
    
    const headers = Array.from(smpsSelectedColumns);
    
    const headerRowData = headers.map(header => smpsOriginalData[0][header] || "");
    csvContent += headerRowData.map(value => `"${value.toString().replace(/"/g, '""')}"`).join(",") + "\n";

    const subHeaderRowData = headers.map(header => smpsOriginalData[1][header] || "");
    csvContent += subHeaderRowData.map(value => `"${value.toString().replace(/"/g, '""')}"`).join(",") + "\n";
    
    smpsOriginalData.slice(2).forEach((row, indexOffset) => {
        const index = indexOffset + 2;
        if (!smpsSelectedRows.has(index)) return;
        
        const rowData = headers.map(header => {
            const value = row[header] || "";
            return `"${value.toString().replace(/"/g, '""')}"`;
        });
        csvContent += rowData.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SMPS_Class12th_Data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =============================================
// ACTIVITY POPUP FUNCTIONS
// =============================================

function showActivityPopup() {
    document.getElementById('activityPopup').style.display = 'block';
    loadActivityData();
}

function closeActivityPopup() {
    document.getElementById('activityPopup').style.display = 'none';
}

async function loadActivityData() {
    try {
        const response = await fetch(`${API_BASE}/${SHEET_ID}/Activity`);
        const data = await response.json();
        
        const class12thActivities = data.filter(row => 
            isClass12th(row.Class) || isClass12th(row['Select Class'])
        );
        
        displayActivityData(class12thActivities);
    } catch (error) {
        console.error('Error fetching activity data:', error);
        document.getElementById('activityContent').innerHTML = 
            '<p>Error loading activities. Please try again later.</p>';
    }
}

function displayActivityData(activities) {
    const activityContent = document.getElementById('activityContent');
    
    if (activities.length === 0) {
        activityContent.innerHTML = '<p>No activities available for Class 12th.</p>';
        return;
    }

    let html = '<div class="activity-grid">';
    
    activities.forEach(activity => {
        const activityName = activity["Activity Name"] || 'Untitled Activity';
        const subject = activity.Subject || 'General';
        const description = activity.Description || 'No description available';
        const link = activity.Link || '';
        const status = activity.Status || '';
        const date = activity.Date || '';
        
        html += `
            <div class="activity-card clickable-row" data-link="${link}" onclick="openRowLink('${link.replace(/'/g, "\\'")}')" style="cursor: ${link ? 'pointer' : 'default'};">
                <div class="activity-header">
                    <h3 class="activity-title">${activityName}</h3>
                    <span class="activity-subject">${subject}</span>
                </div>
                <div class="activity-body">
                    <p class="activity-description">${description}</p>
                    <div class="activity-meta">
                        ${date ? `<span class="activity-date"><i class="fas fa-calendar"></i> ${date}</span>` : ''}
                        ${status ? `<span class="activity-status ${status.toLowerCase()}">${status}</span>` : ''}
                    </div>
                </div>
                ${link ? `
                <div class="activity-footer">
                    <a href="${link}" target="_blank" class="activity-link" onclick="event.stopPropagation()">
                        <i class="fas fa-external-link-alt"></i> View Activity
                    </a>
                </div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    activityContent.innerHTML = html;
}

document.getElementById('activityPopup').addEventListener('click', function(e) {
    if (e.target === this) {
        closeActivityPopup();
    }
});
// =============================================
// SYLLABUS PORTAL FUNCTIONS
// =============================================

function showSyllabus() {
    // Create the syllabus popup HTML
    const syllabusHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Saiema Mansoor Public School - Syllabus Portal</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
            
            <style>
                /* Base Styles */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                    color: #333;
                    min-height: 100vh;
                    padding: 10px;
                }
                
                /* Main Container */
                .main-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: rgba(255, 255, 255, 0.98);
                    border-radius: 15px;
                    box-shadow: 0 15px 40px rgba(220, 38, 38, 0.25);
                    overflow: hidden;
                    position: relative;
                }
                
                /* Header */
                .header {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    color: white;
                    padding: 25px 20px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
                    background-size: 40px 40px;
                    animation: float 20s linear infinite;
                    opacity: 0.3;
                }
                
                @keyframes float {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    100% { transform: translate(-40px, -40px) rotate(360deg); }
                }
                
                .logo-container {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    margin-bottom: 15px;
                    box-shadow: 0 8px 20px rgba(220, 38, 38, 0.2);
                    border: 4px solid #dc2626;
                }
                
                .school-logo {
                    width: 55px;
                    height: 55px;
                    border-radius: 50%;
                    object-fit: cover;
                }
                
                .header h1 {
                    font-size: 2rem;
                    margin-bottom: 8px;
                    font-weight: 800;
                    text-shadow: 0 3px 5px rgba(0, 0, 0, 0.3);
                    letter-spacing: -0.5px;
                }
                
                .header p {
                    font-size: 1rem;
                    opacity: 0.9;
                    max-width: 600px;
                    margin: 0 auto;
                    line-height: 1.4;
                }
                
                .syllabus-title {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 15px;
                    font-size: 1.2rem;
                    background: rgba(255, 255, 255, 0.15);
                    padding: 10px 20px;
                    border-radius: 40px;
                    display: inline-flex;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                /* Controls Section */
                .controls-section {
                    padding: 20px 15px;
                    background: white;
                    border-bottom: 1px solid #fecaca;
                }
                
                .filters-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .filter-group label {
                    font-weight: 600;
                    color: #dc2626;
                    font-size: 0.95rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .filter-select {
                    padding: 12px 15px;
                    border: 2px solid #fecaca;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    background: white;
                    color: #6b7280;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 500;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 15px center;
                    background-size: 14px;
                    padding-right: 40px;
                }
                
                .filter-select:focus {
                    outline: none;
                    border-color: #dc2626;
                    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
                }
                
                .filter-select:hover {
                    border-color: #ef4444;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .btn {
                    padding: 12px 25px;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    color: white;
                    box-shadow: 0 3px 10px rgba(220, 38, 38, 0.3);
                }
                
                .btn-primary:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(220, 38, 38, 0.4);
                }
                
                .btn-secondary {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #fecaca;
                }
                
                .btn-secondary:hover {
                    background: #fecaca;
                    transform: translateY(-3px);
                }
                
                /* Syllabus Container */
                .syllabus-container {
                    padding: 20px 15px;
                    background: #fef2f2;
                    min-height: 400px;
                }
                
                .chapter-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .chapter-card {
                    background: white;
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow: 0 3px 15px rgba(220, 38, 38, 0.08);
                    border: 1px solid #fecaca;
                    transition: all 0.3s ease;
                }
                
                .chapter-card:hover {
                    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.12);
                    transform: translateY(-2px);
                }
                
                .chapter-header {
                    padding: 18px 20px;
                    background: white;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: #1f2937;
                    border-bottom: 2px solid transparent;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .chapter-header:hover {
                    background: #fef2f2;
                }
                
                .chapter-header::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: linear-gradient(90deg, #dc2626, #b91c1c);
                    transform: scaleX(0);
                    transition: transform 0.3s ease;
                }
                
                .chapter-header:hover::after {
                    transform: scaleX(1);
                }
                
                .chapter-title {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                    flex: 1;
                }
                
                @media (min-width: 481px) {
                    .chapter-title {
                        flex-direction: row;
                        align-items: center;
                        gap: 15px;
                    }
                }
                
                .class-badge {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    color: white;
                    padding: 5px 12px;
                    border-radius: 16px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    min-width: 60px;
                    text-align: center;
                    white-space: nowrap;
                }
                
                .chapter-name {
                    flex: 1;
                    word-break: break-word;
                }
                
                .toggle-icon {
                    color: #dc2626;
                    font-size: 1.1rem;
                    transition: transform 0.3s ease;
                    min-width: 20px;
                }
                
                .chapter-content {
                    display: none;
                    padding: 20px;
                    background: #fef2f2;
                    border-top: 1px solid #fecaca;
                }
                
                .chapter-content.active {
                    display: block;
                    animation: slideDown 0.3s ease;
                }
                
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .syllabus-items {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .syllabus-item {
                    background: white;
                    padding: 15px;
                    border-radius: 10px;
                    border: 1px solid #fecaca;
                }
                
                .syllabus-item-header {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #fecaca;
                }
                
                @media (min-width: 481px) {
                    .syllabus-item-header {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }
                }
                
                .subject-badge {
                    background: #ef4444;
                    color: white;
                    padding: 5px 12px;
                    border-radius: 16px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-align: center;
                }
                
                .exam-badge {
                    background: #f87171;
                    color: white;
                    padding: 5px 12px;
                    border-radius: 16px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-align: center;
                }
                
                .syllabus-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 12px;
                    margin-bottom: 15px;
                }
                
                .detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .detail-label {
                    font-size: 0.8rem;
                    color: #6b7280;
                    font-weight: 500;
                }
                
                .detail-value {
                    font-size: 0.95rem;
                    color: #1f2937;
                    font-weight: 600;
                    word-break: break-word;
                }
                
                .resource-links {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #fecaca;
                }
                
                @media (min-width: 481px) {
                    .resource-links {
                        flex-direction: row;
                        flex-wrap: wrap;
                    }
                }
                
                .resource-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 14px;
                    background: #fef2f2;
                    border-radius: 8px;
                    text-decoration: none;
                    color: #991b1b;
                    font-weight: 500;
                    font-size: 0.85rem;
                    border: 1px solid #fecaca;
                    transition: all 0.3s ease;
                    text-align: center;
                    justify-content: center;
                    flex: 1;
                    min-width: 0;
                }
                
                @media (min-width: 481px) {
                    .resource-link {
                        flex: 0 1 auto;
                        min-width: 140px;
                    }
                }
                
                .resource-link:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 3px 10px rgba(220, 38, 38, 0.1);
                    background: #fee2e2;
                }
                
                .resource-link i {
                    font-size: 1rem;
                    color: #dc2626;
                }
                
                .links-container {
                    margin-top: 15px;
                }
                
                .links-section {
                    margin-bottom: 15px;
                }
                
                .links-section h4 {
                    font-size: 0.9rem;
                    color: #991b1b;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .links-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                @media (min-width: 481px) {
                    .links-list {
                        flex-direction: row;
                        flex-wrap: wrap;
                    }
                }
                
                .link-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 7px 10px;
                    background: #fee2e2;
                    border-radius: 6px;
                    text-decoration: none;
                    color: #991b1b;
                    font-size: 0.8rem;
                    transition: all 0.2s ease;
                    flex: 1;
                    justify-content: center;
                }
                
                @media (min-width: 481px) {
                    .link-item {
                        flex: 0 1 auto;
                    }
                }
                
                .link-item:hover {
                    background: #fecaca;
                    transform: translateY(-1px);
                }
                
                .link-item i {
                    font-size: 0.85rem;
                    color: #dc2626;
                }
                
                .exercise-section {
                    background: #fee2e2;
                    padding: 12px;
                    border-radius: 8px;
                    margin-top: 15px;
                    border-left: 4px solid #ef4444;
                }
                
                .exercise-title {
                    font-weight: 600;
                    color: #991b1b;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.9rem;
                }
                
                .exercise-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .exercise-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 6px 0;
                    border-bottom: 1px dashed #fca5a5;
                }
                
                @media (min-width: 481px) {
                    .exercise-item {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }
                }
                
                .exercise-item:last-child {
                    border-bottom: none;
                }
                
                /* Loading State */
                .loading-container {
                    text-align: center;
                    padding: 50px 15px;
                }
                
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #fecaca;
                    border-top-color: #dc2626;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .loading-container h3 {
                    color: #991b1b;
                    margin-bottom: 8px;
                    font-size: 1.1rem;
                }
                
                .loading-container p {
                    font-size: 0.9rem;
                    color: #991b1b;
                }
                
                /* Error State */
                .error-container {
                    text-align: center;
                    padding: 50px 15px;
                    background: #fef2f2;
                    border-radius: 14px;
                    border: 1px solid #fecaca;
                }
                
                .error-container h3 {
                    color: #dc2626;
                    margin-bottom: 12px;
                    font-size: 1.1rem;
                }
                
                .error-container p {
                    font-size: 0.9rem;
                    color: #991b1b;
                }
                
                /* Empty State */
                .empty-container {
                    text-align: center;
                    padding: 50px 15px;
                    background: #fef2f2;
                    border-radius: 14px;
                    border: 2px dashed #fca5a5;
                }
                
                .empty-container h3 {
                    color: #991b1b;
                    margin-bottom: 8px;
                    font-size: 1.1rem;
                }
                
                .empty-container p {
                    font-size: 0.9rem;
                    line-height: 1.5;
                    color: #991b1b;
                }
                
                /* Footer */
                .footer {
                    background: #1f2937;
                    color: white;
                    padding: 25px 15px;
                    text-align: center;
                }
                
                .footer-content {
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .footer p {
                    margin-bottom: 12px;
                    color: #d1d5db;
                    line-height: 1.5;
                    font-size: 0.9rem;
                }
                
                .contact-info {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin-top: 20px;
                    align-items: center;
                }
                
                @media (min-width: 481px) {
                    .contact-info {
                        flex-direction: row;
                        justify-content: center;
                        gap: 25px;
                    }
                }
                
                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #cbd5e1;
                    text-decoration: none;
                    transition: color 0.3s ease;
                    font-size: 0.9rem;
                }
                
                .contact-item:hover {
                    color: white;
                }
                
                .copyright {
                    margin-top: 25px;
                    padding-top: 15px;
                    border-top: 1px solid #374151;
                    color: #9ca3af;
                    font-size: 0.85rem;
                }
                
                /* Responsive Design */
                @media (max-width: 480px) {
                    .header h1 {
                        font-size: 1.7rem;
                    }
                    
                    .syllabus-title {
                        font-size: 1.1rem;
                        padding: 8px 16px;
                    }
                    
                    .syllabus-details {
                        grid-template-columns: 1fr;
                    }
                }
                
                @media (min-width: 769px) {
                    body {
                        padding: 20px;
                    }
                    
                    .header {
                        padding: 30px 40px;
                    }
                    
                    .header h1 {
                        font-size: 2.8rem;
                        margin-bottom: 10px;
                    }
                    
                    .header p {
                        font-size: 1.2rem;
                    }
                    
                    .logo-container {
                        width: 100px;
                        height: 100px;
                        margin-bottom: 20px;
                    }
                    
                    .school-logo {
                        width: 70px;
                        height: 70px;
                    }
                    
                    .syllabus-title {
                        font-size: 1.5rem;
                        padding: 12px 30px;
                        margin-top: 20px;
                    }
                    
                    .controls-section {
                        padding: 30px 40px;
                    }
                    
                    .filters-grid {
                        gap: 20px;
                        margin-bottom: 25px;
                    }
                    
                    .filter-group label {
                        font-size: 1rem;
                    }
                    
                    .filter-select {
                        padding: 14px 18px;
                        font-size: 1rem;
                        padding-right: 45px;
                    }
                    
                    .syllabus-container {
                        padding: 30px 40px;
                    }
                    
                    .chapter-grid {
                        gap: 20px;
                    }
                    
                    .chapter-card {
                        border-radius: 16px;
                    }
                    
                    .chapter-header {
                        padding: 22px 30px;
                        font-size: 1.2rem;
                    }
                    
                    .chapter-content {
                        padding: 30px;
                    }
                    
                    .syllabus-items {
                        gap: 20px;
                    }
                    
                    .syllabus-item {
                        padding: 20px;
                    }
                    
                    .resource-links {
                        gap: 15px;
                    }
                    
                    .resource-link {
                        padding: 10px 16px;
                        font-size: 0.9rem;
                    }
                    
                    .footer {
                        padding: 30px 40px;
                    }
                }
                
                /* Print Styles */
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    
                    .main-container {
                        box-shadow: none;
                        border-radius: 0;
                    }
                    
                    .action-buttons,
                    .btn,
                    .toggle-icon,
                    .resource-links,
                    .link-item {
                        display: none !important;
                    }
                    
                    .chapter-content {
                        display: block !important;
                    }
                    
                    .chapter-header {
                        border-bottom: 2px solid #dc2626;
                    }
                    
                    .footer {
                        background: white;
                        color: black;
                        border-top: 2px solid #dc2626;
                    }
                    
                    .contact-item {
                        color: black;
                    }
                }
            </style>
        </head>
        <body>
            <div class="main-container">
                <!-- Header -->
                <div class="header">
                    <div class="logo-container">
                        <img src="images/smps_logo.jpg" alt="School Logo" class="school-logo">
                    </div>
                    <h1>Saiema Mansoor Public School</h1>
                    <p>Excellence in Education Since 1995</p>
                    <div class="syllabus-title">
                        <i class="fas fa-book-open"></i>
                        Exam Syllabus Portal - 12th Class
                    </div>
                </div>

                <!-- Controls Section -->
                <div class="controls-section">
                    <div class="filters-grid">
                        <!-- Class filter removed as requested -->
                        
                        <div class="filter-group">
                            <label for="subjectFilter">
                                <i class="fas fa-book"></i>
                                Subject:
                            </label>
                            <select id="subjectFilter" class="filter-select" onchange="applyFilters()">
                                <option value="">-- All Subjects --</option>
                                <!-- Will be populated by JavaScript -->
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="examFilter">
                                <i class="fas fa-file-alt"></i>
                                Exam:
                            </label>
                            <select id="examFilter" class="filter-select" onchange="applyFilters()">
                                <option value="">-- All Exams --</option>
                                <!-- Will be populated by JavaScript -->
                            </select>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-secondary" onclick="downloadPDF()">
                            <i class="fas fa-download"></i>
                            Download PDF
                        </button>
                        <button class="btn btn-secondary" onclick="clearFilters()">
                            <i class="fas fa-times"></i>
                            Clear Filters
                        </button>
                    </div>
                </div>

                <!-- Syllabus Container -->
                <div class="syllabus-container">
                    <div id="syllabusContent" class="chapter-grid">
                        <div class="loading-container">
                            <div class="spinner"></div>
                            <h3>Loading Syllabus Data...</h3>
                            <p>Please wait while we fetch the latest syllabus information</p>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <div class="footer-content">
                        <p>© 2023 Saiema Mansoor Public School. All Rights Reserved.</p>
                        <p>This syllabus portal provides comprehensive exam preparation materials for students and teachers.</p>
                        
                        <div class="contact-info">
                            <a href="https://maps.google.com/?q=Main Campus, Education City, Mumbai" class="contact-item" target="_blank">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>Main Campus, Education City, Mumbai</span>
                            </a>
                            <a href="tel:+917275126421" class="contact-item">
                                <i class="fas fa-phone"></i>
                                <span>+91 72751 26421</span>
                            </a>
                            <a href="mailto:info@smps.edu.in" class="contact-item">
                                <i class="fas fa-envelope"></i>
                                <span>info@smps.edu.in</span>
                            </a>
                        </div>
                        
                        <div class="copyright">
                            Designed for academic excellence and efficient learning
                        </div>
                    </div>
                </div>
            </div>

            <script>
                // API Configuration
                const API_URL = "https://opensheet.elk.sh/1FUpqRyVWcQZGK8bPuXEd12f-4xU7h6M9VUHlG4rMlnw/Syllabus";
                let syllabusData = [];
                let groupedChapters = {};

                // Initialize on page load
                window.onload = function() {
                    loadSyllabusData();
                };

                // Apply filters automatically when any dropdown changes
                function applyFilters() {
                    renderSyllabus();
                }

                // Load syllabus data from API
                async function loadSyllabusData() {
                    try {
                        const response = await fetch(API_URL);
                        if (!response.ok) throw new Error('Failed to fetch data');
                        
                        const data = await response.json();
                        
                        // Filter for 12th class only and valid rows
                        syllabusData = data.filter(row => 
                            row.Class && row.Class.trim().toUpperCase() === '12TH' &&
                            row.Chapter_Name && row.Chapter_Name.trim() !== '' &&
                            row.Subject && row.Subject.trim() !== ''
                        );
                        
                        if (syllabusData.length === 0) {
                            showEmptyState();
                            return;
                        }
                        
                        // Sort by date (newest first)
                        syllabusData.sort((a, b) => {
                            const dateA = new Date(a.Date || 0);
                            const dateB = new Date(b.Date || 0);
                            return dateB - dateA;
                        });
                        
                        initializeFilters();
                        groupChaptersByClass();
                        renderSyllabus();
                        
                    } catch (error) {
                        console.error('Error loading syllabus data:', error);
                        showErrorState();
                    }
                }

                // Initialize filter dropdowns
                function initializeFilters() {
                    const subjectFilter = document.getElementById('subjectFilter');
                    const examFilter = document.getElementById('examFilter');
                    
                    // Clear existing options except the first one
                    while (subjectFilter.options.length > 1) subjectFilter.remove(1);
                    while (examFilter.options.length > 1) examFilter.remove(1);
                    
                    // Get unique subjects
                    const subjects = [...new Set(syllabusData.map(row => row.Subject))].filter(s => s && s.trim() !== '');
                    subjects.sort();
                    subjects.forEach(subject => {
                        const option = document.createElement('option');
                        option.value = subject;
                        option.textContent = subject;
                        subjectFilter.appendChild(option);
                    });
                    
                    // Get unique exams from data
                    const exams = [...new Set(syllabusData.map(row => row.Exam))].filter(exam => exam && exam.trim() !== '');
                    exams.sort();
                    exams.forEach(exam => {
                        const option = document.createElement('option');
                        option.value = exam;
                        option.textContent = exam;
                        examFilter.appendChild(option);
                    });
                }

                // Group chapters by class and name
                function groupChaptersByClass() {
                    groupedChapters = {};
                    
                    syllabusData.forEach(row => {
                        const key = \`\${row.Class}||\${row.Chapter_Name}\`;
                        
                        if (!groupedChapters[key]) {
                            groupedChapters[key] = [];
                        }
                        
                        groupedChapters[key].push(row);
                    });
                }

                // Render syllabus based on filters
                function renderSyllabus() {
                    const subjectFilter = document.getElementById('subjectFilter').value;
                    const examFilter = document.getElementById('examFilter').value;
                    const container = document.getElementById('syllabusContent');
                    
                    // Clear container
                    container.innerHTML = '';
                    
                    // If no data yet
                    if (Object.keys(groupedChapters).length === 0) {
                        container.innerHTML = \`
                            <div class="loading-container">
                                <div class="spinner"></div>
                                <h3>Loading Syllabus Data...</h3>
                                <p>Please wait while we fetch the latest syllabus information</p>
                            </div>
                        \`;
                        return;
                    }
                    
                    let hasMatchingChapters = false;
                    let chaptersHTML = '';
                    
                    // Iterate through grouped chapters (only 12th class)
                    Object.keys(groupedChapters).forEach(key => {
                        const [className, chapterName] = key.split('||');
                        const rows = groupedChapters[key];
                        
                        // Apply filters cumulatively
                        let filteredRows = rows;
                        
                        // Filter by subject if selected
                        if (subjectFilter) {
                            filteredRows = filteredRows.filter(row => row.Subject === subjectFilter);
                        }
                        
                        // Filter by exam if selected
                        if (examFilter) {
                            filteredRows = filteredRows.filter(row => row.Exam === examFilter);
                        }
                        
                        if (filteredRows.length === 0) return;
                        
                        hasMatchingChapters = true;
                        
                        // Generate chapter HTML
                        chaptersHTML += \`
                            <div class="chapter-card">
                                <div class="chapter-header" onclick="toggleChapter(this)">
                                    <div class="chapter-title">
                                        <span class="class-badge">\${className}</span>
                                        <span class="chapter-name">\${chapterName}</span>
                                    </div>
                                    <span class="toggle-icon">▼</span>
                                </div>
                                <div class="chapter-content">
                                    <div class="syllabus-items">
                                        \${filteredRows.map(row => renderSyllabusItem(row)).join('')}
                                    </div>
                                </div>
                            </div>
                        \`;
                    });
                    
                    // Show appropriate message
                    if (!hasMatchingChapters) {
                        container.innerHTML = \`
                            <div class="empty-container">
                                <i class="fas fa-search" style="font-size: 2.5rem; color: #dc2626; margin-bottom: 15px;"></i>
                                <h3>No Matching Chapters Found</h3>
                                <p>Try adjusting your filters or select different criteria.</p>
                            </div>
                        \`;
                    } else {
                        container.innerHTML = chaptersHTML;
                    }
                }

                // Helper function to parse and clean links
                function parseLinks(linksString) {
                    if (!linksString) return [];
                    
                    // Split by semicolon and clean up
                    const links = linksString.split(';')
                        .map(link => link.trim())
                        .filter(link => link && link !== '')
                        .filter(link => {
                            // Remove common unwanted patterns
                            const unwantedPatterns = [
                                'NOT GIVEN',
                                'NOT GIVEN YET',
                                'NOT PROVIDED',
                                'NA',
                                'N/A',
                                'NULL',
                                'TBA',
                                'TBD',
                                'COMING SOON'
                            ];
                            return !unwantedPatterns.some(pattern => 
                                link.toUpperCase().includes(pattern)
                            );
                        });
                    
                    return links;
                }

                // Render individual syllabus item
                function renderSyllabusItem(row) {
                    const exercise = row.Exercise || '';
                    const qFrom = row.Q_From || '';
                    const qTo = row.Q_To || '';
                    const filesLinks = row.Files_Links || '';
                    const ytLinks = row.YT_Links || '';
                    
                    // Parse links
                    const pdfLinks = parseLinks(filesLinks);
                    const youtubeLinks = parseLinks(ytLinks);
                    
                    // Generate exercise HTML
                    let exerciseHTML = '';
                    
                    if (exercise && exercise.includes(';')) {
                        // Multiple exercises
                        const exercises = exercise.split(';').map(e => e.trim()).filter(e => e);
                        const qFromArray = qFrom.split(';').map(q => q.trim()).filter(q => q);
                        const qToArray = qTo.split(';').map(q => q.trim()).filter(q => q);
                        
                        exerciseHTML = '<div class="exercise-section">';
                        exerciseHTML += '<div class="exercise-title"><i class="fas fa-list-check"></i> Exercises</div>';
                        exerciseHTML += '<div class="exercise-list">';
                        
                        exercises.forEach((ex, index) => {
                            const fromQ = qFromArray[index] || '';
                            const toQ = qToArray[index] || '';
                            
                            if (fromQ && toQ) {
                                exerciseHTML += \`
                                    <div class="exercise-item">
                                        <span>Exercise \${ex}</span>
                                        <span>Questions \${fromQ}-\${toQ}</span>
                                    </div>
                                \`;
                            } else if (fromQ) {
                                exerciseHTML += \`
                                    <div class="exercise-item">
                                        <span>Exercise \${ex}</span>
                                        <span>Question \${fromQ}</span>
                                    </div>
                                \`;
                            }
                        });
                        
                        exerciseHTML += '</div></div>';
                    } else if (exercise && qFrom && qTo) {
                        // Single exercise
                        exerciseHTML = \`
                            <div class="exercise-section">
                                <div class="exercise-title"><i class="fas fa-list-check"></i> Exercise</div>
                                <div class="exercise-list">
                                    <div class="exercise-item">
                                        <span>Exercise \${exercise}</span>
                                        <span>Questions \${qFrom}-\${qTo}</span>
                                    </div>
                                </div>
                            </div>
                        \`;
                    }
                    
                    // Generate resource links HTML (only quick access links)
                    let quickResourcesHTML = '';
                    if (pdfLinks.length > 0 || youtubeLinks.length > 0) {
                        quickResourcesHTML = '<div class="resource-links">';
                        
                        if (pdfLinks.length > 0) {
                            quickResourcesHTML += \`
                                <a href="\${pdfLinks[0]}" target="_blank" class="resource-link">
                                    <i class="fas fa-file-pdf" style="color: #dc2626;"></i>
                                    View Study Material
                                </a>
                            \`;
                        }
                        
                        if (youtubeLinks.length > 0) {
                            quickResourcesHTML += \`
                                <a href="\${youtubeLinks[0]}" target="_blank" class="resource-link">
                                    <i class="fab fa-youtube" style="color: #dc2626;"></i>
                                    Watch Video Lesson
                                </a>
                            \`;
                        }
                        
                        quickResourcesHTML += '</div>';
                    }
                    
                    return \`
                        <div class="syllabus-item">
                            <div class="syllabus-item-header">
                                <span class="subject-badge">\${row.Subject || 'N/A'}</span>
                                <span class="exam-badge">\${row.Exam || 'N/A'}</span>
                            </div>
                            
                            <div class="syllabus-details">
                                <div class="detail-item">
                                    <span class="detail-label">Marks Weightage</span>
                                    <span class="detail-value">\${row.Marks_Weightage || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Important Topics</span>
                                    <span class="detail-value">\${row.Important_Topic || 'N/A'}</span>
                                </div>
                            </div>
                            
                            \${quickResourcesHTML}
                            \${exerciseHTML}
                        </div>
                    \`;
                }

                // Toggle chapter expansion
                function toggleChapter(element) {
                    const content = element.nextElementSibling;
                    const icon = element.querySelector('.toggle-icon');
                    
                    if (content.classList.contains('active')) {
                        content.classList.remove('active');
                        icon.textContent = '▼';
                    } else {
                        content.classList.add('active');
                        icon.textContent = '▲';
                    }
                }

                // Download PDF without links and dates
                function downloadPDF() {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF('p', 'mm', 'a4');
                    
                    // School Header
                    doc.setFontSize(22);
                    doc.setTextColor(220, 38, 38);
                    doc.setFont('helvetica', 'bold');
                    doc.text("Saiema Mansoor Public School", 105, 20, { align: 'center' });
                    
                    doc.setFontSize(16);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'normal');
                    doc.text("12th Class Exam Syllabus Report", 105, 30, { align: 'center' });
                    
                    // Filter Information
                    const subjectFilter = document.getElementById('subjectFilter').value;
                    const examFilter = document.getElementById('examFilter').value;
                    
                    let filterText = 'Showing: ';
                    if (subjectFilter) filterText += \`Subject \${subjectFilter} \`;
                    if (examFilter) filterText += \`Exam \${examFilter}\`;
                    
                    doc.setFontSize(10);
                    doc.setTextColor(100, 100, 100);
                    doc.text(filterText, 105, 38, { align: 'center' });
                    
                    // Generation Date
                    doc.text(\`Generated on: \${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}\`, 105, 44, { align: 'center' });
                    
                    // Add syllabus content
                    let yPosition = 60;
                    const pageWidth = doc.internal.pageSize.width;
                    const margin = 20;
                    const contentWidth = pageWidth - 2 * margin;
                    
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'bold');
                    
                    // Get visible chapters
                    const chapters = document.querySelectorAll('.chapter-card');
                    
                    if (chapters.length === 0) {
                        doc.setFontSize(14);
                        doc.setTextColor(150, 150, 150);
                        doc.text("No syllabus data to export", 105, 100, { align: 'center' });
                        doc.save("SMPS_Syllabus_Export.pdf");
                        return;
                    }
                    
                    chapters.forEach((chapter, index) => {
                        // Check if we need a new page
                        if (yPosition > 270) {
                            doc.addPage();
                            yPosition = 20;
                        }
                        
                        const header = chapter.querySelector('.chapter-header');
                        const className = header.querySelector('.class-badge').textContent;
                        const chapterName = header.querySelector('.chapter-name').textContent;
                        
                        // Add chapter title
                        doc.setFontSize(14);
                        doc.setTextColor(220, 38, 38);
                        doc.text(\`\${className} - \${chapterName}\`, margin, yPosition);
                        yPosition += 10;
                        
                        // Get syllabus items
                        const syllabusItems = chapter.querySelectorAll('.syllabus-item');
                        
                        syllabusItems.forEach(item => {
                            if (yPosition > 270) {
                                doc.addPage();
                                yPosition = 20;
                            }
                            
                            const subject = item.querySelector('.subject-badge').textContent;
                            const exam = item.querySelector('.exam-badge').textContent;
                            
                            // Add subject and exam
                            doc.setFontSize(11);
                            doc.setTextColor(0, 0, 0);
                            doc.setFont('helvetica', 'bold');
                            doc.text(\`Subject: \${subject}\`, margin, yPosition);
                            doc.text(\`Exam: \${exam}\`, margin + 80, yPosition);
                            yPosition += 8;
                            
                            // Add details
                            const details = item.querySelectorAll('.detail-item');
                            details.forEach(detail => {
                                if (yPosition > 270) {
                                    doc.addPage();
                                    yPosition = 20;
                                }
                                
                                const label = detail.querySelector('.detail-label').textContent;
                                const value = detail.querySelector('.detail-value').textContent;
                                
                                doc.setFontSize(10);
                                doc.setFont('helvetica', 'normal');
                                doc.text(\`\${label}: \${value}\`, margin, yPosition);
                                yPosition += 6;
                            });
                            
                            // Add exercises if present
                            const exerciseSection = item.querySelector('.exercise-section');
                            if (exerciseSection) {
                                if (yPosition > 270) {
                                    doc.addPage();
                                    yPosition = 20;
                                }
                                
                                doc.setFontSize(10);
                                doc.setFont('helvetica', 'bold');
                                doc.text('Exercises:', margin, yPosition);
                                yPosition += 6;
                                
                                const exercises = exerciseSection.querySelectorAll('.exercise-item');
                                exercises.forEach(exercise => {
                                    if (yPosition > 270) {
                                        doc.addPage();
                                        yPosition = 20;
                                    }
                                    
                                    const text = exercise.textContent.trim();
                                    doc.setFontSize(9);
                                    doc.setFont('helvetica', 'normal');
                                    doc.text(\`• \${text}\`, margin + 5, yPosition);
                                    yPosition += 5;
                                });
                            }
                            
                            yPosition += 10;
                        });
                        
                        yPosition += 5;
                    });
                    
                    // Add page numbers
                    const totalPages = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= totalPages; i++) {
                        doc.setPage(i);
                        doc.setFontSize(8);
                        doc.setTextColor(150, 150, 150);
                        doc.text(\`Page \${i} of \${totalPages}\`, pageWidth - margin, 290, { align: 'right' });
                    }
                    
                    // Save PDF
                    const subjectText = subjectFilter ? \`_\${subjectFilter}\` : '';
                    const examText = examFilter ? \`_\${examFilter}\` : '';
                    const fileName = \`SMPS_12th_Syllabus\${subjectText}\${examText}_\${new Date().toISOString().slice(0, 10)}.pdf\`;
                    doc.save(fileName);
                }

                // Clear all filters
                function clearFilters() {
                    document.getElementById('subjectFilter').value = "";
                    document.getElementById('examFilter').value = "";
                    renderSyllabus();
                }

                // Show error state
                function showErrorState() {
                    const container = document.getElementById('syllabusContent');
                    container.innerHTML = \`
                        <div class="error-container">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #dc2626; margin-bottom: 15px;"></i>
                            <h3>Error Loading Syllabus Data</h3>
                            <p>Unable to connect to the syllabus database. Please try again later or contact support.</p>
                            <button class="btn btn-primary" onclick="loadSyllabusData()" style="margin-top: 20px;">
                                <i class="fas fa-sync-alt"></i> Retry Loading
                            </button>
                        </div>
                    \`;
                }

                // Show empty state (no 12th class data)
                function showEmptyState() {
                    const container = document.getElementById('syllabusContent');
                    container.innerHTML = \`
                        <div class="empty-container">
                            <i class="fas fa-graduation-cap" style="font-size: 2.5rem; color: #dc2626; margin-bottom: 15px;"></i>
                            <h3>No 12th Class Syllabus Data Available</h3>
                            <p>Currently, there is no syllabus data available for the 12th class.</p>
                            <p>Please check back later or contact the administration.</p>
                        </div>
                    \`;
                }
            </script>
        </body>
        </html>
    `;
    
    // Create a new popup container for syllabus
    const syllabusPopup = document.createElement('div');
    syllabusPopup.id = 'syllabusPopup';
    syllabusPopup.className = 'syllabus-popup-modal';
    syllabusPopup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    const syllabusContent = document.createElement('div');
    syllabusContent.id = 'syllabusPopupContent';
    syllabusContent.className = 'syllabus-popup-content';
    syllabusContent.style.cssText = `
        background: white;
        width: 95%;
        height: 95%;
        border-radius: 15px;
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 15px 20px;
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #dc2626;
    `;
    
    const title = document.createElement('h2');
    title.innerHTML = '<i class="fas fa-book-open"></i> Syllabus Portal - Class 12th';
    title.style.margin = '0';
    title.style.fontSize = '1.5rem';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.3s;
    `;
    closeBtn.onmouseover = function() { this.style.background = 'rgba(255,255,255,0.2)'; };
    closeBtn.onmouseout = function() { this.style.background = 'none'; };
    closeBtn.onclick = function() {
        document.body.removeChild(syllabusPopup);
        document.body.style.overflow = 'auto';
    };
    
    const iframeContainer = document.createElement('div');
    iframeContainer.style.cssText = `
        flex: 1;
        overflow: hidden;
        position: relative;
    `;
    
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        display: block;
    `;
    iframe.srcdoc = syllabusHTML;
    
    // Assemble the popup
    header.appendChild(title);
    header.appendChild(closeBtn);
    iframeContainer.appendChild(iframe);
    syllabusContent.appendChild(header);
    syllabusContent.appendChild(iframeContainer);
    syllabusPopup.appendChild(syllabusContent);
    
    // Add to body and prevent scrolling
    document.body.appendChild(syllabusPopup);
    document.body.style.overflow = 'hidden';
    
    // Close on Escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape' && document.getElementById('syllabusPopup')) {
            document.body.removeChild(syllabusPopup);
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
    
    // Close on outside click
    syllabusPopup.addEventListener('click', function(e) {
        if (e.target === syllabusPopup) {
            document.body.removeChild(syllabusPopup);
            document.body.style.overflow = 'auto';
        }
    });
}

