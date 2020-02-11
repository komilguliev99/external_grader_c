/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-02-10 23:21:24
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-02-11 01:00:47
 * @ Description:
 */

const	http = require('./gitlab_scripts/http');
const	fs = require('fs');
const	global = require('./configs/global');
const	lib = require('./lib');
const	classroom = require('./google_scripts/classroom');

const   students = JSON.parse(fs.readFileSync('./students.json')).students;
const   conf = {
    courseId: 43751834869
};
classroom.setCourseId(conf.courseId);

async function    createGitlabProjects(title)
{
    let         i = 0;

    while (i < students.length)
    {
        students[i].userName = students[i].gmail.slice(0, students[i].gmail.indexOf('@'));
        i++;
    }
    await http.setUsersID(students);
    await http.createProjectsForUsers(students, title);
    console.log("STUDENTS: \n", students);
}

//createGitlabProjects();

async function      createCourseWork(title)
{
    let         list = await classroom.studentsList();

    let         i = 0;
    while (i < list.length)
    {
        let     j = 0;
        while (j < students.length)
        {
            if (list[i].profile.emailAddress == students[j].gmail)
            {
                students[j].classId = list[i].userId;
                break;
            }
            j++;
        }
        i++;
    }

    conf.title = title;
    await classroom.createCourseWork(conf);
}

async function      create()
{
    await createGitlabProjects("lastex");
    await  createCourseWork("New exam");
    fs.writeFileSync('./gitlab_scripts/students.json', JSON.stringify({ students, ...conf }));
}

create();