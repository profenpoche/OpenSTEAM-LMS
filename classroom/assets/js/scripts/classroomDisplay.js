function getClassroomDisplaySettings(link) {
    // is the localStorage ready?
    if (localStorage.getItem('classroomDisplaySettings')) {
        // we parse all the settings
        let settings = JSON.parse(localStorage.getItem('classroomDisplaySettings'))

        // if no settings are found, we set the defaults for the current one
        if (!settings[link]) {
            settings[link] = {
                monochrome: false,
                anonymised: false
            }
            localStorage.setItem('classroomDisplaySettings', JSON.stringify(settings))
        }

        return settings[link];

    } else { //  if not ready we create the localStorage and relaunch the function
        localStorage.setItem('classroomDisplaySettings', JSON.stringify({}))
        getClassroomDisplaySettings(link)
    }
}

function setClassroomDisplaySetting(link, setting, value) {
    // is the localStorage ready?
    if (localStorage.getItem('classroomDisplaySettings')) {
        // we parse all the settings
        let settings = JSON.parse(localStorage.getItem('classroomDisplaySettings'))

        // if no settings are found, we set the defaults for the current one
        if (!settings[link]) {
            settings[link] = {
                monochrome: false,
                anonymised: false
            }
        }

        // we set the new value and push it to localStorage
        settings[link][setting] = value;
        localStorage.setItem('classroomDisplaySettings', JSON.stringify(settings))

        //also update DOM elements accordingly
        switch (setting) {
            case 'monochrome':
                if (value) {
                    $('#is-monochrome').prop('checked', true);
                } else {
                    $('#is-monochrome').prop('checked', false);
                }
                break;
            case 'anonymised':
                if (value) {
                    $('#is-anonymised').prop('checked', true);
                } else {
                    $('#is-anonymised').prop('checked', false);
                }
                break;
        }

    } else { //  if not ready we create the localStorage and relaunch the function
        localStorage.setItem('classroomDisplaySettings', JSON.stringify({}))
        getClassroomDisplaySettings(link)
    }
}



$('body').on('change', '#is-anonymised', function () {
    let classLink = $(this).data("link");
    let status = $(this).is(':checked');
    setClassroomDisplaySetting(classLink, 'anonymised', status);

    if (status) {
        anonymizeStudents()
    } else {
        let students = getClassroomInListByLink(ClassroomSettings.classroom)[0].students;
        displayStudentsInClassroom(students);
    }
});

function anonymizeStudents() {
    let index = 1;
    $('.username').each(function (el) {
        $('.username')[el].children[0].setAttribute('src', _PATH + 'assets/media/alphabet/E.png')
        $('.username')[el].children[0].setAttribute('alt', '')
        $('.username')[el].children[0].setAttribute('anonymized', 'true')
        $('.username')[el].children[1].innerHTML = i18next.t('classroom.activities.anoStudent') + " " + index
        $('.username')[el].children[1].setAttribute('title', '')
        index++
    })
}

$('body').on('change', '#is-monochrome', monochromeStudents);

function monochromeStudents() {
    let classLink = $(this).data("link");
    let status = $(this).is(':checked');
    setClassroomDisplaySetting(classLink, 'monochrome', status);

    if (status) {
        $('#body-table-teach').addClass('is-monochrome')
    } else {
        $('#body-table-teach').removeClass('is-monochrome')
    }
}