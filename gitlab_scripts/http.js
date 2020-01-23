/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   http.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dcapers <dcapers@student.21-school.ru>     +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2020/01/23 11:47:41 by dcapers           #+#    #+#             */
/*   Updated: 2020/01/23 11:47:41 by dcapers          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

var axios = require('axios');
var fs = require('fs');

var http = {
	baseDomain: 'https://git.miem.hse.ru/api/v4',
	accessToken: 'ffVrpATDs77Q9xPtisM7',
	projectName: 'examm',


	post: async function (url, params)
	{	
		var		data;
		
		const	configs = {
					headers: { "Authorization":` Bearer ${this.accessToken}` }
				};

		await axios.post(`${this.baseDomain}${url}`, params, configs)
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
		let		paramsStr = '';
		let		data;

		Object.keys(params).forEach((key, i) => {
			if (i > 0)
				paramsStr += '&';
			paramsStr += key + '=' + params[key];
		});

		axios.get(`${this.baseDomain}${url}?${paramsStr}`)
		.then(function (response) {
			data = response.data;
		})
		.catch(function (error) {
			data = error;
		})

		return data;
	},

	uploadFile: async function uploadFile(conf, branch = 'master', commitMessage = 'Initial state')
	{
		var		buff = fs.readFileSync(configs.filePath);
		const	content = buff.toString();
		const	params = {
					branch: branch,
					"commit_message": commitMessage,
					content
				};
		const	configs = {
			headers: { "Authorization":` Bearer ${this.accessToken}` }
		};

		await axios.post(`${this.baseDomain}/projects/${conf.projectId}/repository/files/${conf.filePath}`, params, configs)
		.then(function (response) {
			console.log(response.data);
		})
		.catch(function (error) {
			console.log(error);
		});
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
		
		projectId = await this.createProject(this.projectName + user.userName);
		await this.post(`/projects/${projectId}/members`, {"user_id": user.id, "access_level": 40});
		return projectId;
	},

	createProjectsForUsers: async function (users)
	{
		let		projectsInfo = [];

		for (let i = 0; i < users.length; i++)
		{
			let user = users[i];
			let id = await this.createProjectForUser(user);
			let	project = {
				id,
				user: user.userName,
				userID: user.id
			}
			projectsInfo.push(project);
		}

		console.log("PROJECTS: ", projectsInfo);
	},

	deleteProject: async function (projectID)
	{
		const	configs = {
			headers: { "Authorization":` Bearer ${this.accessToken}` }
		};

		await axios.delete(this.baseDomain + '/projects/' + projectID, configs)
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

	}
};

module.exports = http;