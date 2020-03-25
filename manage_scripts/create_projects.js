/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-02-10 23:21:24
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-03-25 22:44:23
 * @ Description:
 */

const	http = require('../gitlab_scripts/http');
const	fs = require('fs');
const	global = require('../configs/global');
const	lib = require('../lib');
const	classroom = require('../google_scripts/classroom');

const   args = process.argv.slice(2);

var     students;
const   conf = {
    courseId: 56269545514
};
classroom.setCourseId(conf.courseId);

async function      read_students_info()
{
    let content = await http.getRepoFile(global.CONFIG_ID, 'students.json');
    return (JSON.parse(content).students);
}

async function    createGitlabProjects(title, courseId, limitTime)
{
    let         i = 0;

    while (i < students.length)
    {
        students[i].userName = students[i].gmail.slice(0, students[i].gmail.indexOf('@'));
        students[i].courseId = courseId;
        i++;
    }
    await http.setUsersID(students);
    await http.createProjectsForUsers(students, title, limitTime);
}

//createGitlabProjects();

async function      createCourseWork(title)
{
    conf.title = title;
    await classroom.createCourseWork(conf, conf.courseId);
    let         list = await classroom.studentsList();

    if (!list)
        console.log("WARNING: no students registered in course!");
}

async function      create()
{
    let     git_pref = "exam";
    let     task_title = "Экзамен";
    let     flags = {};
    let     group = null;
    let     courseId = conf.courseId;
    let     limitTime = 3600 * 1000;

    let     i = -1;
    while (args[++i])
        if (args[i] == '--re')
            flags['re'] = 1;
        else if (args[i].split('=')[0] == '--git_prefix')
            git_pref = args[i].split('=')[1];
        else if (args[i].split('=')[0] == '--task_title')
            task_title = args[i].split('=')[1];
        else if (args[i].split('=')[0] == '--group')
            group = args[i].split('=')[1];
        else if (args[i].split('=')[0] == '--course_id')
            courseId = args[i].split('=')[1];
        else if (args[i].split('=')[0] == '--limit_time')
            limitTime = Number(args[i].split('=')[1]) * 1000;
    
    // reading students info
    students = await read_students_info();

    await createGitlabProjects(git_pref, courseId, limitTime);
    await  createCourseWork(task_title, courseId);

    console.log(students);

    const   params = {
        branch: 'master',
        content: JSON.stringify({ projects: students}),
        'commit_message': 'created new projects'
    };

    http.put(`/projects/${global.CONFIG_ID}/repository/files/projects.json`, params);
}

create();
