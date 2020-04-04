/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-02-10 23:21:24
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-04 13:01:50
 * @ Description:
 */

const	gitlab      = require('../gitlab_scripts/gitlab');
const	fs          = require('fs');
const	gl          = require('../config/global');
const	lib         = require('../config/lib');
const	gapi        = require('../google_scripts/classroom');

const   args = process.argv.slice(2);
var   projects = [];

var		confFile	    = null;
var     CONFIG_ID       = gl.external_configs.id;
var     EXT_PR_INFO     = gl.external_configs.projects_info;
var     EXT_TSK_INFO    = gl.external_configs.tasks_info;
console.log(gl);

if (!gl.external_configs.id)
    console.log("Missing id of external configs!");

var     students;
const   conf = {
    courseId: 57365570536
};
gapi.class.setCourseId(conf.courseId);

async function prepare_configs()
{
    console.log(CONFIG_ID, EXT_PR_INFO, EXT_TSK_INFO);
	confFile = JSON.parse(await gitlab.getRepoFile(CONFIG_ID, EXT_PR_INFO));
    console.log(confFile);
    projects = confFile.projects;
	if (!projects)
		console.log("there is no projects for testing!");

	gl.tasks_info = JSON.parse(await gitlab.getRepoFile(CONFIG_ID, EXT_TSK_INFO)).variants;
    if (!gl.tasks_info)
        console.log("there is no task variants for checking!");
}

async function    createGitlabProjects(students, flags)
{
    let         i = 0;

    while (i < students.length)
    {
        students[i].userName = students[i].gmail.slice(0, students[i].gmail.indexOf('@'));
        students[i].courseId = flags.courseId;
        students[i].cwId = flags.cwId;
        students[i].cwTitle = flags.cwTitle;
        if (flags.group)
            students[i].group = flags.group;
        i++;
    }
    await gitlab.setUsersID(students);
    await gitlab.createProjectsForUsers(students, flags);
}

//createGitlabProjects();

async function      createCourseWork(title)
{
    conf.title = title;
    await gapi.class.createCourseWork(conf, conf.courseId);
    let         list = await gapi.class.studentsList();

    if (!list)
        console.log("WARNING: no students registered in course!");
}

function            setFlags(flags)
{
    let     i = -1;
    while (args[++i])
    {
        let     item = args[i].split('=');

        if (item[0] == '--course-id' && item[1])
            flags.courseId = item[1];
        else if (item[0] == '--git-prefix' && item[1])
            flags.gitPrefix = item[1];
        else if (item[0] == '--gmail' && item[1])
            flags.gmail = item[1];
        else if (item[0] == '--task-variant' && item[1])
            flags.taskVariant = Number(item[1]);
        else if (item[0] == '--task-type' && item[1])
            flags.taskType = item[1];
        else if (item[0] == '--group' && item[1])
            flags.group = item[1];
        else if (item[0] == '--limit' && Number(item[1]))
            flags.limit = Number(item[1]) * 1000;
        else if (item[0] == '--course-title' && item[1])
            flags.courseTitle = item[1];
        else if (item[0] == '--cw-id' && item[1])
            flags.cwId = item[1];
        else if (item[0] == '--cw-title' && item[1])
            flags.cwTitle = item[1];
    }
}

async function      create()
{
    const   flags = {
        gitPrefix: Math.random().toString(36).substring(7),
        cwTitle: "Экзамен",
        limit: 3600 * 1000,
        courseId: null,
        taskType: null,
        defaultType: 1
    };

    let         error = 0;

    setFlags(flags);

    // reading students info
    if (flags.gmail)
    {
        let     group = await gapi.directory.getGroupByGmail(flags.gmail);
        students = [{gmail: flags.gmail, group}];
    }
    else if (flags.group)
        students = await gapi.directory.getGroup(flags.group);

    console.log("FLAGS: ", flags);
    if (students.length && !error)
    {
        // creating course at classroom
        if (flags.courseTitle && !flags.courseId)
            flags.courseId = await gapi.class.createCourse({ name: flags.courseTitle});
        else
            flags.courseId = conf.courseId;
        
        // creating course work
        if (!flags.cwId)
            flags.cwId = await gapi.class.createCourseWork({
                title: flags.cwTitle},
                flags.courseId
            );  
        else 
            flags.cwId = flags.cwId;

        await prepare_configs();
        await createGitlabProjects(students, flags);
    
        let projects = JSON.parse(await gitlab.getRepoFile(CONFIG_ID, EXT_PR_INFO)).projects;
    
        if (projects)
            projects = [...students, ...projects];
        else
            projects = students;
        
        if (confFile)
        {
            let     params = {
                        branch: 'master',
                        content: JSON.stringify({ projects }),
                        'commit_message': 'created new projects'
                    };
            gitlab.put(`/projects/${CONFIG_ID}/repository/files/${EXT_PR_INFO}`, params);
        }
        else
            gitlab.uploadFile({ content: JSON.stringify({ projects }), path: EXT_PR_INFO, projectId: CONFIG_ID });
    }
}

create();
