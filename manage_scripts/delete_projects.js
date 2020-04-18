/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-03-19 15:14:42
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-09 02:06:09
 * @ Description:
 */

const		gitlab = require('../gitlab_scripts/gitlab');
const		gl = require('../config/global')
const		parameters = process.argv.slice(2);

var     EXT_PR_INFO     = gl.external_configs.projects_info;

function			setFlags(flags, args)
{
	let		i = 0;
	while (i < args.length)
	{
		let		item = args[i].split('=');
		console.log(item);

		if (item[0] == '--gmail' && item[1] && ++flags.allow)
			flags.gmail = item[1];
		else if (item[0] == '--group' && item[1] && ++flags.allow)
			flags.group = item[1];
		else if (item[0] == '--git-prefix' && item[1] && ++flags.allow)
			flags.gitPrefix = item[1];
		else if (item[0] == '--pr-ids' && item[1] && ++flags.allow)
			flags.prIds = item[1].split(' ');
		else if (item[0] == '--cw-title' && item[1] && ++flags.allow)
			flags.cwTitle = item[1];
		else if (item[0] == '--cw-ids' && item[1] && ++flags.allow)
			flags.cwIds = item[1].split(' ');
		else if (item[0] == '--active' && ++flags.allow)
			flags.active = 1;
		else if (item[0] == '--not-active' && ++flags.allow)
			flags.active = 0;
		else if (item[0] == '--all' && ++flags.allow)
			flags.all = 1;
		else if (item[0] == '--ignore' && ++flags.allow)
			flags.ignore = 1;
		else if (item[0] == '--no-prid' && ++flags.allow)
			flags.noPrId = 1;
		else if (item[0] == '--no-course' && ++flags.allow)
			flags.noCourse = 1;
		else if (item[0] == '--no-cw' && ++flags.allow)
			flags.noCw = 1;
		i++;
	}
}

async function		getProjects()
{
	let		content;

	content = JSON.parse(await	gitlab.getRepoFile(gl.external_configs.id, "projects.json"));
	if (!content)
		return false;
	else
		return content.projects;
}

function			showProjects(projects)
{
	projects.forEach(el => {
		console.log(
			el.gmail, " ",
			el.projectId, " ", 
			el.cwId, " ",
			el.group, " ",
		);
	});
}

async function		deleteProjects(args)
{
	const		flags = {
		active: -1,
		all: 0,
		ignore: 0,
		allow: 0,
	};
	let			projects;
	let			fprojects;

	if (!args)
		args = parameters;
	// setting flags
	setFlags(flags, args);

	console.log(flags);
	if (flags.ignore)
	{
		console.log(flags.prIds);	
		gitlab.deleteProjects(flags.prIds);
		return flags.prIds.map(el => {
			return {
				gmail: "unknown",
				group: "unknown",
				projectId: el,
				cwTitle: "unknown"
			};
		});
	}

	// reading projects info
	projects = gl.projects;
	if (!projects || !projects.length)
	{
		console.log("No projects found!")
		return ;
	}

	fprojects = [...projects];
	console.log("FLAGS: ", flags);

	//console.log(projects);

	if (!flags.all)
	{
		if (flags.active == 0 || flags.active == 1)
			projects = projects.filter(el => {
				let	active = new Date(el.createdDate + el.limit)  <= new Date();

				if (active == flags.active)
					return true;
				return false;
			});

		if (flags.gmail)
			projects = projects.filter(el => el.gmail == flags.gmail);

		if (flags.group && !flags.gmail)
			projects = projects.filter(el => el.group == flags.group);
		
		if (flags.prIds)
			projects = projects.filter(el => flags.prIds.includes(el.projectId ? el.projectId.toString() : null));
		
		if (flags.cwIds)
			projects = projects.filter(el => flags.cwIds.includes(el.cwId));
		
		if (flags.cwTitle)
			projects = projects.filter(el => el.cwTitle == flags.cwTitle);
		
		if (flags.noPrId)
			projects = projects.filter(el => !el.projectId);
		
		if (flags.noCourse)
			projects = projects.filter(el => !el.courseId);
		
		if (flags.noCw)
			projects = projects.filter(el => !el.cwId);
	}

	if (flags.allow)
	{
		fprojects = fprojects.filter(el => {
			let		i = 0;
			while (i < projects.length)
				if (el.projectId == projects[i++].projectId)
					return false;
			
			return true;
		})
	
		projects.forEach(el => {
			if (el.projectId)
				gitlab.deleteProject(el.projectId);
		});
	
		const   params = {
			branch: 'master',
			content: JSON.stringify({ projects: fprojects }),
			'commit_message': 'created new projects'
		};
	
		gitlab.put(`/projects/${gl.external_configs.id}/repository/files/${EXT_PR_INFO}`, params);
	
		//showProjects(projects);
		return projects;
	}
	return [];
}


module.exports.deleteProjects = deleteProjects;