//formulaire de création de classe
$('body').on('click', '.teacher-new-classe', function (event) {
    ClassroomSettings.classroom = null
    navigatePanel('classroom-dashboard-form-classe-panel', 'dashboard-classes-teacher')
    $('#table-students ul').html("");
})


//student modal-->supprimer
$('body').on('click', '.modal-student-delete', function () {
    let confirm = window.confirm(i18next.t("classroom.notif.deleteAccount"))
    if (confirm) {
        ClassroomSettings.student = parseInt($(this).parent().parent().parent().attr('data-student-id'))
        Main.getClassroomManager().deleteStudent(ClassroomSettings.student).then(function (response) {
            let classroom = deleteStudentInList(ClassroomSettings.student, ClassroomSettings.classroom)
            displayStudentsInClassroom(classroom.students)
            displayNotification('#notif-div', "classroom.notif.accountIsDelete", "success")
        })
    }
})

//student modal-->restaurer le mot de passe
$('body').on('click', '.modal-student-password', function () {
    let self = $(this)
    ClassroomSettings.student = parseInt(self.parent().parent().parent().attr('data-student-id'))
    Main.getClassroomManager().generatePassword(ClassroomSettings.student).then(function (response) {
        displayNotification('#notif-div', "classroom.notif.newPwd", "success", `'{
            "pseudo": "${response.pseudo}",
            "pwd": "${response.mdp}"
        }'`)
        self.parent().find('.pwd-display-stud .masked').html(response.mdp)

    })

})
//student modal-->modifier le pseudo

function changePseudoModal(pseudo, id) {
    ClassroomSettings.student = id
    $('.change-pseudo-modal').val(pseudo)
    pseudoModal.openModal('update-pseudo-modal')
}
$('body').on('click', '#update-pseudo-close', function () {
    Main.getClassroomManager().changePseudo(ClassroomSettings.student, $('.change-pseudo-modal').val()).then(function (formerPseudo) {
        pseudoModal.closeModal('update-pseudo-modal');
        $("#body-table-teach").find(`[data-student-id='${ClassroomSettings.student}']`).html($('.change-pseudo-modal').val() + '  <i class="fas fa-cog"></i>');
        changePseudoStudentInList(ClassroomSettings.student, ClassroomSettings.classroom, $('.change-pseudo-modal').val());
        displayNotification('#notif-div', "classroom.notif.pseudoUpdated", "success", `'{"newPseudo": "${$('.change-pseudo-modal').val()}"}'`);
        $('.change-pseudo-modal').val('');
    })

})

//classroom modal-->supprimer
$('body').on('click', '.modal-classroom-delete', function (e) {
    e.stopPropagation();
    let confirm = window.confirm("Etes vous sur de vouloir supprimer la classe?")
    if (confirm) {
        ClassroomSettings.classroom = $(this).parent().parent().parent().attr('data-link')
        Main.getClassroomManager().deleteClassroom(ClassroomSettings.classroom).then(function (classroom) {
            // concatenate classroom name + group in GAR context, else set only classroom name
            const classroomFullName = classroom.group != null 
                                        ? `${classroom.name}-${classroom.group}`
                                        : `${classroom.name}`

            deleteClassroomInList(classroom.link);
            classroomsDisplay();
            displayNotification('#notif-div', "classroom.notif.classroomDeleted", "success", `'{"classroomName": "${classroomFullName}"}'`);
        })
        ClassroomSettings.classroom = null
    }
})

//classroom modal-->modifier
$('body').on('click', '.modal-classroom-modify', function (e) {
    e.stopPropagation();
    ClassroomSettings.classroom = $(this).parent().parent().parent().attr('data-link')
    navigatePanel('classroom-dashboard-form-classe-panel', 'dashboard-classes-teacher')
})

//ouvre le dashboard d'une classe
$('body').on('click', '.class-card', function () {
    if (!$(this).find("i:hover").length) {
        ClassroomSettings.classroom = $(this).find('.class-card-top').attr('data-link')
        navigatePanel('classroom-table-panel-teacher', 'dashboard-classes-teacher', ClassroomSettings.classroom)
    }
})

function setNote(note) {
    alert(note)
    Activity.note = note
    if (note > 1) {
        Activity.correction = 2
    } else {
        Activity.correction = 3
    }
}

function giveNote() {
    let comment = $('#commentary-textarea').val()
    console.log(comment)
    Main.getClassroomManager().setActivityCorrection(Activity, Activity.correction, Activity.note, comment).then(function (exercise) {
        Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(function () {
            Activity = exercise
            navigatePanel('classroom-table-panel-teacher', 'dashboard-classes-teacher', ClassroomSettings.classroom)
        })

    })
}


//affiche le bilan d'un élève
$('body').on('click', '.username .col-6, .username .propic', function () {
    if ($('#student-bilan-return').length > 0) {
        let id = parseInt($(this).parent().attr('data-student-id'))
        let students = getClassroomInListByLink(ClassroomSettings.classroom)[0].students
        let student = getStudentInListById(id, students)
        displayStudentsInClassroom(student)
        $('.legend').after('<button id="student-bilan-return"class="btn c-btn-primary">Retour à la classe</button>')
    }
})
$('body').on('click', '#student-bilan-return', function () {
    $(this).remove()
    navigatePanel('classroom-table-panel-teacher', 'dashboard-classes-teacher', ClassroomSettings.classroom)
})
//retirer un étudiant du tableau
$('body').on('click', '.remove-student', function () {
    $(this).parent().remove()
})

