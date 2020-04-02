/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 11:46:10
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-02 14:09:54
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
	projects = confFile.projects;
	if (!projects)
		console.log("there is no projects for testing!");

	global.TASKS_INFO = JSON.parse(await gitlab.getRepoFile(global.CONFIG_ID, 'tasks_info.json')).variants;
	if (!global.TASKS_INFO)
		console.log("there is no task variants for checking!");
	VARIANTS = global.TASKS_INFO;
}

async function checkLastUpdate(student)
{
	let commits = await gitlab.commitList(student.projectId);
	let lastUpdate;
	if (commits && commits.length > 0)
	{
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

function			reset_grader(variant, tasks)
{
	Grader.reset();
	taskCount = VARIANTS.taskCounts[variant - 1];
	Grader.variant = variant;
	Grader.taskFiles = tasks;
	Grader.taskCount = taskCount;
	Grader.types = VARIANTS.types[variant - 1];
	Grader.weights = VARIANTS.weights[variant - 1];
}

async function checkRepo() {
	let		i = 0, st = false;
	let		variant;
	let		taskCount = 0;
	let		tasks = [];

	await prepare_configs();
	while (projects && i < projects.length)
	{
		Grader.reset();

		let check = await checkLastUpdate(projects[i])
		variant = projects[i].taskVariant;
		if (check.status)
		{
			st = true;
			
			let		j = 0;
			while (j < VARIANTS.taskCounts[variant - 1])
			{
				let		content = await gitlab.getRepoFile(projects[i].projectId, `code${++j}.c`);
				console.log("CONTENT", content);
				if (content)
					tasks.push(content);
			}
			
			if (tasks.length > 0) 
			{
				reset_grader(variant, tasks);
				await Grader.run();
				let trace = Grader.getTrace();
				let result = `Вы загрузили новые данные студент ${projects[i].userName}\nДата загрузки: ${new Date(projects[i].lastUpdate)} \n\n ${trace}\n`;
				result = result + "```Оценка за работу: " + Grader.getAssignedGrade() + "```";
				
				console.log(result);
				zulip.sendMessage({
					to: "kzguliev@miem.hse.ru",		//projects[i].gmail
					type: "private",
					content: result
				});
				if (new Date(projects[i].createDate + projects[i].limit) >= new Date())
				{
					console.log("Setting grade on classroom...");
					gapi.class.setGrade(projects[i].gmail, Grader.getAssignedGrade(), projects[i].courseId, projects[i].cwId);
				}
			}
		}
		else
			console.log("status: not updated!");
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
	await lib.sleep(10000);
	checkRepo();
}

checkRepo();
