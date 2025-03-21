document.addEventListener('DOMContentLoaded', () => {
    // Show loading spinner
    document.getElementById('loading').style.display = 'block';

    // Generate decade navigation dynamically
    generateDecadeNavigation();

    // Determine the decade from the URL or file name
    const currentPage = document.location.pathname.split('/').pop();
    const decadeMatch = currentPage.match(/(\d{4})s\.html$/);
    let decade = '';

    if (decadeMatch) {
        decade = decadeMatch[1];
    } else {
        // Default to the current decade if not found in URL
        const currentYear = new Date().getFullYear();
        decade = Math.floor(currentYear / 10) * 10;
    }

    // Fetch and display matches for the detected decade
    if (document.getElementById('data-table-body')) {
        fetchAndDisplayMatches(decade);
    } else {
        fetchAndProcessExcel();
    }

    // Initialize "Back to Top" button
    initializeBackToTopButton();
});

function generateDecadeNavigation() {
    const currentYear = new Date().getFullYear();
    const startDecade = 1900;
    const endDecade = Math.floor(currentYear / 10) * 10;

    const decadeNav = document.getElementById('decade-nav');
    for (let decade = startDecade; decade <= endDecade; decade += 10) {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.innerHTML = `<a class="nav-link" href="${decade}s.html">${decade}s</a>`;
        decadeNav.appendChild(li);
    }
}

function fetchAndProcessExcel() {
    fetch('Cinturão do Futebol Português.xlsx')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // Get the 10 most recent matches
            const recentMatches = getRecentMatches(jsonData, 10);
            displayRecentMatches(recentMatches);

            // Get the most recent winner
            const mostRecentWinner = getMostRecentWinner(jsonData);
            displayMostRecentWinner(mostRecentWinner);

            // Hide loading spinner
            document.getElementById('loading').style.display = 'none';
        })
        .catch(error => {
            console.error('Error fetching the Excel file:', error);
            alert('Failed to load data. Please try again later.');
            document.getElementById('loading').style.display = 'none';
        });
}

function fetchAndDisplayMatches(decade) {
    fetch('Cinturão do Futebol Português.xlsx')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            const filteredData = filterDataByDecade(jsonData, decade);
            generateTable(filteredData);

            // Hide loading spinner
            document.getElementById('loading').style.display = 'none';
        })
        .catch(error => {
            console.error('Error fetching the Excel file:', error);
            alert('Failed to load data. Please try again later.');
            document.getElementById('loading').style.display = 'none';
        });
}

function getRecentMatches(data, count) {
    const sortedData = data.slice(1).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    return sortedData.slice(0, count);
}

function getMostRecentWinner(data) {
    const sortedData = data.slice(1).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    const mostRecentMatch = sortedData[0];
    if (mostRecentMatch) {
        return mostRecentMatch[7];
    }
    return null;
}

function displayRecentMatches(matches) {
    const tableBody = document.getElementById('recent-matches-body');
    tableBody.innerHTML = '';

    matches.forEach(match => {
        const tr = document.createElement('tr');

        match.forEach((cell, index) => {
            const td = document.createElement('td');
            if (index === 0) {
                td.textContent = convertExcelDate(cell);
            } else if (index === 1) {
                td.textContent = cell;
            } else if (index === 2 || index === 6) {
                const teamName = cell;
                getTeamLogoHTML(teamName).then(logoHTML => {
                    td.innerHTML = logoHTML + ' ' + teamName;
                }).catch(error => {
                    console.error(`Error fetching logo for ${teamName}`, error);
                    td.textContent = teamName;
                });
            } else if (index === 3 || index === 5) {
                td.textContent = cell;
            } else if (index === 4) {
                if (cell && cell.trim() !== '') {
                    td.textContent = cell;
                }
            } else if (index === 7) {
                td.textContent = cell;
            }
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

function displayMostRecentWinner(winner) {
    const mostRecentWinnerContent = document.getElementById('most-recent-winner');
    mostRecentWinnerContent.innerHTML = '';

    if (winner) {
        const winnerElement = document.createElement('div');
        winnerElement.className = 'winner-container';

        getTeamLogoHTML(winner).then(logoHTML => {
            winnerElement.innerHTML = `${logoHTML} O atual detentor do cinturão é: ${winner}`;
            mostRecentWinnerContent.appendChild(winnerElement);
        }).catch(error => {
            console.error(`Error fetching logo for ${winner}`);
            winnerElement.textContent = `O atual detentor do cinturão é: ${winner}`;
            mostRecentWinnerContent.appendChild(winnerElement);
        });
    } else {
        const noWinnerElement = document.createElement('p');
        noWinnerElement.textContent = 'Nenhum vencedor foi identificado no último jogo.';
        mostRecentWinnerContent.appendChild(noWinnerElement);
    }
}

function filterDataByDecade(data, decade) {
    const startYear = parseInt(decade, 10);
    const endYear = startYear + 9;
    return data.filter(row => {
        if (!row[0] || row[0] === 'Data') return true;
        const date = convertExcelDate(row[0]);
        const year = parseInt(date.split('-')[2], 10);
        return year >= startYear && year <= endYear;
    });
}

function generateTable(data) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = '';

    data.slice(1).forEach(row => {
        const tr = document.createElement('tr');

        row.forEach((cell, index) => {
            const td = document.createElement('td');
            if (index === 0) {
                td.textContent = convertExcelDate(cell);
            } else if (index === 1) {
                td.textContent = cell;
            } else if (index === 2 || index === 6) {
                const teamName = cell;
                getTeamLogoHTML(teamName).then(logoHTML => {
                    td.innerHTML = logoHTML + ' ' + teamName;
                }).catch(error => {
                    console.error(`Error fetching logo for ${teamName}:`, error);
                    td.textContent = teamName;
                });
            } else if (index === 3 || index === 5) {
                td.textContent = cell;
            } else if (index === 4) {
                if (cell && cell.trim() !== '') {
                    td.textContent = cell;
                }
            } else if (index === 7) {
                td.textContent = cell;
            }
            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}

function convertExcelDate(excelDate) {
    const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function sanitizeTeamName(teamName) {
    const sanitized = teamName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return sanitized.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
}

function getTeamLogoHTML(teamName) {
    const sanitizedTeamName = sanitizeTeamName(teamName);
    const logoPath = `images/teams/${sanitizedTeamName}.png`;
    const defaultLogoPath = 'images/teams/No_Logo.png';

    return fetch(logoPath)
        .then(response => {
            if (response.ok) {
                return `<img src="${logoPath}" alt="${teamName} Logo" class="team-logo"> `;
            } else {
                const initials = teamName.split(' ').map(word => word[0]).join('');
                return `<div class="team-initials">${initials}</div>`;
            }
        })
        .catch(() => {
            const initials = teamName.split(' ').map(word => word[0]).join('');
            return `<div class="team-initials">${initials}</div>`;
        });
}

function initializeBackToTopButton() {
    const backToTopButton = document.getElementById('back-to-top');

    // Show or hide the button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    // Smooth scroll to top when the button is clicked
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}