//ajout d'une classe en bdd
$('.new-classroom-form').click(function () {
    $(this).attr('disabled', 'disabled')
    $('#body-table-teach').html('')
    $('#header-table-teach').html('<th style="max-width:250px;color:var(--text-1);">Activités</th>')
    if (ClassroomSettings.classroom == null) {
        Main.getClassroomManager().addClassroom({
            'name': $('#classroom-form-name').val(),
            'school': $('#classroom-form-school').val(),
            'isBlocked': document.querySelector('#classroom-form-is-blocked').checked
        }).then(function (classroom) {
            // handle specific error
            if(classroom.errorType){
                displayNotification('#notif-div', `classroom.notif.${classroom.errorType}`, "error", `'{"ClassroomNameInvalid": "${classroom.errorType}"}'`)
                $('.new-classroom-form').attr('disabled', false);
                return
            } 
            // If the backend detects that the user is not a premium user and that he already has one classroom
            else if(classroom.isClassroomAdded == false){
                
                displayNotification('#notif-div', "classroom.notif.classNotCreated", "error", `'{"classroomNumberLimit": "${classroom.classroomNumberLimit}"}'`);
               $('.new-classroom-form').attr('disabled', false);
            }else{
                let students = []
                let existingStudents = []
                $('#table-students ul li .col').each(function (index) {
                    if ($(this).html() != "") {
                        students.push($(this).html())
                    }
                })
                if(students.length){
                    Main.getClassroomManager().addUsersToGroup(students, existingStudents, classroom.link).then(function (response) {
                        if(!response.isUsersAdded){
                            if(response.errorType){
                                 displayNotification('#notif-div', `classroom.notif.${response.errorType}`, "error");
                            }
                            else{
                                 displayNotification('#notif-div', "classroom.notif.classCreatedButNotUsers", "error", `'{"classroomName": "${classroom.name}", "learnerNumber": "${response.currentLearnerCount+response.addedLearnerNumber}"}'`);
                            }
                           
                            Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(() => {
                                $('.new-classroom-form').attr('disabled', false);
                                navigatePanel('classroom-table-panel-teacher', 'dashboard-classes-teacher', classroom.link)
                           })
                        }
                        else{
                            Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(function () {
                                ClassroomSettings.classroom = classroom.link;
                                addUserAndGetDashboard(classroom.link);
                                displayNotification('#notif-div', "classroom.notif.classroomCreated", "success", `'{"classroomName": "${classroom.name}"}'`);
                                $('.new-classroom-form').attr('disabled', false);
                            });
                        }
                    });
                }else{
                    Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(function () {
                        ClassroomSettings.classroom = classroom.link;
                        addUserAndGetDashboard(classroom.link);
                        displayNotification('#notif-div', "classroom.notif.classroomCreated", "success", `'{"classroomName": "${classroom.name}"}'`);
                        $('.new-classroom-form').attr('disabled', false);
                    });
                }
            }
        });
    } else {
        Main.getClassroomManager().updateClassroom({
            'name': $('#classroom-form-name').val(),
            'school': $('#classroom-form-school').val(),
            'link': ClassroomSettings.classroom,
            'isBlocked': document.querySelector('#classroom-form-is-blocked').checked
        }).then(function (classroom) {

            if(classroom.errorType){
                displayNotification('#notif-div', `classroom.notif.${classroom.errorType}`, "error", `'{"ClassroomNameInvalid": "${classroom.errorType}"}'`)
               $('.new-classroom-form').attr('disabled', false);
                return
            }
            let students = []
            let existingStudents = []
            $('.student-form-name').each(function (index) {
                if ($(this).val() != "") {
                    if (parseInt($(this).attr('data-id')) > 0) {
                        existingStudents.push({
                            'pseudo': $(this).val(),
                            'id': $(this).attr('data-id')
                        })
                    } else {
                        students.push($(this).val())
                    }
                }
            })
            Main.getClassroomManager().addUsersToGroup(students, existingStudents, classroom.link).then(function (response) {
                let noAdditionError = response.isUsersAdded ? response.isUsersAdded : response.noUser;
                if(!noAdditionError){
                    displayNotification('#notif-div', "classroom.notif.classUpdatedButNotUsers", "error", `'{"classroomName": "${classroom.name}", "learnerNumber": "${response.currentLearnerCount+response.addedLearnerNumber}"}'`);
                   $('.new-classroom-form').attr('disabled', false);
                }
                else{
                    Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(function () {
                        addUserAndGetDashboard(classroom.link)
                        displayNotification('#notif-div', "classroom.notif.classroomUpdated", "success", `'{"classroomName": "${classroom.name}"}'`)
                       $('.new-classroom-form').attr('disabled', false);
                    });
                }
            })
        });
    }
})
//add students to a classroom
$('body').on('click', '.save-student-in-classroom', function () {
    if (ClassroomSettings.classroom != null) {
        let students = []
        let existingStudents = []
        $('.student-form-name').each(function (index) {
            if ($(this).val() != "") {
                if (parseInt($(this).attr('data-id')) > 0) {
                    existingStudents.push({'pseudo': $(this).val(), 'id': $(this).attr('data-id')})
                } else {
                    students.push($(this).val())
                }
            }
        })
        Main.getClassroomManager().addUsersToGroup(students, existingStudents, ClassroomSettings.classroom).then(function (response) {
            if(!response.isUsersAdded){
                if(response.noUser){
                    displayNotification('#notif-div', "classroom.notif.noUserUsername", "error");
                    return;
                }
                /**
                 * Update Rémi : Users limitation by group 
                 * possible return : personalLimit, personalLimitAndGroupOutDated, bothLimitReached
                 */
                if(response.errorType){
                    // a specific error has been returned, display it
                    displayNotification('#notif-div', `classroom.notif.${response.errorType}`, "error", `'{"reservedNickname": "${demoStudentName}"}'`);
                    return;
                } else {
                    manageResponseOfAddUsers(response);
                }
            }else{
                Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(function () {
                    addUserAndGetDashboard(ClassroomSettings.classroom);
                    $('#add-student-div').html(BASE_STUDENT_FORM);
                    pseudoModal.closeModal('add-student-modal')
                    displayNotification('#notif-div', "classroom.notif.usersAdded", "success")
                });
            }
        })
    } else {
        if ($('.student-form-name').val() != ''){
            $('#no-student-label').remove()
            $('#table-students ul').append(addStudentRow($('.student-form-name').val()))
            pseudoModal.closeModal('add-student-modal')
            // Reset the input field
            $('.student-form-name').val('');
        } else {
            displayNotification('#notif-div', "classroom.notif.noUserUsername", "error");
        }
    }

})

