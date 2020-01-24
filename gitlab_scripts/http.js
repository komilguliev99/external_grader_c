/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 11:47:04
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-01-23 23:30:40
 * @ Description:
 */

var axios = require('axios');
var fs = require('fs');
var global = require('../configs/global');

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
			console.log(data);
		})
		.catch(function (error) {
			data = error;
			console.log(error);
		})

		return data;
	},

	uploadFile: async function (conf, branch = 'master', commitMessage = 'Initial state')
	{
		var		buff = fs.readFileSync(configs.filePath);
		const	content = buff.toString();
		const	params = {
					branch: branch,
					"commit_message": commitMessage,
					content
				};
		const	configs = {
			headers: { "Authorization":` Bearer ${global.GITLAB_ACCESS_TOKEN}` }
		};

		await axios.post(`${global.GITLAB_DOMAIN}/projects/${conf.projectId}/repository/files/${conf.filePath}`, params, configs)
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
			console.log(data);
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

	createProjectForUser: async function(user)
	{
		let		projectId;
		
		projectId = await this.createProject(global.GITLAB_PROJECT_NAME + '_' + user.userName);
		await this.post(`/projects/${projectId}/members`, {"user_id": user.id, "access_level": 40});
		user.projectId = projectId;
		return projectId;
	},

	createProjectsForUsers: async function (users)
	{
		let		projectsInfo = [];

		for (let i = 0; i < users.length; i++)
		{
			let user = users[i];
			if (!user.projectId)
			{
				let id = await this.createProjectForUser(user);
				let	project = {
					id,
					user: user.userName,
					userID: user.id
				}
			}
			projectsInfo.push(user);
		}

		console.log("PROJECTS: ", projectsInfo);
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