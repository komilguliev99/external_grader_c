/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 11:46:10
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-01 01:20:19
 * @ Description:
 */


const	gitlab		= require('./gitlab_scripts/gitlab');
const	fs 			= require('fs');
const	global		= require('./configs/global');
const	Grader		= require('./grader_scripts/components/Grader');
const	lib			= require('./lib');
const	zulip		= require('./gitlab_scripts/zulip');
const	gapi	= require('./google_scripts/classroom');

const	defaultCourseId = 56269545514;


var		VARIANTS	=null;
var		confFile	=null;
var		projects	=null;

async function prepare_configs()
{
	confFile = JSON.parse(await gitlab.getRepoFile(global.CONFIG_ID, 'projects.json'));
	console.log(confFile);
	projects = confFile.projects;
	console.log(projects)
	if (!projects)
		throw "there is no projects for testing!"

	global.TASKS_INFO = JSON.parse(await gitlab.getRepoFile(global.CONFIG_ID, 'tasks_info.json')).variants;
	if (!global.TASKS_INFO)
		throw "there is no task variants for checking!";
	VARIANTS = global.TASKS_INFO;
}

async function checkLastUpdate(student)
{
	//console.log("BEFORE CHECKING: ", student);
	let commits = await gitlab.commitList(student.projectId);
	let lastUpdate;
	if (commits && commits.length > 0)
	{
		//console.log(commits);
		lastUpdate = commits[0]['committed_date'];

		if (lastUpdate && (!student.lastUpdate || new Date(student.lastUpdate).getTime() < new Date(lastUpdate).getTime()))
		{
			student.lastUpdate = new Date(lastUpdate).getTime();
			return {
				status: true,
				date: lastUpdate
			};
		}
		return { status: false };
	}
	return { status: false };
}

async function checkRepo() {
	let		i = 0, st = false;
	let		variant;
	let		taskCount = 0;
	let		tasks = [];

	while (i < projects.length)
	{
		//console.log(projects[i]);
		Grader.reset();

		let check = await checkLastUpdate(projects[i])
		variant = projects[i].taskVariant;
		taskCount = VARIANTS.taskCounts[variant - 1];
		let	email = projects[i].gmail;
		if (check.status)
		{
			st = true;
			//console.log("GITLAB_FILES: ", global.GITLAB_FILES[0]);
			
			let		j = 0;
			while (j < taskCount)
			{
				let		content = await gitlab.getRepoFile(projects[i].projectId, `code${++j}.c`);
				console.log("CONTENT", content);
				if (content)
					tasks.push(content);
			}
			
			if (tasks.length > 0) 
			{
				Grader.reset();
				Grader.variant = variant;
				Grader.taskFiles = tasks;
				Grader.taskCount = taskCount;
				Grader.types = VARIANTS.types[variant - 1];
				Grader.weights = VARIANTS.weights[variant - 1];
				await Grader.run();
				let trace = Grader.getTrace();
				let result = `Вы загрузили новые данные студент ${projects[i].userName}\nДата загрузки: ${new Date(projects[i].lastUpdate)} \n\n ${trace}\n`;
				result = result + "```Оценка за работу: " + Grader.getAssignedGrade() + "```";
				
				console.log(result);
				zulip.sendMessage({
					to: `kzguliev@miem.hse.ru`,
					type: "private",
					content: result
				});
				console.log("GRRRRRRRR: ", Grader.getAssignedGrade());
				console.log(new Date(projects[i].createDate + projects[i].limit));
				console.log(new Date());
				if (new Date(projects[i].createDate + projects[i].limit) >= new Date())
				{
					console.log("Setting grade on classroom...");
					gapi.class.setGrade(email, Grader.getAssignedGrade(), projects[i].courseId, projects[i].cwId);
				}
			}
		}
		i++;
	}
	if (st)
	{
		confFile.projects = projects

		const   params = {
			branch: 'master',
			content: JSON.stringify(confFile),
			'commit_message': 'created new projects'
		};

		gitlab.put(`/projects/${global.CONFIG_ID}/repository/files/projects.json`, params);
	}
	else
		console.log("No changes!");
}

async function run() {
	
	try {
		await prepare_configs();
		gapi.class.setCourseId(confFile.courseId);
		gapi.class.setCourseWorkId(confFile.courseWorkId);
		
		let id = setInterval(checkRepo, 5000);
	} catch (err)
	{
		console.log("WARNING: ", err);
	}
}

run();