/**
 * Manage the display notification from the response
 * @param {*} response 
 */
function manageResponseOfAddUsers(response) {
    if (response.hasOwnProperty('message')) {
        if (response.message == "personalLimit") {
            displayNotification('#notif-div', "classroom.notif.personalLimitationsReached", "error", `'{"learnerNumber": "${response.currentLearnerCount+response.addedLearnerNumber}"}'`);
            // Show upgrade modal
        } else if (response.message == "personalLimitAndGroupOutDated") {
            displayNotification('#notif-div', "classroom.notif.groupLimitationsTeacher", "error", `'{"learnerNumber": "${response.currentLearnerCount+response.addedLearnerNumber}"}'`);
           // Show upgrade modal
        } else if (response.message == "bothLimitReached") {
            // Teacher's and Group's limits reached
            displayNotification('#notif-div', "classroom.notif.bothLimitationsReached", "error", `'{"learnerNumber": "${response.currentLearnerCount+response.addedLearnerNumber}"}'`);  
        }
    } else {
        displayNotification('#notif-div', "classroom.notif.usersNotAdded", "error", `'{"learnerNumber": "${response.currentLearnerCount+response.addedLearnerNumber}"}'`);
    }
}

/**
 * Open the modal which allows to add users using a csv file
 */
function openCsvModal(){
    pseudoModal.openModal('import-csv');
}


/**
 * Add students to a classroom using a csv file
 */
function importLearnerCsv(){
    if(ClassroomSettings.classroom){
        csvToClassroom(ClassroomSettings.classroom).then((response) => {
            /**
             * Updated @Rémi
             * the case where the students was not added was not implemented
             */
            if (response == true) {
                pseudoModal.closeModal('import-csv');
                Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(() => {
                    let students = getClassroomInListByLink(ClassroomSettings.classroom)[0].students;
                    displayStudentsInClassroom(students);
                    displayNotification('#notif-div', "classroom.notif.usersAddedFromCsv", "success");
                });
            } else {
                if(response.errorType){
                  // a specific error has been returned, display it
                  displayNotification('#notif-div', `classroom.notif.${response.errorType}`, "error", `'{"reservedNickname": "${demoStudentName}"}'`);
                  return;
                } else {
                  manageResponseOfAddUsers(response);
                }  
            }
        })
        .catch((response) => {
            console.warn(response);
        });
    } else {

        // import the students before the class creation
        const csvFile = document.getElementById('importcsv-fileinput').files[0];
        if (csvFile){
            const reader = new FileReader();
            try {
                reader.readAsText(csvFile);
                reader.onload = function (event) {
                    let csv = event.target.result;
                    let lines = csv.split("\n");
                    let headers = lines[0].split(/[,;]/);

                    for(let i = 0; i < headers.length; i++) {
                        headers[i] = headers[i].replace("\r","");
                    }
                    
                    let missingPseudoError = false
                    for (let i = 1; i < lines.length; i++) {
                        // sanitize the current line
                        lines[i] = lines[i].replace(/(\r\n|\n|\r)/gm, "")
                        // ignore current empty line
                        // NOTE : EXCEL return a single character for an empty line when we use the "pseudo;password" example file
                         if(lines[i] == '' || lines[i] ==';') continue 

                        let currentline = lines[i].split(/[,;]/);
                        
                        // set the error flag to true if the pseudo is missing in the csv
                        if(currentline[0].trim() == '') missingPseudoError = true;

                        // add the student into the students table
                        else $('#table-students ul').append(addStudentRow(currentline[0]));
                    }

                    // display the missing pseudo error
                    if(missingPseudoError == true) displayNotification('#notif-div', "classroom.notif.pseudoMissingInCsvFile", "error");

                    if ($('#table-students ul li .col').length > 1) {
                        $('#no-student-label').remove();
                    }
                    // remove the previous filename uploaded on open 
                    $('#importcsv-fileinput').val("");
                    pseudoModal.closeModal('import-csv');
                }
            } catch (error) {
                reject(`Error while opening the csv file! Reason: ${error}`);
                displayNotification('#notif-div', "classroom.notif.errorWithCsv", "error", `'{"error": "${error}"}'`);
            }
        } else {
            reject('No csv file given!');
            displayNotification('#notif-div', "classroom.notif.CsvFileMissing", "error");
        }
        $('#table-students ul').html("");
    }
}



/**
 * Process and send data from csv to the server
 * @param {string} link 
 */
