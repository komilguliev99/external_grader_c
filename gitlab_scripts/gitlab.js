/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 11:47:04
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-04 21:25:54
 * @ Description:
 */

var axios = require('axios');
var fs = require('fs');
var gl = require('../config/global');
var lib = require('../config/lib');

var gitlab = {
	initConfigs: function ()
	{
		if (!gl.gitlab.access_token)
			console.log("There is no token for gitlab API!");
		if (!gl.gitlab.domain)
			console.log("There is no domain for gitlab!");
		this.access_token = gl.gitlab.access_token;
		this.domain = gl.gitlab.domain;
		this.path = gl.gitlab.path;
	},

	post: async function (url, params)
	{	
		var		data;
		
		const	configs = {
					headers: { "Authorization":` Bearer ${this.access_token}` }
				};

		await axios.post(`${this.domain}${url}`, params, configs)
		.then((response) => {
			//console.log(response.data);
			data = response.data;
		})
		.catch((error) => {
			console.log(`error: post: -url: ${this.domain}${url}`);
			console.log("Message", error.response.data.message);
			data = error;
		});

		return data;
	},

	put: async function (url, params)
	{
		const	configs = {
			headers: { "Authorization":` Bearer ${this.access_token}` }
		};

		axios.put(`${this.domain}${url}`, params, configs)
		.then((response) => {
			//console.log(response.data);
			data = response.data;
		})
		.catch((error) => {
			console.log(error);
			data = error;
		});
	},

	get: async function(url, params = {})
	{
		let		paramsStr = '?access_token=' + this.access_token;
		let		data;
		const	configs = {
			headers: { "PRIVATE-TOKEN":`${this.access_token}` }
		};

		Object.keys(params).forEach((key, i) =>	paramsStr += "&" + 	key + '=' + params[key]);

		await axios.get(`${this.domain}${url}${paramsStr}`, configs)
		.then(function (response) {
			data = response.data;
			//console.log(response);
		})
		.catch(function (error) {
			data = error;
			console.log("ERROR: ", error.response.config.url);
		})

		return data;
	},

	uploadFile: async function (conf, branch = 'master', commitMessage = 'Initial state')
	{
		var		buff, content;

		if (!conf.content)
		{
			buff = fs.readFileSync(conf.filePath);
			content = buff.toString();
		}
		else
			content = conf.content;
		const	params = {
					branch: branch,
					"commit_message": commitMessage,
					content
				};
		const	configs = {
			headers: { "Authorization":` Bearer ${this.access_token}` }
		};

		await axios.post(`${this.domain}/projects/${conf.projectId}/repository/files/${conf.path}`, params, configs)
		.then(function (response) {
			console.log(response.data);
		})
		.catch(function (error) {
			console.log(error);
		});
	},

	getRepoFile: async function (id, filePath, ref = 'master')
	{
		let		data;
		let		buff;
		
		try {
			data = await this.get(`/projects/${id}/repository/files/${filePath}`, {ref});
			//console.log(data);
			if (data)
			{
				buff = Buffer.from(data.content, 'base64');
				return buff.toString();
			}
		} catch(error) {
			return false;
		}
	},

	createProject: async function(title)
	{
		let		result;

		if (!title)
			console.log("error: title - can't find to create project");
		else
		{
			console.log('project title: ', title);
			result = await this.post('/projects', { name: title });
			return result.id;
		}
		return null;
	},

	createProjectForUser: async function(user, flags, taskVariant)
	{
		let		projectId = null;
		
		let		filePath = `./gitlab_scripts/tasks/variant_${lib.getFormat(taskVariant)}.txt`;

		console.log("Creating project for user : ", user.userName, " ...");

		projectId = await this.createProject(flags.gitPrefix + '_' + user.userName);
		if (projectId)
		{
			this.uploadFile({projectId, filePath, path: "tasks.txt"});
			await this.post(`/projects/${projectId}/members`, {"user_id": user.userGitlabId, "access_level": 40});
			user.projectId = projectId;
			user.taskVariant = taskVariant;
			user.createDate = Date.now();
			user.lastUpdate = user.createDate;
			user.limit = flags.limit;
			user.taskType = flags.taskType;
			user.cwId = flags.cwId;
			user.courseId = flags.courseId;
			user.courseTitle = flags.courseTitle;
			user.cwTitle = flags.cwTitle;
			return projectId;
		}
		else
			console.log("WARNING: project did not created for user: ", user.userName);
		return null;
	},

	createProjectsForUsers: async function (users, flags)
	{
		let		tasks = [];
		let		types = gl.tasks_info.types;

		if (flags.taskType)
			types.forEach((type, i) => {
				if (type.length == 1 && type[0] == flags.taskType)
					tasks.push(i);
			})
		else
			types.forEach((type, i) => tasks.push(i));
		
		if (!tasks.length)
		{
			console.log("No variants with given type!");
			return ;
		}

		for (let i = 0; i < users.length; i++)
		{
			let user = users[i];

			if (!user.userGitlabId)
				continue ;

			if (flags.taskVariant && (Number(flags.taskVariant) <= types.length
										&& Number(flags.taskVariant) > 0))
				await this.createProjectForUser(user, flags, flags.taskVariant);
			else
			{
				let ind = lib.rangeRandom(1, tasks.length);
				console.log(ind, tasks);
				await this.createProjectForUser(user, flags, tasks[ind])	
			}
		}

		console.log("PROJECTS: ", users);
	},


	setUsersID: async function (users)
	{
		let		i = 0;
		let		user;

		while (i < users.length)
		{
			user = await this.get("/users", { username: users[i].userName });
			console.log(user);
			if (user[0])
				users[i].userGitlabId = user[0].id;
			else
				console.log("no gitlab user for ", users[i].userName);
			i++;
		}
	},

	deleteProject: async function (projectID)
	{
		const	configs = {
			headers: { "Authorization":` Bearer ${this.access_token}` }
		};

		await axios.delete(this.domain + '/projects/' + projectID, configs)
		.then(function (response) {
			//console.log(response.data);
			data = response.data;
		})
		.catch(function (error) {
			//console.log(error);
			data = error;
		});
		console.log("Deleted");
	},

	deleteProjects: async function (ids)
	{
		let		i = 0;

		while (i < ids.length)
		{
			this.deleteProject(ids[i]);
			i++;
		}

	},

	commitList: async function(projectID)
	{
		let		data;

		data = await this.get('/projects/' + projectID + '/repository/commits');
		return data;
	}
};

gitlab.initConfigs();

module.exports = gitlab;