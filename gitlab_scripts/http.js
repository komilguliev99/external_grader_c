/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 11:47:04
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-02-11 00:03:39
 * @ Description:
 */

var axios = require('axios');
var fs = require('fs');
var global = require('../configs/global');
var lib = require('../lib');

var http = {
	post: async function (url, params)
	{	
		var		data;
		
		const	configs = {
					headers: { "Authorization":` Bearer ${global.GITLAB_ACCESS_TOKEN}` }
				};

		await axios.post(`${global.GITLAB_DOMAIN}${url}`, params, configs)
		.then(function (response) {
			//console.log(response.data);
			data = response.data;
		})
		.catch(function (error) {
			console.log(error);
			data = error;
		});

		return data;
	},

	get: async function(url, params = {})
	{
		let		paramsStr = '?access_token=' + global.GITLAB_ACCESS_TOKEN;
		let		data;
		const	configs = {
			headers: { "PRIVATE-TOKEN":`${global.GITLAB_ACCESS_TOKEN}` }
		};

		Object.keys(params).forEach((key, i) =>	paramsStr += "&" + 	key + '=' + params[key]);

		await axios.get(`${global.GITLAB_DOMAIN}${url}${paramsStr}`, configs)
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
		var		buff = fs.readFileSync(conf.filePath);
		const	content = buff.toString();
		const	params = {
					branch: branch,
					"commit_message": commitMessage,
					content
				};
		const	configs = {
			headers: { "Authorization":` Bearer ${global.GITLAB_ACCESS_TOKEN}` }
		};

		await axios.post(`${global.GITLAB_DOMAIN}/projects/${conf.projectId}/repository/files/tasks.txt`, params, configs)
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

		result = await this.post('/projects', { name: title });
		return result.id;
	},

	createProjectForUser: async function(user, projectName)
	{
		let		projectId;
		
		let		taskVariant = lib.rangeRandom(1, 23);
		let		filePath = `./gitlab_scripts/tasks/variant_${lib.getFormat(taskVariant)}.txt`;

		projectId = await this.createProject(projectName + '_' + user.userName);
		this.uploadFile({projectId, filePath});
		await this.post(`/projects/${projectId}/members`, {"user_id": user.id, "access_level": 40});
		user.projectId = projectId;
		user.taskVariant = taskVariant;
		return projectId;
	},

	createProjectsForUsers: async function (users, projectName)
	{
		for (let i = 0; i < users.length; i++)
		{
			let user = users[i];
			if (!user.projectId)
				await this.createProjectForUser(user, projectName);
		}

		//console.log("PROJECTS: ", users);
	},


	setUsersID: async function (users)
	{
		let		i = 0;
		let		user;

		while (i < users.length)
		{
			user = await this.get("/users", { username: users[i].userName });
			console.log(user);
			users[i].id = user[0].id;
			i++;
		}
	},

	deleteProject: async function (projectID)
	{
		const	configs = {
			headers: { "Authorization":` Bearer ${global.GITLAB_ACCESS_TOKEN}` }
		};

		await axios.delete(global.GITLAB_DOMAIN + '/projects/' + projectID, configs)
		.then(function (response) {
			//console.log(response.data);
			data = response.data;
		})
		.catch(function (error) {
			console.log(error);
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

module.exports = http;