function csvToClassroom(link) {
    return new Promise((resolve, reject) => {
        let csvFile = document.getElementById('importcsv-fileinput').files[0];
        if(csvFile){
            const reader = new FileReader();
            try {
                reader.readAsText(csvFile);
                reader.onload = function (event) {
                    const csv = event.target.result;
                    let json = csvJSON(csv);
                    Main.getClassroomManager().addUsersToGroupByCsv(JSON.parse(json), link, "csv")
                    .then((response) => {
                        resolve(response);
                    });
                }
            } catch (error) {
                reject(`Error while opening the csv file! Reason: ${error}`);
                displayNotification('#notif-div', "classroom.notif.errorWithCsv", "error", `'{"error": "${error}"}'`);
            }
        }else{
            reject('No csv file given!');
            displayNotification('#notif-div', "classroom.notif.CsvFileMissing", "error");
        }
    });
}

/**
 * Convert a csv file into data to be sent to the server
 * @param {*} csv 
 * @returns {string} - list of learners and their passwords
 */
function csvJSON(csv) {

    let lines = csv.split("\n");
    const result = [];

    // NOTE: If your columns contain commas in their values, you'll need
    // to deal with those before doing the next step 
    // (you might convert them to &&& or something, then convert them back later)
    // jsfiddle showing the issue https://jsfiddle.net/
    let headers = lines[0].split(/[,;]/);
    
    for(let i=0; i< headers.length; i++){
        headers[i] = headers[i].replace("\r","")
    }
    
    for (let i = 1; i < lines.length; i++) {
        // sanitize the current line
        lines[i] = lines[i].replace(/(\r\n|\n|\r)/gm, "")
        // ignore current empty line
        // NOTE : EXCEL return a single character for an empty line when we use the "pseudo;password" example file
        if(lines[i] == '' || lines[i] ==';') continue 

        // create empty object to fill and split line data
        let obj = {};
        let currentline = lines[i].split(/[,;]/);

        for (let j = 0; j < headers.length; j++) {
            if(typeof currentline[j] != 'undefined' ){
                // fill the object with data 
                obj[headers[j]] = currentline[j].replace("\r","").trim();
            }
        }
        result.push(obj);
    }
    // remove the previous filename uploaded on open 
    $('#importcsv-fileinput').val("");
    return JSON.stringify(result); //JSON
}

/**
 * Open the modal which allows to download csv files
 */
function openDownloadCsvModal(){
    pseudoModal.openModal('export-csv');
}

/**
 * Download the current classroom list of learners and close the export-csv modal
 */
function exportLearnerCsv(){
    if(ClassroomSettings.classroom){
        classroomToCsv(ClassroomSettings.classroom);
        pseudoModal.closeModal('export-csv');
    }
}

/**
 * Download the current classroom dashboard and close the export-csv modal
 */
function exportDashboardCsv(){
    if(ClassroomSettings.classroom){
        dashboardToCsv(ClassroomSettings.classroom);
        pseudoModal.closeModal('export-csv');
    }
}

/**
 * Generate and download a csv file containing the list of the learners in the classroom and their passwords
 * @param {string} link - link of the classroom
 */
