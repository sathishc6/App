// DISPLAYING ONLY THE TABLE

document.addEventListener('DOMContentLoaded', () => {
    // Selecting HTML elements
    const userIdInput = document.getElementById('userId');
    const calculationMethodSelect = document.getElementById('calculationMethod');
    const outputTableBody = document.getElementById('outputTableBody');

    // Replace with your actual API token
    const apiToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjRjZWJiNTM2LWQwNTItNDQ1OC04YTYyLWQwYWI0MmYyNjUxYSIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE3MjA0MjY5MTcsImV4cCI6MTcyMDQ5ODkxNywiaXNzIjoiaHR0cHM6Ly9hcGkuYnJpZ2h0c3BhY2UuY29tL2F1dGgiLCJhdWQiOiJodHRwczovL2FwaS5icmlnaHRzcGFjZS5jb20vYXV0aC90b2tlbiIsInN1YiI6IjY4MiIsInRlbmFudGlkIjoiYzQyNmU0MmQtYWMyYS00ZTU3LTkxZTYtYTJiZjY0ZGNjYmQwIiwiYXpwIjoiN2UxMmUyZWItZGJhMy00MzU2LTkwYjQtYjE3ZTMyNzBlZjBkIiwic2NvcGUiOiJjb250ZW50Oio6KiBjb3JlOio6KiBkYXRhaHViOio6KiBlbnJvbGxtZW50Oio6KiBncmFkZXM6KjoqIG9yZ2FuaXphdGlvbnM6KjoqIHF1aXp6aW5nOio6KiByZXBvcnRpbmc6KjoqIHVzZXJzOio6KiIsImp0aSI6IjI5NDgxMzU0LTY5M2EtNDMxYS05MDBhLWFlZTQ1MGE4ZjRjMCJ9.I4NC6lapm76FCcHF_-pFBKrRFs2-4G4BDSfNNbAYfh-PcCVeCWFUXujvfOwCZijc-JJ2FM2AJGyI0RFX3rnqOT5-V9YgdBpS2G6n7iMnGKc7ZuinkKu8imkuTrarGge776IJr7FFQl117ek0kxk7mhsXZkvXv8o4dCSl8RIEFj7qUSd2C06h3pE6RXLPZi4Uq9qe-kcevXLONFXzSIWxVvkE1eqxD7XsNi8qTXJegAI0F_CurtCtLZDQDd4etyJ_fVxBC2d9C8gSGWkmjf-sgHKGHiC_PznZqk4otUM1I6ONkz-aqWnqEKoifH03kr-2uVknqi7Z4seKlDhQ0xHIWw';

    // Function to fetch organization unit IDs and associated data
    async function fetchOrgUnitIds() {
        const userId = userIdInput.value.trim();
        if (!userId) {
            alert('Please enter a valid User ID.');
            return null;
        }

        const apiUrl = `https://acadlms.d2l-partners.brightspace.com/d2l/api/lp/1.43/enrollments/users/${userId}/orgunits/`;

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const orgUnitIds = data.Items.map(item => item.OrgUnit.Id);

            // Fetch grades and course names in parallel
            const fetchPromises = orgUnitIds.map(orgId => {
                return Promise.all([
                    fetchGrades(orgId, userId, apiToken),
                    fetchCourseName(orgId, apiToken)
                ]).then(([grades, courseName]) => ({ orgId, grades, courseName }));
            });

            const allGradesAndNames = await Promise.all(fetchPromises);

            if (allGradesAndNames.length === 0) {
                alert('The user does not have any valid grades assigned.');
            } else {
                displayOutputTable(allGradesAndNames); // Display data in the table
            }

            return allGradesAndNames;

        } catch (error) {
            console.error('Error fetching org unit IDs:', error);
            return null;
        }
    }

    // Function to fetch grades for a specific organization unit
    async function fetchGrades(orgId, userId, apiToken) {
        const gradeUrl = `https://acadlms.d2l-partners.brightspace.com/d2l/api/le/1.43/${orgId}/grades/final/values/${userId}`;

        try {
            const response = await fetch(gradeUrl, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const gradeData = await response.json();
            return gradeData;

        } catch (error) {
            console.error(`Error fetching grades for orgId ${orgId}:`, error);
            return null;
        }
    }

    // Function to fetch course name for a specific organization unit
    async function fetchCourseName(orgId, apiToken) {
        const courseUrl = `https://acadlms.d2l-partners.brightspace.com/d2l/api/lp/1.43/orgstructure/${orgId}`;
    
        try {
            const response = await fetch(courseUrl, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const responseData = await response.json();
    
            // Extract course name directly if Type.Id is 3 (Course Offering)
            if (responseData.Type && responseData.Type.Id === 3) {
                return responseData.Name || 'N/A';
            } else {
                return null; // Return null if not a course offering or structure doesn't match
            }
    
        } catch (error) {
            console.error(`Error fetching course name for orgId ${orgId}:`, error);
            return null;
        }
    }    

    // Function to display data in the output table
    function displayOutputTable(allGradesAndNames) {
        const outputTableBody = document.getElementById('outputTableBody');
        outputTableBody.innerHTML = ''; // Clear existing table rows
    
        allGradesAndNames.forEach(item => {
            const orgId = item.orgId;
            const courseName = item.courseName;
            const grades = item.grades;
    
            if (courseName && orgId && grades && grades.DisplayedGrade !== undefined) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${courseName}</td>
                    <td>${orgId}</td>
                    <td>${grades ? (grades.DisplayedGrade || 'N/A') : 'N/A'}</td>
                `;
                outputTableBody.appendChild(row);
            }
        });
    }

    // Event listener for Fetch Data button
    const fetchBtn = document.getElementById('fetchBtn');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', async () => {
            await fetchOrgUnitIds();
        });
    }
});
