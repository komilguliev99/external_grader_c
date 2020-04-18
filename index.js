/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 11:46:10
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-10 22:51:44
 * @ Description:
 */


const	gl			= require('./config/global');
const	gitlab		= require('./gitlab_scripts/gitlab');
const	Grader		= require('./grader_scripts/components/Grader');
const	lib			= require('./config/lib');
const	zulip		= require('./gitlab_scripts/zulip');
const	gapi		= require('./google_scripts/classroom');

const	defaultCourseId = 56269545514;

// initialization of containers
gl.queue = [];
gl.projects = [];

var		UPDATED		= false;

async function reset_configs(fl_pr, fl_tsk, fl_admins)
{
	if (fl_pr)
	{
		let confFile = JSON.parse(await gitlab.getRepoFile(gl.external_configs.id, 'projects.json'));
		gl.projects = confFile.projects;
		if (!gl.projects)
			console.log("there is no projects for testing!");
	}

	if (fl_tsk)
	{
		gl.tasks_info = JSON.parse(await gitlab.getRepoFile(gl.external_configs.id, 'tasks_info.json')).variants;
		if (!gl.tasks_info)
			console.log("there is no task variants for checking!");
	}

	if (fl_admins)
	{
		let		admins = JSON.parse(await gitlab.getRepoFile(gl.external_configs.id, 'admins.json'));
		if (admins && admins.admins)
			gl.admins = gl.admins.concat(admins.admins);
	}
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
	taskCount = gl.tasks_info.taskCounts[variant - 1];
	Grader.variant = variant;
	Grader.taskFiles = tasks;
	Grader.taskCount = taskCount;
	Grader.types = gl.tasks_info.types[variant - 1];
	Grader.weights = gl.tasks_info.weights[variant - 1];
}

async function		run_grader(variant, project)
{
	Grader.resetAll();
	let		j = 0, tasks = [];
	while (j < gl.tasks_info.taskCounts[variant - 1])
	{
		let		content = await gitlab.getRepoFile(project.projectId, `code${++j}.c`);
		if (content)
			tasks.push(content);
	}
	
	if (tasks.length > 0) 
	{
		reset_grader(variant, tasks);
		await Grader.run();
		let trace = Grader.getTrace();
		let result = `Ваша работа проверено.\n`;
		result += `Результат работы:\n${trace}\n`;
		result = result + "```quote\n" + "Оценка за работу: " + Grader.getAssignedGrade() + "\n```";
		
		console.log(result);
		zulip.sendMessage({
			to: "c.grader2@miem.hse.ru",		//project.gmail
			type: "private",
			content: result
		});
		if (new Date(project.createDate + project.limit) >= new Date())
		{
			console.log("Setting grade on classroom...");
			gapi.class.setGrade(project.gmail, Grader.getAssignedGrade(), project.courseId, project.cwId);
		}
	}

}

async function 		checkRepo() {
	let		i = 0;
	let		variant;
	let		projects = gl.projects;

	while (projects && i < projects.length)
	{
		let check = await checkLastUpdate(projects[i])
		variant = projects[i].taskVariant;
		if (check.status)
		{
			UPDATED = true;
			//await run_grader(projects[i].taskVariant, projects[i]);

			let message = 'Ваша работа принято!\n';
			message += 'Работа в очереди для проверки.\n';
			zulip.sendMessage({
				to: projects[i].gmail,
				type: 'private',
				content: message
			});
	
			gl.queue.push(projects[i]);
		}
		else
			console.log("status: not updated!");
		i++;
	}

	await lib.sleep(5000);
	checkRepo();
}

async function		check_queue()
{
	console.log("check_queue");
	while (gl.queue.length)
	{
		let project = gl.queue.shift();
		await run_grader(project.taskVariant, project);
	}
}

async function		update_projects()
{
	console.log("update_projects");
	if (UPDATED)
	{
		const   params = {
			branch: 'master',
			content: JSON.stringify({ projects: gl.projects }),
			'commit_message': 'created new projects'
		};

		gitlab.put(`/projects/${gl.external_configs.id}/repository/files/projects.json`, params);
		UPDATED = false;
	}
}

async function		run_service()
{
	await reset_configs(1, 1, 1);
	checkRepo();
	setInterval(check_queue, 5000);
	setInterval(update_projects, 30000);
}

run_service();