function classroomToCsv(link) {
    let html = "apprenant;mot_de_passe \n"
    let classroom = getClassroomInListByLink(link)[0]
    for (let i = 0; i < classroom.students.length; i++) {
        if(classroom.students[i].user.pseudo != demoStudentName){
            html += classroom.students[i].user.pseudo + ";" + classroom.students[i].pwd + "\n";
        }
    }
    let date = new Date();
    let name = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear() + '-' + date.getHours() + 'h-' + date.getMinutes() + 'm.csv';
    let element = document.createElement('a');
    let encodedUri = 'data:application/csv;charset=utf-8,' + encodeURIComponent(html);
    element.setAttribute('href', encodedUri);
    element.setAttribute('download', name)
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * Generate and download a csv file containing the classroom dashboard
 * @param {string} link - link of the classroom
 */
function dashboardToCsv(link) {
    let html = ""
    let headHtml = "apprenant;"
    let classroom = getClassroomInListByLink(link)[0]
    let index = listIndexesActivities(classroom.students)
    for (let j = 0; j < index.length; j++) {
        headHtml += index[j].title + ';'
    }
    headHtml += "\n"
    for (let i = 0; i < classroom.students.length; i++) {
        if(classroom.students[i].user.pseudo != demoStudentName){
            let arrayActivities = reorderActivities(classroom.students[i].activities, index)
            html += classroom.students[i].user.pseudo + ";"
            for (let j = 0; j < arrayActivities.length; j++) {
                html += statusActivity(arrayActivities[j], 'csv') + ';'

            }
            html += "\n"
        }
    }
    html = headHtml + html
    let date = new Date();
    let name = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear() + '-' + date.getHours() + 'h-' + date.getMinutes() + 'm.csv';
    let element = document.createElement('a');
    let encodedUri = 'data:application/csv;charset=utf-8,' + encodeURIComponent(html);
    element.setAttribute('href', encodedUri);
    element.setAttribute('download', name)
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

}

/**
 * Order the current user array of activities to fit the current classroom index of activities
 * @param {Object} activities - The current user array of activities
 * @param {array} indexes - The current classroom index of activities
 * @returns {array} - The current user array of activities ordered to fit the current classroom index of activities
 */
function reorderActivities(activities, indexes) {
    let orderedActivities = [];
    for(let i=0; i<indexes.length; i++){
        for(activity of activities){
            if(activity.reference == indexes[i].reference){
                orderedActivities[i] = activity;
                break;
            }else{
                orderedActivities[i] = false;
            }
        
        };
    }
    return orderedActivities;
}
//ne peut attribuer une activité qu'une fois pour le dashboard
//faudrait ajouter une notif "cette activité lui a déja été attribuée"
function listIndexesActivities(students) {
    ClassroomSettings.indexRef = []
    let indexArray = new Array()
    let indexArraybis = new Array()
    students.forEach(element => {
        element.activities.forEach(element => {
            if (!indexArray.includes(element.reference)) {
                indexArray.push(element.reference)
                indexArraybis.push({
                    id: element.activity.id,
                    title: element.activity.title,
                    reference: element.reference
                })
                ClassroomSettings.indexRef.push(element)

            }
        })
    });
    // sorting the index array by date
    indexArraybis.sort((a, b) => {
        return (a.reference > b.reference) ? 1 : -1;
    });
    return indexArraybis;
}

function addUserAndGetDashboard(link) {
    navigatePanel('classroom-table-panel-teacher', 'dashboard-classes-teacher', link)
}

function getClassroomInListByLink(link) {
    return Main.getClassroomManager()._myClasses.filter(x => x.classroom.link == link)
}

function addClassroomInList(classroom) {
    Main.getClassroomManager()._myClasses.push(classroom)
}

function addSandboxInList(project) {
    Main.getClassroomManager()._myProjects.push(project)
}

function addStudentActivityInList(student, activity) {
    Main.getClassroomManager()._myClasses.foreach(function (element, index) {
        if (ClassroomSettings.classroom == element.classroom.link) {
            var classroomIndex = index;
            element.students.foreach(function (element, index) {
                if (student.id == element.id) {
                    var studentIndex = index;
                    element.activities.push(activity)

                }
            })
        }
    })
    if (classroomIndex && studentIndex) {
        Main.getClassroomManager()._myClasses[classroomIndex].students[studentIndex].push(activity)
    } else {
        console.log("l'actualisation des activités a échoué")
    }
}

function deleteClassroomInList(link) {
    Main.getClassroomManager()._myClasses = Main.getClassroomManager()._myClasses.filter(x => x.classroom.link !== link)
}

function deleteStudentInList(id, linkClassroom) {
    let classroom = getClassroomInListByLink(linkClassroom)[0]
    let classroomToChange = classroom.students.filter(x => x.user.id !== id)
    classroomToChange = {
        classroom: classroom.classroom,
        students: classroomToChange
    }
    Main.getClassroomManager()._myClasses = Main.getClassroomManager()._myClasses.filter(x => x.classroom.link !== linkClassroom)
    Main.getClassroomManager()._myClasses.push(classroomToChange)
    return classroomToChange
}

function changePseudoStudentInList(id, linkClassroom, pseudo) {
    let classroom = getClassroomInListByLink(linkClassroom)[0];
    let userToChange = classroom.students.filter(x => x.user.id == id)[0];
    userToChange.user.pseudo = pseudo
    let studentList = classroom.students.filter(x => x.user.id !== id)
    studentList.push(userToChange)
    classroom = {
        classroom: classroom.classroom,
        students: studentList
    }
    Main.getClassroomManager()._myClasses = Main.getClassroomManager()._myClasses.filter(x => x.classroom.link !== linkClassroom)
    Main.getClassroomManager()._myClasses.push(classroom)
    return classroom
}

function getStudentInListById(id, students) {
    return students.filter(x => x.user.id == id)
}

function getAttributionByRef(ref) {
    return ClassroomSettings.indexRef.filter(x => x.reference == ref)[0]

}

function getTeacherActivityInList(id) {
    return Main.getClassroomManager()._myTeacherActivities.filter(x => x.id == id)[0]
}

function deleteTeacherActivityInList(id) {
    Main.getClassroomManager()._myTeacherActivities = Main.getClassroomManager()._myTeacherActivities.filter(x => x.id !== id)
}


function deleteSandboxInList(link) {
    Main.getClassroomManager()._myProjects = Main.getClassroomManager()._myProjects.filter(x => x.link !== link)
}

function addTeacherActivityInList(activity) {
    Main.getClassroomManager()._myTeacherActivities.push(activity)
}

function addProjectInList(project) {
    Main.getClassroomManager()._myProjects.push(project)
}

function filterTeacherActivityInList(keywords = [], orderBy = 'id', asc = true) {

    let expression = ''
    for (let i = 0; i < keywords.length; i++) {
        expression += '(?=.*'
        expression += keywords[i].toUpperCase()
        expression += ')'

    }
    regExp = new RegExp(expression)
    let list = Main.getClassroomManager()._myTeacherActivities.filter(x => regExp.test(x.title.toUpperCase()))
    if (asc) {
        return list.sort(function (a, b) {
            return a[orderBy] - b[orderBy];
        })
    } else {
        return list.sort(function (a, b) {
            return b[orderBy] - a[orderBy];
        })
    }

}

function filterSandboxInList(keywords = [], orderBy = 'id', asc = true) {

    let expression = ''
    for (let i = 0; i < keywords.length; i++) {
        expression += '(?=.*'
        expression += keywords[i].toUpperCase()
        expression += ')'

    }
    regExp = new RegExp(expression)
    let list = Main.getClassroomManager()._myProjects.filter(x => regExp.test(x.name.toUpperCase()) || regExp.test(x.description.toUpperCase()))
    if (asc) {
        return list.sort(function (a, b) {
            return a[orderBy] - b[orderBy];
        })
    } else {
        return list.sort(function (a, b) {
            return b[orderBy] - a[orderBy];
        })
    }

}

/**
 * Display the teacher dashboard in the classroom tab
 * @param {array} students - Array of students in a classroom
 */
function displayStudentsInClassroom(students, link=false) {
    if (link && link != $_GET('option')) {
        return;
    }
    $('#body-table-teach').html(''); //clean the display
    $('#add-student-container').html(''); //clean the display
    $('#export-class-container').html(''); //clean the display
    $('#header-table-teach').html('<th class="table-title" style="max-width: 250px; font-size: 19pt; text-align: left; height: 3em;" data-i18n="classroom.activities.title"></th>').localize();
    // get the current classroom index of activities
    let arrayIndexesActivities = listIndexesActivities(students);

    students.forEach(element => {
        // reorder the current student activities to fit to the classroom index of activities
        let arrayActivities = reorderActivities(element.activities, arrayIndexesActivities);
        let html = '';
        let pseudo = element.user.pseudo;
        // shorten the current student nickname to fit in the table
        if (element.user.pseudo.length > 10) {
            pseudo = element.user.pseudo.slice(0, 9) + "&#8230;";
        }
        // Add demoStudent's head table cell if it's the current student
        if (element.user.pseudo == demoStudentName) {
            html = `<tr><td class="username row" data-student-id="` + element.user.id + `"><img class="col-2 propic" src="${_PATH}assets/media/alphabet/` + element.user.pseudo.slice(0, 1).toUpperCase() + `.png" alt="Photo de profil"><div class="col-7 line_height34" title="` + element.user.pseudo + `">` + pseudo + ` </div> <div class="dropdown col "><i class="classroom-clickable line_height34 fas fa-exchange-alt" type="button" id="dropdown-studentItem-${element.user.id}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></i>
            <div class="dropdown-menu" aria-labelledby="dropdown-studentItem-${element.user.id}">
        <li id="mode-apprenant" class="dropdown-item classroom-clickable col-12" href="#" onclick="modeApprenant()" data-i18n="classroom.classes.panel.learnerMode">Mode apprenant</li>
        </div>
        </div></td>`;
        // Add the current student head table cell
        } else {
            html = `<tr><td class="username row" data-student-id="` + element.user.id + `"><img class="col-2 propic" src="${_PATH}assets/media/alphabet/` + element.user.pseudo.slice(0, 1).toUpperCase() + `.png" alt="Photo de profil"><div class="col-7 line_height34" title="` + element.user.pseudo + `">` + pseudo + ` </div>`
            if (!UserManager.getUser().isFromGar) {
                html += `<div class="dropdown col"><i class="classroom-clickable line_height34 fas fa-cog" type="button" id="dropdown-studentItem-${element.user.id}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></i>
                <div class="dropdown-menu" aria-labelledby="dropdown-studentItem-${element.user.id}">
                <li class="col-12 pwd-display-stud" href="#"><div data-i18n="classroom.classes.panel.password">Votre mot de passe :</div> <span class="masked">${element.pwd}</span><i class="classroom-clickable fas fa-low-vision switch-pwd ml-2"></i></li>
                <li class="modal-student-password classroom-clickable col-12 dropdown-item" href="#" data-i18n="classroom.classes.panel.resetPassword">Régenérer le mot de passe</li>
                <li class="classroom-clickable col-12 dropdown-item" href="#"><span class="classroom-clickable" data-i18n="classroom.classes.panel.editNickname" onclick="changePseudoModal('${element.user.pseudo}',${element.user.id})">Modifier le pseudo</span></li>
                <li class="dropdown-item modal-student-delete classroom-clickable col-12" href="#" data-i18n="classroom.classes.panel.delete">Supprimer</li>
                </div>
                </div>`;
            }
            html += `</td>`;
        }
        let activityNumber = 1;
        // Display the current student activities in the dashboard

        // Loop in the classroom activities index (with ids) to generate the dashboard table header and body
        for(let i=0; i<arrayIndexesActivities.length; i++){
            if (element.user.pseudo == demoStudentName) {
                $('#header-table-teach').append(`
                <th data-toggle="tooltip" data-placement="top" title="${ arrayIndexesActivities[i].title }">
                    <div class="dropdown dropdown-act" style="width:30px;">
                        <div id="dropdown-act-${activityNumber}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <span class="span-act">Act.</br>n°${ activityNumber }</span>
                            <i style="display:none;font-size:2em;" class="fa fa-cog i-act" aria-hidden="true"></i>
                            <div class="dropdown-menu" aria-labelledby="dropdown-act-${activityNumber}" data-id="${arrayIndexesActivities[i].id}" style="text-transform: none;">
                            <li class="ml-5" style="border-bottom:solid 2px black;">
                                <b>${ arrayIndexesActivities[i].title }</b>
                            </li>
                            <li class="classroom-clickable col-12 dropdown-item " onclick="activityWatch(${arrayIndexesActivities[i].id})" ><i class="fas fa-eye"></i> <span data-i18n="classroom.classes.panel.seeActivity">Voir l'activité</span></li>
                            <li class=" classroom-clickable col-12 dropdown-item" onclick="activityModify(${arrayIndexesActivities[i].id})"><i class="fas fa-pen"></i> <span data-i18n="classroom.classes.panel.editActivity">Modifier l'activité</span></li>
                            <li class="classroom-clickable col-12 dropdown-item" onclick="attributeActivity(${arrayIndexesActivities[i].id},${arrayIndexesActivities[i].reference})"><i class="fas fa-user-alt"></i> <span data-i18n="classroom.classes.panel.editAttribution">Modifier l'attribution</span></li>
                            <li class="dropdown-item classroom-clickable col-12" onclick="undoAttributeActivity(${arrayIndexesActivities[i].reference},'${arrayIndexesActivities[i].title}','${Main.getClassroomManager().getClassroomIdByLink(ClassroomSettings.classroom)}')"><i class="fas fa-trash-alt"></i> <span data-i18n="classroom.classes.panel.removeAttribution">Retirer l'attribution</span></li>
                        </div>
                    </div>
                </th>`);
                    activityNumber++
            }
            // Display the current student activities in the dashboard
            let currentActivity = arrayActivities[i];
            if (currentActivity) {
                html += `<td class=" ${statusActivity(currentActivity)} bilan-cell classroom-clickable" data-state=" ${statusActivity(currentActivity, false)}" data-id="${ currentActivity.id}" data-toggle="tooltip" data-html="true" data-placement="top" title="<b>${currentActivity.activity.title}</b><br><em>${i18next.t("classroom.classes.panel.dueBy") + " " + formatDay(currentActivity.dateEnd)}</em>"></td>`;
            } else {
                html += `<td class="no-activity bilan-cell" "></td>`;
            }
        }
        // addition of 6 "empty" cells at the end of the current table row
        for (let i = 0; i < 6; i++) {
            // html += '<td class="no-activity bilan-cell"></td>';
        }
        // end of the current table row
        html += '</tr>';
        $('#body-table-teach').append(html).localize();
        $('[data-toggle="tooltip"]').tooltip()
    });
    
    $('#add-student-container').append(`<button id="add-student-dashboard-panel" class="btn c-btn-primary"><span data-i18n="classroom.activities.addLearners">Ajouter des apprenants</span> <i class="fas fa-plus"></i></button>`).localize();

    $('#export-class-container').append(`<button id="download-csv" class="btn c-btn-tertiary ml-2" onclick="openDownloadCsvModal()"><i class="fa fa-download" aria-hidden="true"></i><span class="ml-1" data-i18n="classroom.activities.exportCsv">Exporter CSV</span></button>`).localize();

    $('#header-table-teach').append(`<th class="add-activity-th" colspan="7"> <button class="btn c-btn-primary dashboard-activities-teacher" onclick="pseudoModal.openModal('add-activity-modal')" data-i18n="classroom.activities.addActivity">Ajouter une activité</button></th>`).localize();
}

$('body').on('click', '.switch-pwd', function (event) {
    $(this).parent().find('span').toggleClass('masked');
    event.stopPropagation();
})

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function displayNotification(div, message, status, options = '{}') {
    let randId = getRandomInt(10000)
    let html = `<div id='notif-` + randId + `' class="vitta-notif status-` + status + `" data-i18n="` + message + `" data-i18n-options=` + options + `><div class="vitta-notif-exit-btn"><i class="fa fa-times-circle"></i></div></div>`
    $(div).append(html)
    $(div).localize()
    setTimeout(function () {
        $('#notif-' + randId).remove()
    }, 15000);
}
$('body').on('click', '.vitta-notif-exit-btn', function () {
    $(this).parent().remove()
})

function setStudentsSelect() {
    ClassroomSettings.studentList = ''
    let classrooms = Main.getClassroomManager()._myClasses
    classrooms.forEach(function (classroom) {
        classroom.students.forEach(function (student) {
            ClassroomSettings.studentList += `<input type="checkbox" class=" col-12 checkStudent-sandbox-${student.user.id}" value="${student.user.id}">${student.user.pseudo} from ${classroom.classroom.name}</option>`
        })
    })
}

function actualizeStudentActivities(activity, correction) {
    let tempActivities = Main.getClassroomManager()._myActivities.newActivities.filter(x => x.id !== activity.id)
    Main.getClassroomManager()._myActivities.newActivities = tempActivities
    if (correction == 1) {
        Main.getClassroomManager()._myActivities.currentActivities.push(activity)
    } else {
        Main.getClassroomManager()._myActivities.doneActivities.push(activity)
    }

}

function addStudentRow(pseudo) {
    return `
    <li class="row align-items-center my-1 ">
        <img class="col-2 propic" src="${_PATH}assets/media/alphabet/` + pseudo.slice(0, 1).toUpperCase() + `.png" alt="Photo de profil">
        <div class="col">` + pseudo + `</div>
        <button type=\"button\" class=\"btn btn-danger remove-student h-50\" data-toggle=\"tooltip\" data-placement=\"top\"  >
            <i class=\"fas fa-times\"></i>
        </button>
    </li>`
}

/**
 * Password display toggler : if an element that has the class password-display-toggler is clicked, it show/hide the password in the adjacent input element
 */
document.getElementsByTagName('body')[0].addEventListener('click', (e) => {
    if(e.target.classList.contains('password-display-toggler')){
        e.stopPropagation();
        for(let childElt of e.target.parentNode.childNodes){
            if(childElt.tagName == 'INPUT'){
                if(childElt.getAttribute('type') == 'password'){
                    childElt.setAttribute('type', 'text');
                }else{
                    childElt.setAttribute('type', 'password');
                }
            }
        }
    }
});

/**
 * Open teacher account panel
 */
function openTeacherAccountPanel(){
    pseudoModal.closeModal('settings-teacher-modal');
    getAndPopulateAccountInfo();
    navigatePanel('classroom-dashboard-account-panel-teacher', 'dashboard-profil-teacher', null);
}

/**
 * Get all the relevant teacher info and fill the associated form fields in teacher account panel
 */
function getAndPopulateAccountInfo(){
    let userInfo = {
        firstname: UserManager.getUser().firstname ?? '',
        lastname: UserManager.getUser().surname ?? '',
        nickname: UserManager.getUser().pseudo ?? '',
        email: UserManager.getUser().isRegular ?? '',
        teacherId: UserManager.getUser().id
    };
    populateAccountInfo(userInfo);
}

/**
 * Fill all the account form fields with the provided datas
 * @param {object} data - fields data from the database
 */
function populateAccountInfo(data){
    let firstNameInputElt = document.getElementById('profile-form-first-name'),
    lastNameInputElt = document.getElementById('profile-form-last-name'),
    nickNameInputElt = document.getElementById('profile-form-nick-name'),
    emailInputElt = document.getElementById('profile-form-email'),
    teacherIdInputElt = document.getElementById('profile-form-teacher-id');

    firstNameInputElt.value = data.firstname;
    lastNameInputElt.value = data.lastname;
    nickNameInputElt.value = data.nickname;
    emailInputElt.value = data.email;
    teacherIdInputElt.value = data.teacherId;
}

/**
 * Update teacher form submit listener
 */
document.getElementById('update-teacher-account-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let data = new FormData(e.target);
    if(teacherAccountUpdateFormCheck(data)){
        Main.getClassroomManager().updateTeacherAccount(data).then((response) => {
            if(response.isUserUpdated){
                document.getElementById('profile-form-password').value = '';
                document.getElementById('profile-form-confirm-password').value = '';
                displayNotification('#notif-div', "classroom.notif.accountUpdated", "success");
                if(data.get('email') != UserManager.getUser().isRegular){
                    displayNotification('#notif-div', "classroom.notif.emailUpdated", "success");
                }
                UserManager.init();
            }else{
                if(response.errorType){
                    switch (response.errorType) {
                        case 'unknownUser':
                            displayNotification('#notif-div', "classroom.notif.unknownUser", "error");
                            break;
                    
                        default:
                            break;
                    }
                }
                if(response.errors){
                    for(let error in response.errors){
                        displayNotification('#notif-div', `classroom.notif.${error}`, "error");
                    }
                }
            }
        });
    }
});

