function showContent(projectName, elem) {
    // Get all project elements and remove the active class
    var projects = document.querySelectorAll('.project');
    projects.forEach(function(project) {
        project.classList.remove('active');
    });

    // Add the active class to the clicked element
    elem.classList.add('active');

    const contentDiv = document.getElementById('content');
    if (contentDiv) {
        contentDiv.innerHTML = ''; // clear the content
        switch (projectName) {
            case 'cathode':
                fetch('project_pages/caster.html')
                    .then(response => response.text())
                    .then(data => {
                        contentDiv.innerHTML = data;
                    });
                break;
            case 'website':
                fetch('project_pages/website.html')
                    .then(response => response.text())
                    .then(data => {
                        contentDiv.innerHTML = data;
                    });
                break;
        }
    }
}