/**
 * Check if the teacher's account update form values are correct
 * @returns {boolean} - true if check ok, false otherwise
 */
function teacherAccountUpdateFormCheck(formData){
    
    let formValues = {
        'firstname': {
            value: formData.get('first-name'),
            id: 'profile-form-first-name'
        },
        'surname': {
            value: formData.get('last-name'),
            id: 'profile-form-last-name'
        },
        'pseudo': {
            value: formData.get('nickname'),
            id: 'profile-form-nick-name'
        },
        'email': {
            value: formData.get('email'),
            id: 'profile-form-email'
        },
        'password': {
            value: formData.get('password'),
            id: 'profile-form-password'
        },
        'confirmPassword': {
            value: formData.get('confirm-password'),
            id: 'profile-form-confirm-password'
        }
    },
    errors = [];
    
    for(let input in formValues){
        let currentElt = document.getElementById(formValues[input].id);
        if(currentElt.classList.contains('form-input-error')){
            currentElt.classList.remove('form-input-error');
        }
    }

    if(!formValues.firstname.value.length == 0 && formValues.firstname.value.length < 2){
        errors.push('firstNameTooShort');
        showFormInputError(formValues.firstname.id);
    }
    
    if(!formValues.surname.value.length == 0 && formValues.surname.value.length < 2){
        errors.push('lastNameTooShort');
        showFormInputError(formValues.surname.id);
    }

    if(!formValues.pseudo.value.length == 0 && formValues.pseudo.value.length < 2){
        errors.push('pseudoTooShort');
        showFormInputError(formValues.pseudo.id);
    }

    if(!formValues.email.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)){
        errors.push('invalidEmail');
        showFormInputError(formValues.email.id);
    }

    if(!formValues.password.value.length == 0 && !formValues.password.value.length > 7){
        errors.push('invalidPassword');
        showFormInputError(formValues.password.id);
    }

    if(formValues.password.value != formValues.confirmPassword.value){
        errors.push('passwordAndConfirmMismatch');
        showFormInputError(formValues.password.id);
        showFormInputError(formValues.confirmPassword.id);
    }

    if(errors.length){
        for(let error of errors){
            displayNotification('#notif-div', `classroom.notif.${error}`, "error");
        }
        return false;
    }else{
        return true;
    }
}

/**
 * Add the error class on input form
 * @param {string} id - the id of the form input
 */
function showFormInputError(id){
    document.getElementById(id).classList.add('form-input-error');
}

/**
 * Refresh the current classroom every 15 seconds if we are in the classroom dashboard
 */
class DashboardAutoRefresh {
    constructor(refreshInterval) {
        this.isRefreshing = false;
        this.refreshInterval = refreshInterval;
    }

    refresh() {
        if($_GET('panel') == 'classroom-table-panel-teacher' && $_GET('option')){
            this.isRefreshing = true;
            let previousClassroomState, newClassroomState;
            if (getClassroomInListByLink($_GET('option'))[0]) {
                previousClassroomState = {
                    data: JSON.stringify(getClassroomInListByLink($_GET('option'))[0].students),
                    link: $_GET('option')
                };
            }
            Main.getClassroomManager().getClasses(Main.getClassroomManager()).then(() => {
                if ($_GET('option') == previousClassroomState.link) {
                    if (getClassroomInListByLink($_GET('option'))[0]) {
                        newClassroomState = JSON.stringify(getClassroomInListByLink($_GET('option'))[0].students);
                    }
                    // Only refresh the classroom if it has changed
                    if (previousClassroomState.data != newClassroomState){
                        if (getClassroomInListByLink($_GET('option'))[0]) {
                            let students = getClassroomInListByLink($_GET('option'))[0].students;
                            displayStudentsInClassroom(students);
                            if (document.getElementById('is-anonymised').checked) {
                                anonymizeStudents();
                            }
                        }
                    }
                }
            });
            setTimeout(() => { this.refresh() }, this.refreshInterval);
        } else {
            this.isRefreshing = false;
        }
    }

    refreshLater() {
        if (!this.isRefreshing){
            this.isRefreshing = true;
            setTimeout(() => { this.refresh() }, this.refreshInterval);
        }
    }
}

const dashboardAutoRefresh = new DashboardAutoRefresh(15000);